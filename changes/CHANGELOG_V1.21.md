# To-Do V1.21 Changelog

## Version
- Base: `To-Do-v1.20-Full.zip`
- Target: `To-Do-v1.21-Full.zip`
- `versionCode = 32`
- `versionName = 1.21`
- applicationId / namespace remain `com.todolist.app`.

## Note attachment workflow
- Added polished attachment import sheet: WeChat chat import / QQ chat import / phone files / recent imports.
- WeChat/QQ import uses a share-back workflow rather than reading private chat storage: launch chat app, share/open the selected file with To-Do, then insert it back into the remembered Note.
- Added incoming `ACTION_SEND`, `ACTION_SEND_MULTIPLE`, and compatible content `ACTION_VIEW` handling.
- Added recent-import multi-select cloning so reused attachments remain independently deletable.
- Attachment card tap now directly previews; `...` opens WeChat send / QQ send / More apps / Delete.
- `More apps` is an ACTION_VIEW chooser for WPS / Office / system players / other professional handlers.
- Fixed attachment card tap focusing contenteditable and opening the IME first.
- Hide the Note-home add-note FAB while a concrete Note editor is open.

## Built-in file viewer
- New `NoteFileViewerActivity`.
- In-app preview: Markdown/text/code/JSON/XML/CSV, PDF, images, audio, video.
- DOCX quick preview: headings, paragraphs, basic formatting, tables, embedded images where available.
- XLSX quick preview: shared strings, multiple sheet cell tables.
- Unsupported/complex formats fall back to external professional apps.
- Built-in viewer always offers `Other apps` so quick-preview fidelity can be checked in WPS/Office/media players.

## Note long-edit stability
- Separated keyboard body-space from toolbar visual offset.
- visualViewport scroll/pan now moves only the toolbar with transform instead of changing body layout.
- Added overflow-anchor protection and a narrow pathological upward-jump guard for long contenteditable notes.
- Focus/selection restoration uses `preventScroll` where available.

## Deep Note <-> To-Do switching
- Any Note editor depth can left-swipe from its top header directly to To-Do.
- Returning to Note restores the same Note and editor scroll position rather than the Note root.

## Locked core
- Reminder/Daily/Banner/Snooze native core is not modified this round.
- Existing Web localStorage business key set is unchanged.
