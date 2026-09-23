# Phases and acceptance gates

RC2 status: Phases 1–7 implementation progressed; final release gates remain in
docs/release-checklist.md. Current evidence: dev-logs/nexa-rc2.md.

Historical status: Phases 1–3 implemented. Phase2 also established shared visual foundations and
initial Daily/Space surfaces; this does not replace their later data/interaction phases.
Current verification evidence is in dev-logs/nexa-phase3.md.

1. Engineering identity, native theme/icon, independent source copy, build and baseline audit.
2. Bottom navigation and return/IME/gesture state regression; preserve unsaved edits.
3. Real-data Dashboard, empty states, local-date statistics and direct navigation.
4. Todo paper cards, checklist in-place motion, swipe masking and CRUD regressions.
5. Reading-first Note, compact toolbar/more, rich text/IME/title/italic/image regressions.
6. Daily calendar/history/date details, statistics and reminder regressions.
7. Shared Space tree with tested lossless legacy mapping, cycle guards and depth handling.
8. Full review, migration integration, Android device tests, artifact/source integrity,
   Android Studio open/build, final ZIP with settings.gradle.kts at archive root.

Migration route must be confirmed before cross-package migration implementation.
The user now authorizes continuous execution through remaining phases without interim approvals.
Never name preliminary artifacts Stable. Keep original code/documents for traceability.
