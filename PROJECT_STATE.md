# Nexa Project State

## Current release: 1.0.18 (versionCode 23)

- Removes the bottom-left inline ellipsis from Note image cards for a cleaner preview/edit surface.
- Image sharing keeps a single deliberate entry point: tap the image to open full-screen preview, then use the top Share control.
- Older notes created by 1.0.16/1.0.17 are cleaned at render time so their stored inline ellipsis button is not shown.
- Existing image delete, full-screen zoom/pan, Android share sheet, WeChat/QQ targets, Favorites overlay behavior and Back hierarchy remain unchanged.

## Channels
- Stable: `com.nexa.app`, `Nexa`, `1.0.18`, code `23`.
- Beta: `com.nexa.app.beta`, `Nexa β`, `1.0.18-beta.1`, code `23`, isolated data and β launcher icon.

## Previous release: 1.0.17 (versionCode 22)


- Fixes the 1.0.16 Android Kotlin compile failure in `MainActivity.kt`: `openNoteFileWithExternalApp()` now uses the existing `getShareableFileUri(file)` helper instead of the nonexistent `getNoteFileUri(file)`.
- Adds a regression assertion that rejects the stale unresolved helper name and verifies the external-file-open path uses the same FileProvider URI helper as Note image/file sharing.
- Note image sharing, file sharing, Favorites in-place editing and Back/scroll preservation remain unchanged.


- Note gallery images are no longer dead-end embeds: every inline image gets a persistent More control and full-screen preview gets a Share control.
- Image actions mirror file attachments: direct WeChat / QQ sharing, Android Sharesheet “更多应用”, and explicit delete. Existing images from older notes are upgraded in-place when the editor opens.
- Android FileProvider now exposes `note_images/` with read-only URI grants, while native sharing preserves image MIME types.
- File attachment “更多应用” now correctly opens the Android share chooser instead of behaving like an external viewer action.
- Back closes the image action sheet before the full-screen image preview, preserving the editor and Favorites-library overlay hierarchy.


- Favorites Library is now a stay-in-place workflow: favorite rows no longer route away to Todo/Note.
- Favorite Todo opens an in-library bottom action drawer for title, state/checklist, reminder, shared labels, favorite state and deletion.
- Favorite Note opens the existing full rich-text editor as an overlay while `NexaShell.page` remains `space`; closing it restores Favorites instead of entering Note.
- Favorites captures and restores its scroll position across detail editing, favorite toggles and Back. Android system Back consumes nested reminder/confirm/editor layers before the favorite detail, then returns to the exact Favorites view.
- Daily history calendar and selected-day detail are real bottom drawers with integrated drag handles. Dragging no longer drops horizontal-centering transforms, so the sheet stays geometrically stable instead of flying sideways.
- The grab area is integrated into each colored header; the generic motion layer no longer injects a second white handle row for these drawers.
- Daily Back/close/background/drag dismissal is hierarchical: day detail closes first, then the history drawer. Both retain velocity-aware drag, rebound and reduced-motion fallback.
- Todo adds a right-swipe Favorite action with a five-point star and a mirrored physical curve. Existing left swipe remains Reminder -> deep Delete.
- Todo and Note favorites share a namespaced model (`todo:<id>` / `note:<id>`), while legacy Note favorite IDs remain readable.
- Space now exposes `收藏库` as a first-class sibling of `内容库`, with its own search and All/Todo/Note filters. The old small favorites filter inside Content Library is removed.
- 1.0.13 staged Todo search-history curtain, 1.0.11 reminder deep-target routing and global-search highlight behavior remain intact.

## Validation
Final Stable/Beta staging trees run the complete Node regression, JS syntax, XML, channel identity/version, WebView mirror and ZIP integrity checks. Android compilation is claimed only when the SDK/Gradle dependencies are genuinely available.

## Channels
- Stable: `com.nexa.app`, `Nexa`, `1.0.17`, code `22`.
- Beta: `com.nexa.app.beta`, `Nexa β`, `1.0.17-beta.1`, code `22`, isolated data and β launcher icon.

## Historical baseline: Nexa 1.0.7 — 2026-09-07

Production identity remains `com.nexa.app`; this round is `versionName 1.0.7`, `versionCode 12`. No Todo / Checklist / Note / Daily / Space storage schema is renamed or migrated.

## 1.0.7 — Banner-style card gestures + physical action sheets

This round continues from 1.0.6 and replaces the temporary bilateral swipe experiment with one consistent left-swipe distance ladder inspired by Nexa's native reminder Banner.

### Unified card gesture
- **Todo**: short left drag previews; first detent = Reminder; deep detent = Delete.
- **Daily**: first detent = Edit; deep detent = Delete.
- **Note**: first detent = Move; deep detent = Delete.
- Right drag is never captured by Todo/Daily/Note card actions. In Note it once again belongs to the knowledge-tree Drawer even when the drag begins directly on a Note card.
- The first action detent is based on roughly 18% card width; the deep destructive detent is roughly 40% plus a minimum safety distance. This mirrors the native Banner's distance-dependent +5/+10 min grammar instead of exposing fixed action buttons.
- During the drag only the currently targeted icon + label is painted. Crossing a detent gives one haptic tick; releasing below the first detent springs the card home.

### Delete / Undo motion continuity
- Deep left release transfers the card's exact finger-release X offset into the existing curved left-fly deletion animation.
- Todo, Daily and Note deletion all capture the same departure trace.
- Undo restores data first and uses `NexaMotion.curveReturn()` to replay that exact trace backwards, then springs the card from the original swipe-release offset back to rest. No sudden reappearance.
- Note attachments remain deferred until the undo window commits, so swipe delete cannot destroy native attachment files before the user has a chance to undo.

### Reminder / Edit / Move sheet entrance
- Todo Reminder, Daily Edit and Note Move now enter from below the viewport.
- The sheet carries slight overshoot past its final resting position, slows during the last third, then settles with a small counter-motion; duration ~480ms.
- Daily input focus waits for the entrance to settle before opening the IME, preventing keyboard geometry from interrupting the animation.
- These three surfaces also join the existing velocity-aware spring-sheet drag/dismiss system.

### Preserved
- 1.0.6 long-list stack gating and completed-row stability.
- Home completion typography fix.
- 1.0.5 transform-only Shared Axis route transitions.
- Writing Checkbox, completion settle, reorder physics, Space hierarchy, Note morph/search/FAB, Peek, odometer/ring and reduced-motion fallback.
- 1.0.2 Note highlight-boundary normalization.

## Validation
Final Stable/Beta staging trees must each run the complete Node regression, JS syntax, XML, channel identity/version, WebView mirror and ZIP integrity checks. Android compilation is claimed only when the SDK/Gradle dependencies are genuinely available.

## Channels
- Stable: `com.nexa.app`, `Nexa`, `1.0.7`, code `12`.
- Beta: `com.nexa.app.beta`, `Nexa β`, `1.0.7-beta.1`, code `12`, isolated data and β launcher icon.
