# Nexa RC4 — Note highlight boundary hotfix — 2026-09-07

Baseline: uploaded Nexa 1.0.1 RC3 (`eb6f96a` / RC3 acceptance history present in repository).

## Root cause
Nexa overrides the Note editor surface to `#F7F2E8`, but the collapsed-caret H-off path still used legacy To-Do `#F5ECD8` as the neutral `backColor`. Chromium/WebView therefore wrapped following text in a nearly-matching beige span. It looked like a faint highlight/shadow attached to the first character after highlighted text.

## Fix
- H-off now resolves the live computed background of `#noteEditorBody` and uses that color to break highlight inheritance.
- Highlight removal on an existing selection uses the same live neutral color.
- Old stored neutral spans matching legacy `#F5ECD8` are remapped to the live Nexa editor neutral color when a note opens.
- Legacy neutral remains recognized as semantically non-highlighted for old notes.
- Unknown/pasted custom backgrounds are still left untouched.

## Regression
- Added `tests/note-highlight-neutral.test.cjs`.
- Full Node/static suite: 46/46 pass.
- Corrected stale pre-RC3 title-track test assertions to RC3's intentional no-track behavior.
- Web source / Android asset mirror remains identical.
- Android compilation unavailable in this handoff environment because SDK 35 and Gradle 8.11.1 distribution are not cached and outbound download is unavailable.
