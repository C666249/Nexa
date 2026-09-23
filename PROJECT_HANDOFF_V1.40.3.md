# PROJECT HANDOFF — To-Do V1.40.3 Stable

## Baseline
- Continues from the reviewed V1.40.2 Stable package, which itself was rebuilt from the user-supplied V1.30.19 baseline.
- Application identity is preserved: `com.todolist.app`.

## V1.40.3 change
1. Checklist collapse no longer animates a CSS grid track (`1fr -> 0fr`).
2. The shell animates from its exact rendered pixel height to `0px`; expansion uses the measured `scrollHeight` and settles back to `height:auto`.
3. Collapse uses a shorter 220 ms non-overshooting easing to reduce Android WebView repaint churn.
4. The shell no longer animates `translateY`, avoiding a transient compositor layer during vertical list reflow.
5. Rapid expand/collapse reversals are guarded by an animation sequence token so stale RAF/transition callbacks cannot modify the new state.
6. Tapping the checklist toggle/content temporarily suppresses the parent card `:active` background change, removing the remaining whole-card flash.
7. Existing V1.40.2 Daily rail fix and Note italic spacing are retained unchanged.

## Delivery rules
- Open the ZIP root containing `settings.gradle.kts` directly in Android Studio.
- `ui/todo.html` and `android/app/src/main/assets/todo.html` must remain byte-identical.
- Build output naming: `To-Do-Stable-1.40.3-<buildType>.apk`.
