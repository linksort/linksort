# Task: Research and prototype better search, keeping the MongoDB + Go stack

You are working on **Linksort**, an open-source bookmarking app (Go API, MongoDB 7 replica set, React frontend, AWS Bedrock for AI). Read `AGENTS.md`, `README.md`, and `PRODUCT.md` first. The product principle that matters here is **"Findability over curation"**: the payoff of saving a link with zero thought is finding it again weeks later.

Search results are generally poor today. Your job is to (1) explain precisely *why* with evidence, (2) research the ways to improve them **without changing the tech stack** (MongoDB stays the datastore and the search engine; Go stays the backend; Bedrock is already in the stack; no Elasticsearch/Meilisearch/Typesense/Postgres/SQLite-FTS sidecars), (3) build a repeatable way to measure search quality, and (4) prototype the quick wins behind the existing API and measure the difference. Write it all up so the owner can decide what to ship.

## Environment and workflow

- All environment variables needed to run Linksort locally end to end (AWS/Bedrock credentials, analyzer and extractor keys, etc.) are already set in your shell, so the analyzer produces real titles, tags, and article text when you seed links, and the assistant's `get_links` search can be exercised in the chat. Run the real stack and measure against it.
- Create a feature branch from `main` (e.g. `research/search-quality`). Research notes and the harness go in one commit series; the quick-win prototype in a clearly separated series on the same branch (or a second branch `feat/search-quick-wins` based on it; say which). **Push to `origin`** (`git push -u origin <branch>`) early and after each milestone. Do not commit to `main`.

---

## 1. How search works today (read these before measuring)

