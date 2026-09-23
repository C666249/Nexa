# V1.15 Banner Snooze Gesture

## 目标
保持 Todo / Daily Banner 静止状态下的现有视觉，不增加常驻按钮、附着胶囊或第二层菜单，通过右滑距离直接选择稍后提醒时间。

## 手势
- 0 ~ 18%：仅跟手移动，松手弹回。
- 18% ~ 38%：`+5 min` 高亮。
- >= 38%：`+10 min` 高亮。
- 进入 5 / 10 分钟档位时各提供一次轻触觉反馈。
- 继续向右时加入轻阻尼，降低误触 10 分钟档位的概率。
- 成功松手后卡片顺势右滑淡出，再调用原生 snooze 回调。

## 时间语义
- Todo：以用户松手确认的时刻为基准，5 / 10 分钟后重新触发；不修改 WebView 中原始 reminderAt。
- Daily：只推迟当前这一轮 Daily 提醒，长期 `hour/minute` 不变，后续日仍按原设定时间提醒。

## 状态隔离
新增 `SnoozeStore`，SharedPreferences 名为 `reminder_snooze_v1`。这里只存临时 `untilMillis`，不写入 To-Do / Note / Daily 主数据。

## 可靠性
- AlarmManager 使用现有 PendingIntent 重新安排 snooze 到点。
- Reminder Receiver 若被提前唤醒，会检查 snoozeUntil 并重新武装而不是提前显示。
- FloatWindowService 的 restore / fallback 同样检查 snoozeUntil，防止服务重启时立即恢复已延后的 Banner。
- 正常重新设置提醒、删除/关闭提醒或 Daily 完成/忽略时会清理对应 snooze 状态。
