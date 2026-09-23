# To-Do Tree Beta V1.0.4 — Project Handoff

## Identity
- Development baseline: `To-Do-Tree-Beta-V1.0.3-Full.zip`
- Stable Golden remains frozen: `To-Do-v1.22.12-NoteAttachmentDeleteGuard-Full.zip`
- applicationId: `com.todolist.app.beta`
- namespace: `com.todolist.app`
- versionCode: `1004`
- versionName: `1.0.4-beta1`
- APK name: `To-Do-Tree-Beta-V1.0.4.apk`
- Fixed Beta signing key remains unchanged from V1.0.2/V1.0.3.

## Real-device evidence / Architecture Escalation
The user supplied `1000164097.mp4` after V1.0.3. Frame review shows:
1. With IME closed / beginning to open, the format bar is visible at the editor bottom.
2. As the MagicOS IME/accessory area opens, the format bar disappears entirely.
3. When the IME closes, the format bar returns.

Therefore V1.0.3's Beta-only `visualViewport` outer-shell docking is rejected and removed completely. No further WindowInsets timing probe or viewport-height docking patch is allowed.

## Root structural difference found
A direct DOM comparison against Stable V1.22.12 found:
- Stable Note header: exactly two vertical rows (title/actions + search).
- Beta V1.0–V1.0.3 header: three vertical rows (title/actions + Breadcrumb + search).
- Stable `noteEditorBody` deliberately retains the Golden `40vh` bottom editing buffer; the extra Beta row reduces the remaining flex height at the exact moment the IME consumes the bottom of the screen.
- V1.0.2 restored the Golden IME functions, but did not restore this outer vertical geometry.

Playwright layout calculation at a 432x900 CSS viewport confirmed:
- Stable edit header = 105 px.
- V1.0.3 edit header without its dock override = 133 px.
- V1.0.4 edit header = 105 px, matching Stable exactly.
- With a simulated 340 px IME inset, Stable and V1.0.4 place the format-bar bottom exactly at y=560 (keyboard top); the previous extra-row Beta consumes 28 px more vertical room.

## V1.0.4 fix
1. Remove all V1.0.3 `noteBetaViewportDock*` JS, `beta-vv-docked` CSS and visualViewport dock listeners.
2. Keep the actual format bar in the Golden flex flow in both modes. Read Mode uses only `visibility:hidden; opacity:0; pointer-events:none`, never `display:none`, so the bar's geometry does not get inserted during pointerdown/IME animation.
3. In Edit Mode only, hide the extra Breadcrumb row. Read Mode still displays the full clickable Breadcrumb.
4. Set Header Undo/Redo/Done button height to 28px so the Edit Mode title row has the same vertical height as the Stable title row.
5. Keep the existing synchronous Read->Edit `pointerdown` mode switch before Chromium's native focus/default action; by that instant the editor already has Golden vertical geometry.

## Golden IME / editor protection
Byte-exact versus Stable V1.22.12:
- `measureVisualImeSpace`
- `resolveNoteImeSpace`
- `getNoteCaretRect`
- `revealNoteCaretAboveIme`
- `scheduleNoteCaretReveal`
- `applyNoteImeSpace`
- `syncResolvedNoteImeSpace`
- `syncNoteViewportOffset`
- `syncNoteImeLayout`
- `window.__onNativeImeInset`
- `MainActivity.kt`
- `NoteFileViewerActivity.kt`
- `ImportReceiverActivity.kt`

The original Stable base rules for `.note-editor`, `.note-editor__body`, and `.note-format-bar` remain unchanged. V1.0.4 changes only Beta-mode overrides / Beta header additions.

## Existing Beta features preserved
- Topic/Note Schema V2 + idempotent migration
- Recent / Knowledge Tree dual view
- Shared Drawer tree semantics
- Topic Workspace / contextual + / clickable Breadcrumb in Read Mode
- Origin navigation / Back semantics
- Default Read Mode; ordinary text tap -> Edit; Done -> Read
- Header Undo/Redo
- Timestamp token
- Compact inline images + full zoom preview
- B/S/H manual future-typing state
- HTTP(S) autolink / external browser
- File import / preview / annotation / attachment keyboard-delete guard
- Note top-right menu remains exactly `移到主题…` / `删除笔记`

## Locked core
Reminder / Daily / Banner / Snooze 20-file Kotlin core remains byte-identical to Stable V1.22.12.

## Compiler gate
Local sandbox Gradle is attempted but may remain blocked by unavailable `services.gradle.org`. Do not claim local compiler PASS unless it truly completes. The user's already-configured GitHub `Build Beta ZIP to APK & Release` workflow is the authoritative real Android compiler gate before installation.
