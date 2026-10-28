# Task: Add an "AI summaries" FeatureTile to the splash page's FeatureBox

You are working on **Linksort**, an open-source bookmarking app. This task is confined to the marketing site in `splash/` (Gatsby 5, React 18, Chakra UI v2). Read `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, and `splash/README.md` before touching anything; they define the voice, the design system ("The Index Card Box"), and what may and may not be claimed on marketing surfaces.

## Environment and workflow

- All environment variables needed to run Linksort locally end to end (AWS/Bedrock credentials, analyzer and extractor keys, Mailgun, etc.) are already set in your shell. Run the real stack and test against it; never stub or skip a step because a key "might be missing".
- Create a feature branch from `main` (e.g. `feat/splash-ai-summaries-tile`), commit in small, well-described chunks as you go, and **push the branch to `origin`** (`git push -u origin <branch>`) when the work is verified. Do not commit to `main`. Never commit screenshots, `.cache`, or `public/` build output; put screenshots in your final message instead.
- Because the web app's summary feature is real and runnable, run the web app too (see §4.0) so your miniature is a faithful copy of the live Summary card, not a guess from source.

---

## 1. What to build, in plain language

The home page's "All the features you expect." section (`splash/src/components/home/FeatureBox.jsx`) is a grid of **FeatureTiles**: each feature is rendered the way Linksort renders a link card: a live, interactive DOM miniature where the cover image would be, a hairline, a title, one line of copy, and a row of chips. There are tiles for Graph view, Auto tags, Search/sort/group/favorite, Three views, Folders, Reader view, and Notes.

Add one more tile for **AI summaries**. This is a real, shipped feature that the page currently never mentions:

- When a user opens a saved article in the web app's link view (`frontend/src/pages/LinkView.jsx`), the backend writes a summary of the article text with Claude (`analyze/ai.go`, `controller/link.go → SummarizeLink`). It runs automatically the first time the link is opened, and only for links that are articles with extracted text (`IsArticle && Corpus != ""`).
- The summary format is fixed by the system prompt in `analyze/ai.go`: **a bulleted list of at most 5 points**; the first bullet states the thesis in one to three sentences; the rest are the most important points. No headings, no intro, Markdown only.
- In the app it renders as a **"Summary" card** above the article: Paper background (`gray.50`), 1px `gray.200` border, `lg` radius, `px={5} py={4}`, a small bold "Summary" heading, and while it is being written a brand-blue spinner with the word "Writing…" (and the line "The assistant is reading this link."). When done, the bullets render in `.prose prose-sans-serif prose-1rem`.

The tile's miniature should show exactly this: the app's summary card, with the bullets being written in front of the visitor.

## 2. Codebase map

- `splash/src/components/home/FeatureBox.jsx`: `FeatureTile({ demo, demoHeight, title, text, chips, colSpan })` and the grid. Grid is `1fr` / `repeat(2, 1fr)` at `md` / `repeat(3, 1fr)` at `lg`, gap 6. Today the three-column layout is exactly full: row 1 = Graph (colSpan 2) + Auto tags; row 2 = Search + Views + Folders; row 3 = Reader (colSpan 2) + Notes.
- `splash/src/components/home/features/SmallDemos.jsx`: the small demos (`AutoTagsDemo`, `SearchDemo`, `ViewsDemo`, `FoldersDemo`, `ReaderDemo`, `NotesDemo`). Note how `ReaderDemo` draws the link view in miniature (control chips, favicon square + site, bold title, serif prose with a fade at the bottom) and how `NotesDemo` fakes a "Saving… / Saved" state.
- `splash/src/components/home/features/primitives.jsx`: `Icon`, `SideRow`, `CondensedRow`, `Chip`, `ControlRow`. Reuse these rather than inventing new primitives.
- `splash/src/components/home/features/collection.js`: the demo collection (`LINKS`, `TAGS`, `FOLDERS`, `GRAPH`). The page tells one story with one set of links; use one of these links (the Atlantic piece "To Be Happy, Hide From the Spotlight" is already the Reader demo's article and the natural choice).
- `splash/src/components/home/AssistantDemo.jsx`: has the patterns you need for motion: `useTypewriter(text, active, speed)`, an `IntersectionObserver` that starts the animation when scrolled into view, `useReducedMotion` from framer-motion (renders the final state immediately), and a "Replay the demo" affordance. Copy the approach; do not duplicate large pieces of code if a small shared hook is cleaner.
- `splash/src/theme/theme.js`: Chakra tokens (`brand.*`, `gray.*`, font sizes incl. `2xs`). Use tokens, not hex.
- `frontend/src/pages/LinkView.jsx` (lines around the `{/* Summary ... */}` block) and `frontend/src/theme/prose.css`: the real summary card to imitate.

## 3. Design brief

- **Tile copy** (plain, friendly, no hype; see PRODUCT.md "Brand Commitments"): title `AI summaries`. One line of text along the lines of: "Open a saved article and the assistant writes a short summary: the point first, then what matters, so you can decide whether to read the whole thing." Tighten it; keep it to one or two sentences like the other tiles. Chips: `["Web", "Automatic"]`; the summary is generated on first open without the user asking, so "Automatic" is truthful. Add `"iOS"` only if you can confirm the iOS app shows summaries (the iOS source is not in this repo; check the blog posts in `splash/content/blog/` and the device screenshots in `splash/content/assets/devices/`, and otherwise leave it off: never claim a platform you cannot verify).
- **Miniature**: the link view's title region in miniature (favicon square + site, bold title; reuse the `ReaderDemo` treatment so the two tiles rhyme), then the Summary card as described in §1. When the tile scrolls into view, show the "Writing…" state (brand spinner, the text "The assistant is reading this link.") for a beat, then type the bullets in with the typewriter effect, one bullet after another. End state: the finished card. Honor `prefers-reduced-motion` (render the finished card immediately). Add a tiny "Replay" text button in the tile the way `AssistantDemo` does, or restart on click of the card; either is fine, but it must be keyboard reachable with a visible focus ring.
- **The bullets**: write 4 plausible bullets for the Atlantic article in the exact format the real prompt produces (thesis first, then points, no bullet starting with the same word, no headings). This is demonstration content, so label the card discreetly the way `AssistantDemo` labels itself "Scripted demo" (e.g. a `2xs` "Example" in the card header). Do not present it as the actual model output for the real article.
- **Design system**: white tile, hairline `gray.100` borders, Paper (`gray.50`) card, Inter only (the summary is sans-serif in the app too; only the article body is Georgia), Linksort Blue only on the spinner and anything pressable. No shadows, no gradients, no new colors. Hover is a tint, not a lift.
- **Grid**: adding an eighth tile must not leave an orphan cell at the three-column (`lg`) layout. Rebalance the `colSpan`s so every row is full (for example Graph spanning 3; or Reader at 2 + AI summaries at 1 and Notes moving next to Folders; pick the arrangement that reads best and keeps Graph first). Check the two-column (`md`) layout too: a `colSpan={2}` tile spans the full width there, which is fine, but make sure no row ends up with a lonely half-width tile that looks accidental. Keep demo heights consistent within a row.
- Consider whether the section's intro sentence ("Each link's metadata is captured and tags are automatically assigned the moment you save it.") should mention summaries; if you change it, keep it to one sentence.

## 4. Verify in the browser (do this, don't just reason about it)

0. Look at the real thing first. Start the web app (`docker build -f docker/mongo.Dockerfile -t mongo-rs . && docker run -p 27017:27017 -v db-data:/data/db -d --name mongo-rs mongo-rs`; then `air` in one terminal and `cd frontend && yarn start` in another; open http://localhost:8080). Sign up, save a real article URL, open it, and watch the Summary card go from "Writing…" to finished bullets. Screenshot it and copy its proportions, spacing, and type sizes into the miniature.
1. `cd splash && nvm use 20 && yarn && yarn develop -p 8000` (Gatsby 5 breaks on Node 22+). Open http://localhost:8000/#features in your browser tool.
2. Screenshot the features section at viewport widths **1440, 1024, 768, and 375**. Confirm: no orphan cell at 3 columns, nothing clipped inside the miniature, the chips fit on one row, the tile's text block height matches its neighbors.
3. Watch the animation start when scrolled into view; confirm the end state is the finished card; confirm Replay works with the mouse and with the keyboard (Tab to it, Enter).
4. Emulate `prefers-reduced-motion: reduce` (your browser tool can emulate media features) and confirm the card renders finished with no typing.
5. Run `yarn format` (prettier) and `yarn build`; both must succeed with no new warnings from your files.
6. Update the `FeatureBox.jsx` row of the table in `splash/README.md` to mention the new demo.

## 5. Acceptance criteria

1. The FeatureBox has an "AI summaries" tile whose miniature is a faithful, animated rendition of the app's Summary card (Writing… → bullets typed in → finished), reduced-motion safe, with a keyboard-accessible replay.
2. The grid has no orphan cells at `lg` and reads deliberately at `md` and `base`.
3. Copy is truthful (the feature exists and works as described), in the product's voice, with no invented numbers or claims; the demo content is labeled as an example.
4. Only design-system tokens are used; the tile is visually indistinguishable in construction from the existing tiles.
5. `yarn build` passes; `splash/README.md` is updated; screenshots from step 4.2 are attached to your final message; the feature branch is pushed to `origin` with the branch name in your final message.
