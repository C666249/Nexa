# CLAUDE.md — Nexa 接力入口

先读：`WORKFLOW.md` → `DELIVERY_RULE.txt` → `PROJECT_STATE.md` → `README-NEXA.md` → 最新 `dev-logs/nexa-*`。

项目根目录含 `settings.gradle.kts`，直接由 Android Studio 打开。WebView 主源码位于 `ui/`；Android 打包镜像位于 `android/app/src/main/assets/`，交付前必须保持一致。

固定渠道：Stable `com.nexa.app`；Beta `com.nexa.app.beta` + `Nexa β` + β 图标。二者数据隔离且可共存。不得通过改 Stable applicationId 绕过升级/签名问题。

Android Studio / Gradle 是正式 Android 构建路径；静态测试不能冒充 APK 编译。每轮按单轮多阶段工作流尽量完成实现、审查、回归和双 ZIP 打包。
