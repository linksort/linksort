# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

*(Confirmed by the owner.)*

The primary user is an individual who browses heavily and accumulates tabs they don't want to close but won't bother to bookmark: a mix of articles, Google Docs, Figma files, YouTube videos, product pages, and other dynamic content. They want to save in one keystroke from the browser, have the collection organize itself, and find a link again weeks later from any device. The product was built by its owner for this problem; it is used by the owner and a small number of outside sign-ups.

No team, enterprise, or shared-workspace audience is confirmed.

## Product Purpose

Linksort is an open-source bookmarking application. It saves links from anywhere (web app, browser extensions for Chrome, Firefox, Safari, Brave), enriches them automatically (title, favicon, cover image, site name, description, auto-tags, optional AI summary), and gives the user tools to find and tidy: search, sort, group, favorites, folders, notes, three list views (tiled / comfy / condensed), a topic network graph, and an AI assistant that can review recent saves and reorganize on request.

Success is: a link saved with zero thought is still findable, and the collection stays tidy without manual filing.

## Positioning

*(Confirmed by the owner.)*

Linksort's claim is **"save anything, let it organize itself, and keep it private."** Unlike Pocket/Instapaper (article-first reading apps) or Raindrop (manual filing), it accepts any URL type, applies default organization automatically (auto-tags, link analysis, and now AI-driven review and folder proposals), collects no tracking data, and is free and open source.

## Operating Context

- Capture path: browser extensions are the primary way links enter the system; the web app's "New Link" is secondary.
- Return path: the user opens the web app to find, read, annotate, or organize. On wide screens (≥1536px) an AI chat panel sits alongside the link grid; on narrow screens it lives in a drawer.
- Properties: the app (`frontend/`), a Gatsby marketing/blog site (`splash/`), browser extensions, and public API docs (`/docs`). The 2021 technical-goals post states a wish that all properties share one design system.
- Terminology: **link** (a saved item), **folder** (user-made container), **tag** (auto tag from classification; user tags also exist), **favorite**, **note**, **graph** (topic network view), **review** (AI "welcome back" pass over recently saved links), **conversation** (AI chat thread).

## Capabilities and Constraints

- Stack: Go API + MongoDB (replica set, transactions) backend; React 17 + Chakra UI v1 + react-query v3 frontend; AWS Bedrock (Claude) for chat; Diffbot / iFramely / GCP classification for enrichment. Chakra's theming is the de facto design token layer.
- Views: tiled, comfy, condensed, graph; sidebar with folders, personal tags, auto tags; search; sort/group pickers.
- AI chat: streaming assistant with tool use over links and folders; automatic link review (≥3 new links and ≥4h since last review, only when the chat pane is visible); clickable choice prompts for yes/no-style questions. Review constants live in `controller/conversation.go`.
- Auth: session-based with CSRF; password reset by email (Mailgun); Google OAuth handler present.
- Data: users' saved URLs and metadata are stored; no third-party sharing; no tracking cookies.
- Undecided / absent: pricing, paid plans, team sharing, public collections, native mobile apps. None of these may be implied by UI.

## Brand Commitments

- Name: **Linksort**. Owner: Linksort LLC / Alexander Richey, Seattle. Contact alex@linksort.com.
- Voice (from splash and in-app copy): plain, friendly, first-person-honest ("Sometimes you just need a good old folder"). No hype.
- Public promises on the splash site, confirmed binding by the owner: **free for early sign-ups "always"**, **no tracking cookies**, **data encrypted at rest and never shared**.
- Existing assets: `frontend/public/logo.svg`, favicons, browser icons, and illustrative SVGs (beach, crystal-ball, star, thinking-face, waving-hand, globe); `splash/static/github.jpeg` screenshot.

## Evidence on Hand

- Real product screenshots: `splash/static/github.jpeg`.
- Blog posts in `splash/content/blog/` (idea, technical goals, reader view, Safari extension, public API) that document motivation and history.
- Privacy policy and terms in `splash/content/pages/privacy.md`.
- Live API docs at linksort.com/docs.
- **Absent, do not fabricate:** testimonials, customer logos, usage numbers, press, benchmarks.

## Product Principles

1. **Zero-thought capture.** Saving must never ask the user to decide anything first; organization happens after the fact.
2. **Default organization that stays out of the way.** Automatic tags, folders, and AI review should feel like a tidy assistant, not a chore; the user confirms before anything moves.
3. **Findability over curation.** The payoff is finding the thing weeks later; search, views, and graph serve that before aesthetics.
4. **Private by construction.** No tracking, no sharing, nothing in the UI that depends on data the user didn't knowingly give.
5. **One coherent system across properties.** App, splash site, and extensions should read as one product.

## Accessibility & Inclusion

No product-specific standard has been set. The app is keyboard-operable through Chakra defaults; treat WCAG 2.1 AA as the working floor until the owner specifies otherwise.
