# 2026-08-25 Note 标题按钮稳定版移植

## 问题

最新版 Note 编辑器中的 `T▾` 按钮在 Android 真机上点击无反应。此前两次针对触摸事件的补丁没有复现稳定版行为。

## 基准确认

用户提供的稳定版 ZIP 中，真正被 Android WebView 加载的是：

`android/app/src/main/assets/todo.html`

而不是 ZIP 根目录下用于开发的 `ui/todo.html`。本次以 APK 实际资源中的标题按钮实现为唯一行为基准。

## 改动

- 恢复稳定版的标题事件模型：短按由原生 `click` 执行 T1，长按 500ms 打开 T1–T6 选择器。
- `touchstart`/`touchend`/`touchmove` 保持 passive，不拦截 WebView 的合成 click。
- 移除后来加入的短按抑制、手势状态机和标题输入时重复 `formatBlock` 的逻辑。
- 保留最新版已有的全局搜索、搜索返回栈和高亮动效。
- 版本升级为 `1.30.3`（versionCode 133）。

## 验证

- 新增/更新 `tests/note-title-touch.test.js`，锁定稳定版短按、长按、移动取消和 passive touch 合约。
- 完整 Node 回归测试通过后再同步 Android assets 并构建 APK。
