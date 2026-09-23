const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const html = read('ui/todo.html');
const motion = read('ui/nexa-motion.js');
const css = read('ui/nexa.css');

test('Todo Daily and Note share one left-swipe two-detent action ladder', () => {
  assert.match(html, /secondaryRatio:\s*0\.18/);
  assert.match(html, /deleteRatio:\s*0\.40/);
  assert.match(html, /function nexaSwipeResolve\(row, rawX, secondaryAction\)/);
  assert.match(html, /setTodoSwipeRowX[\s\S]*'reminder'/);
  assert.match(html, /nexaSwipePaint\(dailySwipeItem[\s\S]*'edit'/);
  assert.match(html, /setNoteSwipeRowX[\s\S]*'move'/);
  assert.match(html, /distance >= thresholds\.delete[\s\S]*action = 'delete'/);
  assert.match(html, /distance >= thresholds\.secondary[\s\S]*action = secondaryAction/);
  assert.match(html, /label\.textContent = '松手删除'/);
});

test('right swipe is not captured by content cards and remains Note Drawer navigation', () => {
  assert.match(html, /return dx < -NEXA_CARD_SWIPE\.slop/);
  assert.match(html, /function nexaSwipeIsRightNavigation\(dx,dy\)/);
  assert.match(html, /nexaSwipeIsRightNavigation\(dx,dy\)\|\|Math\.abs\(dy\)>Math\.abs\(dx\)\)noteSwipeGesture\.row=null/);
  assert.match(html, /!swipeRowWasOpen&&dx>50&&dx>dy[\s\S]*openFolderSidebar\(\)/);
});

test('delete keeps the current left-fly curve and undo reverses the exact captured trace', () => {
  assert.match(html, /nexaSwipeTransferForDelete\(row/);
  assert.match(html, /deleteTodoById[\s\S]*fromX:Number\(options\.fromX\)\|\|0[\s\S]*capture:function\(trace\)/);
  assert.match(html, /deleteDailyTask[\s\S]*fromX:Number\(options\.fromX\)\|\|0[\s\S]*capture:function\(trace\)/);
  assert.match(html, /deleteNoteFromList[\s\S]*fromX:Number\(options\.fromX\)\|\|0[\s\S]*capture:function\(trace\)/);
  assert.match(motion, /function curveReturn\(element,trace,done,options\)/);
  assert.match(motion, /trace\.frames\.slice\(\)\.reverse\(\)/);
  assert.match(html, /NexaMotion\.curveReturn\(restored,motionTrace/);
});

test('reminder edit and move sheets enter from below with a slowed inertial settle', () => {
  assert.match(motion, /function presentSheet\(sheet,options\)/);
  assert.match(motion, /translate3d\(0,\$\{travel\}px,0\) scale\(\.986\)/);
  assert.match(motion, /translate3d\(0,-8px,0\) scale\(1\.003\)/);
  assert.match(motion, /translate3d\(0,2\.5px,0\) scale\(\.999\)/);
  assert.match(motion, /duration:Number\(options\.duration\)\|\|480/);
  assert.match(motion, /cubic-bezier\(\.16,\.78,\.18,1\)/);
  assert.match(motion, /'\.reminder-picker'/);
  assert.match(motion, /'\.note-swipe-topic-sheet'/);
  assert.match(html, /openDailyEditor[\s\S]*NexaMotion\.presentSheet\(sheet\)/);
  assert.match(html, /openTodoReminderPicker[\s\S]*NexaMotion\.presentSheet\(sheet\)/);
  assert.match(html, /openNoteSwipeTopicPicker[\s\S]*NexaMotion\.presentSheet\(sheet\)/);
  assert.match(css, /@keyframes nexaSheetPresent/);
});
