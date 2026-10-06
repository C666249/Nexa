# JianType Mobile v1.0.0

Android 拼音输入法，基于 Qingjian Core v0.1.4（GPL-3.0-or-later）构建。

这个分支是 JianType Mobile 的隔离构建分支，不修改 Nexa 的 main。由于当前 ChatGPT GitHub 连接器不能直接上传二进制源码归档，完整源码快照以 source.part-* 的 Base64 分块保存；GitHub Actions 会按固定顺序还原，并用 SHA-256 校验后再构建。

源快照 SHA-256：
`17099b7cc5e72c389ca3ade9d8271da1381c990e0052644694b91ddc542004c5`

主要功能：Android InputMethodService、Qingjian Engine JNI、完整拼音词库、英文释义、用户候选学习、隐私输入禁学、候选展开、Emoji/符号页、中英切换、空格滑动光标、连续退格、深浅色与设置页。

上游：qingjian-team/qingjian v0.1.4。项目遵循 GPL-3.0-or-later；完整 LICENSE、NOTICE、ATTRIBUTION 均包含在源快照内。
