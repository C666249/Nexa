# Note HTTP(S) Ice/Cyan Motion Style — V1.22.9

## Product intent
The link should be quiet while reading and feel alive only when it appears or is pressed.

### Resting state
- Two colors only: ice blue `#86E8FF` → cyan `#26D6C8`.
- Thin cyan underline.
- Visited links keep the same product style.

### One-shot reveal
- Runs once when an anchor enters the rendered editor DOM.
- Approximately 520ms.
- Paint-only: background size/position, opacity, text shadow and underline color.
- A restrained violet accent appears only mid-animation, then disappears.

### Press feedback
- Approximately 380ms while `:active`.
- A wider off-screen gradient is positioned so the resting viewport shows only ice/cyan; pointer press moves the background position across a violet + pearl-white band.
- Underline and glow briefly brighten, then the normal ice/cyan rule takes over.

### Safety choices
- No permanent animation loop.
- No `inline-block` conversion and no scale transform, because those can alter wrapping/line boxes in a long contenteditable URL.
- No JavaScript class insertion or linkify changes.
- `prefers-reduced-motion: reduce` disables both animations.
