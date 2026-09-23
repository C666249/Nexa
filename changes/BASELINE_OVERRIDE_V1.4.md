# V1.4 基线纠正记录

用户明确指出此前 AI 交付分支缺失 7 月 22 日已经存在的 Note 模式，因此此前 V1.1–V1.3 不能再作为功能基线。

本轮以用户重新上传的 `To-Do List(1).zip` 为权威来源重新核验。发现：

- ZIP 中 `ui/todo.html` 与 `android/app/src/main/assets/todo.html` 是 7 月 25 日的 132501-byte 版本，缺失 Note 模式；
- 同一 ZIP 的 Gradle 已合并资源 `android/app/build/intermediates/assets/debug/mergeDebugAssets/todo.html` 为 184003 bytes，时间为 2026-07-21 16:19 UTC（UTC+8 为 2026-07-22 00:19），其中完整存在 Note 模式、笔记树、文件夹和编辑器；
- 因此先把该 7 月 22 日 Note-mode HTML 恢复为两个正式源码副本，再实施本轮提醒需求。

这是用户授权后的“基线纠正”，不是回退此前错误分支。后续版本应以 V1.4 Full 为唯一继续开发基线。
