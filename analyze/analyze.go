package analyze

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/aws/aws-sdk-go-v2/service/bedrockruntime"
	"github.com/dyatlov/go-htmlinfo/htmlinfo"
	"github.com/dyatlov/go-opengraph/opengraph"
	"github.com/dyatlov/go-readability"
	"github.com/russross/blackfriday/v2"
	"github.com/yosssi/gohtml"

	"github.com/linksort/linksort/log"
)

const defaultHTTPRequestTimeoutSeconds = 30

var (
	ErrUnparsableURI            = errors.New("unparsable URI")
	ErrNoClassify               = errors.New("could not classify")
	errUnexpectedOembedResponse = errors.New("unexpected oembed response")
	errNoDiffbotResult          = errors.New("no result from diffbot")
)

type Request struct {
	URL         string
	Title       string
	Favicon     string
	Site        string
	Image       string
	Description string
	Corpus      string
}

type Response struct {
	URL         string
	Image       string
	Favicon     string
	Title       string
	Site        string
	Description string
	Original    string
	Corpus      string
	Tags        []*Tag
	Summary     string
	IsArticle   bool
}

type Tag struct {
	Name       string
	Confidence float32
}

type classifer interface {
	Classify(context.Context, *Response) (*Response, error)
	Close() error
}

type Client struct {
	classifer    classifer
	httpClient   *http.Client
	diffbotToken string
	aiClient     aiClient
}

func New(ctx context.Context, bedrockC *bedrockruntime.Client) (*Client, error) {
	c := &http.Client{
		Timeout: time.Duration(defaultHTTPRequestTimeoutSeconds) * time.Second}

	classiferBackend, err := resolveBackend(ctx, c)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize: %w", err)
	}

	aiClient, err := getAIClient(bedrockC)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize AI client: %w", err)
	}

	return &Client{
		httpClient:   c,
		classifer:    classiferBackend,
		diffbotToken: os.Getenv("DIFFBOT_TOKEN"),
		aiClient:     aiClient,
	}, nil
}

func (c *Client) Close() error {
	return c.classifer.Close()
}

func (c *Client) Summarize(ctx context.Context, text string) (string, error) {
	// Only generate summary if text is more than roughly 700 words
	words := len(strings.Fields(text))
	if words <= 700 {
		return "", nil
	}

	rawsummary, err := c.aiClient.Summarize(ctx, gohtml.Format(text))
	if err != nil {
		return "", fmt.Errorf("failed to generate summary: %w", err)
	}

	bytes := blackfriday.Run([]byte(rawsummary))
	summary := string(bytes)

	return summary, nil
}

func (c *Client) Do(ctx context.Context, req *Request) (*Response, error) {
	rlog := log.FromContext(ctx)
	// We use a new context here because we don't want to cancel the request if the
	// context is cancelled.
	nctx := context.Background()

	urlobj, err := url.Parse(req.URL)
	if err != nil {
		return nil, fmt.Errorf("%w: %s", ErrUnparsableURI, err.Error())
	}

	urlobj.Host = strings.TrimPrefix(urlobj.Host, "m.")
	urlobj.Host = strings.TrimPrefix(urlobj.Host, "mobile.")
	cleanURL := urlobj.String()

	ld, err := c.extract(nctx, rlog, urlobj)
	if err != nil {
		return nil, fmt.Errorf("failed to extract any info: %w", err)
	}

	ld, err = c.classifer.Classify(nctx, ld)
	if err != nil && !errors.Is(err, errTooFewTokens) {
		rlog.Printf("failed to classify text: %v", err)
	}

	// Use Twitter's and YouTube's oembed APIs which don't provide much info but which
	// are more reliable than making ordinary reqests.
	if ld.Image == "" {
		if hn := urlobj.Hostname(); hn == "youtu.be" || strings.HasSuffix(hn, "youtube.com") {
			return c.handleYouTube(ctx, cleanURL, req.URL, ld)
		} else if strings.HasSuffix(hn, "twitter.com") {
			return c.handleTwitter(ctx, cleanURL, req.URL, ld)
		}
	}

	return ld, nil
}

