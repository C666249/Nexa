const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const html = read('ui/todo.html');
const motion = read('ui/nexa-motion.js');
const shell = read('ui/nexa-shell.js');
const workspace = read('ui/nexa-workspace.js');
const css = read('ui/nexa.css');

test('long Todo lists use a bounded 2-4 layer stack and suspend it for stateful interactions', () => {
  assert.match(motion, /function enhanceListStack\(/);
  assert.match(motion, /minItems=Math\.max\(10,Number\(options\.minItems\)\|\|12\)/);
  assert.match(motion, /const minGroupItems=4/);
  assert.match(motion, /const maxLayers=4/);
  assert.match(motion, /if\(depth>=maxLayers\)/);
  assert.match(motion, /checklist-expanded,\.checklist-animating,\.swipe-open,\.nexa-reorder-source,\.nexa-departing/);
  assert.match(css, /\.todo-list>\.todo-item\.nexa-list-stack-card\{position:sticky/);
  assert.match(css, /\.todo-list\.nexa-list-stack-suspended/);
  assert.match(css, /prefers-reduced-motion:reduce[\s\S]*nexa-list-stack-card/);
});

test('completion motion covers Todo, checklist children and Daily with drawn SVG state paths', () => {
  assert.match(html, /class="checkbox[^\"]*"[^>]*>[\s\S]*nexa-state-glyph__check/);
  assert.match(html, /class="todo-subcheck"[\s\S]*nexa-state-glyph__check/);
  assert.match(html, /class="daily-check[^\"]*"[\s\S]*nexa-state-glyph__check/);
  assert.match(css, /stroke-dashoffset/);
  assert.match(css, /@keyframes nexaCheckboxInk/);
  assert.match(html, /function toggleChecklistItem[\s\S]*wasCompleted[\s\S]*softSettle\(el/);
  assert.match(html, /function toggleTodo[\s\S]*softSettle\(el/);
  assert.match(css, /todo-item\.nexa-completing[\s\S]*nexaStrikeWrite/);
});

test('Todo drag reorder persists within date and completion group and uses spring displacement', () => {
  assert.match(motion, /function enableTodoReorder\(/);
  assert.match(motion, /statusGroup:s\.status,ids,movedId/);
  assert.match(motion, /duration:320,easing:ease\.spring/);
  assert.match(html, /TODO_ORDER_KEY\s*=\s*'nexa_todo_order_v1'/);
  assert.match(html, /map\[key\+':'\+status\]=ids/);
  assert.match(html, /sortTodoGroup\(items, dateKey\)/);
  assert.match(html, /todo-completed-divider/);
});

test('curved deletion is wired in the swipe direction and reflow is animation-safe', () => {
  for (const marker of [
    /deleteNoteFromList[\s\S]*curveAway\(row,finish,\{direction:-1,[\s\S]*fromX:/,
    /deleteTopic[\s\S]*curveAway\(row,finish,\{direction:-1\}/,
    /deleteTodoById[\s\S]*curveAway\(el, finish, \{[\s\S]*direction:-1,[\s\S]*fromX:/,
    /deleteDailyTask[\s\S]*curveAway\(row, finish, \{direction:-1,[\s\S]*fromX:/
  ]) assert.match(html, marker);
  assert.match(motion, /captureFlow\(container\)/);
  assert.match(motion, /animateReflow\(before,container\)/);
  assert.match(html, /nexa-list-reflowing/);
});

test('Space keeps tools reachable through sticky collapsing header, quick-nav and sibling swipe', () => {
  assert.match(workspace, /function spaceQuickNav\(/);
  for (const view of ['library','labels','tools']) assert.match(workspace, new RegExp("\\['"+view+"'"));
  assert.match(workspace, /function bindSpaceSwipe\(/);
  assert.match(workspace, /Math\.abs\(dx\)<72/);
  assert.match(motion, /function installCollapsingSpaceHeader\(/);
  assert.match(css, /\.nexa-space-page-head\{position:sticky/);
  assert.match(css, /\.nexa-space-page-head\.is-compact/);
});

test('navigation, Note morph, search morph and FAB share the Nexa motion language', () => {
  assert.match(shell, /NexaMotion\.navIndicator/);
  assert.match(shell, /NexaMotion\.markRouteMotion/);
  assert.match(motion, /function routeAxis\(/);
  assert.match(motion, /function noteMorph\(/);
  assert.match(motion, /document\.startViewTransition/);
  assert.match(html, /NexaMotion\.noteMorph\(card/);
  assert.match(html, /note-scope-open/);
  assert.match(css, /note-search-scope-menu\.active/);
  assert.match(css, /note-create-menu\.active\+\#fab/);
});

test('odometer, ring draw, spring sheets, press physics, Peek and skeleton morph are present with reduced-motion fallback', () => {
  assert.match(shell, /data-nexa-odometer="home-percent"/);
  assert.match(shell, /data-nexa-progress=/);
  assert.match(motion, /function mountOdometer\(/);
  assert.match(motion, /function drawRings\(/);
  assert.match(motion, /function bindSheet\(/);
  assert.match(motion, /function installPressPhysics\(/);
  assert.match(motion, /function showPeek\(/);
  assert.match(motion, /escapeHTML\(n\.textContent\)/);
  assert.match(html, /nexa-skeleton-line/);
  assert.match(css, /@keyframes nexaSkeletonMorph/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});
