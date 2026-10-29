# AGENTS.md

This file provides guidance to Claude Code and other AI agents when working with code in this repository.

## Project Overview

Linksort is an open source bookmarking application with AI-powered features. It consists of a Go backend API server and a React frontend, with MongoDB for data storage and AWS Bedrock for AI functionality.

## Key Architecture Components

### Backend (Go)
- **Entry point**: `cmd/serve/main.go` - Main server with dependency injection setup
- **Handler layer**: `handler/` - HTTP routing and middleware, organized by domain (user, link, folder, conversation)
- **Controller layer**: `controller/` - Business logic for each domain
- **Model layer**: `model/` - Data structures and store interfaces
- **Database layer**: `db/` - MongoDB implementations of store interfaces
- **Analysis system**: `analyze/` - Content extraction, summarization, and classification using multiple AI providers
- **AI Agent system**: `agent/` - AWS Bedrock integration for conversational AI features
- **Assistant system**: `assistant/` - Orchestrates AI agent interactions with link and folder operations

### Frontend (React)
- **Entry point**: `frontend/src/index.jsx`
- **Components**: `frontend/src/components/` - Reusable UI components
- **Pages**: `frontend/src/pages/` - Route-level components
- **Hooks**: `frontend/src/hooks/` - Custom React hooks for API calls and state management
- **Utils**: `frontend/src/utils/` - API utilities, mutations, and helpers

## Development Commands

### Full Development Setup
```bash
docker compose up
```
Access at http://localhost:8000

### Backend Development (without Docker Compose)
```bash
# Setup MongoDB replica set
docker build -f docker/mongo.Dockerfile -t mongo-rs .
docker run -p 27017:27017 -v db-data:/data/db -d mongo-rs

# Set environment variables
export PRODUCTION=0
export ANALYZER_KEY=$(cat /path/to/key)  # Optional
export DIFFBOT_TOKEN="<YOUR KEY>"  # Optional
export IFRAMELY_KEY="<YOUR KEY>"  # Optional
export LOG_PUTTER="<AWS IAM ROLE ARN>"  # Optional; leave unset locally to use the default AWS credential chain (see README "AI Chat Features")
export FRONTEND_HOSTNAME=localhost
export FRONTEND_PORT=3000

# Start backend with hot reload
air
```

### Frontend Development
```bash
cd frontend
yarn start
```
Access at http://localhost:8080

### Testing
```bash
# Setup test database
docker build -f docker/mongo.Dockerfile -t mongo-rs .
docker run -p 27017:27017 -v db-data2:/data/db2 -d mongo-rs

# Run all tests
go test ./...

# Frontend tests (CI=true runs jest non-interactively; required for agents)
cd frontend
CI=true yarn test
```

### Production Build
```bash
# Build production image
docker build -f ./docker/main.Dockerfile -t ls .

# Run production locally
docker run -e ANALYZER_KEY="$ANALYZER_KEY" -e DB_CONNECTION="mongodb://172.17.0.2:27017/?connect=direct" -p 8080:8080 ls
```

### API Documentation
```bash
# Install swag. The version must match the one pinned in go.mod, or the
# generated docs/docs.go will not compile.
go install github.com/swaggo/swag/cmd/swag@v1.8.10

# Generate Swagger docs (the agent dir is needed to resolve agent.ToolUse)
swag init --dir cmd/serve/,handler,model,payload,agent
```

### Development Gotchas

- **Stale webpack cache after git operations**: if the frontend dev server reports `Module not found` for a file that clearly exists (e.g. after switching branches or merging while `yarn start` is running), stop the dev server, `rm -rf frontend/node_modules/.cache`, and restart it.
- **Finding orphaned dev servers**: `ps -a` hides processes without a controlling terminal (e.g. anything started with `nohup`). Use `lsof -nP -iTCP:3000 -sTCP:LISTEN` (or `ps aux`) to find what owns a port.
- **AWS credentials for Bedrock locally**: the Go SDK cannot read credentials from the browser-based `aws login` flow. Run `unset LOG_PUTTER && eval "$(aws configure export-credentials --format env)"` before `air`. Exported credentials are a snapshot and expire; re-run and restart `air` if Bedrock calls start failing with credential errors.
- **Forcing a link review for manual testing**: reset the user's stamp to before their links were created, then reload with the chat pane visible:
  ```bash
  mongosh --quiet --eval 'db.getSiblingDB("test").users.updateOne(
    {email: "you@example.com"},
    {$set: {lastLinkReviewAt: new Date(Date.now() - 24*3600*1000)}})'
  ```

