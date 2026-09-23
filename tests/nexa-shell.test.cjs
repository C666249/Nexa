const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../ui/nexa-core.js');
test('five routes only, each workspace backs to home',()=>{
  for(const route of ['home','todo','notes','daily','space']) assert.equal(core.route(route),route);
  assert.equal(core.route('invalid'),'home');
  assert.equal(core.back('notes'),'home');
  assert.equal(core.back('daily'),'home');
  assert.equal(core.back('home'),null);
});
test('summary uses local date, no fabricated progress and no state mutations',()=>{
  const now=new Date(2026,8,5,12);
  const tasks=[{id:1,createdAt:new Date(2026,8,5,0).getTime(),status:'completed'},{id:2,createdAt:new Date(2026,8,4,23).getTime(),status:'todo'}];
  const snapshot=JSON.stringify(tasks);
  assert.deepEqual(core.summary(tasks,[],[],now),{total:1,done:1,percent:100,notes:0,daily:0});
  assert.equal(JSON.stringify(tasks),snapshot);
  assert.equal(core.summary([],[],[],now).percent,0);
  assert.equal(core.summary([],[],[{completedDates:['2026-09-05']}],now).done,1);
});
test('Space tree handles cycles, missing parents and deep trees without recursion',()=>{
  const rows=core.topics([{id:1,title:'A',parentTopicId:2},{id:2,title:'B',parentTopicId:1},{id:3,title:'C',parentTopicId:99}]);
  assert.equal(rows.length,3);
  assert.equal(new Set(rows.map(x=>x.id)).size,3);
  assert.equal(core.topics(Array.from({length:2000},(_,i)=>({id:i+1,parentTopicId:i||null}))).length,2000);
});
