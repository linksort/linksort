# Task: Put the search input in the sidebar (replace the "Search" modal)

You are working on **Linksort**'s web app (`frontend/`: React 17, Chakra UI v1, react-query v3, react-router v5). Read `AGENTS.md` and `DESIGN.md` first. No backend changes are expected.

## Environment and workflow

- All environment variables needed to run Linksort locally end to end (AWS/Bedrock credentials, analyzer and extractor keys, etc.) are already set in your shell. Run the real stack and verify against it.
- Create a feature branch from `main` (e.g. `feat/sidebar-search-input`), commit in small chunks, and **push the branch to `origin`** (`git push -u origin <branch>`) once verified. Do not commit to `main`.

---

## 1. Today

The left sidebar (`frontend/src/components/Sidebar.jsx`) starts with a group of filter controls (`#filter-controls`, also referenced by the onboarding tour in `hooks/tour.js`): **Search**, Sort by, Group by, Favorites, Notes, Graph, each a `SidebarButton` (ghost, 1.75rem tall, `sm` text at 500 weight, 14px left icon, `marginLeft="-0.5rem"` / `paddingLeft="0.5rem"` so the icon column sits at the sidebar's 1.5rem left padding, `width="100%"`).

"Search" is `SidebarSearchButton.jsx` → `SidebarPopover.jsx`: a `SidebarButton` that opens a **centered Modal** containing an `Input` ("Type your query...") joined to a blue "Search" submit button. Submitting calls `useFilters().handleSearch(query)`, which pushes `/?search=<encoded>` (merged with the other filter params) and closes the modal; the modal clears its local state on close. The query lives in the URL (`FILTER_KEY_SEARCH`); `useFilters()` exposes `searchQuery` (decoded) and `handleSearch`. The header (`Header.jsx`) shows `Searching for "x" in All`; `Home.jsx` shows a "Clear search" button under results while searching, and `NullScreen` shows a "no results" state with its own "Clear search".

`SidebarPopover` is **also used by `SidebarFolderTree.jsx` for "New folder"**; leave that working.

On narrow screens the whole sidebar is rendered inside a Chakra `Drawer` from `Header.jsx` (`<Sidebar width="100%" isMobile={true} />`); the drawer has no way to be closed from inside `Sidebar` today.

## 2. What to build

Replace the Search button + modal with an **always-visible search input at the top of the sidebar's filter group**, sitting naturally alongside the other rows:

- New component `frontend/src/components/SidebarSearchInput.jsx`. A Chakra `InputGroup` with a left `Search2Icon` and a `size="sm"` input (2rem tall is the right rhythm against 1.75rem ghost rows; do not use the 2.5rem default). White field, `gray.200` (Pencil) border, `md`/`lg` radius, placeholder "Search" with `_placeholder={{ color: "gray.600" }}` (Chakra's default placeholder gray fails AA on Paper), focus border = `accent` as the theme's `Input` already sets, keyboard focus ring per theme. The splash site's `SearchDemo` (`splash/src/components/home/features/SmallDemos.jsx`) draws this exact control in miniature; match it.
- **Alignment**: the search icon must sit on the same vertical column as the sort/group/star icons below it, and the field's left and right edges must line up with the ghost buttons' hit areas (which start at `-0.5rem` and run full width). Achieve this with the same `marginLeft="-0.5rem"` trick and matching horizontal padding, then **measure** (`getBoundingClientRect` of the icon vs. the sort icon, and of the input vs. a button) rather than eyeballing. Leave 0.25rem between the input and the Sort row like the other rows (`Stack spacing={1}`), or 0.5rem if the input visibly needs more air; pick one and keep it.
- **Behavior**:
  - The field's value is seeded from, and kept in sync with, `searchQuery` from `useFilters()` (URL is the source of truth): navigating to `/?search=foo`, clicking "Clear search" on the Home page, or using back/forward must update the field. Local state only diverges while the user is typing.
  - Enter submits: `handleSearch(value.trim())`. An empty submission clears the search (`handleSearch("")`). Escape blurs the field and reverts it to the URL value.
  - A small **clear button** (×, `IconButton` `aria-label="Clear search"`, ghost, inside the right of the field) appears when the field is non-empty; it clears the field and the URL search.
  - Keep the existing "Clear search" affordances in `Home.jsx`/`NullScreen`; they should now also clear the field (that follows from URL sync).
  - Optional, if it stays simple: the `/` key focuses the search when no input/textarea has focus (announce it in the placeholder as "Search  /" or in `title`). Do not implement live-as-you-type search; the backend search is a full text query over every page of results and should fire on Enter.
- **Mobile drawer**: on submit in the mobile sidebar, close the drawer. Add an `onNavigate` prop to `Sidebar` that `Header.jsx` wires to the drawer's `onClose`, and call it from the search input (and consider calling it from folder/tag links too, if they do not already close the drawer; check before changing). Autofocus must **not** steal focus on desktop page load; in the drawer it is fine to focus the field when the drawer opens only if the drawer was opened from a search intent (it isn't today; so no autofocus).
- The header's "Searching for … in …" title and the `#filter-controls` tour step keep working; the tour copy still says "You can search, sort, group, and filter your links with these controls." which remains true.
- Remove `SidebarSearchButton.jsx`. Keep `SidebarPopover.jsx` for "New folder" (or, if you want, rename it to make clear it is now only the folder-name modal; do not change its behavior).
- The sidebar is `overflowY="scroll"` and `position="fixed"`; the input must not add a horizontal scrollbar at 18rem (check with the long-site-name link list and in the mobile drawer at 320px).

Design-system reminders (DESIGN.md): Paper sidebar, one blue (the focus ring/border only), hairline borders, 0.5rem radius on controls, Inter only, no shadows at rest, hover is a tint.

## 3. Tests

- `frontend/src/components/__tests__/SidebarSearchInput.test.jsx` (jest + testing-library; mock `../../hooks/filters` like the existing tests mock modules): renders with the value from `searchQuery`; pressing Enter calls `handleSearch` with the trimmed value; the clear button appears only when non-empty and calls `handleSearch("")`; Escape reverts to the URL value; an `onNavigate` prop is called on submit when provided.
- `cd frontend && CI=true yarn test` and `yarn build` must pass. Run `npx eslint src` (CRA's config) if available; no new warnings.

## 4. Verify in the browser (required)

Setup if nothing is running: build/run the `mongo-rs` image, `export PRODUCTION=0 FRONTEND_HOSTNAME=localhost FRONTEND_PORT=3000 PORT=8080; air`, and `cd frontend && yarn start`; open http://localhost:8080, sign up, and save 8–10 real URLs (the analyzer fills titles, tags, and article text from the pages; create them from the browser console with a `POST /api/links` and the `X-Csrf-Token` from `<meta name="csrf">` after a fresh page load).

Then, with screenshots at **1700 (chat open), 1280, 1024, 768, and 420**:

1. The sidebar's filter group with the input at rest, focused (ring visible via keyboard Tab), and with a value typed. Measure and report the icon-column and edge alignment numbers.
2. Type a word that appears in one link's title, press Enter: URL becomes `/?search=<word>`, header reads `Searching for "<word>" in All`, only matching links show, the field still shows the word.
3. Click a folder in the sidebar while searching; note what happens to the search param (today `makeFolderLink` preserves it) and make sure the field reflects whatever the URL says.
4. Click the × in the field: URL search param gone, all links back, field empty. Repeat with Home's "Clear search" button.
5. Browser back/forward between a search and no search: the field follows.
6. Search for something with no results: `NullScreen` shows; its "Clear search" works.
7. 420px: open the hamburger drawer, search, press Enter: drawer closes, results shown; open it again, the field shows the query.
8. Keyboard: Tab order is logical (logo → search → sort → …); Escape behaves; `/` focuses the field if you implemented it; no focus trap.
9. Confirm "New folder" in the Folders section still opens its name modal and creates a folder.
10. Confirm the onboarding tour still attaches to `#filter-controls` for a fresh user (the tour runs once per user; a new sign-up triggers it).

Attach the screenshots, the alignment measurements, and the name of the pushed feature branch to your final message.

## 5. Acceptance criteria

1. There is no search modal; the search field is always visible in the sidebar (desktop and the mobile drawer), aligned to the icon column and edges of the rows beneath it, styled with design-system tokens.
2. Enter searches, × clears, Escape reverts, the field always mirrors the URL, and the mobile drawer closes on submit.
3. "New folder", the header title, the Home/NullScreen clear buttons, and the tour continue to work.
4. Jest tests cover the component; `CI=true yarn test` and `yarn build` pass; `SidebarSearchButton.jsx` is gone.
