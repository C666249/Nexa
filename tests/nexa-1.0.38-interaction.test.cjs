const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../ui/nexa-core.js');
const motion=fs.readFileSync('ui/nexa-motion.js','utf8');
const timeline=fs.readFileSync('ui/nexa-timeline.js','utf8');

test('Timeline remains a first-class route',()=>{
  assert.equal(core.route('timeline'),'timeline');
  assert.equal(core.back('timeline'),'home');
});

test('Todo long press directly starts reorder and never opens Todo Peek',()=>{
  assert.match(motion,/hold=setTimeout\(\(\)=>\{[\s\S]*state\.ready=true[\s\S]*startDrag\(\);\},330\)/);
  assert.doesNotMatch(motion,/showPeek\(row,'todo'/);
  assert.doesNotMatch(motion,/showPeek\(s\.row,'todo'/);
  assert.doesNotMatch(motion,/peekShown/);
});

test('Timeline disclosure uses FMV geometric chevron',()=>{
  assert.match(timeline,/timeline-fmv-chevron/);
  assert.doesNotMatch(timeline,/timeline-event-chevron">('\+)?icon\('chev'\)/);
});
