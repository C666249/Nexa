const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'ui/todo.html'),'utf8');
const css=fs.readFileSync(path.join(root,'ui/nexa.css'),'utf8');
const motion=fs.readFileSync(path.join(root,'ui/nexa-motion.js'),'utf8');

test('Daily history calendar and day detail own integrated drag handles',()=>{
 assert.match(html,/daily-history-card">\s*<div class="daily-history__top">\s*<div class="nexa-sheet-grab daily-history__grab"/);
 assert.match(html,/daily-history-sheet" id="dailyHistorySheet">\s*<div class="daily-history-sheet__head">\s*<div class="nexa-sheet-grab daily-history-sheet__grab"/);
 assert.match(css,/daily-history__top>\.daily-history__grab/);
 assert.match(css,/daily-history-sheet__head>\.daily-history-sheet__grab/);
 assert.match(css,/background:transparent!important/);
});

test('Both Daily history surfaces are bottom drawers without translateX centering',()=>{
 assert.match(css,/\.daily-history-overlay\{[\s\S]*align-items:flex-end!important/);
 assert.match(css,/\.daily-history-card\{[\s\S]*left:auto!important;top:auto!important;bottom:auto!important/);
 assert.match(css,/\.daily-history-sheet\{[\s\S]*left:10px!important;[\s\S]*right:10px!important/);
 assert.match(html,/daily-history-detail/);
 assert.match(html,/detail-open/);
});

test('Sheet dismiss animation is cancelled before the close callback to avoid stale transforms',()=>{
 assert.match(motion,/dismissAnim\.cancel\(\)/);
});