### Splash Site (Gatsby, `splash/`)
```bash
cd splash
nvm use 20        # Gatsby 5 breaks on Node 22+ (lmdb/msgpackr RangeError)
yarn && yarn start   # http://localhost:8000
```
The home page below the hero is composed from `splash/src/components/home/` (see `splash/README.md`). Design decisions live in the root `PRODUCT.md` and `DESIGN.md`; the sign-up button is the page's only call to action.

## Key Environment Variables

- `PRODUCTION` - Set to "0" for development mode
- `DB_CONNECTION` - MongoDB connection string
- `ANALYZER_KEY` - Google Cloud Platform key for content classification
- `DIFFBOT_TOKEN` - Diffbot API key for enhanced content extraction
- `IFRAMELY_KEY` - iFramely API key for enhanced content extraction (used in place of Diffbot in extract)
- `MAILGUN_KEY` - Email service for password resets
- `APP_SECRET` - Application secret for CSRF tokens
- `FRONTEND_HOSTNAME` and `FRONTEND_PORT` - Frontend proxy configuration for development
- `LOG_PUTTER` - AWS IAM role ARN used to access AWS APIs (CloudWatch Logs, Bedrock), called "LOG_PUTTER" for historical reasons. Optional: when unset, the server falls back to the default AWS credential chain, which is the easiest setup for local development.

## Data Flow

1. **Link Creation**: Links go through content analysis (`analyze/`) for metadata extraction, classification, and summarization
2. **AI Features**: User conversations (`controller/conversation.go`) use the assistant system to interact with links/folders via AI agents
3. **Authentication**: Session-based auth with CSRF protection via magic tokens
4. **Database**: All operations use transaction support via the `Transactor` interface

## Notes and Highlights

- **Model**: `model.Highlight` (`id`, `exact`, `prefix`, `suffix`, `start`, `end`, `note`, timestamps) on `model.Link.Highlights`; `IsAnnotated = len(Annotation) > 0 || len(Highlights) > 0`, set in `db.LinkStore.UpdateLink`. Caps live in `model/link.go` (`HighlightMaxPerLink` = 200 etc.). `GetLinksByUser` projects `annotation`, `isannotated`, and `highlights.{id,exact,note}` so cards and the Notes & highlights view need no extra request.
- **Endpoints** (`handler/link/link.go` → `controller.Link.CreateHighlight/UpdateHighlight/DeleteHighlight`): `POST /api/links/{id}/highlights`, `PATCH|DELETE /api/links/{id}/highlights/{highlightId}`; each returns `{"link": …}`. The controller does a transactional read-modify-write of the whole link (`mutateHighlights`). `PATCH /api/links/{id}` with `annotation` is unchanged for the iOS app and the public API. Note that `payload.Valid` trims all string fields, so stored `prefix`/`suffix` lose outer whitespace; the frontend matches them whitespace-insensitively.
- **Search / index migration**: `db.LinkTextIndexWeights` is the single source of truth for the links text index (title 10, annotation 6, highlights.note 6, highlights.exact 4, description 3, site 3, corpus 1). `db.SetupIndexes` lists indexes, finds the one with `textIndexVersion`, and drops + recreates it as `links_text` when its weights differ; `integ/highlight_test.go` (`TestSetupIndexesMigratesTextIndex`) covers the migration and idempotence. Use `testutil.Mongo()` to inspect collections in tests.
- **Anchoring (frontend)**: `frontend/src/utils/highlights.js` — `textIndex` (whitespace-normalized text with a per-character node/offset map; block boundaries count as a space), `describeSelection`/`describeRange` → `{exact, prefix, suffix, start, end}`, `findQuote`/`locate` (prefix/suffix disambiguation, `start` as tiebreaker), `wrapRange` (one `<mark class="ls-highlight" data-highlight-id>` per text segment; only the first is a tab stop), `unwrapAll`, `applyHighlights` (idempotent; returns orphaned ids). Tests: `utils/__tests__/highlights.test.js`.
- **UI**: `pages/LinkView.jsx` owns the state (annotation draft + debounced save, selection pill, popover, Notebook open state in localStorage `isNotebookVisible`, `#h={highlightId}` deep links). Components: `NotebookPanel`, `HighlightCard` (also debounced note auto-save), `SelectionToolbar`, `HighlightPopover`, `FloatingAnchored` (viewport-anchored floating surface), `LinkAnnotationIndicator` (cards), `LinkItemNoteCard` (Notes & highlights view). `hooks/highlights.js` wraps the three endpoints as mutations that update the detail cache and patch cached lists. The Notebook is a column when `(min-width: 64rem)` and, if the chat column is on screen (`isChatVisible` and ≥ 80rem), `(min-width: 87rem)`; otherwise a bottom `Drawer`. Marks are styled in `theme/prose.css` with the `highlight.100/200` tokens from `theme/theme.js` (the only yellow in the app).
- **Assistant**: `get_link` prepends a plain-text "USER'S OWN NOTE AND HIGHLIGHTS" block before the link JSON (small models overlook fields after a 75k-char corpus). `get_links` with `annotations: "1"` returns links with a note or highlights.

