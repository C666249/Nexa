const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const space=require('../ui/nexa-space.js');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'ui/todo.html'),'utf8');
const workspace=fs.readFileSync(path.join(root,'ui/nexa-workspace.js'),'utf8');
const css=fs.readFileSync(path.join(root,'ui/nexa.css'),'utf8');

test('Todo and Note favorites are namespaced and legacy Note favorites remain readable',()=>{
 let m=space.empty();
 m=space.favorite(m,'todo',42,true);
 m=space.favorite(m,'note',42,true);
 assert.equal(space.isFavorite(m,'todo',42),true);
 assert.equal(space.isFavorite(m,'note',42),true);
 assert.equal(m.favorites['todo:42'],true);
 assert.equal(m.favorites['note:42'],true);
 m=space.favorite(m,'todo',42,false);
 assert.equal(space.isFavorite(m,'todo',42),false);
 assert.equal(space.isFavorite(m,'note',42),true);
 const legacy=space.favorite(space.empty(),7,true);
 assert.equal(space.isFavorite(legacy,'note',7),true);
});

test('Space exposes a standalone favorites library with search and All/Todo/Note filters',()=>{
 assert.match(workspace,/spaceView==='favorites'/);
 assert.match(workspace,/收藏库/);
 assert.match(workspace,/nexaFavoriteSearch/);
 assert.match(workspace,/\['todo','Todo'\]/);
 assert.match(workspace,/\['note','Note'\]/);
 assert.doesNotMatch(workspace,/onlyFavorites/);
});

test('Todo right swipe paints and commits a favorite action while left swipe stays reminder/delete',()=>{
 assert.match(html,/nexaFavoriteSwipePaint/);
 assert.match(html,/g\.direction==='right'/);
 assert.match(html,/setFavorite\?\.\('todo',id,true\)/);
 assert.match(html,/右滑收藏/);
 assert.match(html,/action==='reminder'/);
 assert.match(html,/deleteTodoById/);
 assert.match(css,/data-action="favorite"/);
 assert.match(css,/data-side="right"/);
});