func (c *Client) extract(ctx context.Context, rlog log.Printer, inputURL *url.URL) (*Response, error) {
	var simpleRes *Response
	var simpleErr error
	var diffbotRes *Response
	var diffbotErr error

	var wg sync.WaitGroup
	wg.Add(2)

	// Start both requests in parallel
	go func() {
		defer wg.Done()
		simpleRes, simpleErr = c.simpleExtract(ctx, inputURL.String())
	}()

	go func() {
		defer wg.Done()
		diffbotRes, diffbotErr = c.diffbot(ctx, inputURL.String())
	}()

	wg.Wait()
	if simpleErr != nil && diffbotErr != nil {
		return nil, fmt.Errorf("multiple errors: (1) %s (2) %s", simpleErr, diffbotErr)
	}

	if simpleErr != nil {
		rlog.Printf("error when executing simpleExtract: %v", simpleErr)
		return diffbotRes, nil
	}
	if diffbotErr != nil {
		if !errors.Is(diffbotErr, errNoDiffbotResult) {
			rlog.Printf("error when executing diffbot: %v", diffbotErr)
		}
		rlog.Printf("not an article: %v", diffbotErr)
		return simpleRes, nil
	}

	return &Response{
		Title:       getValidUTF8NonZeroString(diffbotRes.Title, simpleRes.Title),
		URL:         getValidUTF8NonZeroString(simpleRes.URL, diffbotRes.URL),
		Site:        getValidUTF8NonZeroString(simpleRes.Site, diffbotRes.Site),
		Description: getValidUTF8NonZeroString(simpleRes.Description, diffbotRes.Description),
		Favicon:     getValidUTF8NonZeroString(simpleRes.Favicon, diffbotRes.Favicon),
		Image:       getValidUTF8NonZeroString(simpleRes.Image, diffbotRes.Image),
		Corpus:      getValidUTF8NonZeroString(diffbotRes.Corpus, simpleRes.Corpus),
		Original:    inputURL.String(),
		IsArticle:   diffbotRes.IsArticle,
	}, nil
}

func (c *Client) simpleExtract(ctx context.Context, inputURL string) (*Response, error) {
	rawhtml, err := c.doSimpleHTTPHTMLRequest(ctx, inputURL)
	if err != nil {
		return nil, fmt.Errorf("failed to do http request: %w", err)
	}

	// Parse response HTML content
	info := htmlinfo.NewHTMLInfo()
	info.AllowMainContentExtraction = false
	contentType := "text/html"
	err = info.Parse(strings.NewReader(rawhtml), &inputURL, &contentType)
	if err != nil {
		return nil, fmt.Errorf("failed to parse html info: %w", err)
	}

	oembed := info.GenerateOembedFor(inputURL)
	description := getNonZeroString(info.OGInfo.Description, info.Description, oembed.Description)

	return &Response{
		Title:       oembed.Title,
		URL:         oembed.URL,
		Site:        oembed.ProviderName,
		Description: description,
		Favicon:     info.FaviconURL,
		Image:       getNonZeroString(oembed.ThumbnailURL, getOpenGraphImageURL(info.OGInfo.Images), info.ImageSrcURL),
		Corpus:      applyReadability(rawhtml),
		Original:    inputURL,
		IsArticle:   false,
	}, nil
}

func (c *Client) handleYouTube(ctx context.Context, link, original string, ld *Response) (*Response, error) {
	purl := fmt.Sprintf("https://www.youtube.com/oembed?url=%s&maxwidth=560&maxheight=400&format=json",
		html.EscapeString(link))

	msi, err := c.doSimpleHTTPJSONRequest(ctx, purl)
	if err != nil {
		log.FromContext(ctx).Printf("failed to do simple HTTP HTML request: %w", err)

		return ld, nil
	}

	title, ok := msi["title"].(string)
	if !ok {
		return nil, errUnexpectedOembedResponse
	}

	thumbnail, ok := msi["thumbnail_url"].(string)
	if !ok {
		return nil, errUnexpectedOembedResponse
	}

	ld.Site = "YouTube"
	ld.Favicon = "https://www.youtube.com/favicon.ico"
	ld.Title = getNonZeroString(title, ld.Title)
	ld.Image = thumbnail
	ld.Description = getNonZeroString(ld.Description, title)
	ld.Corpus = ""

	return ld, nil
}

func (c *Client) handleTwitter(ctx context.Context, link, original string, ld *Response) (*Response, error) {
	purl := fmt.Sprintf("https://publish.twitter.com/oembed?url=%s&omit_script=true&format=json",
		html.EscapeString(link))

	msi, err := c.doSimpleHTTPJSONRequest(ctx, purl)
	if err != nil {
		log.FromContext(ctx).Printf("failed to do simple HTTP HTML request: %w", err)

		return ld, nil
	}

	html, ok := msi["html"].(string)
	if !ok {
		return nil, errUnexpectedOembedResponse
	}

	info := htmlinfo.NewHTMLInfo()

	err = info.Parse(strings.NewReader(html), &link, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to read html: %w", err)
	}

	oembed := info.GenerateOembedFor(link)

	ld.Site = "Twitter"
	ld.Favicon = "https://www.twitter.com/favicon.ico"
	ld.Title = getNonZeroString(oembed.Title, ld.Title)
	ld.Image = getNonZeroString(oembed.ThumbnailURL, ld.Image)
	ld.Description = getNonZeroString(oembed.Description, ld.Description)
	ld.Corpus = ""

	return ld, nil
}

