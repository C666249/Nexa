# Nexa 1.0.5 交付验收状态 — 2026-09-07

`Stable` 仍表示生产身份源码渠道（固定 `com.nexa.app`），不等同于已经完成正式商店签名与全部物理机验收。

## 本轮针对视频反馈完成

- Bottom Nav 页面切换不再把整个目标页面做 0.12–0.25 → 1 的透明度动画，消除明显“发白/闪一下”。
- 移除和 Shared Axis 重复的 page-entry 动画，避免 Shared Axis 结束后又启动第二次动画。
- Todo/Note 不再对整个 `.app` 做 Shared Axis transform；只移动内容层，固定控件和定位体系保持稳定。
- Space 二级页面进入动画也取消整体透明度淡入。
- Todo 堆栈锚点从错误的 `top:12px` 改为实时 Header 高度 + 8px。
- Todo 堆栈 z-index 降到 Header 下方，日期/完成分隔条高于任务堆栈，避免卡片盖住顶部筛选栏或跨组污染。
- 堆栈改为连续的 next-card approach 进度，最多展示 4 层；反向滚动按同一路径逐步释放。
- 路由切换、Checklist、Swipe、编辑、拖动、删除、完成重排期间暂停堆栈 transform。

## 保留能力

1.0.4 的写入式 Checkbox、完成沉降、曲线删除、弹簧重排、Space 二级结构、Bottom Nav indicator、Note Morph、搜索/FAB Morph、Peek、odometer、环形进度、Bottom Sheet spring、Press Physics、Skeleton Morph 全部保留。1.0.2 Note 高亮边界修复与 1.0.3 Space 二级信息架构继续保留。

## 源码验证

- 完整 Node 回归包含历史 `.test.js` + Nexa `.test.cjs`，并加入 1.0.5 闪烁/堆栈专项断言。
- `ui/*.js` 与 HTML 内联脚本执行 `node --check`。
- Android Manifest / resources XML 解析。
- `ui/` 与 `android/app/src/main/assets/` WebView 文件逐字节一致。
- Stable/Beta staging 在最终打包前分别重新执行回归与身份验证。
- ZIP 打包后执行完整性检查，并排除 APK/AAB、密钥、`local.properties`、Gradle/IDE 缓存与 build 目录。

## 当前环境 Android 编译边界

Android Studio / Gradle 仍是正式构建路径。如果当前容器无法取得 Gradle 8.11.1 / Android SDK 35，则只记录实际失败，不把 Node/静态验证描述成 APK 编译成功。

## 仍建议真机重点复核

- 快速连续 Todo → Note → Daily → Space 切换，确认无闪白。
- 10 / 30 / 100+ Todo 上下快速滚动，确认 Header 下方出现 2–4 层堆栈且顶部筛选栏永不被覆盖。
- Checklist 展开、完成沉降、左滑删除、长按排序与堆栈的互斥关系。
- 正式签名下 Stable 覆盖升级、本地数据连续性，以及 Stable/Beta 同机共存。
