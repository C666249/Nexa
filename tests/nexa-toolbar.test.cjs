const {test}=require('node:test'),a=require('node:assert/strict'),t=require('../ui/nexa-toolbar.js');
test('toolbar normalization has exactly four common tools and retains every advanced command once',()=>{
 const order=t.normalize(['title','image','title','unknown']);a.equal(order[0],'title');a.equal(order[1],'image');a.equal(order.length,t.tools.length);a.equal(new Set(order).size,t.tools.length);a.equal(t.split(order).primary.length,4);
});
test('reorder crosses section boundary with no lost command; default is stable',()=>{
 const original=t.normalize(null),next=t.move(original,'title',0);a.equal(next[0],'title');a.deepEqual(original,t.normalize(null));a.deepEqual(new Set(next),new Set(original));
 const moved=t.move(next,'title',4);a.equal(t.split(moved).more[0],'title');a.throws(()=>t.move(next,'bad',0));
});
