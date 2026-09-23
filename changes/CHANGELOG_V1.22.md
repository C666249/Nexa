# To-Do V1.22 Changelog

**Base:** V1.21 Full  
**Target:** V1.22 Full

## 本轮修复 / 新增

1. Note 长文编辑：移除输入期 scrollTop 强制纠偏与 visualViewport scroll 驱动，改用 Android IME WindowInsets 作为唯一键盘几何来源，修复输入/删除/光标变化时闪烁与当前行跳顶。
2. 新增 `ImportReceiverActivity` 作为外部文件分享专用临时入口；MainActivity 只保留 Launcher 入口，防止微信/QQ导入制造第二个 To-Do 最近任务。
3. Share Target 显示为“添加到 To-Do”，支持 SEND / SEND_MULTIPLE / content VIEW，并把收到文件插回原 Note。
4. 附件导入 Bottom Sheet 精简为“微信 / QQ / 文件 / 最近”，移除大段说明和 backdrop blur。
5. 文件卡片 `⋯` 去掉白圈，使用透明热区 + 垂直居中 SVG 三圆点；附件点击不再唤起键盘。
6. 内置预览仍保留专业应用兜底；APK/APKS/XAPK/AAB/PK、PPT/PPTX、压缩包、可执行/二进制/专业格式明确直接走外部应用选择器。
7. PDF 从单页横向翻页改为纵向连续懒渲染，离屏 Bitmap 主动回收。
8. 音频/视频内置解码失败时回退到外部专业应用。

## 不在本轮范围

- 1×1 Smart Icon Widget（单击 Note / 双击 To-Do）只保留设计，不进入 V1.22。
- Reminder / Daily / Banner / Snooze 稳定核心不重构。
