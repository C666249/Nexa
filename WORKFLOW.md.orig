# WORKFLOW — Nexa Android Commercial Delivery

1. 只从用户本轮最新完整 Nexa Source ZIP（或当前聊天中刚交付的最新 Nexa 完整源码）继续，先读 `PROJECT_STATE.md`、`DELIVERY_RULE.txt`、`README-NEXA.md` 与最新 `dev-logs/nexa-*`。
2. 开工前确认 Stable/Beta 身份、版本、数据兼容、WebView 主源码与 Android assets 镜像，并检查本轮需求是否会碰到历史交互/持久化约束。
3. 一轮内尽可能完成：设计 → 实现 → 第一轮代码/状态审查 → 修复 → 第二轮交互/边界审查 → 回归。目标是接近商业交付，不以“功能刚能跑”为终点。
4. 交互类改动重点验证真实事件链：系统返回键、pointer-events/遮罩、重复监听器、动画最终几何和回调、状态切换、滚动/键盘、数据保存与恢复。支持 `prefers-reduced-motion`。
5. UI 变更后同步 `ui/` 到 `android/app/src/main/assets/`；交付前对关键资产做字节一致性检查，并执行 Node 测试、JS 语法检查、XML/身份/版本检查。环境允许时再执行 Gradle/Android 构建。
6. 最终同时输出两份完整独立源码：`Nexa-<Version>-Stable.zip` 与 `Nexa-<Version>-Beta.zip`。Stable 固定 `com.nexa.app`；Beta 固定 `com.nexa.app.beta` + `Nexa β` + β 图标，二者可共存且数据隔离。
7. APK 正式命名至少包含项目名、渠道、versionName 和 buildType，例如 `Nexa-Stable-1.0.7-debug.apk` / `Nexa-Beta-1.0.7-beta.1-debug.apk`。不得把默认 `app-debug.apk` 当作正式交付命名。
