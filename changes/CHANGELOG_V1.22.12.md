# V1.22.12 — Note Attachment Keyboard Delete Guard

## Fixed
- File attachments inside Note can no longer be removed by keyboard Backspace/Delete.
- A text selection that crosses an attachment cannot delete the attachment.
- The only destructive attachment path remains the explicit three-dot menu -> 删除附件.

## Editor boundary
- Normal text Backspace/Delete remains native Chromium behavior.
- Android soft-keyboard deletion is guarded through `beforeinput delete*`.
- Hardware-keyboard Backspace/Delete has a narrow fallback guard.
- No attachment card structure, import flow, annotation structure, IME geometry, caret reveal or toolbar behavior was changed.

## Safety
- Runtime JavaScript differs from V1.22.11 only by the isolated attachment-delete guard block.
- MainActivity, NoteFileViewerActivity, ImportReceiverActivity, Manifest and FileProvider remain byte-identical.
- Reminder/Daily/Banner/Snooze locked core remains byte-identical.
