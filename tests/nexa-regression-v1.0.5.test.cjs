const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const motion = read('ui/nexa-motion.js');
const css = read('ui/nexa.css');

test('bottom route changes never fade the whole page toward transparent', () => {
  assert.doesNotMatch(css, /@keyframes nexaShared(?:Forward|Back|Child|Parent)\{[^}]*opacity\s*:\s*\.(?:0|1|2|3|4|5|6|7|8|9)/);
  assert.doesNotMatch(css, /body\[data-nexa-page="(?:home|space|daily|todo|notes)"\][^{]*\{animation:nexa(?:Home|Space|Daily|Todo|Note)Enter/);
  assert.match(css, /Shared Axis without whole-page fading/);
  assert.match(motion, /setTimeout\(\(\)=>body\.classList\.remove\('nexa-route-animate'\),300\)/);
});

test('Todo stack anchors below the real sticky header and never paints over it', () => {
  assert.match(motion, /rect\?\.bottom\|\|header\?\.offsetHeight/);
  assert.match(motion, /--nexa-list-stack-top/);
  assert.match(motion, /const maxLayers=4/);
  assert.match(motion, /const depth=\(current-i\)\+incoming/);
  assert.match(motion, /longList&&g\.kind==='active'&&g\.cards\.length>=minGroupItems/);
  assert.match(motion, /const boundaryTop=g\.boundary\?naturalTop\(g\.boundary,cr\):Infinity/);
  assert.match(css, /top:var\(--nexa-list-stack-top,156px\)/);
  assert.match(css, /z-index:var\(--nexa-list-z,70\)/);
  assert.match(css, /\.todo-list>\.date-divider,.todo-list>\.todo-completed-divider\{position:relative;z-index:88/);
  assert.match(motion, /routeObserver\.observe\(document\.body/);
});

test('list stack listens to both window and list scrolling and cleans all temporary state', () => {
  assert.match(motion, /container\.addEventListener\('scroll',schedule/);
  assert.match(motion, /container\.removeEventListener\('scroll',schedule\)/);
  assert.match(motion, /container\.style\.removeProperty\('--nexa-list-stack-top'\)/);
});
