---
name: Linksort
description: A tidy, friendly bookmarking app where links are white index cards and one blue does all the pointing.
colors:
  linksort-blue: "#0a52ff"
  linksort-blue-deep: "#0042cc"
  pen-blue: "#558cff"
  halo-blue: "#80a9ff"
  blue-tint: "#f6f9ff"
  blue-wash: "#d5e2ff"
  white: "#FFFFFF"
  paper: "#FAFAFA"
  paper-edge: "#EEEEEE"
  pencil: "#DDDDDD"
  graphite: "#777777"
  ink-soft: "#555555"
  ink: "#333333"
  ink-deep: "#111111"
  error: "#ca2e48"
  success: "#1fb900"
typography:
  headline:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
  reading:
    fontFamily: "Georgia, Source Serif Pro, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "0.125rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  3xl: "1.5rem"
  full: "9999px"
spacing:
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  6: "1.5rem"
  8: "2rem"
  10: "2.5rem"
  header: "5rem"
  sidebar: "18rem"
  chat: "25rem"
components:
  button-primary:
    backgroundColor: "{colors.linksort-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "0 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.linksort-blue-deep}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 0.5rem"
    height: "1.75rem"
  button-ghost-hover:
    backgroundColor: "{colors.paper-edge}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.linksort-blue}"
    rounded: "{rounded.lg}"
    padding: "0 0.75rem"
    height: "2rem"
  button-outline-hover:
    backgroundColor: "{colors.blue-tint}"
  button-control:
    backgroundColor: "{colors.paper-edge}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 0.75rem"
    height: "2rem"
  card-link-tile:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0.5rem 1rem 1rem"
    height: "18rem"
  card-link-tile-hover:
    backgroundColor: "{colors.paper}"
  input-text:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.5rem"
  input-chat:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  bubble-user:
    backgroundColor: "{colors.linksort-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1rem"
  bubble-assistant:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1rem"
  sidebar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    width: "{spacing.sidebar}"
    padding: "0 0.5rem 0 1.5rem"
  floating-pill:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.3xl}"
    padding: "1.5rem"
---

# Design System: Linksort

## Overview

**Creative North Star: "The Index Card Box"**

Linksort is a box of index cards. Every saved link is a white card with a crisp hairline edge, laid out in a tidy grid on a pale paper surface. The sidebar is the row of dividers along the left (folders, tags, views); the chat panel on the right is the librarian who files cards for you when asked. Nothing is decorative: the cards carry the color (cover images, favicons), the interface stays white, gray, and one blue.

The mood is **tidy, friendly, clean**. Density is comfortable rather than compact: 1.5rem gutters between cards, 5rem header, generous card padding. Interaction is crisp and tactile: edges are drawn, not blurred; hover is a visible tint change rather than a lift; buttons have a firm 0.5rem radius and solid fills. The one accent, Linksort Blue, is reserved for things the user can act on or has just said; it is never atmosphere.

