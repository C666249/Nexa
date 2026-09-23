# To-Do V1.10.1 CompileFix

Base: **To-Do V1.10 Full**  
Target: **To-Do V1.10.1 Full**

## Fixed

- Fixed the Android Studio Kotlin compile failure in `DailyTaskBannerView.kt:76`:
  - V1.10 used `text = "✕"` inside `TextView.apply {}` while the class constructor already has an immutable parameter named `text`.
  - Kotlin therefore resolved the assignment to that constructor parameter and reported **`'val' cannot be reassigned`**.
  - V1.10.1 explicitly targets the `TextView` receiver with `this.text = "✕"`.
- No Daily behavior/UI logic was redesigned; this is a one-line compile correction only.
- Bumped Android version to `versionCode = 21`, `versionName = "1.10.1"` so this compile-fix APK can update any V1.10 test installation.
- Updated `build-apk.bat` output name to `dist\To-Do-v1.10.1.apk`.

## Compatibility

- `applicationId` remains `com.todolist.app`.
- Existing To-Do / Note / Daily storage keys are unchanged.
- Existing reminder scheduling and overlay logic is unchanged.
