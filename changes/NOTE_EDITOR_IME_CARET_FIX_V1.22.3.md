# Note editor IME + caret visibility repair — v1.22.3

## Reported on-device behavior in v1.22.2
- Long-note top-line jumping was fixed.
- The format toolbar could remain behind the soft keyboard instead of being pushed above it.
- Tapping a low caret position could leave the insertion line hidden by the keyboard/tool bar, so newly typed text was not visible.

## Root cause
The packaged Android WebView exposes `window.visualViewport`, but on the target MagicOS device the existence of that API does not guarantee that its height reports the IME geometry needed by this editor. V1.22.2 returned early from `window.__onNativeImeInset(...)` whenever `visualViewport` existed, so a valid native `WindowInsetsCompat.Type.ime()` measurement could be ignored entirely.

V1.22 had the opposite problem: it used the native inset as a CSS value without converting Android physical pixels. On a high-density screen that can overshoot by approximately `devicePixelRatio`.

## v1.22.3 model
- **Single scroll owner remains:** `#noteEditorBody`.
- **Native Android app:** converted `WindowInsetsCompat.Type.ime()` is authoritative for IME bottom geometry.
- **Browser fallback:** `visualViewport.height` is used only before a native source is known / outside the native bridge.
- **Viewport pan:** `visualViewport.offsetTop` only translates the toolbar compositor layer; it never restores body scroll.
- **Caret reveal:** one-shot and event-scoped to IME geometry changes or explicit pointer taps. It is not attached to text input, deletion or selectionchange.

## Expected target behavior
1. Keyboard opens → editor flex workspace becomes shorter by the true keyboard height.
2. In-flow format toolbar ends directly above the keyboard.
3. If the current caret would now be below the visible body rectangle, body scrolls only enough to show that caret above the toolbar.
4. Continued typing/backspace uses Chromium's normal contenteditable caret following and does not receive JS `scrollTop` corrections.
5. User scrolls long note while keyboard is open → toolbar remains a sibling control at the keyboard edge, not a child of the body scroll content.
