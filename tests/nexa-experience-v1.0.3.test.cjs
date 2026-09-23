const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('home metrics keep equal visual height while total task count stays accessible', () => {
  const shell = read('ui/nexa-shell.js');
  assert.doesNotMatch(shell, /nexa-metric-caption/);
  assert.doesNotMatch(shell, /<small[^>]*>全部\s*['"+a-zA-Z0-9_. ]*项任务<\/small>/);
  assert.match(shell, /allTaskCount/);
  assert.match(shell, /aria-label/);
  assert.match(read('ui/nexa.css'), /\.nexa-metrics button[^{]*\{[^}]*min-height:/s);
});

test('Space is split into hub and focused second-level pages instead of one endless list', () => {
  const ws = read('ui/nexa-workspace.js');
  assert.match(ws, /SPACE_BATCH\s*=\s*36/);
  for (const view of ['hub', 'library', 'labels', 'tools']) assert.ok(ws.includes(`spaceView==='${view}'`) || ws.includes(`'${view}'`), view);
  assert.match(ws, /function renderHub\(/);
  assert.match(ws, /function renderLibrary\(/);
  assert.match(ws, /function renderLabels\(/);
  assert.match(ws, /function renderTools\(/);
  assert.match(ws, /handleBackPress=.*spaceView!=='hub'/s);
  assert.match(ws, /再显示/);
  assert.match(ws, /libraryLimit\s*\+=\s*SPACE_BATCH/);
});

test('Space search entry preserves its requested second-level destination without observer race', () => {
  const ws = read('ui/nexa-workspace.js');
  assert.match(ws, /preserveSpaceViewOnEntry=false/);
  assert.match(ws, /spaceView='library'.*preserveSpaceViewOnEntry=true.*NexaShell\.navigate\('space'\)/s);
  assert.match(ws, /if\(!preserveSpaceViewOnEntry\)\{spaceView='hub'/);
});

test('advanced motion is applied only to suitable card and state transitions', () => {
  const html = read('ui/todo.html');
  const shell = read('ui/nexa-shell.js');
  const css = read('ui/nexa.css');
  assert.match(html, /nexa-motion\.js/);
  assert.match(html, /nexa-state-glyph/);
  assert.match(html, /NexaMotion\.curveAway/);
  assert.match(shell, /data-nexa-stack/);
  assert.match(css, /--nexa-ease-standard:\s*cubic-bezier/);
  assert.match(css, /stroke-dashoffset/);
  assert.match(css, /prefers-reduced-motion/);
});
