# V1.22.11 — Note File Annotations

## Added
- Optional one-to-one annotation for Note file attachments.
- `＋ 附注` / `编辑附注` appears as a low-priority top-right action in the existing attachment action sheet.
- Annotation renders as a title-less inset paper-note directly beneath its file card.
- Empty annotations are ephemeral; deleting the file deletes its annotation.

## Editor boundary
- No nested contenteditable editor was introduced. The annotation remains a sibling node inside the existing `#noteEditorBody`, so the established IME/caret/B-S-H/link/autosave pipeline remains the only editor pipeline.
- Root-level Enter inside an annotation is converted only to a line break, preventing Chromium from cloning the whole annotation block. Native list-item Enter behavior remains untouched.
- Image/file block insertion is redirected only when the caret is inside an annotation, placing the block after the annotation instead of nesting an attachment island inside it.

## Safety
- Normal file add/display flow is unchanged unless the user explicitly taps `＋ 附注`.
- MainActivity, NoteFileViewerActivity, ImportReceiverActivity, Manifest and FileProvider are unchanged.
- V1.22.3 IME/caret/single Scroll Owner, V1.22.4 B/S/H, V1.22.5 zoom, V1.22.6 image focus-safe, V1.22.7+ link chain and Reminder/Daily/Banner/Snooze remain locked.
