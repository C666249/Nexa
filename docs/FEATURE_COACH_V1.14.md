# Feature Coach V1.14

V1.14 在 V1.13 的 5 步首次启动主教程之外，新增独立的情景教学系统。它只在用户第一次真正进入某个隐藏功能时出现，避免把所有说明一次性塞进首次教程。

## 触发项

1. `todoSwipe`：第一次成功左滑真实 To-Do 条目，聚光提醒/删除两个隐藏按钮。
2. `todoReminder`：第一次打开单条 To-Do 提醒设置，解释 Todo Banner 三态及关闭逻辑。
3. `dailyOpen`：第一次打开 Daily 抽屉，解释“今天完成、明天重新开始”。
4. `dailyCalendar`：第一次打开 Daily 总体历史日历，解释红/黄/绿完成度与日期详情卡。
5. `summaryReminder`：第一次打开每日总结提醒，解释它与单条 Todo / Daily 的区别及每天重复。
6. `noteOpen`：第一次真正进入 Note，说明长期记录、文件夹、与任务统计隔离。
7. `aiOpen`：第一次打开 AI 助手，给出自然语言操作示例。

额外保留 `daily_item_calendar`：第一次查看某一条 Daily 的长期统计时，解释日期下方 `✓ / × / ●`。

## 状态与数据隔离

主教程状态继续使用 `todo_glass_onboarding_v1`。
情景提示只使用 `todo_glass_coach_v1_<feature>` 前缀，不修改 `todo_glass_data`、`todo_glass_notes`、`todo_glass_daily_tasks_v1`、`todo_glass_history`、`todo_glass_recycle`。

主教程完成（`done`）后才允许情景提示出现；如果用户在欢迎页选择“我已经会用 · 跳过”，情景提示不会继续打扰。

## 帮助入口

右上角 `?` 打开“帮助与教程”：
- 重新观看 5 步主教程；
- 清除所有 Feature Coach 已读标记，让情景提示在下次进入对应功能时重新出现。

## UI

复用 V1.13 的 Spotlight 视觉，但 V1.14 增强为：
- 聚光镂空 + 呼吸边界；
- 浮动光点与方向箭头；
- 毛玻璃说明卡；
- 柔和渐变顶边与功能示例条；
- “稍后再说”不会写入已读标记；
- “知道了”才会持久标记该功能已学习。
