# Nexa 1.0.17

## Fix
- Fixed Android `compileDebugKotlin` failure at `MainActivity.kt` caused by unresolved `getNoteFileUri`.
- `openNoteFileWithExternalApp()` now calls the existing `getShareableFileUri(file)` helper, keeping FileProvider URI handling consistent across file open, file share, and image share flows.
- Added regression coverage that fails if the stale helper name reappears.

No storage schema changes.
