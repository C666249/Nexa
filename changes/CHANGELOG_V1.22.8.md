# V1.22.8 — Note HTTP(S) Gradient Link Styling

## Scope
Pure presentation-layer update for already-linked HTTP(S) anchors inside the Note editor.

## Behavior
- Replace the V1.22.7 single blue link text with a cyan → blue → green → purple horizontal text gradient.
- Keep the same gradient for `:visited` links; never fall back to browser visited-purple.
- Keep a light underline and existing press-opacity feedback so links remain recognizable as links.
- Add a selection-only text-fill fallback so selected link text remains readable while editing.

## Regression boundary
- No JavaScript changes. URL recognition, local-token linkify, old-note migration and link-click interception are byte-identical to V1.22.7.
- No Kotlin runtime changes. `openExternalUrl()` and all Android bridge behavior are byte-identical to V1.22.7.
- No changes to IME/caret/toolbar/single Scroll Owner, B/S/H, image/PDF zoom, image focus-safe preview, file import or reminder stack.
