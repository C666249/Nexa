# Note HTTP(S) Auto-Link Architecture — V1.22.7

## Scope
This release adds clickable web links to Note body text without turning the existing contenteditable editor into a new editor framework.

## Recognition boundary
- Auto-link only explicit `http://` and `https://` URLs.
- Do not fuzzy-link `example.com`, `www.example.com`, IP-like text, or email-like text.
- Reject non-http(s) protocols in both JavaScript and the Android bridge.
- Reject credential-bearing URL text (`user:pass@host`) from auto-link creation.

## Live-editor safety
- Never scan or replace the whole Note on every key stroke.
- Space: inspect only the URL token immediately before the caret.
- Enter / line break: capture only the just-completed token before Chromium splits the text block, then link it after native input completes.
- Paste: do not cancel or rewrite the paste event; inspect only the token at the caret after Chromium inserts it.
- Use the existing browser editing engine and `execCommand(createLink)` for the narrow selected URL range; preserve/restore the caret text offset and body scroll position.
- The manual B/S/H state remains authoritative and is re-synchronized by the already-existing beforeinput path on the next typed character.

## Legacy notes
Existing plain-text HTTP(S) URLs are linkified only immediately after `bodyEl.innerHTML = note.content` and before the editor is focused. There is therefore no live caret, IME, or toolbar geometry to disturb.

## Click behavior
- Intercept only valid HTTP(S) anchors inside `noteEditorBody`.
- The Note WebView never navigates to the remote page.
- Delegate to Android through a minimal `openExternalUrl()` bridge using `Intent.ACTION_VIEW` / `CATEGORY_BROWSABLE` after scheme/host validation.
- Browser fallback (`window.open`) exists for non-Android local HTML testing.

## Explicitly locked
- V1.22.3 IME WindowInsets / toolbar-at-keyboard-edge / one-shot caret reveal / single Scroll Owner.
- V1.22.4 B / S / H manual typing-state architecture.
- V1.22.5 PDF and image pinch/pan.
- V1.22.6 focus-safe inline-image preview entry.
- File/image import, PDF viewer, Reminder/Daily/Banner/Snooze.
