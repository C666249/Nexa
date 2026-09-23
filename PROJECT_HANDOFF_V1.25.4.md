# To-Do V1.25.4 Handoff

## Baseline
Strictly based on Stable V1.25.3. Functional UI/JS twin of Tree Beta V1.2.4.

## Functional delta
1. Read Mode visually hides Undo / Redo / Done.
2. Edit Mode reveals the complete Header history group immediately.
3. The group remains in flex layout; only visibility/pointer participation changes, preserving title-row/action-slot geometry.
4. `aria-hidden` follows Read/Edit state.

## Stable identity
- applicationId `com.todolist.app`
- versionCode 52
- versionName 1.25.4
- No Beta signing config is introduced. Android Studio debug builds continue using the computer's normal debug keystore.

## Locked
V1.25.3 Rail lifecycle, Note Editor IME/caret, attachments, Schema V2, ToDo/Daily/Reminder/Banner/Snooze remain unchanged.
