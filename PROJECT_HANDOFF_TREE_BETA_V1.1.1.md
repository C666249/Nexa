# To-Do Tree Beta V1.1.1 — Project Handoff

## Identity
- Development baseline: `To-Do-Tree-Beta-V1.1-Full.zip` only.
- Stable Golden: `To-Do-v1.22.12-NoteAttachmentDeleteGuard-Full.zip`.
- applicationId: `com.todolist.app.beta`
- namespace: `com.todolist.app`
- versionCode: `1101`
- versionName: `1.1.1-beta1`
- APK: `To-Do-Tree-Beta-V1.1.1.apk`
- Fixed Beta signing key is byte-identical to V1.1.

## V1.1.1 scope — solid foreground masking for Note swipe cards
Real-device V1.1 showed the Move/Delete rail through the translucent glass Note card before the card had actually uncovered that region. V1.1.1 fixes only that visual layering defect.

The implementation follows the already-proven Golden To-Do model:
- the swipe row has an opaque `#fffefa` base;
- the moving foreground `.note-swipe-inner` is an opaque rounded `#fffefa` layer at z-index 2;
- swipeable `.note-doc-card` / `.note-recent-card` are opaque while inside that foreground;
- the action rail remains z-index 1 and therefore becomes visible only in the area physically uncovered by the translated foreground.

No action button position, rail geometry, threshold, transition, gesture arbitration, Move routing or Delete confirmation logic changed.

## Locked protections
- V1.1 gesture constants stay `124px / 48px / 200ms ease-out`.
- Note Editor / IME / Read-Edit core is source-identical to V1.1.
- Native Kotlin/Java is byte-identical to V1.1.
- ToDo Golden swipe source is byte-identical to V1.1.
- Topic/Note Schema V2, migration, Breadcrumb, Origin Back, timestamp, compact images, B/S/H, links, files, annotations and attachment delete guard are unchanged.

## Test gate
- `tests/note-swipe-physics.test.js`: PASS expected.
- `tests/note-swipe-move.test.js`: PASS expected.
- `tests/note-swipe-mask.test.js`: asserts Golden-style opaque foreground, z-index ordering and solid swipeable Note cards.
- HTML/Android asset mirror, inline JS syntax, Android XML, signing key, full-tree hashes and ZIP integrity must pass before delivery.
