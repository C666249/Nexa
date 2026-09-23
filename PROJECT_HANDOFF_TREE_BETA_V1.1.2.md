# To-Do Tree Beta V1.1.2 — Development Handoff

## Identity
- Baseline: `To-Do-Tree-Beta-V1.1.1-Full.zip` only.
- applicationId: `com.todolist.app.beta`
- namespace: `com.todolist.app`
- versionCode: `1102`
- versionName: `1.1.2-beta1`
- APK output: `To-Do-Tree-Beta-V1.1.2.apk`

## V1.1.2 scope
This is a deliberately narrow information-density pass on Note list cards.

1. Recent Note body preview is one visual line only (`white-space: nowrap; text-overflow: ellipsis`).
2. Recent Note cards reduce gap from 6px to 4px and use 9px/11px vertical/horizontal padding.
3. Swipeable Topic Workspace Note cards use 9px/11px padding and 8px inner gap.
4. Titles, topic path/time metadata and swipe actions remain available; opening a Note remains the path for reading full body content.

## Locked behavior
- V1.1 swipe rail geometry and physics: 124px rail, 48px reveal threshold, 200ms settle.
- Exactly two swipe actions: Move / Delete; Delete still requires the existing confirmation path.
- V1.1.1 opaque foreground mask remains unchanged.
- Note Editor / Read-Edit / IME / caret / format toolbar source is unchanged from V1.1.1.
- B/S/H, HTTP links, images/PDF, files, annotations, timestamp, Schema V2/migration, Breadcrumb/Origin Back are unchanged.
- All Native Kotlin/Java files remain byte-identical to V1.1.1.
- Fixed Beta signing keystore remains byte-identical to V1.1.1.

## Validation
- `tests/note-card-density.test.js` verifies one-line preview + compact card CSS + preserved swipe geometry.
- Existing `note-swipe-mask`, `note-swipe-physics`, `note-swipe-move` tests pass.
- `ui/todo.html` and Android asset mirror are byte-identical.
- Inline runtime JavaScript is source-identical to V1.1.1 and passes `node --check`.
- Android XML parses successfully.
- Local Gradle attempt is blocked before compilation because this environment cannot resolve `services.gradle.org`; GitHub Actions remains final Android compiler/signing gate.

## Next baseline rule
If V1.1.2 is accepted on-device, all subsequent Beta work must increment from this complete V1.1.2 source, not V1.1.1 or earlier.
