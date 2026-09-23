# PROJECT HANDOFF — To-Do V1.40.6 Stable

## Baseline
- Continued from V1.40.5 Stable; V1.40.5 runtime matched V1.40.3.

## Changes
1. Checklist collapse: no opacity fade/blanking; the expanded shell remains visually active until its measured height reaches zero. Added layout/paint containment and disabled scroll anchoring on checklist rows to reduce WebView repaint flashes, especially for long rows near the top of the viewport.
2. Note title: removed the separate yellow rounded title-highlight box; title remains on the same header surface.

## Compatibility
- No storage keys or todo/note data schema changed.
- Channel identity preserved.
