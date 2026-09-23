const {test}=require('node:test'),a=require('node:assert/strict');
test('horizontal palette maps visible swatches and clamps at edges',()=>{
 const g=require('../ui/nexa-highlight.js');
 a.equal(g.indexAt(20,20,280,8),0);a.equal(g.indexAt(299,20,280,8),7);a.equal(g.indexAt(-99,20,280,8),0);a.equal(g.indexAt(900,20,280,8),7);
 a.equal(g.indexAt(20+3.5*35,20,280,8),3);
});
