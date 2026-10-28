# Linksort Blog & Splash

## Development

This is a [Gatsby](https://www.gatsbyjs.com/) app bootstrapped with [gatsby-starter-blog](https://github.com/gatsbyjs/gatsby-starter-blog) and [Chakra UI](https://chakra-ui.com/).

Gatsby 5 needs **Node 18–20**. On Node 22+ `gatsby develop` fails with `RangeError: "length" is outside of buffer bounds` (an lmdb/msgpackr incompatibility). With nvm:

```bash
nvm use 20

# Install deps.
$ yarn

# Develop.
$ yarn start

# Build.
$ yarn build

# Serve.
$ yarn serve
```

## Home page

`src/pages/index.jsx` keeps the gradient hero and composes the sections below it from `src/components/home/`:

| Component | What it does |
|---|---|
| `DeviceStage.jsx` | "Your links, on every screen you own": MacBook / iPhone / iPad showing one collection, with a segmented control that steps a device forward and an Extensions panel; the always-visible "ways in" strip. |
| `AssistantDemo.jsx` | A scripted, in-page rendition of the AI "welcome back" review with choice buttons and tool-call rows. Starts when scrolled into view; "Replay the demo" restarts it; honors `prefers-reduced-motion`. All copy is demonstration data and is labeled "Scripted demo". The typewriter and scroll-into-view hooks live in `useDemoMotion.js`, shared with the summary tile. |
| `FeatureBox.jsx` | Features rendered as Linksort link tiles whose "cover" is a live, interactive DOM miniature from `features/` (SVG graph with cluster hover, clickable auto tags, real search/sort/favorites filtering, Tiled/Comfy/Condensed toggle, folder tree with inline "New folder", reader prose, an AI summary card that goes from "Writing…" to bullets typed in when scrolled into view, with a keyboard-reachable "Replay" and labeled "Example", a note textarea). Demo data is `features/collection.js`, the same links the screenshots show. At `lg` the grid is Graph (2 cols) + Auto tags / Search + Views + Folders / Reader + AI summaries + Notes; at `md` Reader spans both columns so no row is left with a lone tile. |
| `Devices.jsx` | Shared MacBook / iPhone / iPad bezels with pixel-exact inner radii and the screenshots' true aspect ratios. |
| `MobileSection.jsx` | "Now on iPhone and iPad" with two phone screenshots, Share/Safari extension points, and an informational App Store link (`APP_STORE_URL`). |
| `Closing.jsx` | Privacy + open-source promises and the single sign-up call to action. |

Images come from `content/assets/`: the hero screenshot and the extension image plus `devices/` (iOS simulator screenshots from `ios/Linksort/scripts/screenshots.sh`, downscaled) and `ways/` (browser icons copied from `frontend/public`). Every raster carries a PNG `tEXt` provenance note.

Design authority: the root `DESIGN.md` ("The Index Card Box"), which includes a *Marketing surfaces* section for these patterns. The sign-up button is the only call to action on the page; the App Store link is informational.
