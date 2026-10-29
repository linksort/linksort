package integ_test

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/steinfletcher/apitest"
	jsonpath "github.com/steinfletcher/apitest-jsonpath"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/linksort/linksort/db"
	"github.com/linksort/linksort/testutil"
)

func createHighlight(t *testing.T, sessionID, linkID string, body map[string]interface{}) *apitest.Response {
	t.Helper()

	return apitest.New().
		Handler(testutil.Handler()).
		Post(fmt.Sprintf("/api/links/%s/highlights", linkID)).
		Header("X-Csrf-Token", testutil.UserCSRF(sessionID)).
		JSON(body).
		Cookie("session_id", sessionID).
		Expect(t)
}

func TestHighlightLifecycle(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)
	other, _ := testutil.NewUser(t, ctx)
	lnk := testutil.NewLink(t, ctx, usr)

	// Create: isAnnotated flips to true with a highlight and no note.
	var highlightID string

	createHighlight(t, usr.SessionID, lnk.ID, map[string]interface{}{
		"exact":  "a memorable sentence",
		"prefix": "this is ",
		"suffix": " in the text",
		// Note: string fields are trimmed by payload.Valid, so prefix/suffix
		// come back without their outer whitespace; the frontend matches them
		// whitespace-insensitively.
		"start":  8,
		"end":    28,
	}).
		Status(http.StatusCreated).
		Assert(jsonpath.Equal("$.link.id", lnk.ID)).
		Assert(jsonpath.Equal("$.link.isAnnotated", true)).
		Assert(jsonpath.Len("$.link.highlights", 1)).
		Assert(jsonpath.Equal("$.link.highlights[0].exact", "a memorable sentence")).
		Assert(jsonpath.Equal("$.link.highlights[0].prefix", "this is")).
		Assert(jsonpath.Equal("$.link.highlights[0].suffix", "in the text")).
		Assert(jsonpath.Equal("$.link.highlights[0].start", float64(8))).
		Assert(jsonpath.Equal("$.link.highlights[0].end", float64(28))).
		Assert(jsonpath.Equal("$.link.highlights[0].note", "")).
		Assert(jsonpath.Present("$.link.highlights[0].id")).
		Assert(jsonpath.Present("$.link.highlights[0].createdAt")).
		End()

	// Fetch the id back through GET so the rest of the test can use it.
	got := apitest.New().
		Handler(testutil.Handler()).
		Get(fmt.Sprintf("/api/links/%s", lnk.ID)).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		Assert(jsonpath.Len("$.link.highlights", 1)).
		End()

	var res struct {
		Link struct {
			Highlights []struct {
				ID string `json:"id"`
			} `json:"highlights"`
		} `json:"link"`
	}
	got.JSON(&res)
	highlightID = res.Link.Highlights[0].ID
	if highlightID == "" {
		t.Fatal("expected a highlight id")
	}

	// The other user cannot see or touch it.
	createHighlight(t, other.SessionID, lnk.ID, map[string]interface{}{
		"exact": "nope",
	}).Status(http.StatusNotFound).End()

	apitest.New().
		Handler(testutil.Handler()).
		Patch(fmt.Sprintf("/api/links/%s/highlights/%s", lnk.ID, highlightID)).
		Header("X-Csrf-Token", testutil.UserCSRF(other.SessionID)).
		JSON(map[string]interface{}{"note": "mine now"}).
		Cookie("session_id", other.SessionID).
		Expect(t).
		Status(http.StatusNotFound).
		End()

	// Update the note.
	apitest.New().
		Handler(testutil.Handler()).
		Patch(fmt.Sprintf("/api/links/%s/highlights/%s", lnk.ID, highlightID)).
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]interface{}{"note": "remember this"}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		Assert(jsonpath.Equal("$.link.highlights[0].id", highlightID)).
		Assert(jsonpath.Equal("$.link.highlights[0].note", "remember this")).
		Assert(jsonpath.Equal("$.link.isAnnotated", true)).
		End()

	// Unknown highlight id → 404.
	apitest.New().
		Handler(testutil.Handler()).
		Patch(fmt.Sprintf("/api/links/%s/highlights/%s", lnk.ID, "does-not-exist")).
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]interface{}{"note": "x"}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusNotFound).
		End()

	// annotated=1 lists a link that has only highlights (no note).
	apitest.New().
		Handler(testutil.Handler()).
		Get("/api/links").
		Query("annotated", "1").
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		Assert(jsonpath.Len("$.links", 1)).
		Assert(jsonpath.Equal("$.links[0].id", lnk.ID)).
		Assert(jsonpath.Equal("$.links[0].isAnnotated", true)).
		Assert(jsonpath.Equal("$.links[0].highlights[0].exact", "a memorable sentence")).
		Assert(jsonpath.Equal("$.links[0].highlights[0].note", "remember this")).
		End()

	// Delete: isAnnotated falls back to false when nothing else is attached.
	apitest.New().
		Handler(testutil.Handler()).
		Delete(fmt.Sprintf("/api/links/%s/highlights/%s", lnk.ID, highlightID)).
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		Assert(jsonpath.Len("$.link.highlights", 0)).
		Assert(jsonpath.Equal("$.link.isAnnotated", false)).
		End()

	apitest.New().
		Handler(testutil.Handler()).
		Get("/api/links").
		Query("annotated", "1").
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		Assert(jsonpath.Len("$.links", 0)).
		End()

	// Deleting twice → 404.
	apitest.New().
		Handler(testutil.Handler()).
		Delete(fmt.Sprintf("/api/links/%s/highlights/%s", lnk.ID, highlightID)).
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusNotFound).
		End()
}

