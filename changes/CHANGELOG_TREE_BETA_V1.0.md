# Tree Beta V1.0 Changelog

## Information architecture
- Added Schema V2 Topic / Note separation.
- Removed the old runtime concept that a Note can also be a parent container.
- Added deterministic, loss-preserving legacy migration and raw legacy backup.
- Added Recent / Knowledge Tree dual view.
- Added Topic Workspace + lightweight Summary.
- Added clickable Breadcrumb navigation.
- Added same-tree right-swipe Drawer.
- Added context-aware Note / Topic creation.
- Added Origin Context navigation restoration.

## Editor shell
- Existing Note now opens in Read Mode without automatically opening IME.
- Tap ordinary text/title to enter Edit Mode.
- `✓` saves and returns to Read Mode.
- System Back saves and leaves directly to the exact source context.
- Moved Chromium Undo / Redo controls from bottom toolbar to editor Header without rewriting their command implementation.
- Added static timestamp token with epoch metadata.
- Reduced inline image footprint; preserved complete image rather than cropping; existing zoom preview unchanged.
- Prevented search highlight markup from being persisted into Note HTML.

## Beta isolation
- `applicationId=com.todolist.app.beta`
- `versionCode=1000`, `versionName=1.0.0-beta1`
- display name `To-Do Beta`
- import task affinity isolated as `com.todolist.app.beta.import`
- launcher icon has a small β badge.

## Stable-protection policy
- Stable V1.22.12 remains untouched.
- MainActivity, NoteFileViewerActivity, ImportReceiverActivity and FileProvider XML remain byte-identical.
- Reminder/Daily/Banner/Snooze locked native core remains 20/20 SHA-256 identical.
