# To-Do V1.20 Changelog

## Base / Target
- Base: `To-Do-v1.19.1-Full.zip`
- Target: `To-Do-v1.20-Full.zip`

## 1. Note 长文编辑工具栏稳定
- 不再通过修改整个 `noteEditor.bottom` 来躲避软键盘，避免编辑器缩短后露出底层 Note 根目录。
- Note 编辑器始终全屏覆盖；格式工具栏改为固定在视口底部，并仅按 `visualViewport` 计算出的键盘高度向上平移。
- 同时监听 `visualViewport.resize` 与 `visualViewport.scroll`，长文滚动、系统输入法发生 viewport pan 时持续贴住键盘上沿。
- 正文增加动态底部滚动留白，收起键盘后工具栏自然回落屏幕底部。

## 2. 图片按钮换成标准图库图标
- 原工具栏最右侧的 `▧+` 替换为简洁 SVG 图库图标。
- 原有系统 Photo Picker、多选图片、私有图片目录、预览与删除逻辑不变。

## 3. Note 文件附件
- 图片按钮右侧新增“添加文件”按钮。
- 调用 Android Storage Access Framework (`OpenMultipleDocuments`) 打开系统文件选择器，可一次多选文件。
- 选中内容复制到 APP 私有 `files/note_files/`，避免原文件移动/删除后笔记附件立即失效。
- 正文在当前光标位置插入附件卡片，显示扩展名/格式、文件名、大小；支持 PDF、DOC/DOCX、MD/TXT、XLS/XLSX/CSV、PPT/PPTX、ZIP/RAR/7Z 及其他类型。
- 单卡片可移除；删除 Note 及其子 Note 时同步删除对应私有文件。

## 4. 商业化文件操作面板
- 点击附件卡片弹出自定义底部圆角操作面板：`文件查看 / 微信发送 / QQ发送 / 更多`。
- 文件查看使用 `ACTION_VIEW` + Android chooser；微信/QQ使用定向 `ACTION_SEND`；更多使用系统 Sharesheet。
- 私有附件通过 AndroidX `FileProvider` 暴露临时 `content://` URI，并授予只读权限；不增加“读取全部存储”权限。

## 版本
- `versionCode = 31`
- `versionName = 1.20`
- `applicationId = com.todolist.app`（保持不变）