func TestHighlightValidation(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)
	lnk := testutil.NewLink(t, ctx, usr)

	tests := []struct {
		Name         string
		GivenBody    map[string]interface{}
		ExpectStatus int
	}{
		{
			Name:         "missing exact",
			GivenBody:    map[string]interface{}{"note": "hi"},
			ExpectStatus: http.StatusBadRequest,
		},
		{
			Name:         "whitespace exact",
			GivenBody:    map[string]interface{}{"exact": "   \n\t "},
			ExpectStatus: http.StatusBadRequest,
		},
		{
			Name:         "exact too long",
			GivenBody:    map[string]interface{}{"exact": strings.Repeat("x", 2001)},
			ExpectStatus: http.StatusBadRequest,
		},
		{
			Name:         "prefix too long",
			GivenBody:    map[string]interface{}{"exact": "ok", "prefix": strings.Repeat("p", 65)},
			ExpectStatus: http.StatusBadRequest,
		},
		{
			Name:         "suffix too long",
			GivenBody:    map[string]interface{}{"exact": "ok", "suffix": strings.Repeat("s", 65)},
			ExpectStatus: http.StatusBadRequest,
		},
		{
			Name:         "note too long",
			GivenBody:    map[string]interface{}{"exact": "ok", "note": strings.Repeat("n", 10001)},
			ExpectStatus: http.StatusBadRequest,
		},
		{
			Name:         "negative start",
			GivenBody:    map[string]interface{}{"exact": "ok", "start": -1},
			ExpectStatus: http.StatusBadRequest,
		},
		{
			Name:         "max lengths are accepted",
			GivenBody:    map[string]interface{}{"exact": strings.Repeat("x", 2000), "prefix": strings.Repeat("p", 64), "suffix": strings.Repeat("s", 64), "note": strings.Repeat("n", 10000)},
			ExpectStatus: http.StatusCreated,
		},
	}

	for _, tcase := range tests {
		t.Run(tcase.Name, func(t *testing.T) {
			createHighlight(t, usr.SessionID, lnk.ID, tcase.GivenBody).
				Status(tcase.ExpectStatus).
				End()
		})
	}

	// Update note too long → 400.
	apitest.New().
		Handler(testutil.Handler()).
		Patch(fmt.Sprintf("/api/links/%s/highlights/%s", lnk.ID, "any")).
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]interface{}{"note": strings.Repeat("n", 10001)}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusBadRequest).
		End()
}

func TestHighlightCap(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)
	lnk := testutil.NewLink(t, ctx, usr)

	for i := 0; i < 200; i++ {
		createHighlight(t, usr.SessionID, lnk.ID, map[string]interface{}{
			"exact": fmt.Sprintf("highlight %d", i),
		}).Status(http.StatusCreated).End()
	}

	createHighlight(t, usr.SessionID, lnk.ID, map[string]interface{}{
		"exact": "one too many",
	}).
		Status(http.StatusBadRequest).
		Assert(jsonpath.Contains("$.message", "at most 200")).
		End()

	apitest.New().
		Handler(testutil.Handler()).
		Get(fmt.Sprintf("/api/links/%s", lnk.ID)).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		Assert(jsonpath.Len("$.link.highlights", 200)).
		End()
}

