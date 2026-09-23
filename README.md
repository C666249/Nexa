# Nexa 1.0.18 — Note 图片预览入口精简

## 开源配置与许可

项目原创代码采用 [MIT License](LICENSE)。第三方组件及其原有版权声明仍适用各自许可，例如 `docs/marked-LICENSE.md`。

公开源码已清空内置 Agnes API 密钥，包括主程序、迁移副本及测试页面。AI 功能需要自行配置有效凭据：可使用应用现有的 DeepSeek 密钥设置；使用 Agnes 时需自行配置本地源码中的 `AI_PROVIDERS.agnes.apiKey`。请勿将个人凭据或签名密钥提交到仓库。

使用 Android Studio 打开仓库根目录，按 Gradle Wrapper 和构建配置同步并构建。本次发布仅验证源码导入和凭据清理，未重新验证 Android 构建。

## 版本说明

Current Stable: `com.nexa.app` / `Nexa` / `1.0.18` / code `23`.
Current Beta: `com.nexa.app.beta` / `Nexa β` / `1.0.18-beta.1` / code `23`.

Note 内联图片左下角的“三个点”入口已移除。点击图片进入全屏预览后，继续保留右上角分享键作为唯一分享入口；旧笔记中由 1.0.16/1.0.17 写入的内联更多按钮会在打开时自动清理。图片删除、缩放/拖动、微信/QQ/系统分享与返回键层级保持不变。

# Nexa 1.0.17 — Android compile fix

Current Stable: `com.nexa.app` / `Nexa` / `1.0.17` / code `22`.
Current Beta: `com.nexa.app.beta` / `Nexa β` / `1.0.17-beta.1` / code `22`.

This hotfix removes the Kotlin compile error reported in 1.0.16: `openNoteFileWithExternalApp()` referenced a nonexistent `getNoteFileUri(file)`. It now reuses the already-defined `getShareableFileUri(file)` FileProvider helper used by Note image/file sharing. A regression check prevents the stale symbol from returning. No storage schema or user-data migration changes are introduced.

# Nexa 1.0.15

Complete Android Studio source delivery.

- Stable: `com.nexa.app` / `Nexa` / `1.0.15` (`versionCode 20`).
- Beta: `com.nexa.app.beta` / `Nexa β` / `1.0.15-beta.1` (`versionCode 20`).

## 1.0.15

- Favorites are now an in-place workspace: clicking a favorite no longer routes to Todo/Note.
- Favorite Todo opens a local action drawer with editing/status/checklist/reminder/labels/delete controls.
- Favorite Note reuses the full Note editor as an overlay while the Space/Favorites route remains active.
- Android system Back closes nested controls first, then the current favorite, and restores the original Favorites scroll position.

## 1.0.14

Daily history and day-detail surfaces are stable bottom drawers with integrated handles and hierarchical dismissal. Todo now supports right-swipe Favorite, while its left-swipe Reminder/Delete ladder is preserved. Space has a standalone Favorites Library with search and All/Todo/Note filters; legacy Note favorites remain compatible.

# Nexa 1.0.13

Complete Android Studio source delivery.

- Stable: `com.nexa.app` / `Nexa` / `1.0.13` (`versionCode 18`).
- Beta: `com.nexa.app.beta` / `Nexa β` / `1.0.13-beta.1` (`versionCode 18`).

## 1.0.13

Todo recent-search curtain motion is deliberately slower and more layered. The four history rows now unfold one at a time with a 120 ms cadence, progressively deeper starting offsets, and a softer ~0.5 s parent curtain. Closing reverses bottom-to-top and waits for the full cascade before refreshing hidden history, making the interaction read as a stepped multi-level drawer rather than one fast popup. Search behavior and storage are unchanged.

## 1.0.12

Todo search history no longer sits on the page during ordinary browsing. Focusing the Todo search field opens recent queries directly under the input as a staggered curtain; pressing Enter or selecting a history item retracts it in reverse, releases input focus, and leaves the filtered Todo results unobstructed. Clearing the query while the field remains active intentionally reopens the curtain. Reduced-motion fallback is retained.

Nexa 1.0.11 reminder deep-target routing and global-search gradient highlighting remain intact. No storage schema changes.

Open the folder containing `settings.gradle.kts` directly in Android Studio. See `PROJECT_STATE.md`, `WORKFLOW.md`, `DELIVERY_RULE.txt`, and `dev-logs/nexa-1.0.12.md`.


## Nexa 1.0.16 — Note 图片可再次分享
- 相册插入 Note 后，缩略图提供“更多”操作，预览页提供分享入口。
- 支持微信、QQ、Android 系统分享面板，可转发至其他已安装应用/位置。
- 旧笔记中的已有图片打开时自动补齐操作入口；系统返回键先关闭图片操作层，再关闭图片预览。
- FileProvider 新增 `note_images/` 安全只读分享路径；文件附件“更多应用”同步改为真正的系统分享。
