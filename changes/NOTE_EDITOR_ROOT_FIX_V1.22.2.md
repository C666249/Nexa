# Note Editor root-cause repair — v1.22.2

## Regression boundary
- v1.19.1: Note text editing used an in-flow toolbar and a resized editor area when the IME appeared. On-device typing was stable.
- v1.20: file attachments were introduced in the same release that the Note keyboard architecture was changed to a full-height editor + fixed toolbar + dynamic keyboard padding. The attachment feature itself was not the root cause; the keyboard/scroll ownership change was.
- v1.21: an input-time scroll guard attempted to restore large upward jumps, creating competing scroll owners.
- v1.22: the visualViewport path was replaced by native WindowInsets for geometry, but on the target MagicOS device the toolbar no longer followed the IME reliably.

## v1.22.2 model
- **Single scroll owner:** `#noteEditorBody`.
- **IME resize:** changes only the outer editor's bottom padding.
- **Toolbar:** normal flex-flow child, visually corrected only by `visualViewport.offsetTop` compositor transform when Android pans the visual viewport.
- **No typing-time scroll writes:** input/delete/selection autosave only.
- **Opaque shell:** the editor always covers the full app, so the Note root list cannot leak through while the visible workspace is shortened.
