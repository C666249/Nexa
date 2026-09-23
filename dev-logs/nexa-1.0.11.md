# Nexa 1.0.11 validation log

Scope: notification/banner deep-target routing and global-search highlight parity.

- Added explicit action + URI identity for Todo/Daily notification PendingIntents.
- MainActivity uses singleTask/documentLaunchMode=never and retry/ack delivery to WebView.
- Todo/Daily native focus routes explicitly to the target module and plays one target sweep.
- Space global results mark matching title/metadata and use a one-pass gradient sweep.
- Global Note/Todo result opening carries the query into the destination search/highlight path.
- Browser-level Playwright acceptance was attempted, but this execution environment blocks both localhost and file navigation with ERR_BLOCKED_BY_ADMINISTRATOR; this is recorded as an environment limitation, not a passed runtime test.

Final staging validation (Nexa-1.0.11-Stable)
- Node CJS regression: 68/68 passed.
- Standalone JS regression files: 18/18 passed.
- UI JavaScript syntax: passed.
- Android XML parsing: passed.
- ui/ to Android assets byte mirror: passed.
