const {test}=require('node:test');
const assert=require('node:assert/strict');
const motion=require('../ui/nexa-motion.js');

test('favoriteCurve mirrors a physical curved fling and returns the card to rest',async()=>{
 let frames,opts,done=0,cancelled=0;
 const classes=new Set();
 const style={removeProperty(){}};
 const el={
  classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},
  style,
  getBoundingClientRect:()=>({width:320,height:74}),
  animate:(f,o)=>{frames=f;opts=o;return{finished:Promise.resolve(),cancel(){cancelled++;}};}
 };
 await motion.favoriteCurve(el,()=>done++,{fromX:86});
 assert.equal(done,1);
 assert.equal(cancelled,1);
 assert.ok(frames.length>=5);
 assert.match(frames[0].transform,/86px/);
 assert.match(frames.at(-1).transform,/translate3d\(0,0,0\)/);
 assert.equal(frames.at(-1).opacity,1);
 assert.ok(opts.duration>=500);
 assert.equal(classes.has('nexa-favoriting'),false);
});
