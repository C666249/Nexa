# Note 图片附件设计（V1.18）

## 目标

为现有 Note 纯文本/富文本编辑器增加轻量图片能力，不把图片二进制写入 localStorage，不破坏旧 Note 数据结构。

## 选图

- 工具栏最右侧 `▧+`。
- Android 系统 Photo Picker。
- Image Only。
- 单次最多 20 张。
- 不要求读取整个媒体库权限。

## 存储

选中的 URI 立即复制到：

```text
/files/note_images/
```

文件名包含 Note id、时间戳、序号和随机短 UUID。

Note 正文只保存：

```text
https://note.local/image/<safe-file-name>
```

WebViewClient 拦截 `note.local` 请求并从 APP 私有目录读取对应文件。

## 编辑体验

- 在调用相册前记录当前光标 Range，并插入临时 marker。
- 选图完成后在 marker 位置插入图片组。
- 1 张：正文宽图。
- 多张：两列网格。
- 点图片：全屏预览。
- 图片右上角 `✕`：删除该附件并立即保存 Note。
- 删除 Note / 子 Note：级联清理其附件文件。

## 兼容性

没有改变 `todo_glass_notes` key，也没有强制给旧 Note 增加新字段。图片块只是新增 HTML 内容，因此旧纯文字笔记不需要迁移。
