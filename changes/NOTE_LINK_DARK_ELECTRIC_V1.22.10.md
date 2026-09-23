# Note Link Dark Electric Visual — V1.22.10

## Visual goal
The Note background is intentionally warm and bright. V1.22.9's ice-blue/cyan resting colors were too close to the paper luminance, so the link looked washed out.

V1.22.10 keeps the cold/clean identity but shifts the resting palette darker:

- Cyan-blue: `#20C6D7`
- Electric blue: `#258DCE`
- Deep indigo: `#415098`

The active sweep may temporarily use:

- Ice-blue: `#80F4FF`
- Pearl-white: `#F8FDFF`
- Electric violet: `#8B6CFF`

## Motion model
- Resting: no continuous animation, no persistent glow.
- First appearance: one short reveal using opacity / text-shadow / underline color only.
- Press: `background-position` moves across the off-screen highlight band so ice/pearl/violet briefly sweeps through the glyphs and underline.
- Release: immediately returns to the darker resting palette.
- `prefers-reduced-motion`: disables reveal and sweep movement.

## Layout safety
The anchor remains an inline text element. This release does not add `inline-block`, scale/transform, width, height, position offsets or other line-box changes. Long URLs therefore keep the same wrap/selection/caret geometry as V1.22.9.
