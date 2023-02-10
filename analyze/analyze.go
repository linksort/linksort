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
	"time"

	"github.com/dyatlov/go-htmlinfo/htmlinfo"
	"github.com/dyatlov/go-opengraph/opengraph"
	"github.com/dyatlov/go-readability"

	"github.com/linksort/linksort/log"
)

const defaultHTTPRequestTimeoutSeconds = 10

var (
	ErrUnparsableURI            = errors.New("unparsable URI")
	ErrNoClassify               = errors.New("could not classify")
	errUnexpectedOembedResponse = errors.New("unexpected oembed response")
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
	html        string
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
	classifer  classifer
	httpClient *http.Client
}

func New(ctx context.Context) (*Client, error) {
	c := &http.Client{
		Timeout: time.Duration(defaultHTTPRequestTimeoutSeconds) * time.Second}

	classiferBackend, err := resolveBackend(ctx, c)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize: %w", err)
	}

	return &Client{
		httpClient: c,
		classifer:  classiferBackend,
	}, nil
}

func (c *Client) Close() error {
	return c.classifer.Close()
}

func (c *Client) Do(ctx context.Context, req *Request) (*Response, error) {
	urlobj, err := url.ParseRequestURI(req.URL)
	if err != nil {
		return nil, fmt.Errorf("%w: %s", ErrUnparsableURI, err.Error())
	}

	urlobj.Host = strings.TrimPrefix(urlobj.Host, "m.")
	urlobj.Host = strings.TrimPrefix(urlobj.Host, "mobile.")
	cleanURL := urlobj.String()

	rawhtml, err := c.doSimpleHTTPHTMLRequest(ctx, cleanURL)
	if err != nil {
		log.FromContext(ctx).Printf("failed to do simple HTTP HTML request: %w", err)

		return nullResponse(req, urlobj), nil
	}

	// Parse response HTML content
	info := htmlinfo.NewHTMLInfo()
	info.AllowMainContentExtraction = false
	contentType := "text/html"
	err = info.Parse(strings.NewReader(rawhtml), &cleanURL, &contentType)
	if err != nil {
		log.FromContext(ctx).Printf("failed to parse html info: %w", err)

		return nullResponse(req, urlobj), nil
	}

	oembed := info.GenerateOembedFor(cleanURL)
	description := getNonZeroString(req.Description, info.OGInfo.Description, info.Description, oembed.Description)

	ld := &Response{
		Title:       getNonZeroString(req.Title, oembed.Title, urlobj.Hostname()),
		URL:         getNonZeroString(oembed.URL, cleanURL),
		Site:        getNonZeroString(req.Site, oembed.ProviderName, urlobj.Hostname()),
		Description: description,
		Favicon:     getNonZeroString(req.Favicon, getFaviconURL(urlobj, info.FaviconURL)),
		Image:       getNonZeroString(req.Image, oembed.ThumbnailURL, getOpenGraphImageURL(info.OGInfo.Images), info.ImageSrcURL),
		Corpus:      getCorpus(req.Corpus, rawhtml, description),
		Original:    req.URL,
		html:        getNonZeroString(req.Corpus, rawhtml),
	}

	ld, err = c.classifer.Classify(ctx, ld)
	if err != nil && !errors.Is(err, errTooFewTokens) {
		ld.Description = ""
		ld.Corpus = ""
		ld.html = ""
		return ld, fmt.Errorf("%w: %s", ErrNoClassify, err.Error())
	}

	ld.html = ""

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
	ld.Corpus = getNonZeroString(ld.Corpus, ld.Description)

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
	ld.Corpus = getNonZeroString(ld.Corpus, ld.Description)

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

func getOpenGraphImageURL(images []*opengraph.Image) string {
	for _, i := range images {
		if len(i.SecureURL) > 0 {
			return i.SecureURL
		}
	}

	return ""
}

func getCorpus(reqCorpus, parsedBody, description string) string {
	if len(parsedBody) < 512 && len(reqCorpus) < 512 {
		return description
	}

	var docToUse string
	if len(reqCorpus) > 512 {
		docToUse = reqCorpus
	} else {
		docToUse = parsedBody
	}

	doc, err := readability.NewDocument(docToUse)
	if err != nil {
		return description
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
		// "img",
	}
	// doc.WhitelistAttrs["img"] = []string{"src", "title", "alt"}
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
