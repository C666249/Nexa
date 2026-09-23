# To-Do Tree Beta V1.0.3 — Project Handoff

## Identity
- Development baseline: `To-Do-Tree-Beta-V1.0.2-Full.zip`
- Stable Golden remains frozen: `To-Do-v1.22.12-NoteAttachmentDeleteGuard-Full.zip`
- applicationId: `com.todolist.app.beta`
- namespace: `com.todolist.app`
- versionCode: `1003`
- versionName: `1.0.3-beta1`
- APK name: `To-Do-Tree-Beta-V1.0.3.apk`

## True-device evidence that triggered V1.0.3
User supplied a 4.88 s Honor/MagicOS screen recording (`1000164086.mp4`). Frame review showed a repeatable full-animation failure:
1. Read Mode starts with keyboard closed and format bar hidden.
2. After tapping body, the format bar appears and during early IME animation (~0.8 s) is briefly visible above the rising keyboard.
3. Once the IME is fully expanded (~1.0–1.6 s), the format bar is no longer visible: the Beta editor shell has extended underneath the keyboard/accessory area.
4. When the keyboard closes (~1.8–2.4 s), the format bar returns to the bottom.

This proves the remaining regression is not caused by the Golden V1.22.12 IME algorithms themselves. V1.0.2 already restored those algorithms byte-for-byte. The conflict is the Beta Read/Edit shell's outer viewport sizing during MagicOS visual-viewport animation.

## Architecture escalation / V1.0.3 fix
Do NOT add a third WindowInsets timing patch.

The Golden editor remains the inner layout model:
- header = fixed flex item
- body = single scroll owner
- format bar = final flex item in editor flow
- Golden IME/caret state machine remains byte-exact

V1.0.3 changes only the **Beta Edit shell outer height**:
- while `noteEditorMode === edit` and `window.visualViewport` is available, compute the currently visible layout-coordinate bottom as `visualViewport.offsetTop + visualViewport.height`;
- set the fixed Beta editor shell height to that visible bottom;
- force the Beta edit shell's own bottom padding to zero so it cannot double-reserve IME space;
- the existing format bar remains static/flex and therefore naturally ends exactly at the shell's visible bottom;
- synchronize throughout `visualViewport.resize` and `visualViewport.scroll`, covering the complete keyboard open/close animation rather than a single transition instant;
- Read Mode and editor close reset the Beta-only dock class/property;
- if `visualViewport` is unavailable, the class is not applied and the Golden V1.22.12 inset layout remains the fallback.

The Beta dock is deliberately outside the Golden IME algorithm. It does not change `measureVisualImeSpace`, `resolveNoteImeSpace`, `getNoteCaretRect`, `revealNoteCaretAboveIme`, `scheduleNoteCaretReveal`, `applyNoteImeSpace`, `syncResolvedNoteImeSpace`, `syncNoteViewportOffset`, `syncNoteImeLayout`, or `__onNativeImeInset`.

## Golden editor proof
V1.0.3 source comparison against Stable V1.22.12:
- `MainActivity.kt`: exact.
- `NoteFileViewerActivity.kt`: exact.
- `ImportReceiverActivity.kt`: exact.
- nine Golden Keyboard-aware Note functions: exact.
- `window.__onNativeImeInset`: exact.
- original `.note-editor`, `.note-editor__body`, `.note-format-bar` base rules remain unchanged; V1.0.3 only adds a later Beta-specific `.edit-mode.beta-vv-docked` override.

## Existing Beta feature behavior preserved
- Topic/Note Schema V2 + migration.
- Recent / Knowledge Tree dual view.
- Drawer uses same Topic/Note tree semantics.
- Topic Workspace, Breadcrumb and contextual +.
- Origin navigation / Back semantics.
- Default Read Mode, ordinary-body tap -> Edit, ✓ -> Read.
- Header Undo/Redo.
- Timestamp token.
- Compact inline image + full zoom preview.
- B/S/H manual future-typing state.
- HTTP(S) autolink/open-external behavior.
- File import/preview/annotation and attachment keyboard-delete guard.
- Note top-right menu remains exactly `移到主题…` / `删除笔记`.

## Fixed Beta signing
Unchanged from V1.0.2:
- `android/app/beta-debug.keystore`
- keystore SHA-256: `6af592d340eac79435f07ce22393af0fd419349b482ce02970852b0ca0f1ef3a`
- Gradle debug signing explicitly uses `betaDebug`.
- V1.0.3 should overwrite V1.0.2 and retain Beta data; no uninstall should be necessary if V1.0.2 was installed from this signing family.
- Never use this key for Stable `com.todolist.app`.

## Locked core
Reminder / Daily / Banner / Snooze 20-file Kotlin core is byte-identical to Stable V1.22.12.

## Compiler status
Local sandbox Gradle still cannot resolve/download from `services.gradle.org`; no local compiler PASS is claimed. GitHub `Build Beta ZIP to APK & Release` remains the authoritative compiler gate before installation.
