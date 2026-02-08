package analyze

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
)

func (c *Client) iframely(ctx context.Context, inputUrl string) (*Response, error) {
	urlobj, err := url.ParseRequestURI("https://iframe.ly/api/iframely")
	if err != nil {
		return nil, fmt.Errorf("failed to parse iFramely url: %w", err)
	}

	q := urlobj.Query()
	q.Set("url", inputUrl)
	q.Set("key", c.iframelyKey)
	urlobj.RawQuery = q.Encode()

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, urlobj.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create iFramely http request: %w", err)
	}

	httpReq.Header.Add("accept", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to do iFramely http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received non-200 status code from iframely: %d", resp.StatusCode)
	}

	iframelyRes := new(IframelyResponse)
	err = json.NewDecoder(resp.Body).Decode(iframelyRes)
	if err != nil {
		return nil, fmt.Errorf("failed to decode iFramely response json: %w", err)
	}

	if iframelyRes.Meta.Title == "" {
		return nil, errNoIframelyResult
	}

	var image string
	if len(iframelyRes.Links.Thumbnail) > 0 {
		image = iframelyRes.Links.Thumbnail[0].Href
	}

	var favicon string
	if len(iframelyRes.Links.Icon) > 0 {
		favicon = iframelyRes.Links.Icon[0].Href
	}

	isArticle := iframelyRes.Meta.Medium == "article"

	return &Response{
		Title:       iframelyRes.Meta.Title,
		URL:         getNonZeroString(iframelyRes.Meta.Canonical, iframelyRes.URL),
		Site:        iframelyRes.Meta.Site,
		Favicon:     favicon,
		Image:       image,
		Description: iframelyRes.Meta.Description,
		Original:    inputUrl,
		IsArticle:   isArticle,
	}, nil
}

type IframelyResponse struct {
	URL   string        `json:"url"`
	Meta  IframelyMeta  `json:"meta"`
	Links IframelyLinks `json:"links"`
	Rel   []string      `json:"rel"`
}

type IframelyMeta struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Site        string `json:"site"`
	Medium      string `json:"medium"`
	Canonical   string `json:"canonical"`
	Author      string `json:"author"`
	AuthorURL   string `json:"author_url"`
	Date        string `json:"date"`
}

type IframelyLinks struct {
	Thumbnail []IframelyLink `json:"thumbnail"`
	Icon      []IframelyLink `json:"icon"`
}

type IframelyLink struct {
	Href  string         `json:"href"`
	Type  string         `json:"type"`
	Rel   []string       `json:"rel"`
	Media *IframelyMedia `json:"media,omitempty"`
}

type IframelyMedia struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}
