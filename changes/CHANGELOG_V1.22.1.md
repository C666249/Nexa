# To-Do V1.22.1 CompileFix Changelog

**Base:** To-Do-v1.22-Full.zip  
**Target:** To-Do-v1.22.1-CompileFix-Full.zip

## Fix
- 修复 Android Studio 真编译在 `NoteFileViewerActivity.kt:362` 报错：`Unresolved reference 'LayoutParams'`。
- 原代码错误使用 `ScrollView.LayoutParams(...)`；改为 `FrameLayout.LayoutParams(...)`。`ScrollView` 继承自 `FrameLayout`，其直接子 View 的 LayoutParams 使用 `FrameLayout.LayoutParams`。

## Scope
- 仅修改上述 PDF 纵向容器的一行 LayoutParams 类型，以及版本/构建输出元数据。
- 不修改 V1.22 的 Note 编辑器、附件导入、ImportReceiver、PDF 懒加载逻辑本身。
- Reminder / Daily / Banner / Snooze / To-Do 数据 / Note 数据结构全部保持 V1.22。

## Version
- versionCode: 34
- versionName: 1.22.1
- applicationId / namespace: `com.todolist.app`
