# Nexa 1.0.7 implementation log

Date: 2026-09-07

## User request
Replace the temporary bilateral card controls with one left-swipe distance ladder modeled after the native reminder Banner: first detent performs the card-specific secondary action, deep pull deletes. Preserve the existing left-fly delete motion, reverse it on Undo, restore Note right-swipe Drawer navigation, and add a bottom-up inertial presentation to Reminder/Edit/Move dialogs.

## Implementation
- Added shared `nexaSwipeThresholds()` / `nexaSwipeResolve()` ladder with 18% secondary and 40% deep-delete ratios plus minimum safety distances.
- Todo=Reminder/Delete, Daily=Edit/Delete, Note=Move/Delete.
- Right drags are never intercepted by content-card actions; closed Note cards now yield right drag to the Drawer again.
- Haptic detent changes and action icon/label morphing use the same physical grammar as the native +5/+10 min reminder Banner.
- Existing `curveAway()` accepts the real swipe release X. Undo uses `curveReturn()` with the captured trace, then settles from the release offset to zero.
- Added `NexaMotion.presentSheet()` with below-viewport entry, mild overshoot and 480ms decelerating settle. Wired to Reminder Picker, Daily Editor and Note Move sheet.
- Daily editor waits for sheet presentation before focusing its text field.
- Reminder and Note Move sheets now participate in the shared velocity-aware spring-sheet drag/dismiss layer.
- Updated onboarding gesture demo and stale historical swipe tests.
- Added `tests/nexa-regression-v1.0.7.test.cjs`.

## Working-tree validation
- Node regression: 71/71 passed after WebView mirror sync.
- JS syntax: `ui/nexa-motion.js` and every inline script in `ui/todo.html` passed `node --check`.
- Final Stable/Beta staging validation is performed again after channel split.

## Final delivery validation
- Final channel staging tree: 71/71 Node regression tests passed.
- UI JavaScript and the inline todo.html script pass syntax checks.
- Android resource XML and AndroidManifest parse successfully.
- All 14 files in ui/ are byte-for-byte mirrored into Android WebView assets.
- Gradle Wrapper build was attempted; the environment cannot resolve services.gradle.org, so Gradle 8.11.1 cannot be downloaded here. This is recorded rather than represented as a successful APK build.
