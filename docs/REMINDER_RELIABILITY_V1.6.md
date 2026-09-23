# List-Note V1.6 — Reminder Reliability Notes

## Why V1.5 could be completely silent

V1.5 had a single-point-of-failure chain:

`AlarmManager -> BroadcastReceiver -> startForegroundService -> overlay`

If the foreground service start or overlay attachment was rejected/delayed by Android or an OEM background policy, the receiver only logged/caught the exception. There was no user-visible event before that failure, so the result could be "nothing happened" even though the alarm receiver itself had run.

## V1.6 chain

V1.6 changes this to:

`AlarmManager -> BroadcastReceiver -> HIGH notification (first) -> foreground service -> overlay`

The notification is therefore a safety net, not the primary UI. If the overlay attaches successfully, the safety notification is removed and the original floating Banner remains the main UI.

For a todo reminder, if the overlay path is blocked, the ongoing notification keeps the reminder actionable with:

- 切换状态
- 关闭提醒
- 点击正文进入对应待办

## Exact alarm permission strategy

- Android 13+ (`API 33+`): `USE_EXACT_ALARM`
- Android 12 / 12L (`API 31-32`): `SCHEDULE_EXACT_ALARM`
- Older Android: exact-alarm special access is not required.

This app uses exact alarms only for explicit user-facing reminder times.

## 10-second test

Open the daily reminder picker from the top-right clock and tap `10 秒测试提醒`.

Expected chain:

1. Toast says the test was scheduled.
2. Around 10 seconds later, a system heads-up reminder is posted.
3. If overlay/background execution is allowed, the floating daily Banner replaces the safety notification.

If step 2 works but step 3 does not, AlarmManager/Receiver is healthy and the remaining issue is specifically the foreground-service/overlay leg.

If neither step 2 nor step 3 appears, check the device's app-launch/background policy in addition to ordinary Android permissions.

## HONOR / MagicOS note

HONOR devices can manage background launch separately from the ordinary permission list. For reminder reliability, check the system's app-launch/background management for List-Note and allow it to run in the background; also ensure battery optimization is disabled for the app when required by the device.
