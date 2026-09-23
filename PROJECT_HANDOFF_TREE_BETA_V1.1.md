# To-Do Tree Beta V1.1 — Project Handoff

## Identity
- Development baseline: `To-Do-Tree-Beta-V1.0.5-Full.zip` only.
- Stable Golden: `To-Do-v1.22.12-NoteAttachmentDeleteGuard-Full.zip`.
- Stable candidate `V1.23.0` remains pending the original Stable signing key and is not the Beta development baseline.
- applicationId: `com.todolist.app.beta`
- namespace: `com.todolist.app`
- versionCode: `1100`
- versionName: `1.1.0-beta1`
- APK: `To-Do-Tree-Beta-V1.1.apk`
- Fixed Beta signing key is byte-identical to V1.0.5.

## V1.1 scope — Shared Physical Swipe Actions
V1.1 adds list-level Note actions only. The Note editor is not modified.

### Supported surfaces
1. Recent view Note cards.
2. Topic Workspace Note cards.

### Intentionally excluded
- Knowledge Tree expanded Note rows.
- Right-swipe Knowledge Tree Drawer rows.
This prevents a horizontal card action from competing with Drawer navigation.

### Golden To-Do physical geometry reused
- Action rail width: `124px`.
- Reveal threshold: `48px`.
- Settle transition: `200ms ease-out`.
- Finger drag moves the card continuously; short drags rebound; crossing threshold opens the full rail.
- Vertical movement takes priority when `|dy| > |dx|`.
- One open Note rail at a time.
- Tapping an open card closes the rail instead of opening the Note.
- A completed horizontal drag suppresses the synthetic click, preventing accidental Note open.

### V1.1 action registry — first release
- `📁 移动`: opens a lightweight Topic picker; reuses existing `moveNoteToTopic()`; supports 未分类 and unlimited nested Topics.
- `⌫ 删除`: calls existing `deleteNoteFromList()` and therefore keeps the existing confirmation dialog. A swipe itself can never delete a Note.
- The rail markup is isolated so later actions can be added without changing gesture math.

### Gesture arbitration
The existing Note surface right-swipe opens the Knowledge Tree Drawer. V1.1 adds an explicit guard: if a horizontal gesture starts inside `.note-swipe-row`, that gesture belongs to the card and the Drawer does not open. Drawer navigation remains available from the existing button and non-card/empty surface.

## Protected V1.0.5 / V1.0.4 editor core
The following functions are source-identical to V1.0.5:
- `measureVisualImeSpace`
- `resolveNoteImeSpace`
- `getNoteCaretRect`
- `revealNoteCaretAboveIme`
- `scheduleNoteCaretReveal`
- `applyNoteImeSpace`
- `syncResolvedNoteImeSpace`
- `syncNoteViewportOffset`
- `syncNoteImeLayout`
- `setNoteEditorMode`
- `openNoteEditor`
- `closeNoteEditor`

Read/Edit, Golden toolbar geometry, Breadcrumb behavior, timestamp, compact images, B/S/H, HTTP links, image/PDF zoom, files, annotations and attachment keyboard-delete guard are outside V1.1 scope.

## Native Locked Core
All 23 files under `android/app/src/main/java` are byte-identical to V1.0.5. Beta keystore is unchanged. ToDo's existing Golden swipe implementation is source-identical; V1.1 does not refactor or alter the proven ToDo gesture.

## Tests / compiler gate
- `tests/note-swipe-physics.test.js`: 124/48/200 clamp, threshold and rebound PASS.
- `tests/note-swipe-move.test.js`: 未分类/nested Topic routing + same-topic no-op guard PASS.
- Static assertions: Recent + Topic Workspace wrapped; Knowledge Tree leaf unwrapped; exactly two V1.1 actions; delete confirmation path retained; Drawer conflict guard present.
- `ui/todo.html` == Android asset mirror.
- Inline JS `node --check`: PASS.
- Android XML parse: PASS.
- Local Gradle attempted but blocked before compilation by `services.gradle.org` DNS (`UnknownHostException`). GitHub `Build Beta ZIP to APK & Release` remains the authoritative real compiler/signing gate.
