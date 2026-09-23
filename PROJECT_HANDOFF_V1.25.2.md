# To-Do V1.25.2 — Topic Rail Lifecycle / Tree Local-Update Handoff

## Root-cause correction
The real-device video proved the V1.2.1 / V1.25.1 diagnosis was incomplete. A Topic Action Rail could flash while the Drawer was not open at all: expanding `未分类` could briefly expose another Topic's `重命名 / 删除` rail. Therefore the fault was not Drawer compositing alone.

Two structural causes were present:
1. every closed Topic row permanently rendered its rail behind a GPU-backed `will-change: transform` foreground;
2. a single expand/collapse called `renderNoteList()` / `renderFolderSidebar()`, destroying and recreating the entire tree and all swipe layers. Android WebView could commit the background rail layer one frame before the opaque foreground returned.

## Fix
- Closed Topic rows keep Action Rails `visibility:hidden; opacity:0; pointer-events:none`.
- `rail-active` is enabled only after the gesture locks horizontally to a valid left swipe, and `open` keeps it active while revealed.
- During animated close the rail stays alive only through the 200ms foreground settle, then becomes non-rendered again.
- `will-change: transform` is no longer permanent; it exists only while the row is swiping/open.
- Main Knowledge Tree Topic and `未分类` toggles update only the touched branch.
- Drawer Topic and `未分类` toggles update only the touched branch.
- The V1.2.1 Drawer/body CSS suppression workaround is removed.

## Header polish
Undo / Redo keep the same commands and the same 28px Header action height, but use 22px SVG arrows with 2.6px rounded strokes. The Done ✓ is visually strengthened to 22px. This intentionally avoids changing the V1.0.4 verified Header vertical geometry / MagicOS IME relationship.

## Locked
No changes to Note/Topic swipe constants (124 / 48 / 200), safe Topic delete/rename semantics, Recent directional Drawer arbitration, Schema V2 keys, Note Editor IME/caret algorithms, B/S/H, links, images/PDF, attachments/annotations, Reminder/Daily/Banner/Snooze Native core.
