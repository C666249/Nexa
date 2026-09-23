# Note 标题按钮触摸修复

- 根因：Android WebView 中 `T▾` 的 `touchstart.preventDefault()` 会抑制合成 `click`，但旧 `touchend` 只清理长按计时器，导致手机短按没有动作。
- 修复严格限定在 `noteTitleBtn`：短按立即应用 T1，长按打开 T1–T6，移动与取消手势不触发标题，触摸后的合成 click 会被去重。
- 恢复标题对当前段落的即时 `formatBlock`，并保留后续输入标题状态。
- 新增 `tests/note-title-touch.test.js`，覆盖短按、长按、滑动取消、合成 click 去重及桌面点击。
- APK 版本升级为 `1.30.1 (131)`，可覆盖已安装的 `1.30 (130)`。
