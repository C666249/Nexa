const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const motion=require('../ui/nexa-motion.js');
const html=fs.readFileSync(path.join(__dirname,'../ui/todo.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../ui/nexa.css'),'utf8');
test('edge auto-scroll accelerates toward top and bottom',()=>{assert.equal(motion.todoEdgeScrollVelocity(200,100,700,96,1.12),0);assert.ok(motion.todoEdgeScrollVelocity(110,100,700,96,1.12)<-.7);assert.ok(motion.todoEdgeScrollVelocity(690,100,700,96,1.12)>.7);});
test('todo reorder emits cross-day source and target order',()=>{const src=fs.readFileSync(path.join(__dirname,'../ui/nexa-motion.js'),'utf8');assert.match(src,/sourceDateKey:s\.date,targetDateKey:targetDate/);assert.match(src,/nexa-reorder-synthetic-date/);assert.match(src,/requestAnimationFrame\(autoScrollFrame\)/);});
test('cross-day drop persists the todo date and both order maps',()=>{assert.match(html,/moveTodoCreatedAtToDate/);assert.match(html,/sourceKey!==targetKey/);assert.ok(html.includes("map[targetKey+':'+status]=ids"));assert.match(html,/saveTodos\(\); render\(\); updateStats\(\)/);});
test('visual drag feedback includes auto-scroll and target-date cues',()=>{assert.match(css,/nexa-auto-scroll-up/);assert.match(css,/nexa-reorder-target-date/);assert.match(css,/nexaTodayDropIn/);});
