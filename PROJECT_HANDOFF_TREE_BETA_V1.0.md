# To-Do Tree Beta V1.0 — Project Handoff

## Branch identity
- Stable Golden remains: `To-Do-v1.22.12-NoteAttachmentDeleteGuard-Full.zip`
- Stable applicationId: `com.todolist.app`
- This experimental build applicationId: `com.todolist.app.beta`
- namespace intentionally remains `com.todolist.app`
- versionCode: `1000`
- versionName: `1.0.0-beta1`
- APK name: `To-Do-Tree-Beta-V1.0.apk`
- Display name: `To-Do Beta`

This Beta is intentionally installable beside Stable. It must not be used as the Stable migration target until the Tree architecture and migration logic are accepted on-device.

## Product model
Schema V2 separates two identities:
- **Topic**: structural node, infinite nesting, optional lightweight text Summary.
- **Note**: content document / leaf node. A Note never owns children.

Storage keys:
- legacy retained: `todo_glass_notes`
- schema marker: `todo_glass_note_schema_version = 2`
- Topics: `todo_glass_note_topics_v2`
- Notes: `todo_glass_note_docs_v2`
- one-time legacy backup: `todo_glass_note_schema_v1_backup`

## Main UX delivered
1. Note header: `最近 / 知识树` dual view.
2. Recent: leaf Notes sorted by last actual content/title modification, with clickable Topic path.
3. Knowledge Tree: Topic and Note coexist; arrow only expands/collapses; Topic body enters Workspace; Note opens editor.
4. Right-swipe Drawer renders the same Topic/Note tree and semantics.
5. Topic Workspace: breadcrumb, optional Summary, child Topics and Notes.
6. Contextual FAB: short click exposes `新建笔记 / 新建主题`; long press is optional fast Topic creation.
7. Breadcrumb segments are clickable. Upward jumps trim deeper navigation history.
8. Opening a Note records Origin Context. Back restores Recent / Tree / Workspace origin rather than deriving return destination from storage path.
9. Existing Notes open in Read Mode. Tapping ordinary text enters Edit Mode at the tapped caret. Interaction islands (image/file/link/timestamp/menu) do not wake editing.
10. Edit header owns Undo / Redo / ✓. ✓ saves and returns to Read Mode; system Back saves and leaves directly to Origin.
11. Inline images are compact, uncropped (`object-fit: contain`); existing full-screen zoom/pan preview remains unchanged.
12. Toolbar has static timestamp token `◷ YYYY.MM.DD · HH:mm:ss`, with persisted epoch milliseconds and atomic deletion behavior.

## Legacy migration rules
- Old folder + same-name shell Note -> one Topic, not duplicate Topic+Note.
- Any old node with children -> Topic.
- Empty old leaf -> Topic (no user content is lost; avoids manufacturing meaningless blank Notes).
- Leaf with actual content -> Note.
- Parent/body plain text -> Topic Summary.
- Parent/body containing images/files/complex blocks -> lightweight Summary when possible + lossless child Note `· 原内容` preserving the exact rich HTML/attachment metadata.
- Broken-parent/orphan records are retained at root.
- Synthetic migration IDs are deterministic, so re-running the same migration produces the same structure rather than appending duplicates.
- Legacy raw JSON remains backed up and is never automatically deleted.

## Locked baseline contract
The following are not reimplemented by Tree Beta:
- Native WindowInsets / IME geometry and single Scroll Owner
- one-shot caret reveal
- B/S/H manual future-typing state model
- conservative HTTP(S) auto-link and external browser bridge
- full-screen image zoom/pan and PDF zoom/pan
- image focus-safe preview
- file import/private sandbox/in-app viewer
- file annotation model
- attachment keyboard-delete guard
- Reminder / Daily / Banner / Snooze native core

Tree Beta changes the Note information architecture / navigation shell around those mature blocks rather than rewriting them.

## Final Stable merge rule
Do not rename/install the Beta package over Stable. After Beta acceptance, merge the validated source changes back to a new Stable build that restores `applicationId=com.todolist.app`, uses the original signing identity, and runs the already-tested Schema V1 -> V2 migration against the existing Stable sandbox.
