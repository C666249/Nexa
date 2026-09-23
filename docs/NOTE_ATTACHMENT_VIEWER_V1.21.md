# Note Attachment Workflow / Viewer — V1.21

## Goal

V1.21 turns Note attachments from a simple "pick file -> external app" feature into a compact attachment workspace while keeping the existing Note/localStorage model compatible.

## Import entry

The Note toolbar file button opens an in-app rounded import sheet first:

- WeChat chat import
- QQ chat import
- Phone files
- Recent imports

Android application sandboxing does not permit To-Do to enumerate another app's private chat/file database. Therefore WeChat/QQ import uses a stable hand-off workflow: To-Do records the target Note and insertion marker, opens the selected chat app, the user chooses a file and shares/opens it with To-Do, and the incoming `ACTION_SEND`, `ACTION_SEND_MULTIPLE`, or compatible `ACTION_VIEW` URI is copied back to `files/note_files/` and inserted into the original Note.

Phone files continue to use Storage Access Framework `OpenMultipleDocuments` and support multi-select. Recent imports clone already-private Note files so deleting one attachment later does not invalidate another Note card.

## Card interaction

Attachment cards are `contenteditable=false` interaction islands inside the Note editor.

- Tap card: direct preview.
- Tap `...`: WeChat send / QQ send / More apps / Delete attachment.
- `More apps` uses an `ACTION_VIEW` chooser so users can explicitly choose professional apps such as WPS, Office, a video player, etc., even when To-Do can preview that format itself.
- Pointer-down suppresses contenteditable's default focus action so the keyboard does not appear before the attachment UI.

The Note-home add-note FAB is hidden whenever a Note editor is open.

## Built-in viewer

`NoteFileViewerActivity` is intentionally dependency-light and uses platform capabilities:

- Markdown / text / source code / JSON / XML / CSV: local JS-disabled WebView renderer.
- PDF: Android `PdfRenderer`, page navigation + swipe + zoom/pan.
- Images: zoom/pan image viewer.
- Audio: MediaPlayer with progress and play/pause.
- Video: VideoView / MediaController.
- DOCX: OOXML ZIP/XML quick preview for headings, paragraphs, basic run formatting, tables, and embedded images.
- XLSX: OOXML quick preview for shared strings and sheet cells.

PPT/PPTX, old binary Office documents, archives, design/CAD formats and any unsupported format remain external-first. DOCX/XLSX are explicitly quick previews: complex pagination, floating objects, charts, macros, conditional formatting and other professional-layout features can differ from WPS/Office. The built-in viewer always keeps an `Other apps` button for authoritative viewing.

## Note editor stability

The keyboard layout model now separates two different dimensions:

1. `--note-keyboard-space`: stable body scroll breathing room. It updates only when the visual viewport height changes.
2. `--note-toolbar-offset`: compositor-only toolbar translation. It can update on visual viewport scroll/pan without reflowing the Note body.

This avoids the V1.20 failure mode where caret/keyboard viewport pan caused repeated editor layout recalculation and visible jump/flash. A narrow input scroll guard rejects only pathological one-frame upward jumps in already-scrolled long notes.

## Nested Note workspace switching

The top area of any open Note editor accepts a physical left swipe to To-Do. Before switching, V1.21 stores the active Note id, editor body scroll position and Note-workspace state. Returning to Note restores that exact Note and scroll position instead of forcing the user back to the root list.

## Data compatibility

- Existing Web localStorage business keys are unchanged.
- Existing Note HTML remains readable.
- File payloads stay in private `files/note_files/`.
- External professional apps receive temporary read-only `content://` URIs through FileProvider.
- No broad storage permission is added.
