# V1.22.5 — PDF / Note Image Gesture Zoom

Base: `To-Do-v1.22.4-NoteManualFormatState-Full.zip`

## Scope
Only add gesture zoom to two existing image-preview surfaces:

1. PDF pages rendered by `PdfRenderer` inside `NoteFileViewerActivity`.
2. The full-screen preview opened after tapping an image inserted from the Android system photo picker into Note.

## Behavior
- PDF at 1× keeps the existing vertical `ScrollView` as the scroll owner.
- Two-finger pinch is captured by the page image; zoom range is 1×–5× for PDF pages.
- While a PDF page is zoomed, one-finger drag pans the page; after returning to 1×, vertical drag belongs to the PDF list again.
- Existing PDF lazy render / far-page bitmap recycling remains unchanged.
- Note image overlay supports pinch 1×–5× and one-finger pan only while zoomed.
- Note preview transform resets on every open/close.

## Explicit non-scope
- No changes to reminder, Daily, Banner, Snooze or permission code.
- No changes to MainActivity image picking/copying or attachment import.
- No changes to Note IME/caret/scroll-owner architecture.
- No changes to B/S/H manual typing state.
- No changes to DOCX/XLSX/text/audio/video preview behavior.
