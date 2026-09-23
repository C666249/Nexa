# Note Attachments — V1.20

## 目标
让 Note 在保留原纯文本/图文结构兼容性的前提下，能够把 Markdown、PDF、DOCX 等开发资料直接作为附件卡片插入正文。

## 文件选择
- Android 原生：`ActivityResultContracts.OpenMultipleDocuments()`。
- WebView Bridge：`AndroidBridge.pickNoteFiles(noteId)`。
- 选择完成后后台流式复制到 `files/note_files/`。
- Note 正文不保存 Base64，只保存附件卡片的内部文件名、原显示名、MIME、大小。

## 打开 / 分享
- `文件查看`：`ACTION_VIEW`。
- `微信发送 / QQ发送`：`ACTION_SEND` 定向到可用应用。
- `更多`：`Intent.createChooser()` 系统 Sharesheet。
- 所有外部访问通过 AndroidX `FileProvider` 生成 `content://` URI，并使用临时 read grant。

## 数据与删除
- 现有 `todo_glass_notes` key 不改变，旧 Note 无需迁移。
- 新附件作为 HTML card 元数据自然随 `content` 持久化。
- 删除单卡、删除 Note、级联删除子 Note 时同步清理 `files/note_files/`。

## Keyboard Toolbar 修复
V1.19.1 的实现通过 `editor.style.bottom = keyboardHeight` 缩短整个 fixed editor。在 Android WebView 的 visual viewport 发生 pan/scroll 时，这会让底层 Note 列表从缩短后的区域漏出来。V1.20 改为：
1. editor 始终 `inset: 0` 全屏覆盖；
2. format bar 独立 fixed；
3. 只移动 format bar，不移动 editor；
4. 监听 visual viewport 的 resize + scroll；
5. 正文用动态 padding 保证长文可滚到键盘上方。
