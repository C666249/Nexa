# V1.30.15

## Note 创建入口
- 右下角 `+` 的两个 Note 操作改为真正的向上抽屉：最终位置整体抬高到 FAB 上方，保留约 22px 可视间距。
- `+` 始终位于更高交互层，展开后再次点击即可收起。
- 移除 Note FAB 长按新建主题，避免和点击抽屉状态冲突。

## Note 全局搜索
- 搜索框右侧放大镜从不可点击 `span` 改成独立 `button`，明确开启 pointer events；点击展开 `全部 / 标题` 范围抽屉。
- 每次启动默认 `全部`：主题标题 + 笔记标题 + 正文；`标题` 只检索主题/笔记标题。
- 正文检索先将 Note HTML 转换为可见纯文本，正文命中结果显示上下文片段。
- 从全文结果进入笔记后，自动高亮所有正文命中，并滚动到首个命中；若仅标题命中则强调标题。
- 临时高亮统一使用可清理的 `mark.search-hit`，保存前自动剥离，并兼容清理旧版本 `.note-search-hit-highlight` 遗留。
- 系统返回键优先关闭搜索范围抽屉。

## 交付与工程
- Stable `com.todolist.app` / Beta `com.todolist.app.beta` 身份保持。
- versionCode 1315；APK 输出命名加入项目、渠道、版本和 buildType。
- `ui/todo.html` 与 Android assets 镜像保持字节一致。
- 按当前交付规则移除旧的一键 build-apk/start 包装脚本，正式构建走 Android Studio。