- **Index** (`db/client.go → SetupIndexes`): one compound text index on `links` over `corpus`, `title`, `description`, `site`, all at the default weight (1). Other indexes: unique `{userid, url}`, `isfavorite`, `tagpaths`, `isannotated`. The text index is **not** prefixed by `userid`, so a `$text` query scans matching documents across all users and then filters by `userid`.
- **Query** (`db/link.go → GetLinksByUser` + `GetLinksSearch`): `search=<q>` becomes `{"$text": {"$search": q}}` added to the filter map alongside `userid` and any folder/tag/favorite filters. When searching, results are sorted by `{"score": {"$meta": "textScore"}}` (the user's chosen sort is dropped) and paginated with skip/limit (default page size 18, `model/pagination.go`). The score projection has a typo (`" textScore"` with a leading space) that MongoDB evidently tolerates; the score is not returned to the client (`model.Link` has no field for it).
- **What gets indexed**: `corpus` is the extractor's **HTML** (tags, attributes, URLs, class names all become tokens), often tens of KB, so corpus term frequency dominates scoring and pollutes the vocabulary. `annotation` (notes), `userTags`, `tagPaths`, and `url` are not indexed at all, even though the splash site says "Notes are searchable". (A parallel task on notes/highlights may add `annotation`/`highlights.*` to the index; check `git log -- db/client.go` and coordinate rather than conflict.)
- **Semantics of `$text`**: terms are OR'ed (any term matches), phrases need escaped quotes, negation with `-`, English stemming and stop-word removal by default (`default_language`), case/diacritic-insensitive, **no prefix/partial matching and no fuzzy matching**. Verified on the running app: `archi` returns nothing although "architecture" is in a title; `FP` matches only because it appears in the corpus.
- **Clients**: the web app (`frontend/src/hooks/filters.js → handleSearch` → `/?search=`; `hooks/links.js → useLinks`), the assistant's `get_links` tool (`assistant/assistant.go`, "Text search across link content"), the iOS app via the public API, and the API docs at `/docs`. Any change must keep `GET /api/links?search=` working with the same shape; adding fields (e.g. a `score` or `matchedIn`) is fine.
- **Where the data lives in prod**: find out whether production MongoDB is **Atlas** or self-managed (ask the owner; `DB_CONNECTION` is injected at deploy time via `.circleci/`). This decides whether Atlas Search / Atlas Vector Search are on the table (they are "still MongoDB", but they do not run in the local `mongo:7` container used by `docker compose` and the tests; the Atlas CLI's local deployments can run them for development; verify the current state of that).

## 2. Build the measurement harness first

Create `cmd/searchbench/` (a Go program) or `integ/search_quality_test.go` (a test gated by an env var so CI stays fast); pick the one that is easier to keep alive. It must:

1. **Seed a realistic corpus** into the local `mongo-rs` database for one user: ~150–300 links across a dozen topics, with real-looking titles, sites, descriptions, user tags, a few notes, and HTML corpora of realistic size. Prefer real content: a list of ~100 public URLs run through the existing analyzer (your environment has the analyzer keys, so `controller/link.CreateLink` produces real titles, descriptions, auto-tags, and extracted article text; see `testutil.NewLink` for direct store inserts), cached to `cmd/searchbench/testdata/links.json` so the benchmark is deterministic offline. Include deliberate hard cases: two articles on the same topic with different vocabulary, a link whose only distinctive word is in its note, a link whose site name is the query, near-duplicate titles, non-English words, and a URL slug that contains the query.
2. **A query set with relevance judgments** (`testdata/queries.json`): 30–50 queries written the way a user would type them weeks later: single words, two-word topics, a site name, a half-remembered title fragment, a prefix (`archi`), a typo (`arcitecture`), a phrase in quotes, a tag, a word from a note, a question-like query ("that article about fame and happiness"). Each query lists the expected link(s) and a relevance grade.
3. **Metrics**: Recall@10, MRR, nDCG@10, and the zero-result rate across the set, plus p50/p95 latency per query from `explain("executionStats")` or wall-clock over 20 runs. Print a table and write JSON so two runs can be diffed.
4. **Pluggable strategies**: the harness calls a `Searcher` interface so the current implementation and each candidate can be scored on the same data. Run the baseline first and commit its numbers.

## 3. Research directions to evaluate (cover all; measure the ones you can run locally)

A. **Fix the index, keep `$text`** (likely the quick wins):
   - Index a **plain-text** version of the corpus instead of HTML: add `corpusText` (HTML stripped, whitespace collapsed, perhaps truncated to the first N KB) populated on create/update and backfilled for existing links (a startup migration or a `cmd/` tool; it must be safe to re-run). Measure the effect on precision alone.
   - **Field weights**: e.g. `title` 10, `userTags` 8, `annotation` 6, `site` 5, `description` 3, `corpusText` 1. Add `userTags`, `tagPaths` (or a flattened tag-name field), `annotation`, and the URL's host/slug tokens to the index.
   - **Compound text index prefixed by `userid`** so a search is confined to one user's documents (equality prefix is required in the query; it always is). Measure latency on the seeded data and reason about it for a user with 5k links.
   - **AND semantics** by auto-quoting each term (`"functional" "architecture"`), with fallback to OR when AND yields nothing; measure precision/recall trade-off on multi-word queries.
   - Language settings: `default_language` vs `none` (no stemming/stop words) and per-document `language_override` for non-English saves.
   - Fix the `" textScore"` typo; return the score to clients; consider a **recency tie-break** (`$addFields` combining `textScore` with age) via an aggregation pipeline instead of `Find`, so sort is `score desc, createdAt desc`.
   - Note the operational constraint: only one text index per collection, so changing it means `SetupIndexes` must drop and recreate it idempotently at startup (and rebuilding takes time on the prod collection; estimate it).

B. **Prefix, partial, and typo tolerance without `$text`** (what `$text` cannot do):
   - A `keywords` array field per link (lower-cased tokens of title, site, user tags, URL host/slug, and maybe the first 50 words of the description) with a regular index, queried with an anchored `$regex: ^prefix` (prefix-friendly on a multikey index) or with **edge n-grams** stored in the array for true index-backed prefix search. Combine with `$text` in one `$or` or run both and merge (reciprocal rank fusion) in Go.
   - Typos: trigram arrays + count-of-matching-trigrams scoring in an aggregation, or a Go-side Levenshtein pass over the user's `keywords` (per-user vocabularies are small; a few thousand tokens) to expand the query before hitting the index. Measure the typo queries.
   - Per-user vocabulary is small enough that **loading a user's titles/sites/tags into memory and ranking in Go** (BM25 over title/description/tags, prefix matching, fuzzy) is a legitimate design; cost it out (memory, cold start, consistency) and measure it; it keeps MongoDB as the only store.

C. **Atlas Search** (`$search`: Lucene analyzers, `autocomplete`, `fuzzy`, `compound` with boosts, highlighting, facets): if prod is on Atlas this is the largest lever with the least code. Document: index definition, how `GetLinksByUser` would change (aggregation with `$search` then `$match` on userid, or a `userid` filter inside `compound.filter`), local dev/test story (Atlas CLI local deployment vs. keeping the mock path), cost, and the migration/rollback plan. If prod is not on Atlas, say so and keep this as the "if you ever move" option; do not build it.

D. **Semantic search with Bedrock embeddings** (Titan Text Embeddings v2 or Cohere via Bedrock, both already reachable through the existing Bedrock client setup in `cmd/serve/main.go`): embed `title + description + first ~1k chars of corpusText` at save time (async, like corpus gathering), store the vector on the link, and at query time embed the query and rank by cosine. On Atlas this is Vector Search; self-hosted it is a Go-side scan over the user's vectors (1,000 links × 1,024 floats is ~4 MB; fine per request with a projection, or cache per user). Evaluate hybrid ranking (RRF of lexical + semantic) on the "question-like" and "different vocabulary" queries. Account for cost per link, latency, failure handling when Bedrock is unavailable, and privacy (PRODUCT.md: no third-party sharing beyond what already happens with Bedrock for summaries/chat).

E. **Query-side and UI improvements** that make results *feel* better regardless of engine: showing which field matched (title / note / article), search within the current folder/tag (already supported; is it discoverable?), highlighting the matched snippet on cards, "did you mean" from the user's own vocabulary, and sorting controls while searching (today the user's sort is silently dropped). Keep this to a page of recommendations; the sidebar search input is being redone in a separate task.

For each direction record: what it fixes (which failing queries in the harness), measured before/after on the harness where you could run it, effort (S/M/L), operational risk (index rebuilds, migrations, new infra), and whether it changes the public API.

## 4. Prototype the quick wins and measure them

On a separate branch/commits, implement the best of direction A (and, if cheap, the prefix part of B) **behind the same `GET /api/links?search=` API**:

- `corpusText` field + backfill tool; weighted, `userid`-prefixed text index with notes/tags included; idempotent index migration in `SetupIndexes` (list indexes, compare spec, drop/recreate; log it); AND-then-OR query strategy; typo fix; score + recency sort via aggregation; score returned as `score` on `model.Link` (`json:"score,omitempty"`).
- Keep `GetLinksSearch`'s option-function shape so the controller does not change much; add an integ test in `integ/link_test.go` for: prefix of a title word (if implemented), a note-only word, a tag, AND semantics (two words that each appear in different links but together only in one), and that the sort is by relevance then recency.
- Run the harness before and after; put the two tables side by side in the write-up.
- `go vet ./...` and `go test ./...` (needs the `mongo-rs` container) must pass; regenerate Swagger (`swag init --dir cmd/serve/,handler,model,payload,agent`) if `model.Link` gained a field.

## 5. Verify end to end (use your tools; do not only reason)

1. Start the stack: build/run the `mongo-rs` image; `export PRODUCTION=0 FRONTEND_HOSTNAME=localhost FRONTEND_PORT=3000 PORT=8080; air`; `cd frontend && yarn start`; open http://localhost:8080 and sign up. Seed the benchmark corpus for your user (give the harness a `--user-email` flag so it can seed into a real account).
2. In the browser, run the "weeks later" queries by hand through the UI (sidebar search) before and after the prototype and screenshot the result lists for 5 representative queries (prefix, typo, note word, site name, two-word topic). Confirm the header still says `Searching for "…" in All`, pagination works on searches with more than 18 results, and "Clear search" works.
3. In `mongosh`, show `db.links.getIndexes()` before and after startup to prove the migration ran once and is a no-op on the second start (restart the backend and check the log line).
4. Ask the assistant in the chat panel "find my link about X" for a prefix query and a note-word query and confirm its `get_links` search benefits from the prototype (watch the tool activity card and the backend log).

## 6. Deliverables

1. `docs/research/search-quality.md`: the diagnosis with evidence (harness tables, `explain` output, the failing query categories), the directions in §3 with measurements and S/M/L estimates, a recommended plan in phases (ship now / next / if-on-Atlas), and open questions for the owner (Atlas or not; acceptable Bedrock spend; whether to index full corpus text or a prefix of it).
2. The harness (`cmd/searchbench/` or the gated integ test) with its fixtures and a README section explaining how to run it and how to add queries.
3. The quick-win prototype on its own commits, with before/after numbers, the browser screenshots, and the pushed branch name(s) in your final message.
4. A short addition to `README.md`/`AGENTS.md` describing the search implementation, the index migration behavior, and how to run the benchmark.

## 7. Acceptance criteria

1. The write-up explains the poor results with measured evidence, not intuition, and every recommendation is tied to the queries it fixes.
2. The harness is deterministic offline, reports Recall@10 / MRR / nDCG@10 / zero-result rate / latency, and can score alternative strategies through one interface.
3. The prototype measurably improves the harness numbers, keeps the public API compatible, migrates the text index idempotently, and passes all Go tests.
4. Every direction in §3 is covered, including an explicit verdict on Atlas Search and on embeddings given the actual production deployment.
