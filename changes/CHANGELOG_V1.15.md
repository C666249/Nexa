# CHANGELOG V1.15

Base: To-Do V1.14 Full  
Target: To-Do V1.15 Full

## Banner Snooze

- Todo / Daily 悬浮 Banner 静止布局保持不变，不增加第二行或常驻延后按钮。
- 新增统一右滑 Snooze 手势：
  - < 18% Banner 宽度：松手回弹，不执行。
  - 18% ~ 38%：高亮 `+5 min`。
  - >= 38%：切换并高亮 `+10 min`。
  - 跨越 5 / 10 分钟档位时提供轻触觉反馈；越向右阻尼略增强。
- 选中档位松手后，Banner 顺势右滑淡出；底部显示轻量自绘 Toast：`5 分钟后再提醒` / `10 分钟后再提醒`。
- Todo Snooze 从用户松手确认时刻重新计时，不修改 WebView 原始 `reminderAt`。
- Daily Snooze 只改变当前这一轮提醒，长期 `hour/minute` 不变。

## Native reliability

- 新增 `SnoozeStore`（SharedPreferences: `reminder_snooze_v1`）保存临时到期时间，与现有 Todo / Note / Daily 业务数据隔离。
- `ReminderScheduler` 增加 Todo / Daily 专用 Snooze 调度路径，沿用原有 PendingIntent + AlarmManager 可靠链路。
- Receiver、Foreground Reminder Keeper、restore 与 in-process fallback 均识别尚未到点的 Snooze，防止进程恢复后提前重新弹出。
- 正常重新设置/取消提醒、Daily 完成或忽略时会清理对应 Snooze 状态。

## Tutorial

- V1.14 Feature Coach 的 Todo 提醒与 Daily 教学文字补充右滑 `+5 / +10 min` 手势，新安装用户可在可视化教学中发现这一隐藏能力。

## Compatibility

- `applicationId` 仍为 `com.todolist.app`。
- 原 WebView 业务 localStorage key 全部保持不变。
- Note 数据层、Note 事件核心、Folder Sidebar 核心区块保持与 V1.14 字节一致。
