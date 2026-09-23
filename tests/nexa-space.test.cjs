const {test}=require('node:test');
const a=require('node:assert/strict');
const s=require('../ui/nexa-space.js');
test('legacy mapping preserves identities and merges equal root categories without changing sources',()=>{
 const todos=[{id:1,category:'工作'}], topics=[{id:2,title:'工作',parentTopicId:null},{id:3,title:'产品',parentTopicId:2}],notes=[{id:4,topicId:3}];
 const raw=JSON.stringify({todos,topics,notes});const model=s.seed(s.empty(),todos,topics,notes);
 a.equal(model.nodes.length,2);a.deepEqual(model.assignments['todo:1'],['topic:2']);a.deepEqual(model.assignments['note:4'],['topic:3']);
 a.equal(JSON.stringify({todos,topics,notes}),raw);a.deepEqual(s.seed(model,todos,topics,notes),model);
});
test('explicit cleared tags stay cleared on reseed and favorites persist',()=>{
 let m=s.seed(s.empty(),[{id:1,category:'工作'}],[],[]);m=s.assign(m,'todo',1,[]);
 m=s.seed(m,[{id:1,category:'工作'}],[],[]);a.deepEqual(m.assignments['todo:1'],[]);
 m=s.favorite(m,9,true);a.equal(m.favorites['9'],true);
});
test('move rejects cycles; deleting a label promotes children and preserves records',()=>{
 let m=s.empty();m=s.add(m,'a','A',null);m=s.add(m,'b','B','a');m=s.assign(m,'daily',4,['a','b']);
 a.throws(()=>s.move(m,'a','b'),/循环/);a.throws(()=>s.move(m,'a','missing'),/不存在/);
 m=s.remove(m,'a');a.equal(m.nodes[0].parent,null);a.deepEqual(m.assignments['daily:4'],['b']);
});
test('deleted imported topic stays deleted during reseeding',()=>{
 const topics=[{id:2,title:'工作',parentTopicId:null}];let m=s.seed(s.empty(),[],topics,[{id:4,topicId:2}]);
 m=s.remove(m,'topic:2');a.deepEqual(s.seed(m,[],topics,[{id:4,topicId:2}]),m);
});
test('deep tree traversal is iterative and search includes descendants across modules',()=>{
 let m=s.empty();for(let i=0;i<3000;i++)m.nodes.push({id:String(i),title:'标签'+i,parent:i?String(i-1):null});
 m=s.assign(m,'note',8,['2999']);a.equal(s.tree(m).length,3000);a.equal(s.matches(m,'note',8,'0'),true);
 a.throws(()=>s.assign(m,'note',8,['missing']),/不存在/);a.throws(()=>s.validate({version:99}),/版本/);
});
