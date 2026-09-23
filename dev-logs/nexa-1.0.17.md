# Nexa 1.0.17 Stable hotfix

## Reported failure
Android Studio reached `:app:compileDebugKotlin` and failed at `MainActivity.kt:821` because `openNoteFileWithExternalApp()` referenced unresolved `getNoteFileUri(file)`.

## Fix
The active app source now uses the already-defined `getShareableFileUri(file)` helper. This is the same FileProvider URI path used by Note image and file sharing, so external open/share behavior remains consistent.

## Regression protection
`tests/note-image-share-v1.0.16.test.cjs` now explicitly rejects `getNoteFileUri(` in the active MainActivity and verifies `openNoteFileWithExternalApp()` resolves through `getShareableFileUri(file)`.

## Validation
- Node suite: 108/108 pass (`dev-logs/nexa-1.0.17-final-tests.log`).
- JS syntax: pass.
- Android XML parse: pass.
- Stable/Beta channel identity and output APK naming: checked.
- WebView source/assets mirror: byte-identical.
- Gradle compile was attempted, but this container cannot resolve `services.gradle.org`, so Gradle 8.11.1 cannot be downloaded here. See `dev-logs/nexa-1.0.17-gradle-compile.log`. This is an environment/network block before project compilation, not a claimed build success.

No storage schema changes.
