# 1.0.8 stability closeout — 2026-09-08

## Evidence and changes
The user-referenced chat requested fixing 1.0.7 Home/nav dead clicks and whole-page flicker, retaining Home stacking and 1.0.7 swipe/sheet motion.

The new real-touch browser test failed on the original source with `closeOtherDailySwipeItems is not defined`. Navigation now calls the actual Daily reset API.

Route-only rendering is gated by per-surface invalidation. Existing business operations still explicitly render or surgically update their DOM; storage saves and reloads mark surfaces dirty. Full-list route transforms and the body.offsetWidth flush were removed. Lightweight header animation is cancelled/replaced on rapid navigation. Hidden Todo stack geometry is not sampled, and route changes reschedule it.

Home refresh compares template markup rather than live odometer/stack animation changes. Space entry has one render owner.

Android testing found Note Move Back left a blocking overlay on Home. This was reproduced before fixing and now consumes Back at the Note-move layer; navigation also explicitly closes it.

## Executed checks
- Node regression suite (all .test.cjs and .test.js); see final log.
- Chromium mobile: 100/300/500 task/note fixtures; each 10 cycles through five routes. Real touch hit testing, no page errors, unchanged root-list mutations = 0, original cards retained, changed-data refresh, Home shortcut.
- Browser additional checks: scroll restoration, unchanged Home node retention, no list route CSS animation, reduced-motion navigation (see final acceptance log).
- Android35 emulator: 30 touch route changes, Checklist expansion/child completion, Todo Reminder / Daily Editor / Note Move and physical Back, Todo deletion/Undo, Note right Drawer, reading/Back, background/resume. No observed JS errors.
- Native instrumentation: ZIP roundtrip, Chinese attachment/image bytes, typed preferences, no overwrite, originals retained, traversal rejection, idempotence, forced commit failure rollback and interrupted recovery.
- Offline Gradle builds with cached JDK21 / Gradle8.11.1 / SDK35.

## Limits and continuation
No user's physical phone was connected. Vendor-ROM frame pacing, lock-screen behavior and release signing are not certified. Stable is channel identity, not a claim of zero defects. Existing animations were retained, not redesigned.

Tools: nexa-route-acceptance.cjs (Playwright + local Edge) and nexa-device-acceptance.cjs (fixture-only emulator-5554). Never inject fixtures on a personal device.
GRADLE_USER_HOME=D:\gradle-home; JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot.
Original source remains at D:\edge download\Chatgpt-app-projects\beta\Nexa-1.0.7-Beta for comparison/rollback.
