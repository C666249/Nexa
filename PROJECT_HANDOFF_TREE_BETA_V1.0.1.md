# To-Do Tree Beta V1.0.1 — Project Handoff

## Identity
- Development baseline: `To-Do-Tree-Beta-V1.0-Full.zip`
- Stable Golden remains frozen: `To-Do-v1.22.12-NoteAttachmentDeleteGuard-Full.zip`
- Stable applicationId: `com.todolist.app`
- Beta applicationId: `com.todolist.app.beta`
- namespace: `com.todolist.app`
- versionCode: `1001`
- versionName: `1.0.1-beta1`
- APK name: `To-Do-Tree-Beta-V1.0.1.apk`
- Display name: `To-Do Beta`

## V1.0.1 scope
Only one true-device bug is addressed: the Edit Mode format toolbar could stay behind the soft keyboard after Read -> Edit on MagicOS.

Root cause model: V1.22.3's Android WindowInsets bridge is correct when its IME transition callback is delivered. The new Read/Edit lifecycle can expose a vendor timing window where the editor changes from read-only to editable and the keyboard opens while the Web layer still holds the earlier native `IME=0` snapshot. Because native geometry was deliberately authoritative, a stale zero could suppress the browser fallback and leave `--note-ime-space=0`.

Fix:
1. MainActivity centralizes the existing WindowInsets dispatch in `dispatchImeInsetsToWeb(...)` without changing the inset conversion or layout contract.
2. New JS bridge method `requestNoteImeInsets()` re-reads `ViewCompat.getRootWindowInsets(webView)` on demand.
3. Edit Mode probes current native IME geometry at 0/70/160/300/480 ms after focus, spanning the keyboard opening animation.
4. A positive native inset is still authoritative; stale native zero may temporarily fall back to a >=80px visualViewport shrink.
5. Probe timers are cancelled on Read Mode/suspend/close.

No fixed-position toolbar rewrite was introduced. The proven V1.22.3 single-scroll-owner design remains: the editor receives `--note-ime-space`, flex layout shrinks above IME, and the existing format bar stays in normal editor flow immediately above the keyboard.

## Overflow menu contract
The top-right Note `⋮` intentionally contains exactly two note-level actions:
- `📁 移到主题…`
- `🗑 删除笔记`

No extra action was added in V1.0.1.

## Locked areas
The 20 Reminder/Daily/Banner/Snooze files remain byte-identical to Golden. `NoteFileViewerActivity.kt`, `ImportReceiverActivity.kt`, AndroidManifest and `res/xml/file_paths.xml` remain byte-identical to Tree Beta V1.0.

`MainActivity.kt` is the only previously locked native file intentionally touched, solely to add the read-only IME re-query bridge and to refactor the already-existing inset dispatch into one helper. No reminder, file, URL, import, permission, system-back, viewer or storage behavior is changed there.

Protected editor functions remain source-identical to V1.0, including B/S/H, HTTP links, image preview/zoom, file card/import/annotation and attachment-delete guard. Existing `syncNoteImeLayout`, `syncResolvedNoteImeSpace`, `scheduleNoteCaretReveal`, and `syncNoteViewportOffset` are unchanged; only `resolveNoteImeSpace` gains the stale-zero fallback.

## Build rule
Local sandbox Gradle remains network-blocked at `services.gradle.org`. The configured GitHub Actions `Build Beta ZIP to APK & Release` workflow is the real compiler gate. Do not install any APK unless that cloud workflow is green.
