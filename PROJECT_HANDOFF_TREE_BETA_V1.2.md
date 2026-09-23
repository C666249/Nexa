# To-Do Tree Beta V1.2 Handoff

## Baseline
Tree Beta V1.1.3 only. No rebase to older Stable/Beta versions.

## New runtime scope
1. Topic physical Swipe Action Rail in Knowledge Tree and Topic Workspace: Rename + safe Delete.
2. Safe Topic delete removes only the Topic node; direct child Topics/Notes are promoted to the deleted Topic parent. No recursive content destruction in the quick rail.
3. `未分类` is a UI-only virtual system folder (`topicId == null`): collapsible in Tree/Drawer and openable as a workspace, but never added to `noteTopics`.
4. Right-swipe Drawer bug fixed through directional ownership: closed card right-swipe -> Drawer; left-swipe -> entity rail; open rail right-drag -> close rail; vertical -> scroll.

## Locked
- Note Editor / MagicOS IME / Read-Edit lifecycle
- Note swipe 124px / 48px / 200ms geometry and Move/Delete routes
- Compact Note cards / opaque swipe foreground
- Schema V2 storage keys and migration
- Attachments / annotations / image/PDF preview / HTTP links / B-S-H / Timestamp
- ToDo / Daily / Reminder / Banner / Snooze Native core

## Beta identity
- applicationId: com.todolist.app.beta
- versionCode: 1200
- versionName: 1.2.0-beta1
- APK: To-Do-Tree-Beta-V1.2.apk
