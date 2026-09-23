# To-Do V1.40.3 Stable Review

## User-visible fix
The remaining flicker reported specifically while **collapsing a checklist todo** was reviewed as a separate path from the earlier Daily action-rail flash.

### What changed
- Removed checklist `grid-template-rows: 1fr -> 0fr` spring interpolation.
- Removed checklist-shell `translateY` animation.
- Collapse now starts from the exact rendered pixel height and animates to `0px` in 220 ms with a non-overshooting curve.
- Expansion measures `scrollHeight`, animates to that pixel height, then returns to `height:auto`.
- A sequence token cancels stale requestAnimationFrame / transition callbacks during rapid taps.
- Tapping the checklist toggle/content temporarily blocks the parent card `:active` background flash.
- Swipe/action rail is explicitly closed before checklist geometry is measured.

## Regression boundaries
Unchanged from V1.40.2: data/storage schema, Stable production identity, Beta isolated identity/icon, Daily local checkbox update, Note italic spacing, checklist child-state linkage, category/tag data, and Android native source files other than version metadata.

## Validation
- 29/29 delivery invariant checks passed.
- Inline JavaScript syntax passed Node.js `--check`.
- Android compilation could not be executed because the sandbox cannot reach the Gradle distribution host; see `SELF_TEST_V1.40.3.txt`.
