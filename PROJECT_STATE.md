# Nexa Project State

## Current cloud release: 1.0.38 (versionCode 44)

- Package id remains `com.nexa.app.cloud`; visible app name remains Nexa.
- Timeline route bug fixed at the source: `NexaCore` now treats `timeline` as a first-class route.
- Todo long-press Peek/action sheet is removed from the reorder gesture. A 330ms hold directly lifts the card into reorder; short tap remains a normal tap.
- Cross-day drag, Today drop target and edge auto-scroll remain enabled.
- FMV 3.2.1 from `C666249/personal-app-stack` is the motion reference. Added bounded Wenku8-style page entry, subtle icon spring feedback, FMV drag lift polish and geometric disclosure chevrons.
- Data schema and backup/restore keys are unchanged.
- Fixed Cloud signing key must be reused for all future `com.nexa.app.cloud` builds.
