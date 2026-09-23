# V1.13 新手引导设计说明

## 数据兼容

新手教程不使用真实 To-Do / Note / Daily 数据进行演示。

教程只新增：

- `todo_glass_onboarding_v1`
- `todo_glass_coach_v1_*`

现有业务 key 保持不变，包括：

- `todo_glass_data`
- `todo_glass_notes`
- `todo_glass_daily_tasks_v1`
- `todo_glass_recycle`
- `todo_glass_history`

因此同包名、同签名覆盖升级时，旧数据继续由原 WebView localStorage 读取。

## 首次打开行为

如果 `todo_glass_onboarding_v1` 不存在：

1. 显示欢迎动画；
2. 用户可以进入 5 步主教程，也可以直接跳过；
3. 完成写入 `done`，跳过写入 `skipped`；
4. 右上角 `?` 可随时重新播放主教程，不会清空数据。

旧用户升级后也会看到欢迎页一次，因为这是新加入的独立 key；可以直接点“我已经会用 · 跳过”。

## 5 步主教程

1. 工作台：To-Do + 底部新增 / 回收站 / AI。
2. 三态待办：虚拟复选框，要求实际点两次体验“未完成 → 进行中 → 已完成”。
3. 左滑隐藏功能：虚拟待办支持手指拖动，展示提醒 / 删除。
4. To-Do ↔ Note：Spotlight 高亮模式切换入口，并演示抽屉式左右切换。
5. 顶部时间工具：日历、每日总结、Daily，并告知 `?` 可重播教程。

教程中的虚拟事项只存在 DOM，引导结束即消失，不写入 localStorage / Native mirror。

## 情境式教学

只有完整完成主教程（`done`）后才会触发，跳过教程不会继续弹这些提示：

- 第一次打开单条待办提醒；
- 第一次打开 Daily 总体历史；
- 第一次打开单个 Daily 的统计日历；
- 第一次打开 AI 助手。

每个情境只显示一次，状态保存在 `todo_glass_coach_v1_*`。
