# CHANGELOG V1.9

Base: List-Note V1.8 Full  
Target: To-Do V1.9 Full

## 本轮改动
1. To-Do ↔ Note 切换动画重新设计。V1.8 的“退出 130ms → DOM 切换 → 进入 230ms”串行纸张淡入淡出被移除。
2. 主路径改为 Chromium same-document View Transition：旧/新视图 snapshot 同时交叠运动，没有中间空白帧；视觉语言为短距离 slide + 微 scale + opacity，避免明显 3D rotateY。
3. 方向 easing 调整为 spring-like：旧页较快退让，新页使用更长的 `cubic-bezier(0.16,1,0.3,1)` 收束，并有约 1.5px 极轻 overshoot。
4. 顶部横向手势新增 finger-follow preview：横向拖动时当前页小幅跟手；超过 40px 后承接到正式 transition；未达阈值用 spring-like 曲线回位。
5. 兼容策略：不引入 React / Motion / Framer 依赖；支持 `document.startViewTransition` 时走原生浏览器合成动画，旧 WebView 自动走 Web Animations API fallback；reduced-motion 直接切换。
6. Android 安装身份从测试分支 `com.listnote.app` 恢复旧稳定版 `com.todolist.app`；Launcher 名称恢复 `To-Do`；namespace 保持 `com.todolist.app`。
7. versionCode/versionName 更新为 `19 / 1.9`；APK 输出名更新为 `To-Do-v1.9.apk`。
8. 新增 `verify-overwrite-safety.bat`：连接手机后比较当前已安装 `com.todolist.app` APK 与新 Debug APK 的 SHA-256 签名证书，避免签名不一致时误卸载旧版导致本地数据丢失。
9. 新增 `docs/UPDATE_SAFETY_V1.9.md`，明确“同 applicationId 还必须同签名才能无损原位更新”的边界。

## Locked Core
- V1.7/V1.8 已真机确认正常的 Reminder Keeper、AlarmManager、Receivers、Banner、Native Bridge 不修改。
- Android Manifest、提醒权限、前台服务声明不修改。
- Note CSS / Note HTML / Note CRUD / 编辑器与文件夹事件核心不修改。
- To-Do / Note localStorage key 集合不修改、不迁移、不清空。
- V1.8 每日重复提醒、条目提醒时间展示、条目提醒当前时间默认等行为不修改。

## App update identity
- V1.9 `applicationId = com.todolist.app` 与用户旧稳定版源码一致。
- 仅 applicationId 相同并不足以保证能覆盖；Android 更新还要求签名证书匹配。
- 若当前手机上的旧稳定版与 V1.9 使用同一签名，直接覆盖安装会继续使用原应用数据目录；若签名不一致，系统会拒绝覆盖，不能通过卸载旧版绕过。
