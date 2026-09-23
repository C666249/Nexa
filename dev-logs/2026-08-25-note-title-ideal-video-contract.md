# 2026-08-25 Note 标题按钮录屏行为修复

## 验收基准

以用户提供的 `b2896fb1cd1b7fbf7cd4bf462e4e0161.mp4` 为最终行为基准，而不是此前稳定 ZIP 中的 Android asset 实现。

## 根因

- 稳定 ZIP 方案会立即执行 `formatBlock`，改变当前段落，偏离“后续输入才是标题”的交互。
- 标题按钮依赖 Android WebView 的合成 click；真机上短按可能没有可靠触发。
- 长按选择器取得焦点后使编辑器失焦，软键盘收起，引发视口重排和页面跳动。
- 标题状态没有在工具栏显示，用户无法确认 T1 是否已生效。

## 修复

- 短按在 `touchend` 明确激活 T1，兼容 click 只作为桌面/无触摸回退。
- 使用 12px 移动阈值，允许手指轻微抖动，不再误判为取消。
- 标题改为未来输入状态；已有内容不立即重写。
- 同时支持 `insertText`、`insertCompositionText` 和 `insertReplacementText`，兼容 Android 中文输入法组合文本。
- 激活后工具栏显示蓝色 `T1▾`；回车后退出标题状态。
- 长按 T1–T6 选择器阻止按钮抢焦点，并恢复编辑区滚动位置。
- 版本升级为 `1.30.4`（versionCode 134）。

## 验证

- `tests/note-title-touch.test.js` 覆盖短按、轻微抖动、长按、拖动取消、合成 click 抑制、中文 IME 和工具栏状态。
- 全部 JavaScript 回归测试通过。
- 构建后在 Android 模拟器继续验证键盘、焦点与滚动稳定性。
