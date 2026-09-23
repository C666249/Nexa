# Nexa 1.0.3 handoff — 2026-09-07

## Request
1. Remove the extra Home Todo total-count line that makes the three summary metrics unequal in height.
2. Redesign Space so 100+ records do not force the user to scroll past the whole library to reach tools/customization.
3. Evaluate and selectively implement richer motion: stack-scroll, curved card deletion, drawn checkbox strokes and custom-bezier route/tab movement.

## Implementation
- `nexa-shell.js`: equal-height Home metrics; total count retained in aria text. Home recent sections opt into stack behavior.
- `nexa-workspace.js`: Space hub + Content Library / Shared Labels / Tools & Settings subpages; 36-record progressive reveal; back-to-hub behavior; filtered label entry; direct search entry race guard.
- `nexa-motion.js`: shared easing tokens, reduced-motion detection, curved departure primitive and stack enhancement primitive.
- `todo.html`: SVG state glyphs and deletion hooks for Todo, Daily, Note and topic paths.
- `nexa.css`: pen-stroke check animation, stack geometry, route/tab easing, Space hub/subpage presentation and reduced-motion fallbacks.

## Product rationale
- Stack motion is used only on naturally scrollable dashboard/hub cards, not every list row, because sticky transforms on dense 100+ item lists would reduce scan speed.
- Curved departure is used for destructive removal where motion clarifies that an object left the collection; the data mutation still occurs from the animation completion callback.
- Pen-stroke motion is reserved for completion controls because it reinforces the semantic “mark done” action.
- Tools are isolated as a second-level destination rather than pinned over the library; this keeps them one tap from Space while preventing persistent controls from stealing content area.

## Compatibility
No storage keys or record schemas were changed. Stable identity remains `com.nexa.app`; Beta remains an isolated package at final packaging.

## Final verification
- 53/53 Node/static regression tests passed on this packaged channel staging tree.
- All `ui/*.js` files passed `node --check`.
- Key WebView files (`todo.html`, Nexa CSS/JS modules and marked) are byte-identical to Android assets.
- Android manifest/resource XML parsed successfully.
- Gradle Android compile could not proceed in the handoff environment because Gradle 8.11.1 is not cached and the network cannot resolve `services.gradle.org`; no APK compile success is claimed.
