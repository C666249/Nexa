# CHANGELOG V1.8

Base: List-Note V1.7 Full  
Target: List-Note V1.8 Full

## 本轮改动
1. 每日总结提醒明确为每天重复：保留 V1.7 已经真机验证成功的 Native Reminder Keeper + AlarmManager 调度核心，不做风险重构；代码核验确认每日 Alarm/Handler 到点后都会重新排下一天。
2. 右上角时钟弹窗新增当前配置行：`当前：每天 HH:mm · 自动重复`；未设置时显示 `当前：未设置 · 每天重复`。
3. 每日提醒确认文案改为“开启/更新每天提醒”，Toast 明确显示每天 HH:mm 及下一次触发时间。
4. 每次打开每日提醒弹窗都重新读取已保存时间；如果用户滚动后直接关闭，不会把未确认值当成当前配置。
5. 单条待办设置 reminderAt 后，普通首页卡片最右侧以弱化颜色显示 `M/D HH:mm`（例如 `8/9 10:00`），不需要左滑即可看到。
6. 条目提醒弹窗无既有提醒时默认当前本地年月日/时/分，不再自动 +30 分钟；已有未来提醒仍回显原设置。
7. To-Do / Note 切换新增 130ms 退出 + 230ms 进入的轻量淡入淡出/纸张翻页感动画；顶部左右滑和模式按钮复用同一动画方向。
8. 从悬浮 Banner 点击进入 APP 的待办定位继续即时切回 To-Do，不等待动画，避免定位定时器与模式动画产生竞态。
9. 版本更新到 versionCode 18 / versionName 1.8；build-apk.bat 输出更新为 `List-Note-v1.8.apk`。

## 明确保留 / Locked Core
- `applicationId = com.listnote.app`。
- V1.7 已真机验证成功的 ReminderScheduler / FloatWindowService / Receivers / ReminderStore / FloatWindowManager / BannerView / TodoReminderBannerView / MainActivity Native Bridge 全部不修改。
- 左滑仍为透明动作区内的绿色“提醒”与红色“删除”两个独立按键。
- Note 数据结构、CRUD、编辑器正文、文件夹/子笔记数据逻辑不改。
- localStorage key 与 Android SharedPreferences schema 不迁移，不清空既有数据。
