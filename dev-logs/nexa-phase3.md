# Phase3 — Dashboard (2026-09-05)

## Scope completed

- Today aggregate counts the union of locally-created-today / reminder-today Todo records,
  plus Daily records applicable today. A checklist is one parent, not multiple inflated tasks.
  Caption explicitly states this scope. It is not a count of timestamped completion events:
  the legacy schema does not store a complete completion-time ledger.
- Today's schedule combines actual task reminderAt and Daily hour/minute, sorted by time.
  Completed, time-passed and upcoming states are derived without modifying reminders.
- Today's task ratio, total notes and schedule count have working destinations.
- Recent tasks and notes include time metadata; Note sorting uses updatedAt with createdAt fallback.
- Home quick-note enters editing directly and preserves the existing save/formatting path.
- Persistence hooks coalesce read-only home refreshes into one frame. Unchanged sections keep
  DOM identities. Visibility/minute refresh handles local date rollover without data writes.
- Original storage keys/schemas and original To-Do directory remain unchanged.

## Verification

- Test first: four dashboard tests failed before implementation, then passed.
- node --test tests/*.test.js tests/*.test.cjs: 28 passed / 0 failed.
- tools/nexa-visual-test.cjs: Dashboard live update, unaffected-section DOM preservation,
  schedule-to-Daily, task destination, direct new Note and saving all passed.
- Previous browser suite also passed: five routes, 320/360/390/430 widths, Note saved across
  restart, scoped search Back, root Back, Daily CRUD, checklist child-node identity,
  Todo creation/restart and clean install. No browser page errors.
- Screenshots: dev-logs/phase3-screenshots. Synthetic fixtures are isolated browser data,
  not APK defaults or the user's data. A full-page screenshot captures a viewport-fixed
  nav in the middle; this is not a scrolling-layout defect. Use viewport screenshots for review.
- Final Android build: :app:assembleDebug --offline --no-daemon, BUILD SUCCESSFUL in 10s.
- Previous rebuild was denied because the approval service reported exhausted usage.
  After the user's continuation, read-only usage query reported availability; the same
  build was approved through the normal escalation path. No bypass or alternate signer used.
- Packaged assets todo.html / nexa.css / nexa-core.js / nexa-shell.js all exactly match ui/.
- aapt: com.nexa.app, versionCode 3, versionName 1.0.0, label Nexa.
- Delivered: dist/Nexa-1.0.0-Phase3-debug.apk.
- SHA256: 22016D9545FAAC984433F51165BB2F04EE95E3B569A2EE9B8BAB696E5F39A3BE.

## Remaining work / next phase

Phase4 Todo-specific refinements, Phase5 Note toolbar/reading details, Phase6 Daily,
Phase7 unified Space hierarchy, Phase8 review/migration/device verification remain.
No physical Android device / real IME / actual reminder-delivery validation claimed.
No cross-package migration implemented; migration-route decision remains open.
No final Stable ZIP generated. Preliminary versionCode 3 can update the same-signed Nexa code 2.
