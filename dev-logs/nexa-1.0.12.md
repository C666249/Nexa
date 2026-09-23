# Nexa 1.0.12 validation log

Scope: Todo search-history focus curtain and filtered-result visibility.

## Implementation
- Search history moved from a fixed viewport overlay into the Todo search field's relative container.
- Default state is hidden, non-interactive, and absent from ordinary browsing.
- Focusing Todo search opens recent queries as a top-anchored curtain with per-row stagger.
- Typing updates Todo filtering but no longer forces history open on every input event.
- Enter or history-row selection closes the curtain in reverse, blurs the search field, and leaves results unobstructed. The existing painted rows are retained through the exit motion; the hidden history list refreshes only after 380 ms.
- Clear keeps the field active and intentionally reopens history; deleting one history row does not collapse the list. Route navigation always force-closes history, and IME composition Enter is guarded so Chinese candidate confirmation does not submit the search.
- Search-history state participates in existing system Back handling and maintains `aria-hidden`.
- `prefers-reduced-motion` removes curtain/item transitions.
- 1.0.11 reminder deep-target routing and global-search gradient highlights were not changed.

## Final source validation
- Node regression: 91/91 passed on Stable and 91/91 passed on Beta.
- New 1.0.12 search-history regression: 5/5 assertion groups passed in both channels.
- External UI JavaScript syntax: 10/10 passed per channel.
- Inline `todo.html` JavaScript syntax: passed.
- Android XML parsing: 11/11 passed per channel.
- `ui/` to `android/app/src/main/assets/` mirror: 14/14 byte-identical per channel.
- Channel identity/version/APK output naming: passed.
- Clean-source scan: no `.idea`, `.gradle`, `build`, APK/AAB, signing key, or `local.properties` artifacts.

## Android build attempt
The bundled Gradle Wrapper was invoked for `:app:assembleDebug` in both channels. This environment could not resolve `services.gradle.org` while fetching Gradle 8.11.1 (`UnknownHostException`), so this delivery does **not** claim APK compilation success. The raw attempt is preserved in `dev-logs/1.0.12-gradle-attempt.log`.
