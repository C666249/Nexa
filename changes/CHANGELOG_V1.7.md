# CHANGELOG V1.7

Base: List-Note V1.6 Full  
Target: List-Note V1.7 Full

## 原因
V1.6 真机反馈为：10 秒测试在桌面没有任何悬浮反馈，重新进入 APP 后会立刻补弹；单条待办的定时提醒从未正常出现。用户明确授权对失败的提醒子系统进行完整重构，并要求参考 FlowLedger 中已经稳定工作的悬浮 Banner 实现。

## 本轮改动
1. 将提醒运行时改为低打扰、可持续存活的 `FloatWindowService` Reminder Keeper。只要存在每日提醒或单条提醒，服务会在 APP 仍处于前台时先被启动，避免到点后才从后台临时创建悬浮宿主。
2. AlarmManager 在具备精确闹钟能力时改用 `setAlarmClock()`；每日提醒继续采用“一次触发后排下一次”的方式，单条提醒独立排程。
3. 新增双时钟：AlarmManager 是跨进程/休眠持久时钟；Keeper 内 Handler 同时为当前进程内已排提醒建立第二条触发路径。两路汇入同一渲染方法并做去重。
4. Receiver 到点先记录诊断并产生高优先通知兜底，再把事件交给 Keeper 挂载 TYPE_APPLICATION_OVERLAY；悬浮成功后撤掉兜底通知。
5. 新增 WAKE_LOCK，在 Alarm Receiver 的短处理窗口内持有 PARTIAL_WAKE_LOCK。
6. 条目级提醒不再只依赖 WebView 全量 snapshot：用户确认/取消具体时间时，HTML 直接调用 `scheduleTodoReminder()` / `cancelTodoReminder()` Native Bridge，Native 立即 upsert/cancel 并刷新 Keeper。
7. `FloatWindowManager` 的窗口挂载方式对齐用户提供的 FlowLedger 稳定实现：applicationContext WindowManager、TYPE_APPLICATION_OVERLAY、FLAG_LAYOUT_IN_SCREEN、安全状态栏/挖孔 inset。
8. 新增 `ReminderDiagnostics`，以 SharedPreferences 保存最近 30 条提醒链路事件，不记录待办正文。
9. Boot / 时间变化 / 时区变化 / APP 更新后继续恢复 AlarmManager；存在有效提醒时同时尝试恢复 Keeper。
10. 版本更新到 versionCode 17 / versionName 1.7；`build-apk.bat` 输出名更新为 `List-Note-v1.7.apk`。

## 明确保留
- `applicationId = com.listnote.app`，仍与稳定版并存。
- Note 模式 CSS / HTML / 数据层 / 事件与文件夹逻辑保持 V1.6 字节级一致。
- 每日 Banner 视觉组件 `BannerView.kt` 保持不变。
- 条目常驻 Banner 视觉与复选框交互组件 `TodoReminderBannerView.kt` 保持不变。
- 左滑动作区仍是透明底，仅显示两个独立按钮：绿色提醒、红色删除，不改成整块涂色卡片。
- 本地存储 key、To-Do/Note 数据结构和既有用户数据不迁移、不清空。
- 不引入 AccessibilityService / NotificationListenerService 等无关高权限能力。

## 用户可观察到的新行为
只要设置过每日提醒或存在条目提醒，Android 通知栏会存在一个低重要度、静音的“List-Note 提醒守护”前台服务通知。这是为了让悬浮提醒宿主在退到桌面后仍持续存活；真正到点的提醒仍优先显示设计好的悬浮 Banner。
