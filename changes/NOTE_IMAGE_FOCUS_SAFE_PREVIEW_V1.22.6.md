# V1.22.6 Note Image Focus-Safe Preview

## Problem
Tapping an inline image inserted from Android Photo Picker could allow the surrounding contenteditable Note body to focus first, reopening the soft keyboard before the full-screen image preview appeared.

## Fix
- Reuse the existing `closeNoteKeyboardForOverlay()` path; no new IME geometry code.
- Inline preview images now use the same focus-safe pointer model already proven by Note file attachment cards.
- `pointerdown`: prevent contenteditable default focus, preserve current selection, blur editor/title, request native keyboard hide.
- `pointerup`: only open preview if movement stayed within 12px.
- `pointercancel`: clear pending tap.
- `touch-action: pan-y` preserves vertical Note scrolling when a gesture begins on an image.
- Compatibility click is consumed so the preview is not opened twice.

## Explicitly unchanged
- V1.22.5 full-screen image pinch/pan implementation.
- PDF viewer and PDF gesture zoom.
- V1.22.3 IME/toolbar/caret/single-scroll-owner architecture.
- V1.22.4 B/S/H manual typing-state architecture.
- Photo Picker/import/private image storage/delete/save flows.
- Reminder/Daily/Banner/Snooze.
