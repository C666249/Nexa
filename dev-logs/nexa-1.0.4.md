# Nexa 1.0.4 handoff — 2026-09-07

## Request
Consolidate a large set of premium interaction ideas into the existing Nexa product without breaking Todo/Checklist/Note/Daily/Space behavior. Existing good interactions should be retained rather than rewritten merely for novelty.

## Product / motion architecture
The round introduces a shared Motion 2.0 layer instead of isolated page-specific animation constants. It uses reusable easing/spring/departure/reflow/press/sheet/peek/morph primitives and a reduced-motion path.

### Todo / Checklist / Daily
- Long Todo list stack-scroll with bounded 2–4 visual depth, only enabled for sufficiently long lists.
- Stack suspension during checklist expansion, swipe, edit, reorder, completion reflow and departure.
- SVG handwriting-style completion glyphs shared by Todo / Checklist / Daily.
- Todo completion soft-settle before reflow into the appropriate completion region.
- Last-checklist-child completion triggers the same parent Todo settle/reflow.
- Long-press Todo reorder with persistent per-date/per-status order and FLIP/spring displacement.
- Curved gesture-direction deletion for Todo / Daily / Note / topic, followed by natural list reflow.

### Space
- Preserves 1.0.3 hub → Content Library / Shared Labels / Tools & Settings hierarchy.
- Sticky/collapsing second-level header and always-reachable quick destinations.
- Sibling Space destinations support horizontal page navigation.
- Progressive library reveal remains to avoid huge initial DOMs.

### Navigation / Note / system-wide controls
- Moving shared bottom-nav capsule plus shared-axis route direction.
- Note card shared-element style morph into detail where supported; fallback retained.
- Search scope unfolds from inside the Note search field.
- Note FAB rotates and reveals child actions on restrained arcs/stagger.
- Category/tag chips have spring selection and persistent reorder.
- Todo/Note long-press Peek with escaped preview text and quick actions.
- Home odometers and one-shot completion ring draw.
- Velocity-aware spring bottom sheets and size-aware button press physics.
- Skeleton-to-content transition only for actual asynchronous waits such as AI; no fake loading delay for instant local operations.

## Review fixes completed before packaging
- Disabled dense-list sticky stacking below the long-list threshold.
- Full stack cleanup removes stale transform/custom properties/pointer state when a list is rebound.
- Reflow temporarily suspends stack transforms so FLIP geometry is correct.
- Last checklist child now updates/repositions its parent task correctly.
- Peek preview strings are escaped before HTML insertion.
- Completion/filter state transitions re-render the real business state instead of leaving stale rows in incompatible filters.

## Compatibility
- Stable identity remains `com.nexa.app`.
- No existing persisted Todo/Note/Daily/topic/attachment/recycle/backup schema is renamed or migrated.
- 1.0.2 highlight-boundary normalization and 1.0.3 Space hierarchy stay intact.

## Validation
- Working-tree Node/static regression: 61/61 pass (`dev-logs/nexa-1.0.4-node-tests.log`).
- All external UI JavaScript and the inline HTML script pass syntax checking.
- Manifest/resources XML parse successfully.
- Every file under `ui/` is byte-identical to the corresponding Android packaged asset after final sync.
- Stable/Beta channel staging is separately revalidated before ZIP creation.
- Actual Gradle build attempt cannot start because Gradle 8.11.1 is not cached and `services.gradle.org` cannot be resolved; see `dev-logs/nexa-1.0.4-gradle-attempt.log`. No APK build success is claimed.

## Version / channels
- Stable: `com.nexa.app`, `Nexa`, 1.0.4 / versionCode 9, APK name `Nexa-Stable-1.0.4-<buildType>.apk`.
- Beta: `com.nexa.app.beta`, `Nexa β`, 1.0.4-beta.1 / versionCode 9, β launcher icon, APK name `Nexa-Beta-1.0.4-beta.1-<buildType>.apk`.
