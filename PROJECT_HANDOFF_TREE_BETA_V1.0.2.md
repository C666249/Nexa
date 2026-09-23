# To-Do Tree Beta V1.0.2 — Project Handoff

## Identity
- Development baseline: `To-Do-Tree-Beta-V1.0.1-Full.zip`
- Stable Golden remains frozen: `To-Do-v1.22.12-NoteAttachmentDeleteGuard-Full.zip`
- applicationId: `com.todolist.app.beta`
- namespace: `com.todolist.app`
- versionCode: `1002`
- versionName: `1.0.2-beta1`
- APK name: `To-Do-Tree-Beta-V1.0.2.apk`

## User-reported regression addressed
On Honor MagicOS, Tree Beta V1.0/V1.0.1 could open the IME while the Note format bar remained behind the keyboard / keyboard accessory row. Stable V1.22.12 did not have this regression.

## Root-cause direction
The Golden V1.22.12 IME CSS/JS itself was already correct in Beta V1.0. The architectural difference was the new Read/Edit shell: Read Mode changed `noteEditorBody` from `contenteditable=false` to `true` immediately before focus/keyboard open. That changed WebView focus/layout timing on the target device. V1.0.1 incorrectly tried to compensate with repeated WindowInsets probes; true-device retest showed that this did not solve the root issue.

## V1.0.2 fix
1. Restore the complete V1.22.12 `Keyboard-aware Note editor` JS block byte-for-byte.
2. Restore `MainActivity.kt` byte-for-byte to V1.22.12, removing the V1.0.1 ad-hoc `requestNoteImeInsets()` bridge/probe path.
3. Keep the Golden `.note-format-bar` layout CSS byte-for-byte.
4. Preserve Read Mode without toggling the editor root's DOM editability:
   - `noteEditorBody` stays `contenteditable=true` in both Read/Edit.
   - entering Read still blurs body/title, hides keyboard and hides format bar.
   - ordinary-body `pointerdown` synchronously changes shell to Edit before Chromium's default focus action; no preventDefault is used, so Chromium owns native caret/focus/keyboard placement.
   - image/file/link/timestamp interaction islands remain excluded from ordinary Read->Edit switching.
5. Header title `pointerdown` similarly enters Edit before the native focus action.

## Fixed Beta signing from V1.0.2 onward
- Added dedicated `android/app/beta-debug.keystore`.
- Gradle debug builds explicitly use signingConfig `betaDebug`.
- Keystore SHA-256: `6af592d340eac79435f07ce22393af0fd419349b482ce02970852b0ca0f1ef3a`.
- Certificate SHA-256 fingerprint: `F8:44:1C:45:A5:2E:1D:5D:FA:2F:44:12:C4:6C:BE:06:84:41:5E:83:84:D3:DF:71:BB:91:54:E0:40:DD:48:51`.
- This is an intentionally non-secret Beta-only development identity. NEVER use it to sign Stable `com.todolist.app`.
- Because V1.0.1 was signed by the unreliable previous cloud-debug identity, the user must uninstall Beta once before installing V1.0.2. From V1.0.2 onward, later Beta packages should overwrite/retain Beta data when built from this source family.

## Product behavior intentionally unchanged
- Topic/Note Schema V2, migration, Recent/Tree, Drawer, Workspace, Breadcrumb and contextual +.
- Default Read Mode semantics and ✓ save-to-read behavior.
- Header Undo/Redo.
- Timestamp token.
- Compact image rendering + full preview zoom.
- B/S/H manual typing state.
- HTTP(S) autolink/open-external behavior.
- File import/preview/annotation and attachment keyboard-delete guard.
- Note top-right menu remains exactly: `移到主题…` / `删除笔记`.

## Locked core
Reminder / Daily / Banner / Snooze 20-file native core is byte-identical to Stable V1.22.12.

## Compiler status
Local sandbox Gradle attempt still cannot resolve `services.gradle.org`; this is an environment network failure, not reported as compiler PASS. The configured GitHub `Build Beta ZIP to APK & Release` workflow remains the real Android compiler gate.

## Optional GitHub workflow cleanup
`github-workflow/build-beta-from-zip-v2.yml` is provided. It removes the obsolete GitHub cache-based debug-keystore step and checks that the bundled Beta signing key exists. The currently-installed workflow can already build V1.0.2 correctly because Gradle now explicitly uses the bundled Beta key; replacing the workflow is cleanup, not a prerequisite for this build.
