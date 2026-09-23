# To-Do v1.22.4 — Note Manual B / S / H Typing State Fix

Base: v1.22.3 NoteImeCaretFix
Target: v1.22.4

## Scope
This release is limited to the Note editor inline-format state bug reported by the user. No new feature is added.

## Fixes
1. **B / S / H become explicit future-input switches**
   - Bold, strikeThrough and highlight no longer import their active state from the caret's inherited formatting.
   - Moving a collapsed caret into or immediately after already-formatted text cannot re-activate the toolbar or force the next character to inherit that format.

2. **Selection editing is separated from future typing state**
   - With a non-collapsed selection, B / S / H toggle the existing selected text only.
   - Selection formatting does not alter the persistent future-input switches.
   - H selection toggle treats a fully highlighted selection as removable; mixed/plain selection is highlighted in one tap.

3. **Native input is preserved**
   - No `beforeinput` event is cancelled and no typed character is manually reinserted.
   - Before text-like insertion, Chromium's pending collapsed-caret command state is only synchronized to the three manual switches.
   - This avoids introducing a custom text-input pipeline that could break Android IME composition, undo/redo or caret behavior.

4. **Highlight color picker remains compatible**
   - With a selection: recolors existing selected text only.
   - With a collapsed caret: choosing a color intentionally enables future highlight input in that color.

## Explicitly unchanged
- v1.22.3 IME geometry, toolbar-at-keyboard-edge and one-shot caret reveal functions.
- `#noteEditorBody` remains the only Note text scroll owner.
- Reminder / Daily / Banner / Snooze stable native core.
- Note attachments, WeChat/QQ import, file/image cards, PDF/file viewer and business storage keys.
