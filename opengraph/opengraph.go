package opengraph

import (
	"context"
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/dyatlov/go-htmlinfo/htmlinfo"
	"github.com/dyatlov/go-opengraph/opengraph"
	"github.com/microcosm-cc/bluemonday"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/log"
)

type LinkData struct {
	URL         string
	Image       string
	Favicon     string
	Title       string
	Site        string
	Description string
	Original    string
	Corpus      string
}

type Extractor interface {
	Extract(ctx context.Context, link string) *LinkData
}

func NewClient() *Client {
	return &Client{
		httpClient: &http.Client{Timeout: time.Duration(5) * time.Second},
	}
}

type Client struct {
	httpClient *http.Client
}

func (c *Client) Extract(ctx context.Context, link string) *LinkData {
	op := errors.Opf("opengraph.Extract(%s)", link)
	logger := log.FromContext(ctx)

	urlobj, err := url.ParseRequestURI(link)
	if err != nil {
		logger.Print(errors.E(op, err))

		return nil
	}

	urlobj.Host = strings.TrimPrefix(urlobj.Host, "m.")
	urlobj.Host = strings.TrimPrefix(urlobj.Host, "mobile.")
	cleanURL := urlobj.String()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, cleanURL, nil)
	if err != nil {
		logger.Print(errors.E(op, err))

		return nil
	}

	req.Header.Set("User-Agent", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")
	req.Header.Set("Cache-Control", "no-cache")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		logger.Print(errors.E(op, err))

		return nil
	}
	defer resp.Body.Close()

	info := htmlinfo.NewHTMLInfo()

	err = info.Parse(resp.Body, &cleanURL, getContentTypeHeader(resp))
	if err != nil {
		logger.Print(errors.E(op, err))

		return nil
	}

	oembed := info.GenerateOembedFor(cleanURL)
	ld := &LinkData{
		Title:       oembed.Title,
		URL:         oembed.URL,
		Site:        oembed.ProviderName,
		Description: getNonZeroString(info.OGInfo.Description, info.Description, oembed.Description),
		Favicon:     getFaviconURL(urlobj, info.FaviconURL),
		Image:       getNonZeroString(oembed.ThumbnailURL, getOpenGraphImageURL(info.OGInfo.Images), info.ImageSrcURL),
		Corpus:      getCorpus(info.MainContent),
		Original:    link,
	}

	// YouTube and Twitter are not reliable. Sometimes they give us what we're
	// looking for and other times they give us nothing. In that case, we
	// fall back to their oembed APIs which don't provide much info but which
	// provide more than nothing.
	if ld.Image == "" {
		if hn := urlobj.Hostname(); hn == "youtu.be" || strings.HasSuffix(hn, "youtube.com") {
			return c.handleYouTube(ctx, cleanURL, link)
		} else if strings.HasSuffix(hn, "twitter.com") {
			return c.handleTwitter(ctx, urlobj.String(), link)
		}
	}

	return ld
}

func (c *Client) handleYouTube(ctx context.Context, link, original string) *LinkData {
	purl := fmt.Sprintf("https://www.youtube.com/oembed?url=%s&maxwidth=560&maxheight=400&format=json",
		html.EscapeString(link))
	op := errors.Opf("opengraph.handleYouTube(%s)", purl)
	logger := log.FromContext(ctx)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, purl, nil)
	if err != nil {
		logger.Print(errors.E(op, err))

		return nil
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		logger.Print(errors.E(op, err))

		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Print(errors.E(op, errors.Strf("received status code %d", resp.StatusCode)))

		return nil
	}

	var msi map[string]interface{}

	err = json.NewDecoder(resp.Body).Decode(&msi)
	if err != nil {
		logger.Print(errors.E(op, err))

		return nil
	}

	ld := &LinkData{
		Site:        "YouTube",
		Favicon:     "https://www.youtube.com/favicon.ico",
		URL:         link,
		Original:    original,
		Description: "",
	}

	title, ok := msi["title"].(string)
	if !ok {
		logger.Print(errors.E(op, errors.Str("no title in response")))

		return nil
	}

	ld.Title = title

	thumbnail, ok := msi["thumbnail_url"].(string)
	if !ok {
		logger.Print(errors.E(op, errors.Str("no thumbnail in response")))
	} else {
		ld.Image = thumbnail
	}

	return ld
}

func (c *Client) handleTwitter(ctx context.Context, link, original string) *LinkData {
	purl := fmt.Sprintf("https://publish.twitter.com/oembed?url=%s&omit_script=true&format=json",
		html.EscapeString(link))
	op := errors.Opf("opengraph.handleTwitter(%s)", purl)
	logger := log.FromContext(ctx)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, purl, nil)
	if err != nil {
		logger.Print(errors.E(op, err))

		return nil
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		logger.Print(errors.E(op, err))

		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Print(errors.E(op, err))

		return nil
	}

	var msi map[string]interface{}

	err = json.NewDecoder(resp.Body).Decode(&msi)
	if err != nil {
		logger.Print(errors.E(op, err))

		return nil
	}

	html, ok := msi["html"].(string)
	if !ok {
		logger.Print(errors.E(op, err))

		return nil
	}

	info := htmlinfo.NewHTMLInfo()

	err = info.Parse(strings.NewReader(html), &link, nil)
	if err != nil {
		logger.Print(errors.E(op, err))

		return nil
	}

	oembed := info.GenerateOembedFor(link)

	return &LinkData{
		Title:       oembed.Title,
		URL:         link,
		Site:        "Twitter",
		Favicon:     "https://www.twitter.com/favicon.ico",
		Description: oembed.Description,
		Image:       oembed.ThumbnailURL,
		Original:    link,
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

func getCorpus(s string) string {
	return strings.TrimSpace(bluemonday.StripTagsPolicy().Sanitize(s))
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

func (c *TestClient) Extract(ctx context.Context, link string) *LinkData {
	return &LinkData{
		URL:         link,
		Image:       "https://via.placeholder.com/150",
		Favicon:     "https://via.placeholder.com/16",
		Title:       "Testing",
		Site:        "testing.com",
		Description: "It's only a test.",
		Original:    link,
		Corpus:      "It's only a test.",
	}
}
