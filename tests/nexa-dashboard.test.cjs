const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../ui/nexa-core.js');
const at=(day,hour=12)=>new Date(2026,8,day,hour).getTime();
test('today includes created OR reminded tasks once; checklist counts as one parent',()=>{
  const tasks=[{id:1,createdAt:at(5),reminderAt:at(5,15),status:'completed',checklist:[{done:true}]},{id:2,createdAt:at(4),reminderAt:at(5,9),status:'todo'},{id:3,createdAt:at(4),status:'completed'},{id:4,createdAt:at(6),status:'todo'}];
  const result=core.dashboard(tasks,[],[],new Date(at(5)));
  assert.equal(result.todayTotal,2);assert.equal(result.todayDone,1);assert.equal(result.percent,50);
  assert.equal(result.schedule.length,2);
  assert.equal(JSON.stringify(tasks[0].checklist),'[{"done":true}]');
});
test('Daily eligibility, completion, time order and status use local time',()=>{
  const daily=[{id:1,createdAt:at(4),hour:8,minute:30,completedDates:[]},{id:2,createdAt:at(4),hour:14,minute:0,completedDates:['2026-09-05']},{id:3,createdAt:at(6),hour:10,minute:0,completedDates:[]}];
  const result=core.dashboard([],[],daily,new Date(at(5)));
  assert.equal(result.todayTotal,2);assert.equal(result.todayDone,1);
  assert.deepEqual(result.schedule.map(s=>[s.kind,s.id,s.state]),[['daily',1,'elapsed'],['daily',2,'done']]);
  const next=core.dashboard([],[],daily,new Date(at(6)));
  assert.equal(next.todayTotal,3);assert.equal(next.todayDone,0);
});
test('empty data and invalid timestamps never create fictitious activity',()=>{
  const result=core.dashboard([{id:1,createdAt:'bad',reminderAt:0,status:'todo'}],[],[],new Date(at(5)));
  assert.equal(result.todayTotal,0);assert.equal(result.percent,0);assert.equal(result.schedule.length,0);
});
test('dashboard is read-only and recent notes sort by modification time',()=>{
  const notes=[{id:1,createdAt:at(4),updatedAt:at(5)},{id:2,createdAt:at(5),updatedAt:at(4)}];
  const before=JSON.stringify(notes);
  const result=core.dashboard([],notes,[],new Date(at(5)));
  assert.deepEqual(result.recentNotes.map(n=>n.id),[1,2]);assert.equal(JSON.stringify(notes),before);
});
test('unfinished tasks from previous days remain visible in home pending total after midnight',()=>{
 const tasks=[{id:1,createdAt:at(4),status:'todo'},{id:2,createdAt:at(4),status:'in-progress'},{id:3,createdAt:at(4),status:'completed'}];
 const data=core.dashboard(tasks,[],[],new Date(at(6)));
 assert.equal(data.pendingTaskCount,2);assert.equal(data.allTaskCount,3);assert.equal(data.todayTotal,0);
});
