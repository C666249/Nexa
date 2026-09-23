# Nexa 1.0.18 — Note 图片预览入口精简

Current Stable: `com.nexa.app` / `Nexa` / `1.0.18` / code `23`.
Current Beta: `com.nexa.app.beta` / `Nexa β` / `1.0.18-beta.1` / code `23`.

Note 内联图片左下角的“三个点”入口已移除。点击图片进入全屏预览后，继续保留右上角分享键作为唯一分享入口；旧笔记中由 1.0.16/1.0.17 写入的内联更多按钮会在打开时自动清理。图片删除、缩放/拖动、微信/QQ/系统分享与返回键层级保持不变。

# Nexa 1.0.17 — Android compile fix

Current Stable: `com.nexa.app` / `Nexa` / `1.0.17` / code `22`.
Current Beta: `com.nexa.app.beta` / `Nexa β` / `1.0.17-beta.1` / code `22`.

This hotfix removes the Kotlin compile error reported in 1.0.16: `openNoteFileWithExternalApp()` referenced a nonexistent `getNoteFileUri(file)`. It now reuses the already-defined `getShareableFileUri(file)` FileProvider helper used by Note image/file sharing. A regression check prevents the stale symbol from returning. No storage schema or user-data migration changes are introduced.

# Nexa 1.0.15 — Favorites in-place editing + position-preserving Back

Current Stable: `com.nexa.app` / `Nexa` / `1.0.15` / code `20`.
Current Beta: `com.nexa.app.beta` / `Nexa β` / `1.0.15-beta.1` / code `20`.

This release keeps Favorites as a real workspace instead of a jump list. Favorite Todo items open an in-library action drawer for title, state/checklist, reminder, labels, favorite state and deletion; Favorite Note items open the existing full editor as an overlay without changing the Space route. Closing with the UI Back control or Android system Back returns to Favorites and restores the previous scroll position. 1.0.14 Daily drawer and favorite-gesture behavior remains intact.

Open the root `settings.gradle.kts` in Android Studio (JDK 17+, SDK 35, Gradle 8.11.1). See `PROJECT_STATE.md`, `WORKFLOW.md`, `DELIVERY_RULE.txt`, and `dev-logs/nexa-1.0.15.md`.

# Nexa 1.0.13 motion tuning

Current release: 1.0.13 (versionCode 18). Todo search-history curtain now uses a slower four-step 120 ms cascade and reverse bottom-to-top collapse.

# Nexa 1.0.12

Current Stable: `com.nexa.app` / `Nexa` / `1.0.12` / code `17`.
Current Beta: `com.nexa.app.beta` / `Nexa β` / `1.0.12-beta.1` / code `17`.

Open the root `settings.gradle.kts` in Android Studio (JDK 17+, SDK 35, Gradle 8.11.1). Build with the bundled Gradle Wrapper. Same-channel installs preserve the Stable upgrade chain; Stable and Beta coexist with isolated app data.

This release fixes Todo search-history layering and interaction: history is absent during normal browsing, opens from the search field as a staggered curtain on focus, and retracts in reverse after Enter or selecting a saved query so filtered results are never permanently covered. The exit keeps the painted rows alive until the reverse curtain finishes, route changes force-close any stale curtain, and Chinese IME composition Enter is ignored until text composition has actually completed. Existing 1.0.11 reminder deep links and global-search highlighting are preserved. No storage format changes.

Details: `PROJECT_STATE.md` and `dev-logs/nexa-1.0.12.md`.

## Historical 1.0.7 baseline

Current production source channel: `com.nexa.app`, app name `Nexa`, version `1.0.7` / versionCode `12`.
Beta delivery channel: `com.nexa.app.beta`, app name `Nexa β`, version `1.0.7-beta.1` / versionCode `12`.

## This round
- Replaces fixed/bilateral Todo, Daily and Note swipe actions with a single Banner-style left-swipe distance ladder.
- Todo: Reminder → deep Delete; Daily: Edit → deep Delete; Note: Move → deep Delete.
- Note right-swipe is free again for the knowledge-tree Drawer, including swipes started on Note cards.
- Delete begins from the real finger-release position and Undo replays the same curved trajectory backwards.
- Reminder/Edit/Move sheets slide up from below, decelerate near the target, overshoot slightly, then settle with inertia.
- Daily editor delays IME focus until the sheet has settled.
- Retains 1.0.6 Todo long-list stability and dashboard percentage hierarchy fixes.

Open the extracted folder containing `settings.gradle.kts` directly in Android Studio. Stable APK output naming is `Nexa-Stable-1.0.7-<buildType>.apk`; Beta is `Nexa-Beta-1.0.7-beta.1-<buildType>.apk`.


## Nexa 1.0.16 — Note 图片可再次分享
- 相册插入 Note 后，缩略图提供“更多”操作，预览页提供分享入口。
- 支持微信、QQ、Android 系统分享面板，可转发至其他已安装应用/位置。
- 旧笔记中的已有图片打开时自动补齐操作入口；系统返回键先关闭图片操作层，再关闭图片预览。
- FileProvider 新增 `note_images/` 安全只读分享路径；文件附件“更多应用”同步改为真正的系统分享。
