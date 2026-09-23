# CHANGELOG V1.13

Base: V1.12 Full
Target: V1.13 Full

## Fix
- 修复 `MainActivity.kt` V1.12 构建失败：JS 返回值判断中的坏字符串 `""true""` 改为 `raw.trim('"') == "true"`。
- `TodoReminderBannerView.kt` 对 `LinearLayout.LayoutParams.WRAP_CONTENT` 做显式限定，避免嵌套 LayoutParams 名称歧义。

## New onboarding
- 首次启动欢迎动画。
- 5 步主教程：工作台 / 三态复选框 / 左滑提醒删除 / To-Do↔Note / 顶部时间工具。
- 三态与左滑教程均使用 DOM 虚拟事项，不写入真实数据库或 localStorage 业务数据。
- Spotlight、毛玻璃卡片、呼吸高亮、手势演示、交互式复选框与滑动练习。
- 右上角新增 `?` 重播入口。
- 系统返回键优先关闭欢迎页 / 教程 / 情境提示，再走原有页面层级。

## Context coaching
- 单条提醒首次打开提示。
- Daily 总体历史首次打开提示。
- 单项 Daily 日历首次打开提示。
- AI 助手首次打开提示。

## Data compatibility
- 未改 `todo_glass_data` / `todo_glass_notes` / `todo_glass_daily_tasks_v1` 等业务 key。
- 教程状态使用独立 `todo_glass_onboarding_v1` 与 `todo_glass_coach_v1_*`。
- applicationId 继续保持 `com.todolist.app`。
