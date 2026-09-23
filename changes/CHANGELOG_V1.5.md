# CHANGELOG V1.5

Base: V1.4 Full
Target: V1.5 Full

## 本轮变更
- Android 安装身份 `applicationId`：`com.todolist.app` → `com.listnote.app`。
- Launcher / 系统显示名：`To-Do` → `List-Note`。
- Android Studio 根工程名：`ToDo` → `List-Note`。
- 内部 action 前缀：`com.todolist.app.action.*` → `com.listnote.app.action.*`，避免测试版和稳定版广播串扰。
- 版本号：1.4 / 14 → 1.5 / 15。
- APK 输出名改为 `List-Note-v1.5.apk`，根目录 `build-apk.bat` 输出到 `dist/List-Note-v1.5.apk`。

## 有意保持不变
- `namespace = com.todolist.app` 与 Kotlin package 目录不迁移，避免触碰提醒、Note、To-Do 核心代码。
- 除与应用身份隔离直接相关的 4 个文件中的 action 字符串外，V1.4 的每日提醒、条目提醒、悬浮 Banner、Note 模式、To-Do 模式逻辑保持不变。
