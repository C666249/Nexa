# To-Do V1.26.3 — Read-Mode Tap vs Scroll Gate

- Stable twin of Tree Beta V1.3.3, based only on V1.26.2.
- Fixes Read Mode incorrectly entering Edit as soon as the finger touches Note body during a scroll gesture.
- Edit is now committed only after a confirmed tap; drag, body scroll, and `pointercancel` remain pure reading gestures.
- A confirmed tap still uses the existing `enterNoteEditMode()` caret/IME path. The locked Note contenteditable lifecycle, IME geometry, format bar, attachments, AI features, Tree/Swipe and Native Reminder/Banner/Snooze are unchanged.
- Stable package: `com.todolist.app`; versionCode `57`; versionName `1.26.3`.

## Locked-core note

Only the Read-Mode pointer-intent gate is changed from V1.26.2. Native Kotlin/Java and the Golden Note IME/caret/format/attachment core must stay byte-identical.
