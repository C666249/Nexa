# To-Do V1.9 原位升级 / 本地数据保护

## 目标
V1.9 把 Android 安装身份从测试分支 `com.listnote.app` 恢复为稳定版的 `com.todolist.app`，目的是让 Android 将 V1.9 视为旧 To-Do 的“更新”，而不是第三个独立 App，从而继续使用旧稳定版已有的 app sandbox / WebView localStorage。

## Android 真正要求
要覆盖已安装旧版，至少必须同时满足：
1. `applicationId` 与已安装 App 完全一致；
2. 新 APK 的签名证书与已安装 App 一致（或符合 Android 支持的签名轮换证明）；
3. versionCode 不低于系统允许更新的条件。

本工程 V1.9：
- applicationId：`com.todolist.app`
- versionCode：`19`
- versionName：`1.9`
- app_name：`To-Do`

## 数据保护结论
- **同 package + 同签名，直接覆盖安装：旧 To-Do / Note 本地数据通常继续保留。** 本轮没有修改或清空 localStorage key，也没有做数据库 schema 迁移。
- **签名不同：Android 会直接拒绝覆盖。不要卸载旧稳定版。** 卸载会删除普通 app sandbox，本地记录/笔记可能随之丢失。
- V1.5–V1.8 的 `com.listnote.app` 测试版仍是另一个 App，它的数据不会因为 V1.9 改回 `com.todolist.app` 自动合并到稳定版。

## 推荐步骤
1. 先保留手机上的旧稳定版，不要卸载。
2. 在 Android Studio 构建 V1.9 Debug APK。
3. USB 连接手机并允许 ADB。
4. 双击根目录 `verify-overwrite-safety.bat`。
5. 只有脚本输出 `[PASS]` 时再把 V1.9 APK直接覆盖安装到旧稳定版。
6. 如果脚本输出 `[BLOCK]`，应找到/使用签署旧稳定版的同一 keystore 重签 V1.9，而不是卸载旧版。

## 原始源码包核验
用户本轮纠正基线所上传的旧 `To-Do List(1).zip` 中，原 Gradle 配置的 applicationId 本身就是 `com.todolist.app`。其内附 `dist/To-Do.apk` 使用 Android Debug 证书签名；但手机当前实际安装版本是否就是该 APK、以及当前电脑的 debug.keystore 是否相同，仍必须以设备实际证书为准，所以不能只凭“包名改回去”承诺 100% 可覆盖。
