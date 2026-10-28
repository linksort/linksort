# Task: Link view title block: always show the divider, and line up the favicon / site / "Saved" row

You are working on **Linksort**'s web app (`frontend/`: React 17, Chakra UI v1, react-query v3). Read `AGENTS.md` and `DESIGN.md` first. This is a small, precise visual fix; the bar for "done" is measured pixels and screenshots, not a plausible diff.

## Environment and workflow

- All environment variables needed to run Linksort locally end to end (AWS/Bedrock credentials, analyzer and extractor keys, etc.) are already set in your shell. Run the real stack and verify against it.
- Create a feature branch from `main` (e.g. `fix/link-view-meta-row`), commit (one or two commits), and **push the branch to `origin`** (`git push -u origin <branch>`) once verified. Do not commit to `main`.

---

## 1. The problem

`frontend/src/pages/LinkView.jsx` renders a "Title block" above the article: a one-line meta row (favicon, site name, a `·` divider, `Saved {date}`), then the `h1` title. DESIGN.md describes it as "a one-line meta row (favicon, site · "Saved {time}") in Body Small Ink Soft".

Two things are wrong with the meta row today (verified in the browser against the current `main`):

1. **The `·` divider is hidden on phones.** It is rendered with `display={{ base: "none", sm: "inline" }}`, so below 640px the row reads `increment.com  Saved 28 Oct 2026` with an unexplained double space. The divider must appear on **all** screen sizes.
2. **The favicon, site, and date do not look aligned.** Measured with `getBoundingClientRect()` at 1700px wide:
   - The gap between the favicon and the site name is **16px**, but the gaps on either side of the `·` are **8px**. Cause: the inner `Flex` has `gap={2}` (8px) **and** `LinkItemFavicon` (`frontend/src/components/LinkItemFavicon.jsx`) carries its own `marginRight={2}` (8px) baked into the component. The pieces therefore read as "favicon … site · date" rather than one evenly spaced line.
   - The favicon box is `1.3rem` (20.8px) square while the 14px text's line box is 19.6px tall. Vertical centers coincide, but the icon is larger than the text's x-height/cap-height and sits visually heavy and low relative to the lowercase site name; favicons with internal transparent padding (and the `/globe.png` fallback) make it look off-center as well.

Context on how the row got here: commit `9ecbac6` ("Link view: keep the site / saved-date row on one line on phones") made each piece unbreakable, let the row wrap *between* pieces, shortened the date below `md` (`isoDateToShortDate`) and kept the full timestamp in the `title` tooltip and from `md` up. Keep all of that behavior; the divider hiding was a side effect of allowing the wrap, not a design decision.

## 2. What to do

In `LinkView.jsx`'s title block:

- **Show the `·` on every breakpoint.** Prefer making the row genuinely one line at every width rather than letting it wrap with a dangling divider: favicon + site as one unit with the site allowed to shrink and truncate (`minW={0}`, `noOfLines={1}` / ellipsis), the divider and the `<time>` as `whiteSpace="nowrap"` fixed-width pieces, and `flexWrap="nowrap"` on the row. Test with a very long site name (see §3) to confirm the site truncates instead of pushing the date off-screen. If you find a real reason wrapping must remain, then the divider must never start or end a line (attach it to the date piece and hide it only when that piece is first on its line, which CSS cannot detect, so this is the harder path; argue for it before taking it).
- **Make the spacing uniform.** One `columnGap` (0.5rem) between every adjacent piece. Do not change the default spacing of the shared `LinkItemFavicon` (it is used by `LinkItemTall`, `LinkItemCondensed`, and elsewhere); override it at the call site (`marginRight={0}`) or render a plain sized `Image` with the same `/globe.png` fallback here.
- **Size and center the favicon to the text.** Use a size that sits inside the 14px text's line box (1rem is the natural choice; 1.125rem at most), `flexShrink={0}`, and vertically centered on the line (flex `align="center"` on a row whose `lineHeight` is explicit). Confirm with measurements that the icon's vertical center equals the text's vertical center and that the icon's top and bottom fall within the text's line box.
- **Left edge.** The favicon's left edge must stay flush with the `h1` and the article text below it (it is today; do not regress it).
- Keep the `<time dateTime=…>` element, the `title` tooltip with the full timestamp, the short date below `md`, `aria-hidden` on the decorative divider, and the `gray.700` / `fontSize="sm"` styling. Do not touch the toolbar, cover, tags, summary, article, or note bar.

## 3. Verify in the browser (required)

Setup (if nothing is running):

```bash
# Mongo replica set
docker build -f docker/mongo.Dockerfile -t mongo-rs . && docker run -p 27017:27017 -v db-data:/data/db -d --name mongo-rs mongo-rs
# Backend (your shell already has the required environment variables)
export PRODUCTION=0 FRONTEND_HOSTNAME=localhost FRONTEND_PORT=3000 PORT=8080; air
# Frontend, in another terminal
cd frontend && yarn start
```

Open http://localhost:8080, sign up, and save a few links. The analyzer fetches each page's own title/favicon, so use real, resolvable URLs. You can create links from the browser console after a fresh page load (the `<meta name="csrf">` token is only valid for the page load it came with):

```js
let csrf = document.querySelector("meta[name='csrf']").content;
await fetch("/api/links", { method: "POST", credentials: "same-origin",
  headers: { "X-Csrf-Token": csrf, "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://increment.com/software-architecture/primer-on-functional-architecture/" }) });
```

Also create one link whose `site` is very long (you can `PATCH /api/links/{id}` with `{"site": "A Very Long Site Name That Goes On And On For Testing Purposes Dot Com"}`), and one with an empty `favicon` so the globe fallback is exercised.

Then, for each link view, at viewport widths **1700 (chat panel open), 1280, 1024, 768, 640, 420, and 320**:

1. Screenshot the title block.
2. Run a measurement script in the page (via your browser tool's evaluate) that returns the bounding rects of the favicon, the site text, the divider, and the `<time>`, and assert: divider `display !== "none"`; all four share the same vertical center (±0.5px); the horizontal gaps favicon→site, site→divider, divider→time are all 8px (±1px); everything is on one line (same `top`); the favicon's left edge equals the `h1`'s left edge.
3. For the long-site link, confirm the site truncates with an ellipsis and the date remains fully visible at 320px.
4. Check the comfy and condensed list views on the home page still look the same as before (you must not have changed `LinkItemFavicon`'s defaults).

Run `cd frontend && CI=true yarn test` and `yarn build`; both must pass.

## 4. Acceptance criteria

1. The `·` divider is visible at every viewport width.
2. Favicon, site, divider, and date are on one line with equal 0.5rem gaps and a shared vertical center, at every width listed above; long site names truncate; the date never clips.
3. No change to `LinkItemFavicon`'s defaults or to any other page.
4. Include the before/after screenshots (at least 1700 and 420) and the measurement output in your final message, along with the name of the pushed feature branch.
