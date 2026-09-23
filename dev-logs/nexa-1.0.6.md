# Nexa 1.0.6 device-video regression

User evidence: Todo with 8 total rows (1 active, 7 completed) showed sticky overlap/cropped card contents and a large blank region. Home 88% rendered `88` tiny and `%` oversized.

Root causes:
1. Todo stack threshold was low enough to enable on 8 rows and completed rows were included. Hidden/sticky completed layers retained layout flow.
2. `.nexa-progress span` applied the 12px caption size to the odometer span itself.

Repair:
- 12-active-task global gate + minimum 4 rows in an active group; completed rows excluded.
- Boundary release before completed/date divider.
- Natural geometry uses offsetTop + list scrollTop; live anchor uses sticky header bottom.
- Odometer digits 52px, percent 24px; caption selector narrowed.
- Added `tests/nexa-regression-v1.0.6.test.cjs`.
