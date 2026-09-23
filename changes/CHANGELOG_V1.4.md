# CHANGELOG V1.4

Base: 用户重新上传项目 + 从其自身 Gradle build intermediate 恢复的 7 月 22 日 Note-mode HTML

Target: V1.4 Full

## Changes

- 恢复并锁定 Note 模式。
- 接通每日总结定时：精确闹钟权限检查、一次性精确排程、每日自重排、重启/时间/时区/更新恢复。
- 新增 TodoSnapshotStore，在闹钟实际触发时计算当天进度。
- 新增单条待办提醒存储、Alarm 调度、Receiver、常驻悬浮 Banner。
- 新增 Native ↔ WebView 状态同步与进入 APP 定位待办。
- 待办卡片改为实心；左滑动作区改为两个独立按钮：绿色提醒、红色删除。
- 单条提醒新增年月日时分选择器。
- 修复每日提醒分钟为 `00` 时被错误回退成 `06` 的解析问题。
- 将 Gradle 工程根移动到最外层，并把 `:app` 映射到 `android/app`。
- 新增根目录 `build-apk.bat`。
