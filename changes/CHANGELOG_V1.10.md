# CHANGELOG — V1.10

Base: **To-Do V1.9 Full**  
Target: **To-Do V1.10 Full**

## Added
- 独立 Daily 半高大圆角抽屉；Daily 与普通 To-Do 数据/统计隔离。
- Daily 每日固定时分提醒、今日完成状态和 `completedDates` 历史。
- Daily 行的统计日历入口；左滑编辑/删除两个独立按钮。
- Daily 月历：✓ 完成、× 过去未完成、● 今天未完成，状态固定显示在日期数字正下方；月完成率统计。
- Android Native `DailyTaskStore`、Daily Alarm Receiver、Action Receiver、单行 `DailyTaskBannerView` 与系统通知兜底。
- Native/WebView Daily 完成状态 mutation 同步；Banner 正文进入 Daily 并定位高亮。

## Changed
- To-Do ↔ Note 去掉 V1.9 View Transition / fade / scale 组合，改为纯横向 translate3d 的跟手抽屉式切换：半滑回弹、过阈值吸附。
- Daily 抽屉高度收敛到约 2/3 屏幕，保持大圆角和暖白毛玻璃视觉。
- `build-apk.bat` 输出更新为 `dist/To-Do-v1.10.apk`。
- versionCode/versionName 更新为 20 / 1.10。

## Preserved
- `applicationId` / namespace 继续为 `com.todolist.app`，用于覆盖稳定版并继续读取旧 app sandbox。
- 既有 To-Do / Note localStorage key 不变。
- 普通 To-Do 三态提醒 Banner 行为不变：未完成 → 进行中 → 已完成，仍由 ✕ 显式关闭。
- Note CSS、HTML、CRUD、编辑器/文件夹事件核心均通过字节级区块 hash。
