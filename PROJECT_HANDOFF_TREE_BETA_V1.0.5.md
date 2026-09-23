# To-Do Tree Beta V1.0.5 — Project Handoff

## Identity
- Baseline: `To-Do-Tree-Beta-V1.0.4-Full.zip`.
- Stable Golden remains frozen at `To-Do-v1.22.12-NoteAttachmentDeleteGuard-Full.zip`; `V1.23.0` is a Stable candidate waiting for the original Stable signing key.
- applicationId: `com.todolist.app.beta`
- namespace: `com.todolist.app`
- versionCode: `1005`
- versionName: `1.0.5-beta1`
- APK name: `To-Do-Tree-Beta-V1.0.5.apk`
- Fixed Beta signing key is unchanged from V1.0.2–V1.0.4.

## Scope — UI-only polish
V1.0.5 is intentionally a minimal diff after V1.0.4 passed the user's real-device format-bar validation.

1. Note top view switch:
   - visible `最近 / 知识树` text removed;
   - Recent uses compact `◷` glyph;
   - Knowledge Tree uses `🌳` glyph;
   - `title` and `aria-label` retain `最近笔记 / 知识树` for semantics.
2. Right-swipe Tree Drawer:
   - header `🌳 知识树` becomes icon-only `🌳`;
   - root row `🌳 知识树根目录` becomes icon-only `🌳`;
   - hidden semantic title/aria labels remain.
3. Feature-coach copy is updated to describe the two icon buttons rather than visible text tabs.

No Tree data, navigation, workspace, IME, editor, attachment or migration behavior changes are authorized in this release.

## V1.0.4 editor/IME lock
The real-device validated V1.0.4 editor fix is preserved. Protected functions are source-identical to V1.0.4:
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

The V1.0.4 structural rule remains: Edit Mode uses the Golden two-row header geometry; Breadcrumb is Read-only; the format bar stays in the Golden flex flow and Read Mode hides it with visibility/opacity instead of removing it.

## Existing Beta features preserved
- Topic/Note Schema V2 and migration
- Recent / Tree dual view and shared Drawer semantics
- Topic Workspace, contextual +, Breadcrumb and Origin navigation
- default Read Mode / tap ordinary text to Edit / Done to Read
- Header Undo/Redo
- compact images and full zoom preview
- timestamp token
- B/S/H manual typing-state model
- HTTP(S) autolink / external browser
- file import / preview / annotation / keyboard-delete guard
- Note top-right menu remains exactly `移到主题…` / `删除笔记`

## Locked core
All 23 Kotlin/Java files under `android/app/src/main/java` are byte-identical to V1.0.4. Reminder/Daily/Banner/Snooze and the native Note/file bridge therefore receive no code change in this release.

## Compiler gate
Local sandbox Gradle was attempted and is blocked before compilation because `services.gradle.org` cannot resolve (`UnknownHostException`). Do not report local compiler success. The user's GitHub `Build Beta ZIP to APK & Release` workflow remains the authoritative real Android compiler/signing gate.
