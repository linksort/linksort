---
target: sidebar, main tile view, link view
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/alex/Code/linksort/frontend/src/components/AppLayout.jsx"
target_fingerprint: "sha256:4c38072c5bb85afb891604c86d77dee2e6098b0abcfea16a71babe4b995bcc35"
target_path: /Users/alex/Code/linksort/frontend/src/components/AppLayout.jsx
timestamp: 2026-10-27T21-47-57Z
slug: frontend-src-components-applayout-jsx
---
⚠️ DEGRADED: single-context (no sub-agent tool exposed)

Target: frontend/src/components/AppLayout.jsx — sidebar, home tile grid, link view. Mode: Operate.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Auto-summary generation on link view runs silently |
| 2 | Match System / Real World | 3 | "Corpus", pipeline vocabulary on the link view |
| 3 | User Control and Freedom | 3 | No undo after delete |
| 4 | Consistency and Standards | 3 | Mobile header uses square joined buttons |
| 5 | Error Prevention | 2 | Delete from card menu has no confirmation/undo |
| 6 | Recognition Rather Than Recall | 2 | Empty aria-labels on card icon buttons; hidden note panel |
| 7 | Flexibility and Efficiency | 2 | No shortcuts, no bulk select, drag undiscoverable |
| 8 | Aesthetic and Minimalist Design | 3 | Link view shows empty "No X" sections |
| 9 | Error Recovery | 2 | Chat/link errors not surfaced to user |
| 10 | Help and Documentation | 2 | Tour and assistant exist but unreferenced |
| Total | | 25/40 | Acceptable |

## Design Specificity Verdict
Authored: the link tile is the product's unit; sidebar reads as the box dividers; empty state has a voice. Generic where it matters most: the link view is a label/value record with "Corpus" last and the note editor hidden.

Deterministic scan: CLI 0 findings over 9 files. Overlay: 8 (grid) + 10 (link view). Real: low-contrast #777777 on #fafafa 4.3:1 and on white 4.48:1 (sidebar values, tag hint, site names, empty-value lines); chat placeholder 2.7:1; skipped heading h1→h6 on link view. Dismissed: overused-font (One Face Rule), straggler (model text). buried-raster is FadeInImage pre-load, but also explains the blank IKEA card when an image 404s.

## Priority Issues
- [P1] Card control row clips at 3 columns beside the chat panel (131px row, 200px needed at 1280): ⋮ menu (Edit/Delete) unreachable. Fix: 2 columns when chat open, or collapse row. → adapt
- [P1] Delete is one click, no confirm/undo. Fix: undo toast or AlertDialog. → harden
- [P2] Link view is a record, not an article: lead with title/cover/article text, fold empty sections, surface the note editor with a label; rename Corpus. → layout, clarify
- [P2] Secondary text under AA (4.3:1): move secondary text to #555555. → polish
- [P2] Empty aria-labels on card icon buttons, view picker and link-view bottom bar; h1→h6 skip. → audit

## Persona Red Flags
- Alex: no `/` or `n` shortcuts, no multi-select, drag-to-folder unhinted.
- Sam: four unlabeled buttons per card, unlabeled collapse chevrons, heading skip.
- Casey: all primary actions at the top; note editor hidden behind unlabeled bottom icons.

## Minor Observations
- Header title truncates to "Favorites i…" at 1280 (heading maxWidth calc is stale).
- "Prevous" typo on pagination.
- FadeInImage stays opacity 0 on image error (blank IKEA card); fall back to gradient onError.
- Mobile header square-joined buttons.
- Marketing footer (copyright/Terms/RSS) inside app sidebar.
- Summary auto-generation has no indicator; failure reads as "none".

## Questions to Consider
- What if the link view opened to the article text with the note beside it and metadata as a side column?
- Is folder + ⋮ enough on the card, with favorite in the menu?
- With undo on delete, could Edit/Delete leave the card and live only on the link view?
