package analyze

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
)

func (c *Client) diffbot(ctx context.Context, inputUrl string) (*Response, error) {
	urlobj, err := url.ParseRequestURI("https://api.diffbot.com/v3/analyze")
	if err != nil {
		return nil, fmt.Errorf("failed to parse Diffbot url: %w", err)
	}

	q := urlobj.Query()
	q.Set("url", inputUrl)
	q.Set("discussion", "false")
	q.Set("mode", "article")
	q.Set("token", c.diffbotToken)
	urlobj.RawQuery = q.Encode()

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodGet, urlobj.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create Diffbot http request: %w", err)
	}

	httpReq.Header.Add("accept", "application/json")

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to do Diffbot http request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received non-200 status code from diffbot: %d", resp.StatusCode)
	}

	diffbotRes := new(DiffbotResponse)
	err = json.NewDecoder(resp.Body).Decode(diffbotRes)
	if err != nil {
		return nil, fmt.Errorf("failed to decode Diffbot response json: %w", err)
	}

	if len(diffbotRes.Objects) < 1 {
		return nil, errNoDiffbotResult
	}

	var image string
	for i := 0; i < len(diffbotRes.Objects[0].Images); i++ {
		if diffbotRes.Objects[0].Images[i].Primary {
			image = diffbotRes.Objects[0].Images[i].Url
			break
		}
	}

	return &Response{
		Title:    diffbotRes.Title,
		URL:      diffbotRes.Objects[0].PageUrl,
		Site:     diffbotRes.Objects[0].SiteName,
		Favicon:  diffbotRes.Objects[0].Icon,
		Image:    image,
		Corpus:   applyReadability(diffbotRes.Objects[0].Html),
		Original: inputUrl,
		html:     diffbotRes.Objects[0].Html,
	}, nil
}

type DiffbotRequest struct {
	PageUrl string `json:"pageUrl"`
	API     string `json:"api"`
	Version int    `json:"version"`
}

type DiffbotResponse struct {
	Request       *DiffbotRequest  `json:"request"`
	HumanLanguage string           `json:"humanLanguage"`
	Objects       []DiffbotArticle `json:"objects"`
	Type          string           `json:"type"`
	Title         string           `json:"title"`
}

type DiffbotArticle struct {
	Type             string            `json:"type"`
	Title            string            `json:"title"`
	Text             string            `json:"text"`
	Html             string            `json:"html"`
	Date             string            `json:"date"`
	EstimatedDate    string            `json:"estimatedDate"`
	Author           string            `json:"author"`
	AuthorUrl        string            `json:"authorUrl"`
	HumanLanguage    string            `json:"humanLanguage,omitempty"`
	NumPages         string            `json:"numPages"`
	NextPages        []string          `json:"nextPages"`
	SiteName         string            `json:"siteName,omitempty"`
	PublisherRegion  string            `json:"publisherRegion"`
	PublisherCountry string            `json:"publisherCountry"`
	Location         string            `json:"location"`
	PageUrl          string            `json:"pageUrl"`
	ResolvedPageUrl  string            `json:"resolvedPageUrl"`
	Icon             string            `json:"icon"`
	Tags             []DiffbotTag      `json:"tags,omitempty"`
	Categories       []DiffbotCategory `json:"categories"`
	Images           []DiffbotImage    `json:"images"`
}

type DiffbotTag struct {
	Label    string   `json:"label"`
	Count    int      `json:"count"`
	Score    float64  `json:"score"`
	RdfTypes []string `json:"rdfTypes"`
	Uri      string   `json:"uri"`
}

type DiffbotCategory struct {
	Score float64 `json:"score"`
	Name  string  `json:"name"`
	Id    string  `json:"id"`
}

type DiffbotImage struct {
	Url           string `json:"url"`
	Title         string `json:"title"`
	Height        int    `json:"height"`
	Width         int    `json:"width"`
	NaturalHeight int    `json:"naturalHeight"`
	NaturalWidth  int    `json:"naturalWidth"`
	Primary       bool   `json:"primary"`
	DiffbotUri    string `json:"diffbotUri"`
}
