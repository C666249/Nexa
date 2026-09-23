# V1.22.7 — Note HTTP(S) Auto Link

## Scope
Only the Note HTTP(S) link experience and the minimal Android external-URL bridge are changed.

## Behavior
- Explicit `http://` and `https://` URLs only; no fuzzy bare-domain recognition.
- URL completion is recognized on whitespace / Enter / paste.
- Live typing modifies only the just-completed text token. It never scans/replaces the whole editor on each keystroke.
- Legacy plain-text URLs are linkified before the Note editor receives focus.
- Link clicks are intercepted and delegated to Android `ACTION_VIEW`; the Note WebView does not navigate away.
- URL scheme/host are validated in both JS and Kotlin; non-http(s) schemes are rejected.

## Regression boundary
- No changes to reminder / Daily / Banner / Snooze runtime.
- No changes to NoteFileViewerActivity, ImportReceiverActivity, file/image import, PDF/image zoom.
- Existing V1.22.3 IME/caret architecture remains exact except unrelated surrounding source offsets.
- Existing V1.22.4 manual B/S/H implementation remains unchanged.
- Existing V1.22.6 focus-safe image preview implementation remains unchanged.