**Key Characteristics:**
- White cards with a hairline Paper-Edge border on a Paper (#FAFAFA) ground
- One accent, Linksort Blue, used only for actions, selection, and the user's own voice in chat
- Inter at every size; Georgia only inside saved-article reading views
- Flat by default: borders define surfaces, tint changes define hover, shadow is reserved for things that float
- Comfortable spacing on a 0.25rem scale; 0.5rem radius on controls, 0.75rem on cards

## Colors

A near-monochrome paper palette with a single saturated blue; everything else is a tint of gray.

### Primary
- **Linksort Blue** (`{colors.linksort-blue}`): solid buttons, the user's chat bubbles, active sidebar states, selected choice buttons, the "New Link" call to action. The only saturated color in the chrome.
- **Linksort Blue Deep** (`{colors.linksort-blue-deep}`): hover/active state of solid blue buttons.
- **Pen Blue** (`{colors.pen-blue}`): the softer blue for prose links and the chat textarea's focused border. Reads as "ink from a blue pen" on reading surfaces.
- **Halo Blue** (`{colors.halo-blue}`): the 3px keyboard focus ring (`0 0 0 3px`) and the underline on prose links. Never a fill.
- **Blue Tint** (`{colors.blue-tint}`) / **Blue Wash** (`{colors.blue-wash}`): hover backgrounds for outline/ghost blue buttons and light selection highlights.

### Neutral
- **White** (`{colors.white}`): card faces, header, chat panel, popovers.
- **Paper** (`{colors.paper}`): the sidebar, the assistant's chat bubbles, the chat textarea, and the card hover tint. The "ground" everything sits on.
- **Paper Edge** (`{colors.paper-edge}`): hairline borders on cards, the sidebar's right edge, the header's bottom edge, chat-input top edge; also the fill of small control buttons on link cards.
- **Pencil** (`{colors.pencil}`): slightly firmer borders on inputs, the chat textarea, and assistant bubbles.
- **Graphite** (`{colors.graphite}`) / **Ink Soft** (`{colors.ink-soft}`): secondary text, sidebar section labels, site names, timestamps.
- **Ink** (`{colors.ink}`): body text. **Ink Deep** (`{colors.ink-deep}`): headings and link text on hover.

### Status
- **Error** (`{colors.error}`): destructive menu items and delete confirmations (Chakra `red` scheme).
- **Success** (`{colors.success}`): completed tool-call indicators in chat.

### Named Rules
**The One Pen Rule.** Linksort Blue appears only on things the user can press or has said. Headings, borders, icons at rest, and backgrounds never use it. If a screen has more than a handful of blue elements, something is wrong.

**The Cards Carry the Color Rule.** Cover images and favicons are the only places saturated non-blue color appears. The chrome does not compete with them.

## Typography

**Display/Body Font:** Inter (with system-ui, -apple-system, Segoe UI, Roboto fallback), weights 100–900 self-hosted via `@fontsource/inter`
**Reading Font:** Georgia (with Source Serif Pro fallback), used only in `.prose` reading views
**Mono Font:** SFMono-Regular / Menlo / Consolas stack, used for code in chat and prose

**Character:** Inter is used everywhere at a neutral weight and never letterspaced except in tiny section labels; it reads like clean handwriting on a card. Georgia appears only when the user is reading a saved article, signalling "this is the content, not the interface."

### Hierarchy
- **Headline** (700, 1.875rem, 1.2): page titles on auth screens ("Sign in").
- **Title** (700, 1.25rem, 1.2): the header's current view name ("All", folder name) and the chat panel's "Chat" title; truncates with ellipsis rather than wrapping.
- **Body** (400, 1rem, 1.5): link titles use this at 600 weight; form labels and most interface text.
- **Body Small** (400, 0.875rem, 1.5): site names under titles, chat messages, choice buttons, sidebar entries (0.9rem with 0.01rem tracking).
- **Label** (600, 0.75rem, 0.05em, uppercase): sidebar section headings ("FOLDERS", "PERSONAL TAGS", "AUTO TAGS") in Graphite.
- **Reading** (400, 1.25rem, 1.5, Georgia): article body in reading view, 65ch-ish max width.

### Named Rules
**The One Face Rule.** The interface is Inter only. Do not introduce a second sans or a display face; hierarchy comes from weight and size, not family.

**The Truncate, Don't Wrap Rule.** Titles in constrained chrome (header, card title rows, folder chips) truncate with ellipsis and expose the full text via `title=`. Chat content and choice buttons are the exception: they wrap.

## Layout

A three-column application shell on a paper ground.

- **Sidebar** (`{spacing.sidebar}` = 18rem, fixed, Paper background, hairline right edge): logo in a 5rem header band, then stacked ghost buttons at 1.75rem height with 0.25rem gaps, grouped into collapsible sections with 2rem between groups.
- **Header** (`{spacing.header}` = 5rem, white, hairline bottom edge): current view title on the left, "New Link" primary button, feedback, chat toggle, and settings on the right in a 1rem-spaced row.
- **Content**: a responsive CSS grid of link cards with 1.5rem gaps: 1 column below 640px, 2 columns from 640px, 3 columns from 1024px. The comfy and condensed views swap the tile for a horizontal row.
- **Chat panel** (`{spacing.chat}` = 25rem, white, hairline left edge): visible only at ≥1536px when toggled on; below that, chat lives in a full-height drawer. Messages stack with 0.75rem gaps; the composer sits at the bottom with a hairline top edge.
- **Breakpoints**: 640 / 768 / 1024 / 1280 (Chakra `sm`–`xl`) plus the 1536px desktop-chat threshold.
- **Spacing scale**: Chakra's 0.25rem step. Card internal padding is 0.5rem top / 1rem sides / 1rem bottom; panels use 1rem; floating pills use 1.5rem; the sidebar's bottom legal block uses 2.5rem.
- **Mobile**: sidebar and chat both collapse into drawers; link controls shrink (24px max-width chips become 48px at md).

## Elevation & Depth

**Flat, bordered, hover-by-tint.** Surfaces are separated by hairline borders and background tints, not shadows. A card at rest is white with a Paper-Edge border and Chakra's barely-there `sm` shadow (`0 1px 2px rgba(0,0,0,0.05)`); on hover its face tints to Paper. Panels (sidebar, header, chat) are defined purely by their edges. Depth is reserved for the few things that genuinely float.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`): link tiles only; enough to lift the white card off the Paper ground.
- **Floating glow** (`box-shadow: rgba(0, 0, 0, 0.1) 0px 0px 24px -2px`): the FloatingPill (mobile controls), popovers, and menus. Soft, centered, no offset: it says "hovering above the desk," not "stacked."
- **Focus ring** (`box-shadow: 0 0 0 3px #80a9ff`): keyboard focus on every interactive element; explicitly suppressed (`_focus={{ boxShadow: "none" }}`) on card title links and control chips where it would clip.

- **Menus, popovers, modals** (`theme.js`): one float shadow (`rgba(0,0,0,0.1) 0 8px 24px -4px`, slightly deeper for modals), Pencil border, `lg`/`xl` radius.

### Named Rules
**The Only Floaters Cast Shadows Rule.** If an element is part of the page layout, it has a border, not a shadow. The 24px glow is for popovers, menus, drawers, and the mobile pill.

**The Tint Is the Hover Rule.** Hover never translates, scales, or adds shadow. It changes background: white → Paper on cards, transparent → Paper Edge on ghost buttons, Linksort Blue → Deep on solid buttons. Transition is `background-color 0.2s ease`.

## Shapes

Firm rounded rectangles at two sizes. Controls (buttons, inputs, chips, chat bubbles) use **lg** (0.5rem). Cards use **xl** (0.75rem) so they read as a larger object than the buttons inside them. The floating pill and toasts use **3xl** (1.5rem) to signal they are not part of the grid. Avatars and status dots are circular. Borders are always 1px (`thin`), solid, and in Paper Edge or Pencil; there are no 2px outlines, no dashed borders, no gradient strokes. Cover images are clipped square-top by the card's overflow and separated from the text block by a hairline.

## Components

### Buttons
Crisp and tactile: solid fills, firm corners, no shadow, an instant tint on hover.
- **Shape:** 0.5rem radius (`{rounded.lg}`), set globally in the theme.
- **Primary** (`button-primary`): Linksort Blue fill, white text, 2.5rem tall, 1rem horizontal padding, 600 weight. Hover: Linksort Blue Deep. The "New Link" CTA and form submits.
- **Ghost** (`button-ghost`): transparent, Ink text, 1.75rem tall in the sidebar (`SidebarButton`: 0.9rem text, 400 weight, 0.75rem icon on the left, full width, left-aligned). Hover: Paper Edge tint. Becomes `solid` (blue) when its view is active (Favorites, Notes, Graph, chat toggle).
- **Outline** (`button-outline`): 1px Linksort Blue border, blue text, transparent. Used for chat choice buttons and the header's chat toggle when off. Hover: Blue Tint fill. A chosen choice becomes solid.
- **Control chip** (`button-control`): Paper Edge fill, Ink text, size `sm` (2rem). The folder/favorite/view/copy/menu row on every link card; `_focus` ring suppressed; folder name truncates.
- **Focus:** 3px Halo Blue ring on all except control chips and card links.

### Chips
- **Tags** (sidebar tag cluster, inline tag editor): small ghost or Paper-Edge pills in Body Small, Graphite text; selected state tints to Blue Wash.
- **Folder chip on cards:** a control button with a folder icon and truncated name; opens a folder move menu.

### Cards / Containers
- **Link tile** (`card-link-tile`): 18rem tall, white, 0.75rem radius, Paper-Edge hairline, `sm` shadow, overflow hidden. 10rem cover image on top, hairline divider, then an 8rem text block (title 600, site in Body Small, controls row at the bottom). Hover tints the whole card to Paper over 0.2s.
- **Comfy / condensed rows:** the same border and tint rules as a horizontal row with favicon, title, site, and controls.
- **Floating pill** (`floating-pill`): white, 1.5rem radius, 1.5rem padding, the 24px floating glow. Mobile controls and popovers.
- **Null screen:** centered 80px illustrative SVG (beach, crystal ball, thinking face, waving hand), a sentence of friendly copy, one primary button.

### Inputs / Fields
- **Text input** (`input-text`): Chakra outline variant, white, Pencil border, 0.375rem radius, 2.5rem tall. Focus border is Halo Blue (`focusBorderColor: accent`).
- **Chat composer** (`input-chat`): auto-growing textarea, Paper fill, Pencil border, 0.375rem radius, 0.5rem/0.75rem padding; focus border shifts to Pen Blue. Send button is a small solid blue icon button; disabled while empty.

### Graph view
- vis-network with one pastel per top-level tag from the theme's 500-step ramps (`CLUSTER_COLORS` in `pages/Graph.jsx`), no node strokes, 1px edges at 45% opacity inheriting the source color, Inter labels in Ink Soft, Linksort Blue border only on the selected node.

### Navigation
- **Sidebar**: Paper background, Logo in the 5rem band, then `SidebarButton`s (ghost, 1.75rem, left icon). Active views render solid blue. Sections ("FOLDERS", "PERSONAL TAGS", "AUTO TAGS") use the Label style with a collapse chevron. Folder tree indents 1rem per level.
- **Header**: white, 5rem, hairline bottom edge, Title-style view name on the left (folder/tag/search on the grid, "Graph", "Account", or the link's title once scrolled), actions on the right: one solid blue "New Link", then ghost controls only (Feedback text link in Graphite, chat toggle that tints Paper Edge when on, settings).
- **Mobile**: hamburger opens the sidebar as a drawer; a FloatingPill holds filter controls.

### Chat (signature)
- **User bubble** (`bubble-user`): Linksort Blue fill, white text, 0.5rem radius, 0.75rem/1rem padding, right-aligned, max 90% width.
- **Assistant bubble** (`bubble-assistant`): Paper fill, Pencil border, Ink text, left-aligned, Body Small markdown with the `.prose prose-sans-serif prose-1rem` treatment.
- **Choice buttons**: a wrapping row of outline-blue `sm` buttons under the latest assistant message; labels wrap to multiple lines rather than overflowing the bubble; the chosen option becomes solid and the rest go inactive.
- **Tool-call indicators**: 0.75rem Label-weight rows with a status dot (Graphite pending, Success done, Error failed).
- **"Clear Chat"**: a ghost button centered above the composer.

### Marketing surfaces (splash)
The splash site shares the app's theme and renders features in the product's own vocabulary rather than a marketing template:
- **Device stage**: real screenshots of one collection inside CSS bezels (MacBook 12px radius dark bezel with a 10px base, iPhone 2.75rem bezel, iPad 1.75rem bezel), on a Paper band with hairline top and bottom edges. A segmented control (Linksort Blue on the selected segment, Pencil border) picks which device steps forward (scale 1.04, 0.6s ease-out); non-selected devices never dim except when the floating Extensions panel is up.
- **Feature tiles**: features are link tiles. Where the cover goes, a live DOM miniature of the feature (15–20rem tall) built from the app's own primitives (`splash/src/components/home/features/`): sidebar rows at 0.9rem, condensed link rows, the segmented control, auto-tag pastels on the graph. Then a hairline, title at 600, one Body Small line, and control chips in place of the link controls. No screenshots inside tiles.
- **Device bezels** (`Devices.jsx`): fixed-pixel padding with inner radius = outer radius − padding (iPhone 44/10/34px, iPad 28/12/16px, laptop 14/12/6px) and a screen box carrying the screenshot's exact aspect ratio, so screens sit flush.
- **Color rhythm**: white → Paper (stage) → Blue Tint (assistant) → white (features) → the hero's blue→lavender fade rotated −3° (iOS band, white text) → the same fade on the closing card. The fade is the one place the marketing site exceeds the One Pen rule, and it bookends the page.
- **Scripted chat**: the chat panel's exact bubble, choice-button, and tool-row styling, labeled "Scripted demo" in the header; it is demonstration data and says so.
- Sections use Title/Headline sizes at -0.02em tracking, Ink Soft body at 1.125rem, ~34rem measure; one blue block (the close) per page.

## Do's and Don'ts

### Do:
- **Do** keep Linksort Blue (#0a52ff) for actions, active states, and the user's own messages; use Blue Tint/Wash for their hover and selection backgrounds.
- **Do** separate every layout surface with a 1px Paper Edge (#EEEEEE) or Pencil (#DDDDDD) border; let the sidebar be Paper (#FAFAFA) and panels be white.
- **Do** use 0.5rem radius on controls and 0.75rem on cards; the difference is what makes cards read as cards.
- **Do** express hover as a background tint over 0.2s ease.
- **Do** truncate titles with ellipsis in chrome and expose the full string via `title=`.
- **Do** let cover images and favicons be the color on the page.
- **Do** use the existing illustrative SVGs in `frontend/public/` for empty states, 80px, centered, with one sentence and one primary button.

### Don't:
- **Don't** add shadows to cards, panels, or buttons at rest; only popovers, menus, drawers, and the floating pill get the 24px glow.
- **Don't** lift, scale, or translate on hover.
- **Don't** introduce a second typeface in the interface; Georgia belongs only to reading views.
- **Don't** use gradients, colored headings, colored borders, or blue icons at rest.
- **Don't** use Chakra's default `blue`/`teal`/`purple` schemes for interface accents; the theme's `brand` scheme is the only accent.
- **Don't** let choice buttons or chips overflow their container; wrap text or truncate, respectively.
- **Don't** invent testimonials, counts, or marketing proof on any surface (see PRODUCT.md).