func (c *Client) doSimpleHTTPJSONRequest(ctx context.Context, url string) (map[string]interface{}, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}

	req.Header.Set("Cache-Control", "no-cache")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to do http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received non-200 status code: %w", errors.New(url))
	}

	var msi map[string]interface{}

	err = json.NewDecoder(resp.Body).Decode(&msi)
	if err != nil {
		return nil, fmt.Errorf("failed to decode response json: %w", err)
	}

	return msi, nil
}

func (c *Client) doSimpleHTTPHTMLRequest(ctx context.Context, url string) (string, error) {
	httpreq, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	httpreq.Header.Set("User-Agent", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")
	httpreq.Header.Set("Cache-Control", "no-cache")

	resp, err := c.httpClient.Do(httpreq)
	if err != nil {
		return "", fmt.Errorf("failed to do http request: %w", err)
	}
	defer resp.Body.Close()

	log.FromContext(ctx).Printf("doSimpleHTTPHTMLRequest: got status code=%d", resp.StatusCode)

	buf := new(bytes.Buffer)

	_, err = buf.ReadFrom(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed read http response body: %w", err)
	}

	return buf.String(), nil
}

func nullResponse(req *Request, urlobj *url.URL) *Response {
	return &Response{
		Title:       getNonZeroString(req.Title, urlobj.String()),
		URL:         urlobj.String(),
		Site:        getNonZeroString(req.Site, urlobj.Hostname()),
		Description: req.Description,
		Favicon:     req.Favicon,
		Image:       req.Image,
		Corpus:      req.Corpus,
		Original:    req.URL,
	}
}

func getFaviconURL(urlobj *url.URL, given string) string {
	if given != "" {
		return given
	}

	return fmt.Sprintf("https://%s/favicon.ico", urlobj.Hostname())
}

func getNonZeroString(v ...string) string {
	for _, val := range v {
		if len(val) > 0 {
			return val
		}
	}

	return ""
}

func getValidUTF8NonZeroString(v ...string) string {
	return strings.ToValidUTF8(getNonZeroString(v...), "")
}

func getOpenGraphImageURL(images []*opengraph.Image) string {
	for _, i := range images {
		if len(i.SecureURL) > 0 {
			return i.SecureURL
		}
	}

	return ""
}

func applyReadability(body string) string {
	if len(body) < 4096 {
		return ""
	}

	// Remove figure tags from Diffbot.
	d, err := goquery.NewDocumentFromReader(strings.NewReader(body))
	if err != nil {
		return ""
	}

	d.Find("figure").Remove()
	d.Find("h1").Remove()
	cleanedHtml, err := d.Html()
	if err != nil {
		return ""
	}

	// Actually apply Readability.
	doc, err := readability.NewDocument(cleanedHtml)
	if err != nil {
		return ""
	}

	doc.WhitelistTags = []string{
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"p",
		"a",
		"strong",
		"em",
		"i",
		"code",
		"pre",
		"ol",
		"ul",
		"li",
		"blockquote",
	}
	doc.WhitelistAttrs["a"] = []string{"href"}

	return strings.Trim(doc.Content(), "\r\n\t ")
}

func getContentTypeHeader(r *http.Response) *string {
	hs := r.Header.Values("Content-Type")
	if len(hs) > 0 {
		return &hs[0]
	}

	h := "text/html"

	return &h
}

type TestClient struct{}

func NewTestClient() *TestClient {
	return &TestClient{}
}

func (c *TestClient) Summarize(ctx context.Context, text string) (string, error) {
	return "summary", nil
}

func (c *TestClient) Do(ctx context.Context, req *Request) (*Response, error) {
	return &Response{
		URL:         req.URL,
		Image:       "https://via.placeholder.com/150",
		Favicon:     "https://via.placeholder.com/16",
		Title:       "Testing",
		Site:        "testing.com",
		Description: "It's only a test.",
		Original:    req.URL,
		Corpus:      "It's only a test.",
	}, nil
}

func (c *TestClient) Close() error {
	return nil
}

func resolveBackend(ctx context.Context, httpClient *http.Client) (classifer, error) {
	if key := os.Getenv("ANALYZER_KEY"); key != "" {
		log.Print("using GCP for auto-tagging")
		return newGCPBackend(ctx, key)
	}

	if key := os.Getenv("MEANING_CLOUD_KEY"); key != "" {
		log.Print("using Meaning Cloud for auto-tagging")
		return newMCBackend(ctx, key, httpClient)
	}

	if key := os.Getenv("UCLASSIFY_KEY"); key != "" {
		log.Print("using uClassify for auto-tagging")
		return newUClassifyBackend(ctx, key, httpClient)
	}

	log.Print("links will not be auto-tagged because no analyzer key was found")
	return newNullBackend(ctx)
}
