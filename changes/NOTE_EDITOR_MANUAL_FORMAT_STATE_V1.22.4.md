# Note editor manual inline-format state — v1.22.4

## Reported v1.22.3 behavior
- B could turn itself back on when the caret was placed at the end of existing bold text, causing the next character to inherit bold.
- S strike-through showed the same caret-inheritance problem.
- H could be visually off while Chromium still retained a highlighted pending insertion state, so one H tap appeared ineffective and a second tap was needed to truly return to normal text.

## Root model problem
The editor mixed two different concepts:
1. **Formatting already present at the caret/selection**, exposed by `queryCommandState()` / `queryCommandValue()`.
2. **Formatting the user explicitly wants for the next input.**

V1.22.3 allowed caret ancestry to drive B (and S through generic toolbar mirroring), while H kept a separate manual boolean. Chromium contenteditable also retains inline command state at a collapsed caret. Those sources could disagree.

## v1.22.4 model
- `_boldActive`, `_strikeActive`, `_highlightActive` are the only authority for future collapsed-caret input.
- A caret move never imports B/S/H state from surrounding text.
- Pointer placement and text-like `beforeinput` only synchronize Chromium's pending command state to those booleans; they do not alter `scrollTop`, prevent input or insert replacement characters.
- Non-collapsed selections use native `execCommand` to edit existing text, without changing future typing booleans.
- Highlight OFF neutralizes inherited background only for the pending collapsed insertion state using the Note editor background color.

## Acceptance behavior
1. Turn B on, type bold, turn B off, place caret after existing bold text, type: new text is normal and B stays off.
2. Repeat exactly for S.
3. Turn H on, type highlighted text, turn H off, place caret after highlighted text, type: new text is normal in one OFF action; no two-tap exit.
4. Select existing plain text and tap B/S/H: selection is formatted; tap the same control again while selected: format is removed.
5. Selection formatting does not silently arm future typing.
6. Long-press H color picker continues to recolor selections and enable the chosen highlight color for collapsed-caret future input.
7. Long-note keyboard/caret/scroll behavior from v1.22.3 remains unchanged.
