# Nexa 1.0.18 Stable

## Request
Remove the bottom-left three-dot control from inline Note image previews and keep the full-screen preview Share button as the only share entry.

## Implementation
- New image blocks no longer create `.note-image-more`.
- The editor removes legacy `[data-note-image-more]` / `.note-image-more` controls when older note HTML is loaded.
- Full-screen preview Share still opens the existing image share actions; delete and preview gestures are unchanged.
- Back still closes image actions before the image preview.

## Validation
- Full Node regression: 108/108 pass.
- JavaScript syntax: pass.
- Static contract / channel / WebView mirror / XML validation: 28/28 pass.
- Gradle compile was attempted, but this container cannot resolve `services.gradle.org`, so Gradle 8.11.1 cannot be downloaded here. This blocks the build before project compilation; no APK build success is claimed.
