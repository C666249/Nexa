# Knowledge Tree Drawer Swipe-Rail Flicker Fix

## Root cause evidence
The user video shows the Knowledge Tree drawer already open while several red/green Action Rails from the obscured Note surface flash simultaneously in the uncovered right strip. This points to Android WebView layer compositing of GPU-backed swipe layers under the translucent drawer/backdrop, not to a single Topic gesture or delete/rename logic failure.

## Fix
1. Before drawer composition starts, reset every Note/Topic swipe row to x=0 and reset both gesture state machines.
2. Add `body.note-tree-drawer-open` while the drawer is visible. Under this class, background swipe action rails use `display:none!important`, so there is no layer to leak through the backdrop.
3. Keep the class until the full 300ms close transition completes. A pending close timer is cancelled when reopening, preventing a close/reopen race from re-enabling rails underneath an open drawer.

## Locked
No changes to swipe width/threshold/settle physics, Topic safe-delete, virtual Unclassified, Recent Drawer direction arbitration, Note Editor/IME, persistence schema, Native reminder/daily/banner/snooze chain.