## AI Chat Features

- **Automatic link review**: `POST /api/conversations/review` starts a `link_review` conversation when the user has ≥3 links newer than `User.LastLinkReviewAt` and the last review was ≥4h ago (constants `ReviewMinNewLinks`, `ReviewMinInterval`, `ReviewMaxLinks` in `controller/conversation.go`); otherwise it returns 204. The frontend (`ChatProvider` in `frontend/src/hooks/chat.js`) calls it at most once per page load, and only when the chat pane is actually visible (viewport ≥1536px with the chat panel toggled on; otherwise no request is made and the review happens on a later visit). On 201 it then sends `PUT /converse` with `{"trigger": "link_review"}`, which persists a hidden synthetic user message (`kind: "link_review_trigger"`, filtered out in `MessageList`) listing the new links (capped at 40) for the model. `lastLinkReviewAt` is server-managed and must not become settable via `PATCH /api/users`.
- **Choice prompts**: the assistant ends questions with a small determinate answer set with a trailing ```` ```choices ```` fenced block (2–5 lines). `frontend/src/utils/choices.js` strips it (including partial blocks mid-stream) and `MessageItem` renders the options as buttons; clicking sends the option text as a normal user message. The convention is defined in the system prompt in `assistant/assistant.go`.

## Testing Strategy

- Integration tests in `integ/` cover end-to-end API functionality (`integ/highlight_test.go` covers highlights, note search, and the text-index migration)
- Tests require MongoDB replica set for transaction support
- The Go side primarily uses integration tests rather than unit tests
- `testutil/mock_bedrock.go` provides the mock Bedrock client used by all Go tests. It streams a fixed "Hello world" reply by default; tests can script multi-turn replies, including tool calls, via `testutil.Bedrock().SetScript(testutil.MockTurn{...}, ...)` and must call `testutil.Bedrock().Reset()` afterwards (see `integ/link_review_test.go`)
- Frontend unit tests use jest via `react-scripts test` (run with `CI=true` to avoid watch mode). Existing suites: `frontend/src/utils/__tests__/choices.test.js` (choices parser), `frontend/src/components/__tests__/MessageList.test.jsx` (choice-button rendering), `frontend/src/components/__tests__/SidebarSearchInput.test.jsx` (sidebar search field: URL sync, Enter/Escape/×, `onNavigate`), `frontend/src/hooks/__tests__/chat.test.js` (streaming/`useConverse` behavior, including the review trigger request shape), `frontend/src/utils/__tests__/highlights.test.js` (highlight anchoring), `frontend/src/hooks/__tests__/highlights.test.js` (`useHighlights` cache updates), `frontend/src/components/__tests__/LinkItemNoteCard.test.jsx` (Notes & highlights card and the card indicator). `frontend/src/setupTests.js` loads jest-dom
