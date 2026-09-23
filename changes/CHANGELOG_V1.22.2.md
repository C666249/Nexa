# To-Do v1.22.2 — Note Editor Root Fix

Base: v1.22.1 CompileFix
Target: v1.22.2

## Scope
This round is intentionally limited to the two P0 Note editor regressions reported on-device. No new feature is added.

## Fixes
1. **Long-note typing/delete jump-to-top root fix**
   - Restores the proven v1.19.1 scroll ownership model: the Note body is the only scroll owner.
   - Input, delete, caret movement and selection changes never write `scrollTop`.
   - Removes the v1.20+ fixed-toolbar / dynamic body-padding geometry model from the active editor layout.
   - The full-screen Note shell remains opaque and fixed, preventing the root Note list from being exposed.

2. **Format toolbar follows keyboard again**
   - The toolbar is back in the editor flex flow instead of being an independent fixed overlay.
   - `visualViewport.resize` only changes the editor's IME bottom space, so the visible editor viewport shrinks above the keyboard.
   - `visualViewport.scroll` is used only for a compositor transform of the toolbar (`offsetTop`) and never mutates body layout or scroll position.
   - Native WindowInsets remains fallback-only on WebViews without `visualViewport`, with px -> CSS px conversion.

3. **Children / toolbar ordering**
   - Child-note area stays above the format toolbar.
   - The toolbar remains the bottom-most editor control and therefore naturally sits on the keyboard edge.

## Explicitly unchanged
- File attachments, WeChat/QQ import, ImportReceiverActivity, internal file viewer and vertical PDF viewer.
- To-Do, Daily, reminder banners and Snooze behavior.
- Existing Note data format and localStorage business keys.
