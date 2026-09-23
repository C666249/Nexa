# Note Attachment Keyboard Delete Guard — V1.22.12

## Problem
`contenteditable=false` prevents editing inside a file card, but Chromium can still delete the entire atomic attachment node when Backspace/Delete is pressed at an adjacent caret or when a deletion selection crosses the card.

## Product rule
A Note file attachment is durable content. The only supported destructive path is the explicit file-card three-dot menu -> **删除附件**.

## Implementation
- Add a narrow `beforeinput` guard for `delete*` input types on `#noteEditorBody`.
- Add a hardware-keyboard `keydown` fallback for Backspace/Delete.
- Block only when the current selection intersects a file stack/card, or a collapsed deletion boundary is immediately adjacent to an attachment through only empty/BR spacer structure.
- Normal text deletion remains native Chromium behavior.
- The explicit three-dot deletion remains JavaScript `remove()` logic and does not pass through this input guard.

## Compatibility boundary
No changes to IME geometry, caret reveal, format toolbar, B/S/H typing state, HTTP(S) links, image/PDF preview, attachment import, file viewer, Android bridge, reminders, Daily, Banner or Snooze.
