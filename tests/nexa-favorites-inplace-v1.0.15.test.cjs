const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ws=read('ui/nexa-workspace.js');
const css=read('ui/nexa.css');

test('favorite rows use an in-place open action instead of the normal route jump',()=>{
  assert.match(ws,/data-nx-favorite-open/);
  assert.match(ws,/if\(b\.dataset\.nxFavoriteOpen\)/);
  assert.match(ws,/openFavoriteTodo/);
  assert.match(ws,/openFavoriteNote/);
});

test('favorite Todo exposes local operations without requiring Todo navigation',()=>{
  assert.match(ws,/nexaFavoriteDetail/);
  assert.match(ws,/data-nx-fav-todo-status/);
  assert.match(ws,/data-nx-fav-sub/);
  assert.match(ws,/data-nx-fav-reminder/);
  assert.match(ws,/data-nx-fav-tags/);
  assert.match(ws,/data-nx-fav-delete/);
  assert.match(css,/\.nexa-favorite-detail/);
});

test('favorite Note keeps the Space route and reuses the full editor',()=>{
  const noteFn=ws.match(/function openFavoriteNote\(id\)\{[^\n]+/s)?.[0]||'';
  assert.match(noteFn,/openNoteEditor/);
  assert.doesNotMatch(noteFn,/NexaShell\.navigate\('notes'\)/);
  assert.match(ws,/nexa-favorite-note-open/);
});

test('Back and close restore Favorites scroll instead of routing to hub or another surface',()=>{
  assert.match(ws,/favoriteDetailScroll/);
  assert.match(ws,/restoreFavoriteScroll/);
  assert.match(ws,/favoriteNoteReturn/);
  assert.match(ws,/if\(favoriteDetailOpen\(\)\)\{closeFavoriteDetail\(\);return 'nexa-favorite-detail';\}/);
  assert.match(ws,/spaceView='favorites'/);
});
