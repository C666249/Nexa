# Note 标题上滑输入态 · v1.30.5

## 已确认交互

- 轻点 `T▾`：切换上次使用的标题等级，首次为 T1。
- 按住约 200ms 或直接向上拖动：显示 T1–T6 纵向弧形轨道；滑过时高亮并触发轻触觉反馈，松手提交。
- 横向滑出或向下离开起点：取消，不改变标题状态。
- 标题仅作用于激活后新输入的字符；光标前文字和选中文字不做任何重排或字号修改。
- 回车后在同一原生输入事务中退出标题态，下一行恢复正文。
- 点击正文移动光标或使用方向/Home/End 键后退出标题态。

## 实现要点

- 删除标题路径中的 `formatBlock`/H1–H6 整段转换。
- 使用 Chromium/WebView 折叠光标的 `fontSize` pending command，T1–T6 映射到持久化内联 `font[size=7..2]`；正文复位使用 `font[size=1]`。
- 保留 Android IME 原生 `beforeinput/input`、composition 和 undo 行为，不拦截或手工重插字符。
- 标题手势统一为 Pointer Events + pointer capture，移除旧 click/touch/long-press 竞态。
- 新增 Android `performNoteTitleHaptic()` JavaScript bridge，使用 `CLOCK_TICK`。
- UI 源文件和 APK asset SHA-256 一致：`B024ABAE7AD9A56FA91EDCDBADC8108B4A7C7DD5EC60176B27AD0E5253ED849B`。

## 回归与真实验证

- 全部 14 个 Node JavaScript 回归测试通过。
- Chromium/Edge 真实 contenteditable 测试通过：
  - `已有文字` + 激活 T1 + `新标题` → `已有文字<font size="7">新标题</font>`。
  - 回车后立即连续输入仍恢复 `font size="1"`，修复了 setTimeout 复位竞态。
  - 预先选中的旧文字保持不变，标题从选择末端开始。
  - 上滑选择 T4、横向滑出取消、移动光标退出均通过。
- Android API 32 模拟器安装覆盖成功，包版本 `135 / 1.30.5`：
  - 键盘全程保持开启，页面无跳动。
  - 轻点后工具栏显示蓝色 `T1`。
  - 已输入的小号 `body` 不变，随后输入 `TITLE` 才变大。
  - 长按上滑轨道在键盘上方完整显示，松手成功提交 T2/T3。
  - 保存/重新进入后内联标题字号仍持久化。

## 交互 Review

- 哲学一致性：9.0/10 —— 连续上滑、逐级反馈与流光收束贯彻运动诗学方向。
- 视觉层级：8.8/10 —— 当前等级唯一高亮，T1–T6 顺序清晰。
- 细节执行：9.0/10 —— 固定浮层不参与文档布局，轨道、触觉、取消态和按钮反馈形成闭环。
- 功能性：9.5/10 —— 旧文字零改写、键盘零关闭、回车和光标移动边界已锁定。
- 创新性：9.2/10 —— 在紧凑移动工具栏中用连续手势完成六级选择，不依赖小弹窗或隐藏长按菜单。

总体：9.1/10。未发现阻断交付的问题。

## APK

- `dist/To-Do-v1.30.5.apk`
- SHA-256：`F792C0EB39BA0F99F8287F325FC11119C0C3AA5D1CC27FED1AB84B7BA2400965`
