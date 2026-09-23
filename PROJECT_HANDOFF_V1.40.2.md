# PROJECT HANDOFF — To-Do V1.40.2 Stable

Baseline: user-supplied V1.30.19 Stable Full Source ZIP.

## Changes
1. Daily checkbox: removed full drawer render on state toggle; row + progress are updated surgically.
2. Daily swipe rail: edit/delete layer is physically unpainted while closed and activated only by horizontal swipe/open state.
3. Main To-Do swipe rail: same closed `display:none` hardening.
4. Checklist expansion: closed foreground rows no longer keep `transform:translateX(0)` compositor layers; expand/collapse first settles any swipe transform.
5. Note italic: `i`/`em` and inline `font-style:italic` receive `.12em` visual margin each side + `.018em` letter spacing.
6. Version/docs/APK output names updated to V1.40.2; stale standalone-incompatible `buildBoth` root task removed.

## Delivery invariants
- Stable identity remains `com.todolist.app`; Beta remains `com.todolist.app.beta`.
- No storage key or schema migration was changed.
- Web UI and Android asset mirror must remain byte-identical.
