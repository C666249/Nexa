# List-Note V1.7 — Reminder Runtime Redesign

Base: V1.6 Full  
Target: V1.7 Full

## Device symptom that drove this redesign

Observed on the user's HONOR Magic 6 Pro:

- Tapping the 10-second test produced no desktop result for a long time.
- Reopening List-Note caused the reminder to appear immediately.
- Per-item reminders did not appear at all.

This indicates that the overlay UI can render, but the closed/background app path is not reliably waking and hosting the overlay.

## Reference project finding

The supplied `FlowLedger-Final-v1.8.1-CompileFix` project renders its `OverlayBanner` directly from an already-live `NotificationListenerService` or `AccessibilityService` (and from MainActivity during manual flows). Its process/service host therefore already exists when `WindowManager.addView()` is called.

List-Note does not legitimately need Notification Listener or Accessibility privileges, so V1.7 copies the *lifecycle property*, not those permissions: a dedicated reminder foreground service is armed while the user is still inside List-Note.

## V1.7 runtime chain

```text
User sets reminder while app is foreground
        ↓
Persist reminder + start low/silent Reminder Keeper FGS
        ↓
Schedule AlarmManager.setAlarmClock() (exact access available)
        +
Arm in-process Handler fallback in already-running FGS
        ↓
At trigger time:
  A. Alarm receiver wakes CPU briefly, posts safety notification, dispatches to FGS
  B. If Alarm delivery is delayed but process remains alive, Handler fallback also dispatches
        ↓
Foreground service attaches TYPE_APPLICATION_OVERLAY Banner
        ↓
Overlay success cancels safety notification
```

Per-item reminder creation additionally uses an explicit JS -> Native `scheduleTodoReminder()` bridge. Snapshot sync remains as recovery/reconciliation rather than being the only scheduling mechanism.

## Window attachment hardening

The overlay manager now adopts the useful mechanics from FlowLedger:

- application-context WindowManager
- TYPE_APPLICATION_OVERLAY
- FLAG_NOT_FOCUSABLE
- FLAG_NOT_TOUCH_MODAL
- FLAG_LAYOUT_IN_SCREEN
- explicit status-bar/display-cutout safe-top inset

The existing List-Note BannerView and TodoReminderBannerView visuals/interactions remain the UI layer.

## Persistence

- Reminder service: `START_STICKY`
- Manifest: `android:stopWithTask="false"`
- Service remains alive while daily reminder settings, reminder records, a test fallback, or overlay views exist.
- BOOT_COMPLETED / TIME_SET / TIMEZONE_CHANGED / MY_PACKAGE_REPLACED reschedule durable alarms and attempt to restore the keeper.
- Fired per-item reminders remain in ReminderStore until the user explicitly presses ✕, allowing restoration after service/process restart.

## Diagnostics

`ReminderDiagnostics` stores a 30-event ring buffer without todo text. Events include schedule, receiver arrival, keeper creation/commands, overlay attach/failure, and service-start failure. This is intended for future troubleshooting without changing user data.
