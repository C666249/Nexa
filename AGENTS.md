# Nexa development handoff

Nexa is an independent app derived from the To-Do 1.40.6 data/function baseline. Continue only from the newest Nexa full-source handoff; never rebuild from memory or modify an unrelated To-Do source tree.

Read in order: `WORKFLOW.md` → `DELIVERY_RULE.txt` → `PROJECT_STATE.md` → `README-NEXA.md` → newest `dev-logs/nexa-*`.

Hard constraints:
- Stable/production-channel identity stays `com.nexa.app`; Beta stays `com.nexa.app.beta` with `Nexa β` and β launcher icon.
- Do not rename persisted keys, IDs, backup/restore schema, or rewrite business logic merely for branding.
- Keep WebView `ui/` assets and `android/app/src/main/assets/` mirrors synchronized.
- Work through implementation, self-review, regression and packaging in one round whenever possible.
- A ZIP named Stable denotes the production identity/source channel; do not claim release-signing or real-device acceptance unless those checks actually ran.
