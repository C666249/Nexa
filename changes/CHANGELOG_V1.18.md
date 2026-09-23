# CHANGELOG V1.18

Base: To-Do V1.17 Full
Target: To-Do V1.18 Full

## 本轮需求

1. 不增加 Note 指纹/锁屏密码；继续保持个人本地使用逻辑。
2. 检查悬浮 Banner / Toast 退出动画，尤其修复手势后消失时的末帧闪烁；所有原生 WindowManager 临时悬浮层退出改为纯透明渐隐。
3. Note 编辑器工具栏在“+子”右侧增加图片按钮，可调用系统相册并多选图片，插入当前正文位置。
4. 修复 Note 编辑器 B 粗体状态：默认正常字重；B 开启才粗体+蓝色选中，再按恢复正常。
5. 保持现有 To-Do / Note / Daily 本地数据兼容和覆盖升级安全。

## 实现

### Native Overlay Fade Pipeline
- `SnoozeSwipeBannerView` 新增统一 `fadeOutForAction()`：只改变整个 Overlay 的 alpha，不在松手后追加 X/Y 位移。
- Fade 完成后先将 View 置为完全透明/不可见，再等待一个 `postOnAnimation` 帧，最后由回调触发 WindowManager detach。
- Todo / Daily 四向手势、`×`、点击正文打开 APP、Daily 点击复选框完成均复用该退出路径。
- `BannerView`（每日总结悬浮层）的自动退出、关闭、打开 APP 同步改为 opacity-only，并加入单次退出 guard。
- WebView `.toast` 去掉退出位移，只保留 opacity transition。

### Note 图片
- Note 工具栏新增 `▧+` 图片按钮（位于 `+子` 右侧）。
- Android Native 使用 `PickMultipleVisualMedia(20)` + `ImageOnly` 调用系统 Photo Picker。
- 选图复制在后台线程完成，避免多张截图复制时阻塞 UI。
- 图片写入 `files/note_images/` 私有目录；Note 的 `todo_glass_notes` 内容只保存内部虚拟 URL 引用，不保存 Base64 大图。
- WebView 通过 `https://note.local/image/<filename>` + `shouldInterceptRequest()` 安全读取私有图片。
- 图片按光标位置插入：单图大图、多图双列网格；支持点图全屏预览、单图删除。
- 删除 Note / 子 Note 时同步清理该 Note 引用的私有图片。
- 仅图片笔记的自动标题为“图片笔记”，避免删除按钮 `✕` 被误识别为标题。

### Note B 粗体修复
- 正文 CSS 显式默认 `font-weight: 400`。
- 删除 selectionchange 中原先会反向执行 `execCommand('bold')` 的逻辑。
- B 按钮状态改为读取真实 `queryCommandState('bold')`：默认关闭；点击一次开启；再次点击关闭。
- 光标/选区变化只同步工具栏状态，不再修改正文格式。

## 数据兼容

原业务 key 未改变：
- `todo_glass_data`
- `todo_glass_recycle`
- `todo_glass_history`
- `todo_glass_notes`
- `todo_glass_daily_tasks_v1`
- `todo_glass_onboarding_v1`
- `banner_reminder_time`

图片是新增的 APP 私有附件文件，不要求迁移旧 Note；旧纯文字 Note 继续按原 HTML 内容读取。
