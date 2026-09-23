# Note HTTP(S) Gradient Link Style — V1.22.8

## Goal
Give Note web links a recognizable but more product-specific visual treatment without touching the editor/link architecture that was stabilized in V1.22.7.

## Style
The existing HTTP(S) anchor selector keeps a normal blue `color` as a compatibility fallback, then applies a text-clipped gradient:

- Cyan: `#22c7c7`
- Blue: `#3f8cff`
- Green: `#39c98b`
- Purple: `#9167f2`

The gradient is horizontal and static. There is no animated gradient, filter animation, layout animation or JS-driven repaint.

## Editing compatibility
Text gradients on Chromium/WebView use `-webkit-background-clip:text` + transparent text fill. For selected link text, V1.22.8 explicitly restores a dark text fill inside `::selection` so selection/editing remains legible.

## Locked architecture
This release does not change:
- URL parsing or fuzzy-link policy.
- `beforeinput`, `input`, paste, Enter or selection handling.
- `execCommand(createLink)` behavior.
- Android `ACTION_VIEW` bridge.
- Note IME/caret/scroll/toolbar code.
- B/S/H manual typing-state code.
- Image/PDF preview, import or reminder code.

The implementation is therefore intentionally CSS-only at runtime.
