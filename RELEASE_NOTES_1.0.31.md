# Nexa 1.0.31 Release Notes

## Mindspace Crystal Star Nodes

This release replaces the remaining colored orb treatment in Mindspace and fixes duplicate node-label presentation seen on-device.

### Changed
- Semantic thought nodes no longer render as purple/gold spherical orbs. They use a crystalline diamond core with four-axis star rays, preserving a clear distinction from ambient background particles.
- Idle nodes use low-frequency staggered breathing and halo pulses. Selected nodes use a brighter restrained starburst pulse; pinned nodes receive only a subtle warm-white crystal tint rather than a colored ball.
- Node labels now use **one live text element**. Mid LOD writes the shortened title into that element; near LOD replaces it with the full title. Short and full copies cannot render simultaneously.
- Live node state is synchronized every layout frame (`is-selected`, `is-related`, `is-pinned`, dimmed state), fixing focus styling after a node is selected without a whole-DOM re-render.
- When a node is focused, its in-space text fades completely and the detail card becomes the single readable copy. Unrelated labels are strongly suppressed while directly related labels remain available.
- Screen-space collision, large-volume spread, relation geometry, 360° orbit, pinch zoom, overview navigator and Lunaxy-style ambient starfield remain unchanged.

### Data compatibility
- No storage/schema migration. `nexa_mindspace_v1` remains v1/v2 compatible exactly as in 1.0.30.

### Channels
- Stable: `com.nexa.app` / `1.0.31` / code 36.
- Beta: `com.nexa.app.beta` / `1.0.31-beta.1` / code 36.
- Clou: `com.nexa.app.clou` / `1.0.31-clou.1` / code 36.
