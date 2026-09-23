# CHANGELOG — To-Do V1.17

Base: V1.16 Full  
Target: V1.17 Full

## User-visible changes

1. **Todo / Daily Banner four-way gestures**
   - Right swipe keeps the V1.15/V1.16 distance selector: ~18% = `+5 min`, ~38% = `+10 min`.
   - Left swipe reveals `关闭提醒` and, after the threshold + haptic tick, releasing performs the same action as the existing `×` button.
   - Up swipe reveals `✓ 完成`; after the threshold + haptic tick, the real checkbox/status is visually completed, then the banner exits with opacity-only fade from the finger-released position.
   - Down swipe reveals `打开应用`; releasing after the threshold performs the same open/focus behavior as tapping the banner body.
   - Short/ambiguous gestures spring back and do not change data.

2. **Completion synchronization**
   - Daily up-swipe uses the existing `DailyTaskStore.markCompletedToday(..., enqueue=true)` path, so today's completion is persisted and mirrored back into WebView Daily history.
   - Todo up-swipe first writes native status `completed`, enqueues/broadcasts the status mutation, then clears the reminder through the existing dismiss path. The WebView therefore receives both `completed` and `clearReminder` semantics.
   - Todo users who want `进行中` still use the existing checkbox once, then may close the banner by `×` or left swipe without forcing completion.

3. **Notification icon refresh**
   - Added Android-compliant monochrome `calendar + check` small notification icon (`ic_notification_todo`).
   - Reminder notifications and the persistent Reminder Keeper notification explicitly use the selected calendar/repeat-check artwork as the large notification icon.
   - Manifest launcher resource changed to a new `ic_launcher_v2` / `ic_launcher_v2_round` resource identity to reduce OEM icon-cache reuse after in-place upgrades.
   - The selected original 1254×1254 artwork is preserved at `assets/icons/ic_launcher_v1.17_source.png`.

4. **Daily drawer entry flicker optimization**
   - Daily drawer is rendered while invisible/off-screen first, forced through a layout frame, then revealed across two `requestAnimationFrame` ticks.
   - Drawer animation now uses `translate3d`, `will-change`, and `backface-visibility` to reduce the one-frame WebView/MagicOS flash when opening Daily.

5. **Feature Coach update**
   - Todo Reminder and Daily coach keys are bumped to V2 so users who already saw the old right-swipe-only coach can see the new four-direction gesture guide once.

## Data compatibility

- `applicationId` remains `com.todolist.app`.
- Existing `todo_glass_*` business storage keys are unchanged.
- No migration or wipe is introduced for To-Do, Note, Daily, history, recycle bin, or onboarding data.
- Direct in-place update with the same signing key keeps the existing app sandbox/data.

## Version

- versionCode: `28`
- versionName: `1.17`
