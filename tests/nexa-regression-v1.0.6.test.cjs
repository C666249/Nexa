const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const motion = read('ui/nexa-motion.js');
const css = read('ui/nexa.css');

test('short and completed Todo lists never enter the stack system', () => {
  assert.match(motion, /minItems=Math\.max\(10,Number\(options\.minItems\)\|\|12\)/);
  assert.match(motion, /const activeCount=groups\.reduce/);
  assert.match(motion, /longList=activeCount>=minItems/);
  assert.match(motion, /g\.stackable=longList&&g\.kind==='active'&&g\.cards\.length>=minGroupItems/);
  assert.match(motion, /kind:'completed'/);
  assert.match(motion, /setActiveGroup\(nextActive\);if\(activeGroup\)styleActiveGroup/);
});

test('Todo stack releases before the completed/date boundary instead of leaving hidden flow gaps', () => {
  assert.match(motion, /boundary:null,stackable:false/);
  assert.match(motion, /const boundaryTop=g\.boundary\?naturalTop\(g\.boundary,cr\):Infinity/);
  assert.match(motion, /const ended=boundaryTop<=anchor/);
  assert.match(motion, /setActiveGroup\(nextActive\);if\(activeGroup\)styleActiveGroup/);
});

test('home completion number owns the large type and percent sign is secondary', () => {
  assert.doesNotMatch(css, /\.nexa-progress span\{font-size:12px/);
  assert.match(css, /\.nexa-progress strong\{[^}]*font-size:52px/);
  assert.match(css, /\.nexa-progress strong \[data-nexa-odometer\]\{font-size:1em/);
  assert.match(css, /\.nexa-progress strong small\{font-size:24px/);
  assert.match(css, /\.nexa-progress>div>span:not\(\[data-nexa-odometer\]\)\{font-size:12px/);
});
