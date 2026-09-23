# Nexa 1.0.16

## Note image share lifecycle
Gallery images inserted into Note are first-class shareable attachments rather than preview-only content. Both old and new image blocks expose actions for WeChat, QQ, the Android Sharesheet, and deletion. Full-screen preview adds a dedicated Share control.

## Native bridge
`note_images/` is exposed through the app FileProvider. `shareNoteImage()` builds an `ACTION_SEND` intent with the image MIME type, content URI, ClipData, and temporary read permission.

## Back behavior
The image action sheet is consumed before the image preview, preserving the existing editor / Favorites Library navigation hierarchy.
