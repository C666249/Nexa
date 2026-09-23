# V1.22.9 — Note Ice-Cyan Animated Links

## Changed
- Note HTTP(S) link static palette is now ice-blue → cyan only (`#86E8FF → #26D6C8`).
- Added one-shot link reveal animation using only paint/compositor-friendly CSS properties.
- Added press-time sweep transition with brief violet + pearl-white highlight; the resting state always returns to ice/cyan.
- Added reduced-motion fallback.

## Safety boundary
- CSS-only runtime change.
- No JavaScript, Kotlin, IME, caret, selection, linkify, browser-intent, image/PDF, attachment, reminder, Daily, Banner or Snooze logic changed.
- No `display:inline-block`, width/height/top/bottom or transform changes were introduced for links, so long-URL line wrapping keeps the V1.22.8 layout model.
