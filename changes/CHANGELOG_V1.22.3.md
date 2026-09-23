# To-Do v1.22.3 — Note IME / Caret Visibility Fix

Base: v1.22.2 NoteEditorRootFix
Target: v1.22.3

## Scope
This release is limited to the remaining Note-editor keyboard regression reported on the target phone. No new feature is added.

## Fixes
1. **Android IME geometry is authoritative again — with correct CSS-pixel conversion**
   - Keeps the existing `WindowInsetsCompat.Type.ime()` native bridge.
   - Stops discarding native IME insets merely because `window.visualViewport` exists.
   - Converts Android physical pixels to CSS pixels using `window.devicePixelRatio`, avoiding the V1.22 raw-pixel overshoot risk.

2. **Format toolbar becomes a real keyboard-edge control**
   - The editor remains a flex column and the format bar remains in normal editor flow.
   - Applying the converted IME bottom space shortens the editor workspace, naturally placing the format bar immediately above the keyboard.
   - `visualViewport.offsetTop` remains compositor-only compensation if Chromium pans the visual viewport; body scrolling is not coupled to it.

3. **Caret is revealed only when geometry/tap requires it**
   - When the IME first appears or changes size, the focused caret is measured after layout and the Note body scrolls only by the minimum amount necessary to expose that line.
   - A direct pointer tap while the IME is already open may trigger the same one-shot reveal.
   - `input`, Backspace/Delete and `selectionchange` still do not restore or rewrite `scrollTop`, preserving the V1.22.2 jump-to-top root fix.

## Explicitly unchanged
- Reminder / Daily / Banner / Snooze stable native core.
- Note attachment import, WeChat/QQ share receiver, image/file cards and internal file viewer.
- Note data format, localStorage business keys, applicationId and namespace.
