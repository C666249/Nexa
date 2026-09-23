# V1.22.10 — Note Dark Electric Links

## Changed
- Deepened Note HTTP(S) resting link palette for the warm/bright paper background.
- Resting gradient is now cyan-blue → electric blue → deep indigo: `#20C6D7 → #258DCE → #415098`.
- Kept the richer accent colors only in transient interaction: ice-blue `#80F4FF`, pearl-white `#F8FDFF`, and electric violet `#8B6CFF` sweep through while the link is pressed.
- Underline is darker and calmer at rest, then briefly brightens toward violet during press feedback.
- One-shot reveal remains subtle and reduced-motion remains supported.

## Safety boundary
- CSS-only runtime change.
- No JavaScript, Kotlin, URL recognition/linkify, browser-intent, IME/caret/scroll, B/S/H, image/PDF, attachment, reminder, Daily, Banner or Snooze runtime logic changed.
- No link layout-box changes: no inline-block, transform, width/height/top/bottom animation, so long URL wrapping remains on the V1.22.9 model.
