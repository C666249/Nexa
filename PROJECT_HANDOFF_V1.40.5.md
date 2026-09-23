# PROJECT HANDOFF — To-Do V1.40.5 Stable

## Purpose
V1.40.5 is intentionally a shell/version bump of V1.40.3. The V1.40.4 Daily Progress gradient experiment is fully discarded.

## Runtime baseline
- Runtime/UI source is byte-for-byte the V1.40.3 Stable runtime source.
- No behavior, UI, storage schema, Daily Progress color logic, checklist animation, Note editor logic, or data key was changed from V1.40.3.

## Version shell only
- applicationId: `com.todolist.app`
- versionName: `1.40.5`
- versionCode: `1405`
- APK output: `To-Do-Stable-1.40.5-<buildType>.apk`
- No custom signingConfig is added; upgrade installation still requires the same signing certificate as the installed app.
