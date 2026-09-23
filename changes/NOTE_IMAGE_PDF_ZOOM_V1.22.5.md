# Note / PDF 图片缩放实现说明 — V1.22.5

## PDF
PDF 仍然使用 V1.22 的纵向连续 `ScrollView + PdfRenderer` 架构，没有引入新的 PDF SDK。每页的普通 `ImageView` 改为复用项目已有的 `ZoomImageView`。

关键兼容规则：
- `nestedInVerticalScroll=true` 时，1× 单指 MOVE 不锁父容器，让 `ScrollView` 正常接管纵向滚动。
- 第二根手指落下时 `requestDisallowInterceptTouchEvent(true)`，保证 pinch 不被父 `ScrollView` 抢走。
- 页面 >1× 时单指 MOVE 才用于平移图像。
- 缩回 1× 后释放父拦截，继续纵向阅读。
- `PdfPageHolder` 的 lazy render / recycle 时序不变；新 bitmap 绑定后只追加 `fitCenter()`。

## Note 相册图片
正文中从 Photo Picker 导入的图片卡片、URL、删除和保存逻辑完全不变。只给现有 `noteImagePreview` 全屏 Overlay 增加局部手势状态：
- scale: 1–5
- translateX / translateY
- 双指 pinch
- 放大后单指 pan
- open / close reset

未拦截 Note 编辑器 input、selection 或 IME 链；手势监听只挂在预览 Overlay 的 `#noteImagePreviewImg` 上。
