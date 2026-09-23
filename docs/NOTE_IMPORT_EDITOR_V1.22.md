# Note Editor / Attachment Architecture — V1.22

## 目标

V1.22 把两个反复出现的问题从“现象补丁”升级为明确的状态/生命周期模型：

1. Note 长文编辑时，软键盘、WebView caret 和 JS 不再同时争夺正文滚动位置。
2. 微信/QQ/系统文件分享不再创建第二个 To-Do 工作台或第二个最近任务卡。

## 1. Note 输入与 IME

- **正文是唯一 Scroll Owner**：`noteEditorBody` 的正常输入、删除、光标移动不再被 JS 强制恢复 `scrollTop`。
- Web 页面不再监听 `visualViewport.scroll` 去纠正文档滚动。
- Android `MainActivity` 通过 `WindowInsetsCompat.Type.ime()` 获取稳定的 IME bottom inset，并调用 `window.__onNativeImeInset(px, visible)`。
- Web 只把该 inset 用于格式工具栏位置和正文底部安全留白；不会在每个 input/beforeinput 事件里重新计算滚动位置。
- 打开附件面板时可主动隐藏键盘，但不会清空 WebView focus/重建编辑器。

## 2. 外部附件导入

### 入口

- MainActivity：仅保留普通 Launcher 入口。
- ImportReceiverActivity：接收 `ACTION_SEND` / `ACTION_SEND_MULTIPLE` / `ACTION_VIEW(content://)`。
- Share Target 标签：`添加到 To-Do`。

### 生命周期

`微信 / QQ / 文件来源` → `ImportReceiverActivity` → 复制到 `files/note_files/` → `note_external_import_queue` → 拉回已有 MainActivity → WebView 插回 Note → Receiver 结束。

ImportReceiverActivity 设置：

- `excludeFromRecents=true`
- `noHistory=true`
- 独立 import taskAffinity

目的：不让外部分享生成第二个用户可见 To-Do 最近任务。

### 无目标 Note

如果用户没有先打开 Note、而是从系统直接把文件分享到 To-Do，WebView 没有可确定的插入目标时会清理刚复制的私有附件并提示先打开笔记，避免产生孤儿文件。

## 3. 附件卡片

- `contenteditable=false`
- 点击正文卡片：直接预览 / 打开。
- 右侧 `⋯`：微信发送 / QQ发送 / 更多应用 / 删除。
- `⋯` 视觉只有三个垂直圆点；点击热区仍保持约 40dp。
- 打开附件操作时先结束正文 IME，不允许附件点击被当成文本输入。

## 4. 文件预览分级

### 内置查看

- 文本 / Markdown / 代码 / JSON / XML / CSV
- PDF
- 图片
- 常见音频 / 视频
- DOCX / XLSX：best-effort 快速预览

### 直接交给专业应用

明确不做内置解析：

- APK / APKS / XAPK / AAB / PK
- PPT / PPTX
- ZIP / RAR / 7Z / TAR / GZ 等压缩包
- EXE / MSI / DMG / ISO
- JAR / CLASS / SO / DLL
- PSD / AI / DWG / DXF 等专业格式

即使是支持内置查看的格式，用户仍可随时使用“更多应用 / 其他应用”交给 WPS、Office、Adobe、系统播放器等专业应用。

## 5. PDF

PDF 不再使用“单页 + 左右滑翻页”。V1.22 使用纵向连续页面列表：

- 页面按屏幕宽度和原始宽高比占位；
- 当前视口上下约一屏范围预加载；
- 距离视口较远的位图主动回收；
- `PdfRenderer` 串行打开/渲染页面，避免并发访问 renderer。

这保证长 PDF 可以像普通文档一样向下阅读，同时控制内存占用。
