# Nexa 1.0.9 implementation / validation — 2026-09-08

Base: user-uploaded `Nexa-1.0.8-Stable.zip`, with matching 1.0.8 Beta used only to preserve channel identity differences.

## Requested UX changes
- Increase Todo/Note list information density toward ~7 short visible rows on a phone screen.
- Remove the visually duplicated second Todo label button while preserving Space shared-label data.
- Category chip toggles itself closed, rotates its arrow and animates picker open/close.
- Category selection in the new-Todo composer must not dismiss the active IME.
- New-Todo composer can stage a reminder before the Todo exists.

## Implementation
- Todo closed rows use a ~60 px rhythm with reduced card gap/padding/radius/shadow; expanded Checklists remain content-sized.
- Note recent/document/topic cards and Note folder-tree rows are compacted without changing the editor or stored content.
- Todo main-list cards no longer inject the Space shared-tag button; Space label assignments/data are untouched.
- Todo category picker is a real toggle, with arrow rotation plus open/close motion and reduced-motion fallback.
- New-Todo category pointer handling preserves the focused title/checklist field so the IME stays open while selecting an existing category.
- New-Todo Reminder uses the existing date/time sheet. The timestamp stays in the draft until a real Todo ID exists, then persists and schedules through `AndroidBridge.scheduleTodoReminder`.

## Runtime issues caught during final acceptance
Static tests initially missed two accidental function removals in the category-picker refactor. A Chromium/CDP self-contained runtime acceptance reproduced them before packaging:
1. `onListScrollWhilePickerOpen` was referenced by listener cleanup/registration but missing. Restored with viewport-aware close/reposition behavior and RAF cleanup.
2. `getTodoById` was still referenced by the Todo-card category picker but missing. Restored with numeric ID normalization.
After the fixes, card category open → same-button close, create-category IME retention, category → reminder handoff, draft reminder confirmation, Todo creation/native scheduling, and duplicate-tag suppression all ran with zero runtime JS errors in the acceptance harness.

## Validation
- Node regression: 78 / 78 pass.
- `ui/*.js`: 10 / 10 syntax pass.
- `ui/todo.html` inline script: syntax pass.
- Android XML under `android/app/src/main`: 11 / 11 parse.
- HTML duplicate IDs: 0.
- WebView mirror: all 14 `ui/` files byte-identical to `android/app/src/main/assets/`.
- Chromium/CDP density check at 412×915: short Todo rows measured ~62 px and 8+ Todo cards fit in the visible content region in the controlled fixture, satisfying the ~7-row target.
- Gradle wrapper is present and executable in the delivery tree, but `./gradlew --version` cannot fetch Gradle 8.11.1 because this environment cannot resolve `services.gradle.org`; Android compilation is therefore not claimed.

No storage key, Todo/Checklist/Note/Daily schema, attachment format, Space label model, Stable package identity, or Stable upgrade chain changed.
