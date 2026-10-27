# Task: "Welcome back" link review + clickable choice prompts in the AI chat

You are implementing a feature in **Linksort**, an open-source bookmarking app (Go backend + React frontend + MongoDB + AWS Bedrock). Read `AGENTS.md` and `README.md` first. You have a browser and can run the app locally (`docker compose up`, or `air` + `cd frontend && yarn start`); all required environment variables (AWS credentials/`LOG_PUTTER`, analyzer keys, etc.) are already set in your environment.

Work on a git branch. Commit in logical, well-described chunks. Keep the existing code style (Go: `errors.Op`/`errors.E` pattern, controller/handler/model/db layering; React: Chakra UI v1, react-query v3, hooks in `frontend/src/hooks`).

---

## 1. The feature, in plain language

### 1a. Automatic link review when the user comes back

Whenever a user returns to Linksort, the AI chat in the right-hand side panel should **automatically start a new conversation that analyzes the links the user has saved since their last visit**. The assistant should:

- Briefly summarize what was saved since last time (counts, topics).
- **Detect patterns/clusters** in those links — e.g. "You saved 6 links about couches" — and **propose organizing them into folders**, suggesting concrete folder names (e.g. a "Couch Options" folder) and which links would go into each. It should prefer re-using existing folders in the user's folder tree when a good match exists, and only propose new folders otherwise.
- Point out other noteworthy things when relevant (e.g. several articles on the same subject, obvious duplicates, links that fit an existing folder but aren't in it).
- **Ask the user for confirmation** before making changes, using the new clickable-choice UI (see 1b). On a "Yes", it should carry out the organization with the existing tools (`create_folder`, `add_link_to_folder`, …), respecting the existing "batches of ≤10 links, confirm before continuing" rule in the system prompt.
- Do nothing (no conversation created, no chat noise) when there is nothing new worth reviewing.

"Since their last visit" needs to be defined precisely because the app is a SPA with 90-day sessions — users almost never go through the sign-in form. Define a *visit* as the authenticated app loading in the browser (the `AppLayout` mounting for an authenticated user), and make the review **idempotent and throttled** so that a simple page refresh does not re-trigger it. Concretely (adjust the constants if you find better values, but keep them in one obvious place):

- Persist a `LastLinkReviewAt time.Time` on the `User` (`model/user.go`; the `UserStore.UpdateUser` uses `ReplaceOne` on the whole struct so adding a field is straightforward; expose it as `lastLinkReviewAt` in JSON).
- A review is **eligible** when there are at least **3** links with `createdAt > LastLinkReviewAt` **and** at least **4 hours** have passed since `LastLinkReviewAt` (or it has never been set). For a user with a zero `LastLinkReviewAt`, treat *all* their links as new but cap what is sent to the model at the **40 most recent** and tell the model it's a cap.
- When a review is started, stamp `LastLinkReviewAt = now` **server-side, in the same request that decides eligibility**, so two concurrent page loads (the chat panel is rendered twice — see §3) cannot start two reviews.

### 1b. Clickable choices in the chat UI

Whenever the assistant asks a **yes/no question** or a question with a **small, determinate set of options (2–5)**, the chat should render a **choice component (buttons/chips) under that assistant message** so the user can click an answer instead of typing it. Clicking sends the chosen option as the user's next message (it should appear as a normal user bubble and be persisted like any other user message). The user must still be able to type a free-form reply instead. Once answered (i.e. there is a later message in the conversation) or once a different conversation is loaded, the choices must render as inactive/already-answered rather than as live buttons. This applies to **all** assistant replies, not only the login review.

---

## 2. Codebase map (what you'll be touching)

Backend (Go):

- `agent/agent.go` — the Bedrock Converse streaming loop (`Agent.Act`), tool dispatch, `Message`/`ToolUse` types. The model id is set here; **do not change it**.
- `assistant/assistant.go` — `agenticSystemPrompt`, `Client.NewAssistant(...)`, all tools (`get_links`, `get_link`, `summarize_link`, `create_folder`, `delete_folder`, `rename_folder`, `add_link_to_folder`, `remove_link_from_folder`), and `userSummary()` which injects the folder tree + page context into the system prompt.
- `controller/conversation.go` — `CreateConversation`, `GetConversation`, `GetConversations`, `Converse` (builds the user `model.Message`, runs the assistant in goroutines, streams `model.ConverseEvent`s, then `PutMessages`).
- `handler/conversation/conversation.go` — routes `POST /api/conversations`, `GET /api/conversations`, `GET /api/conversations/{id}`, `PUT /api/conversations/{id}/converse` (newline-delimited JSON streamed as `text/event-stream`). `ConverseRequest.Message` is currently `validate:"required"`.
- `model/conversation.go` — `Conversation`, `Message` (custom `MarshalJSON` joins `Text []string` into a single `text` string), `ConverseEvent`, `MapToAgentMessage` (renders `PageContext` into extra text entries for user messages).
- `db/conversation.go` — `PutMessages` requires an **even** number of messages and assigns sequence numbers; `GetConversationByID` pages messages newest-first then reverses.
- `model/user.go`, `controller/user.go` (`UpdateUser` uses reflection over `handler/user.UpdateUserRequest`), `db/user.go`.
- `model/link.go`, `db/link.go` — `GetLinksByUser` with `model.GetLinksOption` filter funcs (`GetLinksSort`, `GetLinksFolder`, …). There is no "created after" filter yet; you'll add one.
- `handler/handler.go` and `cmd/serve/main.go` — dependency wiring. `testutil/testutil.go` wires the same handler for integration tests with `testutil.MockBedrockClient` (`testutil/mock_bedrock.go`), which currently always streams a fixed "Hello world!" reply.
- `integ/` — integration tests (`conversation_test.go`, `user_test.go`, …) using `apitest`. They need the replica-set Mongo from the README running.
- `docs/` — generated Swagger; regenerate with `swag init --dir cmd/serve/,handler,model,payload` after changing handlers/models.

Frontend (React, CRA, Chakra UI v1, react-query v3, react-router v5):

- `frontend/src/components/AppLayout.jsx` — grid layout; renders `<ChatSidepanel />` in the desktop right column (toggled by `isChatVisible` in localStorage via `useLocalStorage`). `Header.jsx` renders a **second** `<ChatSidepanel />` inside a mobile `Drawer`.
- `frontend/src/components/ChatSidepanel.jsx` → `MessageList.jsx` (groups assistant text + tool-use messages into one bubble via `groupMessages`, shows the streaming bubble, intro text, "Clear Chat") → `MessageItem.jsx` (markdown via `marked`, `ToolUseIndicator`), `MessageInput.jsx`.
- `frontend/src/hooks/chat.js` — `useChat()` (holds `activeConversationId` in **component-local state**, auto-selects the most recent conversation or creates one), `useConverse()` (fetch + `ReadableStream` parsing of the NDJSON events, builds `content[]`, invalidates `user` / `links` queries after successful write tools, then appends the result to the react-query cache for `["conversations","detail",id]`), `useCreateConversation`, `useConversation`, `useListConversations`. There is a jest test in `frontend/src/hooks/__tests__/chat.test.js` showing how streaming is mocked.
- `frontend/src/hooks/auth.js` — `useUser()` (seeded from `window.__SERVER_DATA__.user`), `useUpdateUser()`. `frontend/src/hooks/tour.js` is a good example of a "run once per user on load" side effect gated on a user field.
- `frontend/src/utils/apiFetch.js` — JSON fetch with CSRF header; `useConverse` uses raw `fetch` + `csrfStore.get()` for streaming.

Spend time reading these before designing. In particular, trace one full message round-trip (MessageInput → useChat.handleSendMessage → useConverse.sendMessage → handler.Converse → controller.Converse → assistant → agent → stream events → cache update → MessageList/MessageItem rendering) so your additions fit the existing data flow.

---

## 3. Suggested design

This is a recommended design. You may deviate where you find something cleaner, but the acceptance criteria in §4 are fixed.

### 3a. Backend: review eligibility + synthetic "review" turn

1. **User model**: add `LastLinkReviewAt time.Time` (`json:"lastLinkReviewAt" bson:"lastLinkReviewAt,omitempty"`).

2. **Link store**: add a `GetLinksOption` such as `db.GetLinksCreatedAfter(t time.Time)` (adds `createdat: {$gt: t}` to the filter). Expose it through the link controller in whatever way fits (e.g. a `CreatedAfter` field on `link.GetLinksRequest`, or a dedicated controller method used only by the review).

3. **Conversation model**: add `Kind string` (`json:"kind,omitempty"`) to `Conversation` (e.g. `"link_review"`) and to `Message` (e.g. `"link_review_trigger"`), plus whatever the review needs to remember (e.g. `ReviewSince time.Time` on the conversation). Messages with a non-empty `Kind` that marks them as synthetic must still be sent to the model (`MapToAgentMessage`) but **hidden in the UI**.

4. **New endpoint `POST /api/conversations/review`** (handler → controller `StartLinkReview`):
   - Loads links created after `user.LastLinkReviewAt` (cap 40, newest first).
   - If not eligible (fewer than 3 new links, or reviewed < 4h ago): respond **204 No Content** and change nothing.
   - Otherwise: create a `Conversation{Kind: "link_review", ReviewSince: user.LastLinkReviewAt}`, set `user.LastLinkReviewAt = now` and persist the user, respond **201** with `{ "conversation": {...}, "newLinkCount": n }`.
   - Use the `Transactor` if you can do the user update + conversation insert atomically; at minimum make sure a second concurrent call sees the updated stamp and returns 204.

5. **Extend `PUT /api/conversations/{id}/converse`**: accept `{ "trigger": "link_review", "pageContext": {...} }` with an empty `message` (relax the `required` validation to "message required unless trigger is set"). When `trigger == "link_review"` and the conversation's `Kind == "link_review"`:
   - Build a **synthetic user message** (`Kind: "link_review_trigger"`, `Role: "user"`) whose text contains: an instruction block for the review (what to do, how to confirm, how to propose folders), the time window, and the new links as compact JSON — `id`, `title`, `url`, `site`, `description` (truncate), `tagPaths`, `userTags`, `folderId`, `createdAt`. Include the cap note when applicable. Do **not** include `corpus`; the assistant can call `get_link` for detail.
   - Run the normal `Converse` pipeline from there (same streaming, same tools, same `PutMessages`). The synthetic message must be persisted so the conversation history is coherent on reload, and `PutMessages`' even-count requirement must still hold.
   - Reject `trigger` on a conversation that is not a `link_review` conversation, or that already has messages (400).

6. **System prompt** (`assistant/assistant.go`): add a section describing the **choice-prompt convention** (see 3b) and a section about link reviews (be concise; be concrete about proposing folder names, preferring existing folders, asking before acting, and not inventing links). Keep the existing ">16 links → batches of ≤10" rule.

7. **Swagger**: regenerate `docs/`.

### 3b. The choice-prompt convention (backend ⇄ frontend contract)

Use a lightweight, deterministic markup that the model emits at the **end** of an assistant message and the frontend parses out. Recommended: a fenced code block with the info-string `choices`, one option per line, 2–5 lines, each ≤ 60 chars:

````
Want me to create a "Couch Options" folder and move those 6 links into it?

```choices
Yes, do it
No thanks
Show me the links first
```
````

Rules to put in the system prompt: emit at most one `choices` block per message; only when the question genuinely has a small set of determinate answers (yes/no, pick-one-of-N); the options must be self-contained phrases that make sense as the user's reply; never put the block anywhere but the end; still write the question in prose above it. The user's click is sent verbatim as their next message, so the model sees ordinary text.

(A tool-based approach — e.g. an `ask_user` tool — is possible but awkward with the Bedrock Converse loop, which requires a tool result before the turn can end. The markup approach is recommended; if you choose something else, document why and keep the UI behavior identical.)

### 3c. Frontend: triggering the review once per visit

- `useChat` currently keeps `activeConversationId` in local state inside each `ChatSidepanel`, and **`ChatSidepanel` is mounted twice** (desktop column + mobile Drawer). Lift the chat state into a `ChatProvider` context mounted once in `AppLayout` (or `Root`), so (a) both panels share the same active conversation/streaming state and (b) there is exactly one place that runs the review trigger. `ChatSidepanel` should then just consume the context.
- On authenticated app load (`AppLayout` mount; the user object is available synchronously from `window.__SERVER_DATA__`), run a once-per-mount effect:
  1. `POST /api/conversations/review`.
  2. On 204 → nothing.
  3. On 201 → add the conversation to the `["conversations","list"]` cache, set it as active, **open the chat panel if it's hidden on desktop** (`isChatVisible` → true; move that state into the provider or pass a setter), and on mobile/narrow layouts show a Chakra toast like "Your assistant has some suggestions about your new links" that opens the chat Drawer.
  4. Call `useConverse.sendMessage` variant with `{ trigger: "link_review" }` (no text) so the streaming UI shows the assistant "typing" exactly as it does for a normal message. Do not add an optimistic user bubble for the trigger.
- Guard against double-firing (React StrictMode / re-mounts) with a ref; the server-side stamp is the real safety net.
- A client-side pre-check is optional (e.g. skip the call when `user.lastLinkReviewAt` is < 4h old) but the server decides.

### 3d. Frontend: choice UI

- Add a small pure parser (e.g. `frontend/src/utils/choices.js`): `splitChoices(text) → { body, choices: string[] | null }` that strips a trailing ```` ```choices ```` block. Unit-test it (jest is already set up via `react-scripts test`; see the existing test for mocking conventions). Handle: no block; block with 1 line (treat as no choices); >5 lines (take first 5 or ignore — pick one and test it); trailing whitespace; a **partial block while streaming** (the fence opened but not closed — hide the partial block text and don't render buttons until the stream is done).
- Render choices in `MessageItem` for assistant content: a `Wrap`/`HStack` of Chakra `Button`s (size `sm`, `variant="outline"`, brand color scheme, wrapping onto multiple lines). Only the **last assistant group in the conversation**, when **not streaming**, gets live buttons; earlier ones render disabled, and if the next user message text equals one of the options, highlight that one as the selected answer.
- Clicking calls the same `handleSendMessage(optionText)` used by `MessageInput`, so persistence, optimistic bubble, streaming, and tool-driven cache invalidation all behave identically. Disable the buttons while a stream is in progress.
- Hide synthetic messages (`message.kind === "link_review_trigger"`) in `groupMessages`/`MessageList`. Make sure hiding them doesn't break the grouping of the assistant reply that follows.
- Keep the intro/empty state working; make sure "Clear Chat" still works and does not retrigger a review.

### 3e. Tests and tooling

- **Go integration tests** (`integ/`):
  - `POST /api/conversations/review`: unauthorized → 401; user with 0–2 new links → 204 and `lastLinkReviewAt` unchanged; user with ≥3 links → 201 with `conversation.kind == "link_review"`, user stamped; immediate second call → 204; after setting the stamp back >4h (via the store) with new links → 201 again.
  - `PUT /converse` with `trigger: "link_review"` on a review conversation streams the mock reply and persists exactly the synthetic user message (`kind` set, hidden-able) followed by the assistant reply; `GET /api/conversations/{id}` returns them in order with `kind` present. Trigger on a non-review conversation → 400. Empty message without trigger still → 400.
  - Extend `testutil.MockBedrockClient` so a test can script the reply (e.g. a field or option for the response text, and ideally a canned tool-use round so a test can prove a "Yes" click leads to `create_folder` + `add_link_to_folder` being executed and the folder tree changing). Keep the default behavior for existing tests.
- **Frontend jest tests**: the choices parser; a `useConverse`-style test proving a `trigger` request body is sent without `message`; a rendering test that live buttons appear only on the last assistant message and clicking one invokes the send handler with the option text.
- `go vet ./...`, `go test ./...` (needs the Mongo replica set from the README), `cd frontend && CI=true yarn test`, and `yarn build` must all pass.

---

## 4. Acceptance criteria

1. A returning user with ≥3 links saved since their last review sees, on app load, a **new conversation auto-selected in the chat panel** in which the assistant summarizes the new links, identifies clusters, and proposes folder organization with concrete folder names, ending with a clickable choice prompt. If the chat panel was hidden on desktop, it is shown. Nothing is typed by the user to make this happen.
2. Refreshing the page immediately afterwards does **not** start another review. Users with <3 new links, or reviewed <4h ago, get no review and no extra conversation.
3. Clicking a choice sends that text as a user message (visible as a normal user bubble, persisted, present after reload) and the assistant proceeds; clicking "Yes" on a folder proposal results in the folders actually being created and links moved (visible in the left sidebar folder tree and link list without a manual refresh — the existing query invalidation on write tools must cover this).
4. Choice buttons appear for any assistant question with 2–5 determinate options in any conversation, not just the review. Old/answered choice prompts are rendered inactive; the answered option is indicated. Free-form typing always remains possible.
5. The synthetic review message is never shown in the UI but is persisted so the conversation makes sense on reload, and the model sees it on later turns of that conversation.
6. The raw ```` ```choices ```` markup is never visible to the user, including mid-stream.
7. Mobile layout: the Drawer chat shows the same conversation and choices; the review start is surfaced with a toast rather than silently.
8. All existing and new Go/JS tests pass; Swagger docs regenerated; `README.md`/`AGENTS.md` get a short note describing the review feature, the constants, and the `choices` convention.

---

## 5. Verify it in the browser (do this, don't just reason about it)

1. Start the app (`docker compose up`, then http://localhost:8000 — or `air` + `yarn start` per README). Sign up a fresh user.
2. Save 6–8 links across two obvious themes (e.g. several couch/sofa product pages from different retailers plus a few articles on one other topic). Link creation runs content analysis asynchronously; give it a moment.
3. Force eligibility for testing: either wait, or reset the user's `lastLinkReviewAt` (e.g. via `mongosh` on the `test` database `users` collection, or a temporary dev-only helper you remove before finishing). Reload the page.
4. Confirm the review conversation appears automatically, proposes something like a "Couch Options" folder listing the right links, and ends with choice buttons. Click "Yes" and confirm the folder appears in the sidebar and the links move into it. Reload and confirm the conversation history (without the hidden trigger message) and the inactive choice buttons render correctly.
5. Reload again — confirm no second review starts. Start a new chat and ask a yes/no-style question ("Should I summarize my latest link?") to confirm choices appear outside the review flow.
6. Hide the chat panel, reset the stamp, reload — confirm the panel auto-opens. Narrow the window to the mobile breakpoint, reset the stamp, reload — confirm the toast and the Drawer.
7. Watch the backend logs for errors during all of the above (the agent loop logs each `ConverseStream` iteration and tool call).

If the model's behavior is unreliable (wrong format, forgetting to ask, operating on links it wasn't given), iterate on the system-prompt and synthetic-message wording — that is part of this task. Keep prompts tight; Haiku-class models follow short, explicit, example-driven instructions best.

---

## 6. Things to watch out for

- `db.PutMessages` rejects odd-length batches; the synthetic trigger message counts as the user turn.
- `agent.trim()` drops a leading tool-response message; `GetConversation` truncates long tool responses to "RESPONSE OMITTED FOR BREVITY" only in the API response, not in what the model sees.
- `useConversation` fetches page 0 (16 newest messages). Keep hidden-message filtering working with pagination.
- `handler.Converse` deliberately detaches from the request context so a client disconnect doesn't abort the assistant; keep that behavior for the review trigger.
- `UpdateUser` in `controller/user.go` reflects over `UpdateUserRequest` — do **not** make `lastLinkReviewAt` user-settable through `PATCH /api/users`; it is server-managed.
- The frontend `useUser()` initial data comes from `window.__SERVER_DATA__.user`; after the review starts, update the cached user (or invalidate `user`) so `lastLinkReviewAt` is current.
- `marked` renders the assistant markdown with `dangerouslySetInnerHTML`; strip the choices block *before* passing text to `marked`.
- Don't break `frontend/src/hooks/__tests__/chat.test.js`; the `react-router-dom` mocks there show what `useConverse` depends on.
