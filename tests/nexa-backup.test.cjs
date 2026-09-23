const {test}=require('node:test');const a=require('node:assert/strict');const b=require('../ui/nexa-backup.js');
test('legacy migrated negative Note and Topic IDs survive exactly; duplicate or zero IDs still fail',()=>{
 const data={todo_glass_note_topics_v2:JSON.stringify([{id:-4294967296,title:'旧文件夹',parentTopicId:null}]),todo_glass_note_docs_v2:JSON.stringify([{id:-123,title:'旧正文',content:'<p>完整保留</p>',topicId:-4294967296}])};
 a.equal(b.validate(data),data);
 a.throws(()=>b.validate({todo_glass_note_docs_v2:JSON.stringify([{id:-1,content:'一'},{id:-1,content:'二'}])}),/重复/);
 a.throws(()=>b.validate({todo_glass_note_docs_v2:'[{"id":0,"content":"零"}]'}),/标识/);
 a.throws(()=>b.validate({todo_glass_data:'[{"id":-1}]'}),/标识/);
});
test('shared Space accepts migrated Note references without rewriting their IDs',()=>{
 const s=require('../ui/nexa-space.js');const m=s.seed(s.empty(),[],[{id:-99,title:'历史目录'}],[{id:-123,topicId:-99}]);
 a.deepEqual(m.assignments['note:-123'],['topic:-99']);a.deepEqual(s.assign(m,'note',-123,['topic:-99']).assignments['note:-123'],['topic:-99']);
});
function memory(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}
test('backup restoration is all-or-nothing for storage quota failure',()=>{const s=memory();s.setItem('a','old');let calls=0;const failing={...s,setItem:(k,v)=>{if(++calls===3)throw Error('quota');s.setItem(k,v);}};a.throws(()=>b.restore(failing,{a:'new',b:'2',c:'3'}),/quota/);a.equal(s.getItem('a'),'old');a.equal(s.getItem('b'),null);});
test('populated storage refuses replacement and malformed records fail closed',()=>{
 const s=memory();s.setItem('todo_glass_data','[{"id":1}]');a.equal(b.populated(s),true);s.setItem('todo_glass_data','bad');a.equal(b.populated(s),true);
 a.throws(()=>b.validate({'todo_glass_note_docs_v2':'not json'}));a.throws(()=>b.validate({'todo_glass_data':'{}'}));
});
test('valid backup preserves every string including history and preferences',()=>{
 const s=memory(),data={'todo_glass_data':'[]','todo_glass_note_docs_v2':'[]','todo_glass_daily_tasks_v1':'[]',todo_glass_history:'["你好"]',other:'x'};
 b.validate(data);b.restore(s,data);a.equal(s.getItem('todo_glass_history'),'["你好"]');a.equal(s.getItem('other'),'x');
});
test('an existing Space with no tasks is still populated; invalid documents cannot be normalized away',()=>{
 const s=memory();s.setItem('nexa_space_v1','{"version":1,"nodes":[{"id":"a","title":"工作","parent":null}],"assignments":{},"favorites":{},"legacy":{}}');a.equal(b.populated(s),true);
 a.throws(()=>b.validate({'todo_glass_note_docs_v2':'[{"content":"data without identity"}]'}));
});
