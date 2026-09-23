# Tree Beta V1.0.1 Changelog

Baseline: `To-Do-Tree-Beta-V1.0-Full.zip`

This is a focused true-device IME positioning fix. No product model or Note information-architecture changes are introduced.

## Fixed
- On Honor/MagicOS, entering Edit Mode from the new default Read Mode could occasionally open the soft keyboard without receiving the one native WindowInsets update that V1.22.3 normally relies on. In that stale-zero state the bottom format toolbar stayed at the physical screen bottom and was covered by the IME.
- Added a tiny native `requestNoteImeInsets()` bridge. When Edit Mode focuses the title/body, the Web layer re-queries current root IME insets several times across the keyboard opening animation (`0/70/160/300/480ms`).
- Positive native WindowInsets remain authoritative. If the last native value is still zero but `visualViewport` already reports a keyboard-sized shrink, that visual value is now allowed as a temporary fallback until the native probe catches up.
- Pending IME probes are cancelled whenever the editor returns to Read Mode, is suspended, or closes.

## Unchanged
- The Note overflow menu remains intentionally only: `移到主题…` and `删除笔记`.
- Topic / Note Schema V2, Recent / Knowledge Tree, Workspace, Breadcrumb, right-swipe Tree Drawer and Origin navigation are unchanged.
- Read/Edit semantics, timestamp, compact image presentation and Header Undo/Redo are unchanged.
- Existing B/S/H typing state, HTTP(S) links, image/PDF zoom, file import/viewer, file annotations and attachment keyboard-delete guard are unchanged.
- Reminder / Daily / Banner / Snooze locked native core remains 20/20 SHA-256 identical.

## Version
- applicationId: `com.todolist.app.beta`
- versionCode: `1001`
- versionName: `1.0.1-beta1`
- APK: `To-Do-Tree-Beta-V1.0.1.apk`
