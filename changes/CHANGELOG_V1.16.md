# To-Do V1.16

Base: V1.15 Full  
Target: V1.16 Full

## Changes

- Replaced the Android launcher icon with the user-selected mint/cream calendar + recurring-check design.
- Generated the standard Android density launcher assets (48/72/96/144/192 px) from the selected 1254×1254 PNG while retaining alpha transparency.
- Preserved the selected original icon at `assets/icons/ic_launcher_v1.16_source.png` for future regeneration.
- Smoothed the native snooze confirmation Toast (`5 分钟后再提醒` / `10 分钟后再提醒`) exit:
  - exit is now opacity-only rather than opacity + translation;
  - animation runs on a temporary hardware layer;
  - after fade reaches alpha 0 the view is made invisible for one rendered frame;
  - only then is the WindowManager overlay detached with `removeViewImmediate`.
  This avoids the final-frame flash seen on some OEM compositors.
- Version bumped to `versionCode 27`, `versionName 1.16`.

## Intentionally unchanged

- To-Do / Note / Daily data models and localStorage keys.
- Reminder scheduling and SnoozeStore timing semantics.
- Banner right-swipe +5/+10 thresholds and haptics.
- V1.14 Feature Coach and V1.13 main onboarding content.
- applicationId / namespace (`com.todolist.app`).
