# Nexa 1.0.5 delivery / regression handoff

## User-reported regressions
The real-device video `48869238e09503e7ce7fbaf7e6bdaaab.mp4` showed two regressions introduced by the 1.0.4 motion-system round:

1. Bottom-tab changes visibly flashed / washed the page before the destination settled.
2. Todo long-list cards did not form the intended 2–4 layer stack. Sticky task cards instead intruded into the sticky header/filter region.

## Root causes
- Route motion had two competing page-entry systems. Shared Axis keyframes faded page opacity from a very low value while legacy page-entry animations also restarted opacity/transform on each switch. In Android WebView this rendered as a white flash.
- Todo stack cards used a fixed `top:12px`, while the Todo sticky header also occupied the top of the viewport. The task-card z-index was raised above the header, so cards could cover/invade the header instead of stacking beneath it.

## 1.0.5 fixes
- Route Shared Axis is now transform-only for high-level tab switching: no whole-page opacity fade.
- Removed duplicated per-page entry animations; `.nexa-route-animate` is the sole owner of route motion.
- Route motion timeout shortened to 300 ms and remains interruptible.
- Todo stack anchor is calculated from the real `.sticky-header` height and exported through `--nexa-list-stack-top`.
- Task stack z-order remains below the sticky header; date/completed separators stay above the stack but below the header.
- Stack depth is continuous (`depth + incoming progress`) rather than a hard threshold, producing a gradual 2–4 layer retreat/release effect.
- Stack respects task date/completion groups and releases naturally when scrolling back.
- Stack is suspended during route animation, checklist expansion/animation, swipe actions, reorder, delete/depart animation, editing, and list reflow to avoid transform conflicts.
- Both window scrolling and list-container scrolling are observed for compatibility with current and future layouts.

## Regression coverage
Added `tests/nexa-regression-v1.0.5.test.cjs` for:
- no whole-page route opacity fade / no duplicated page-entry animation;
- dynamic Todo stack anchor and z-order;
- 2–4 layer continuous stack depth and grouping;
- dual scroll source registration and cleanup.

Full Node suite: **64 / 64 passed**.

Static validation:
- all UI JS files pass `node --check`;
- inline script in `ui/todo.html` passes syntax check;
- Android resource/manifest XML parses;
- all 14 UI WebView source files are byte-for-byte mirrored into Android assets;
- Stable identity/version/output naming validated.

## Android build attempt
`:app:assembleDebug` was actually invoked. Gradle Wrapper attempted to obtain Gradle 8.11.1 but the sandbox cannot resolve `services.gradle.org`, ending in `java.net.UnknownHostException`. Therefore no APK build success is claimed. See `dev-logs/nexa-1.0.5-gradle-attempt.log`.

## Visual automation note
A local Chromium/Playwright smoke attempt is blocked by the sandbox browser administrator policy. The reported visual symptoms were instead grounded against the user's real-device video and covered with source-level regression tests.

## Version
- Stable: `com.nexa.app`, `Nexa`, versionName `1.0.5`, versionCode `10`
- Beta: `com.nexa.app.beta`, `Nexa β`, versionName `1.0.5-beta.1`, versionCode `10`