func TestAnnotationStillWorksAndIsSearchable(t *testing.T) {
	ctx := context.Background()
	usr, _ := testutil.NewUser(t, ctx)
	noteLink := testutil.NewLink(t, ctx, usr)
	highlightLink := testutil.NewLink(t, ctx, usr)
	testutil.NewLink(t, ctx, usr) // a link with nothing written on it

	// PATCH /api/links/{id} with annotation is unchanged for the iOS app and
	// the public API.
	apitest.New().
		Handler(testutil.Handler()).
		Patch(fmt.Sprintf("/api/links/%s", noteLink.ID)).
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]interface{}{"annotation": "the word zanzibar appears only here"}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		Assert(jsonpath.Equal("$.link.annotation", "the word zanzibar appears only here")).
		Assert(jsonpath.Equal("$.link.isAnnotated", true)).
		Assert(jsonpath.Len("$.link.highlights", 0)).
		End()

	createHighlight(t, usr.SessionID, highlightLink.ID, map[string]interface{}{
		"exact": "some quoted passage",
		"note":  "compare with the quokka paper",
	}).Status(http.StatusCreated).End()

	// A word that appears only in the link note.
	apitest.New().
		Handler(testutil.Handler()).
		Get("/api/links").
		Query("search", "zanzibar").
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		Assert(jsonpath.Len("$.links", 1)).
		Assert(jsonpath.Equal("$.links[0].id", noteLink.ID)).
		Assert(jsonpath.Equal("$.links[0].annotation", "the word zanzibar appears only here")).
		End()

	// A word that appears only in a highlight note.
	apitest.New().
		Handler(testutil.Handler()).
		Get("/api/links").
		Query("search", "quokka").
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		Assert(jsonpath.Len("$.links", 1)).
		Assert(jsonpath.Equal("$.links[0].id", highlightLink.ID)).
		End()

	// A word that appears only in highlighted text.
	apitest.New().
		Handler(testutil.Handler()).
		Get("/api/links").
		Query("search", "quoted").
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		Assert(jsonpath.Len("$.links", 1)).
		Assert(jsonpath.Equal("$.links[0].id", highlightLink.ID)).
		End()

	// Clearing the note turns isAnnotated off again.
	apitest.New().
		Handler(testutil.Handler()).
		Patch(fmt.Sprintf("/api/links/%s", noteLink.ID)).
		Header("X-Csrf-Token", testutil.UserCSRF(usr.SessionID)).
		JSON(map[string]interface{}{"annotation": ""}).
		Cookie("session_id", usr.SessionID).
		Expect(t).
		Status(http.StatusOK).
		Assert(jsonpath.Equal("$.link.isAnnotated", false)).
		End()
}

// TestSetupIndexesMigratesTextIndex simulates a database that still has the
// pre-highlights text index and checks that SetupIndexes replaces it, and
// that running it again is a no-op.
func TestSetupIndexesMigratesTextIndex(t *testing.T) {
	ctx := context.Background()
	client := testutil.Mongo()
	col := client.Database("test").Collection("links")

	// Replace the current text index with the legacy one.
	name, _ := findLinksTextIndex(t, ctx, col)
	if name != "" {
		if _, err := col.Indexes().DropOne(ctx, name); err != nil {
			t.Fatal(err)
		}
	}

	legacyName, err := col.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			primitive.E{Key: "corpus", Value: "text"},
			primitive.E{Key: "title", Value: "text"},
			primitive.E{Key: "description", Value: "text"},
			primitive.E{Key: "site", Value: "text"},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	if err := db.SetupIndexes(ctx, client); err != nil {
		t.Fatal(err)
	}

	name, weights := findLinksTextIndex(t, ctx, col)
	if name != db.LinkTextIndexName {
		t.Fatalf("expected text index %q, got %q (legacy was %q)", db.LinkTextIndexName, name, legacyName)
	}

	for field, want := range db.LinkTextIndexWeights {
		if weights[field] != want {
			t.Errorf("weight for %s: want %d, got %d", field, want, weights[field])
		}
	}

	if len(weights) != len(db.LinkTextIndexWeights) {
		t.Errorf("unexpected weights: %v", weights)
	}

	// Second run: idempotent.
	if err := db.SetupIndexes(ctx, client); err != nil {
		t.Fatal(err)
	}

	name2, weights2 := findLinksTextIndex(t, ctx, col)
	if name2 != name || len(weights2) != len(weights) {
		t.Fatalf("second SetupIndexes changed the index: %q %v", name2, weights2)
	}

	count := countTextIndexes(t, ctx, col)
	if count != 1 {
		t.Fatalf("expected exactly one text index, got %d", count)
	}
}

func listIndexes(t *testing.T, ctx context.Context, col *mongo.Collection) []bson.M {
	t.Helper()

	cur, err := col.Indexes().List(ctx)
	if err != nil {
		t.Fatal(err)
	}

	var specs []bson.M
	if err := cur.All(ctx, &specs); err != nil {
		t.Fatal(err)
	}

	return specs
}

func findLinksTextIndex(t *testing.T, ctx context.Context, col *mongo.Collection) (string, map[string]int32) {
	t.Helper()

	for _, spec := range listIndexes(t, ctx, col) {
		if _, ok := spec["textIndexVersion"]; !ok {
			continue
		}

		weights := map[string]int32{}

		switch w := spec["weights"].(type) {
		case bson.D:
			for _, e := range w {
				weights[e.Key] = e.Value.(int32)
			}
		case bson.M:
			for k, v := range w {
				weights[k] = v.(int32)
			}
		}

		return spec["name"].(string), weights
	}

	return "", nil
}

func countTextIndexes(t *testing.T, ctx context.Context, col *mongo.Collection) int {
	t.Helper()

	n := 0
	for _, spec := range listIndexes(t, ctx, col) {
		if _, ok := spec["textIndexVersion"]; ok {
			n++
		}
	}

	return n
}
