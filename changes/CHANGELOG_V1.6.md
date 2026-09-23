# CHANGELOG V1.6

Base: V1.5 Full
Target: V1.6 Full

## Bug addressed

Both the daily reminder and per-item reminder could reach the trigger time with no visible result, even when the user had granted the visible permissions.

## Reminder reliability changes

- Replaced the Android 13+ exact-alarm permission strategy with `USE_EXACT_ALARM`; Android 12/12L keeps `SCHEDULE_EXACT_ALARM` using `maxSdkVersion=32`.
- Added `ReminderNotifier.kt` as an alarm-arrival safety net.
- Alarm receivers now post a HIGH-priority notification before attempting to start the overlay foreground service.
- If overlay attachment succeeds, the safety notification is removed; if the overlay/service leg is blocked, the notification remains visible instead of failing silently.
- Added `ReminderActionReceiver.kt` so notification actions do not need to start another foreground service.
- Per-item fallback notifications support status cycling and explicit dismissal while keeping ReminderStore/WebView synchronization intact.
- Added try/fallback handling around overlay attachment in `FloatWindowService`.
- Added a `10 秒测试提醒` button to the existing daily reminder picker.
- Test alarm delay changed from 60 seconds to 10 seconds.
- Version bumped to 1.6 / versionCode 16.

## Deliberately unchanged

- applicationId remains `com.listnote.app` so the test build stays isolated from the stable app.
- Note mode data model, UI, editor and event handlers are unchanged.
- Existing To-Do data model / localStorage keys are unchanged.
- Existing reminder record format (`ReminderStore`) and todo native snapshot format are unchanged.
- Existing floating daily Banner and floating todo Banner visual implementations are unchanged.
- Existing left-swipe UI remains two independent buttons: green reminder + red delete.
