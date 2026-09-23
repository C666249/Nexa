# Architecture and migration audit

RC2 update: explicit ZIP backup/import and a generated old-ID bridge now exist.
See docs/migration.md and docs/release-checklist.md; the proposal below is historical,
not a claim of automatic migration or a new phase confirmation requirement.

## Existing architecture

Android Kotlin + AppCompat shell; embedded ui/todo.html, mirrored in Android assets.
AGP 8.7.3, Kotlin 2.1.0, Gradle wrapper 8.11.1, SDK 35, minSdk 26, JVM target 17.
No new framework or business rewrite. UI changes should be separated into scoped
components/styles with regression coverage around existing state transitions.

## Storage boundaries

- WebView localStorage: todo_glass_data, todo_glass_recycle, todo_glass_history,
  todo_glass_notes legacy backup, todo_glass_note_topics_v2, todo_glass_note_docs_v2,
  schema metadata, todo_glass_daily_tasks_v1, onboarding and AI settings/history.
- Native SharedPreferences: reminder schedules/snapshots/mutations, Daily task state,
  snooze, diagnostics, banner time and external-import queues/settings.
- Internal files: note_images and note_files. Web references use note.local image URLs;
  file-opening grants use the current package FileProvider authority.
- Search derived state should rebuild from restored records; preserve stored history.

## Mandatory migration decision (not implemented)

Changing applicationId gives Nexa a separate UID and private directory. Same signing
key alone does not grant sandbox access. Manifest contains no old data migration
provider. Existing ImportReceiverActivity imports shared attachments, not full backups.
allowBackup does not make an old package backup accessible to a differently named app.

Recommended route to assess: install a same-ID, same-signature To-Do bridge update
(higher versionCode, old data preserved), then let Nexa copy a consistent snapshot
through a signature-protected, caller-verified endpoint. This requires an additional
old-app update; cannot honestly be described as zero-step migration from untouched 1.40.6.
If old installed signer is unavailable, bridge update cannot cover-install: never tell
the user to uninstall. An old-app export/import flow would also require an updated old app.

Before implementing any bridge: confirm route; verify installed signing certificate;
test complete attachment manifest/hash/size validation, atomic import and rollback,
storage quota, disk full, interrupted copy, retries/idempotency, populated Nexa conflicts,
invalid paths/symlinks, unauthorized callers and reminder rescheduling without duplicates.
Do not copy raw live WebView database files or import old PendingIntent objects.
Never overwrite populated Nexa storage automatically or mark migration complete early.

Alternative requiring a product decision: keep com.todolist.app while rebranding to
Nexa for normal same-package updates. That conflicts with the requested com.nexa.app.

Official references:
- https://developer.android.com/build/configure-app-module
- https://developer.android.com/guide/components/fundamentals

## Local build

Root settings.gradle.kts maps :app to android/app.
JAVA_HOME=C:/Program Files/Eclipse Adoptium/jdk-21.0.11.10-hotspot
GRADLE_USER_HOME=D:/gradle-home ; SDK=D:/Android/SDK (local.properties, not portable).
Run ./gradlew.bat :app:assembleDebug --offline --no-daemon from project root.
Debug signing is only for local evaluation; commercial release needs a retained release
signing key. No key is generated or embedded by this phase.
