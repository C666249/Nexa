# Nexa 1.0.14

## Implemented
- Daily history calendar and selected-day detail converted/normalized as bottom drawers with integrated drag handles; no translateX-centering conflict during pointer drag.
- Existing grab controls are reused by Nexa Motion so no extra white drag row is inserted.
- Day detail closes before history drawer on Back, close, backdrop and drag dismissal.
- Todo right swipe now reveals a star Favorite action; commit stores Todo favorite and plays a rightward curved physical motion before returning to rest.
- Favorites model accepts namespaced Todo/Note keys and legacy Note keys.
- Space hub has a dedicated Favorites Library sibling with search and All/Todo/Note filters.

## Regression
Pre-staging Node suite: 100/100 pass. Final channel validation is recorded separately.
