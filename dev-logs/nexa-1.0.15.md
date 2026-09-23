# Nexa 1.0.15

## Implemented
- Replaced Favorites Library jump-navigation with an in-place editing workflow.
- Todo favorites open a Space-owned bottom detail sheet. It edits title, tri-state status or checklist completion, opens the existing reminder picker, edits shared labels, toggles favorite, and can delete through the existing recycle/undo path.
- Note favorites open the existing full rich-text Note editor while the Space route stays active, preserving all mature Note editing behavior without cloning a second editor.
- Added explicit Favorites return-state tracking so editor/detail close and Android system Back restore the prior scroll position.
- Back priority is nested: dialog/Note editor/reminder/confirm -> favorite detail -> Favorites page -> Space hub.

## Compatibility
- No storage schema changes. Existing namespaced Todo/Note favorites and legacy Note favorites remain readable.
- Stable identity remains com.nexa.app. Beta is staged separately as com.nexa.app.beta with isolated data and beta launcher icon.

## Validation
- Full Node regression: 104/104 passed.
- UI/Android WebView mirrors verified byte-identical for `todo.html`, `nexa-workspace.js`, and `nexa.css`.
- All UI/Android asset JavaScript passed `node --check`; Android XML parsed successfully.
- Android Gradle build was attempted with the bundled wrapper, but this environment could not resolve `services.gradle.org` (`UnknownHostException`) while downloading Gradle 8.11.1. No APK build success is claimed.
