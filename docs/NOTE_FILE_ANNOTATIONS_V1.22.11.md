# Note File Annotations — V1.22.11

## Product rule
- Adding a file remains unchanged and never opens an annotation automatically.
- The file action sheet exposes a small top-right `＋ 附注` / `编辑附注` action.
- One file has at most one optional annotation.
- No annotation title is shown.

## DOM / editor boundary
- `.note-file-card` remains `contenteditable=false`.
- `.note-file-annotation` is a sibling within the existing `#noteEditorBody`, not a nested editor.
- The annotation therefore reuses the existing IME/caret/format/link/autosave pipeline.
- If a selected card lives in a multi-card `.note-file-stack`, only the explicit Add Annotation action isolates that card into a single-card stack so the annotation can sit directly below it. Normal file insertion is unchanged.

## Empty / delete semantics
- Empty annotations are ephemeral and disappear when the user taps elsewhere (toolbar taps are exempt).
- Empty/orphan annotations are pruned when opening a note before focus.
- Deleting the attachment also deletes its annotation.
- Split stacks are merged again when an empty annotation is cancelled or an annotated attachment is deleted where possible.

## Block insertion guard
- Image/file picker insertion ranges are only redirected when the caret is inside an attachment annotation.
- In that case the block attachment is inserted after the annotation, preventing nested file/image islands.
- Outside annotations the previous marker behavior is byte-for-byte equivalent apart from this guarded call.

## Locked architecture
Do not alter for this feature:
- V1.22.3 IME Insets / toolbar-at-keyboard / caret reveal / single Scroll Owner.
- V1.22.4 B/S/H manual typing state.
- V1.22.5 PDF and image pinch/pan.
- V1.22.6 image focus-safe preview entry.
- V1.22.7+ HTTP(S) linkification and external browser bridge.
- Reminder / Daily / Banner / Snooze native core.
