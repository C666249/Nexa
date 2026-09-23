# 2026-09-05 — Phase1 engineering identity

## Completed

- Copied source to D:/Claude/projects/nexa; excluded build/cache/IDE/APK/ZIP artifacts.
  Kept historical sources/docs/tests; original To-Do unchanged, no commit.
- applicationId and namespace com.nexa.app; Kotlin source moved to com/nexa/app.
- Renamed native imports and internal intent-action prefixes consistently, including
  legacy com.listnote.app prefixes. Persisted preference/key names unchanged.
- Nexa native labels/notifications; Theme.Nexa paper startup/navigation colors.
- Adaptive N vector icon: dark brown field with cream pillars and muted ribbon.
- Root settings.gradle.kts maps :app to android/app; version 1.0.0 / code 1.
  Separate package means this is NOT an update of To-Do regardless of versionCode.
- Documentation skeleton, migration audit and test-first identity checks.

## Verification evidence

- New identity checks: failed before changes, 3/3 passed after changes.
- node --test tests/*.test.js tests/nexa-identity.test.cjs: 19 passed / 2 failed.
  checklist-v1.30.7.test.js expects historical spring easing; note-global-search.test.js
  lacks noteSearchMode in its isolated VM. Both fail identically in untouched source.
  Do not erase failures or modify business logic to satisfy obsolete assertions.
- note-title-touch.test.js path updated for package move; title interaction test passes.
- Exact source comparison: UI differs only in document title and meta theme-color;
  all 23 Kotlin files differ only by native package/action/brand text replacements.
- Root Gradle 8.11.1 :app:assembleDebug --offline --no-daemon: BUILD SUCCESSFUL in 43s.
  Initial sandbox native-platform.dll failure resolved using approved build environment.
  Existing deprecated Android API warnings remain; no compilation errors.
- aapt confirms com.nexa.app / code 1 / name 1.0.0 / label Nexa /
  launchable com.nexa.app.MainActivity.
- APK SHA256: FDF1AA85ADB60D28595743AD1F2B69827554C9D2268F231B762E905B37B22D18.

## Not verified / not delivered

No physical-device install or full UI/IME/reminder runtime testing in this phase.
Dashboard/navigation/pages/Space/italic spacing not implemented yet.
No migration implementation or real-user data copy. No final Stable ZIP generated.
Preliminary APK must not be represented as final Nexa; do not uninstall old To-Do.

## Required decision / next work

Confirm next phase and migration route. Recommended: separate com.nexa.app plus
same-signed old To-Do bridge update; install that update once. Verify installed signer
before promising cover-install. Original data never deleted. Without an old-app change,
Android sandbox prevents invisible access to its private data.
After confirmation: baseline test maintenance, navigation/state tests, implementation,
then Dashboard and subsequent phases. Follow workspace per-phase review gates.
