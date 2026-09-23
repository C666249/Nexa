const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const uiPath = path.join(root, 'ui', 'todo.html');
const assetPath = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'todo.html');
const ui = fs.readFileSync(uiPath, 'utf8');
const asset = fs.readFileSync(assetPath, 'utf8');
function must(cond, msg) { if (!cond) { console.error('FAIL checklist-v1.30.10:', msg); process.exit(1); } }
must(ui === asset, 'ui/todo.html and Android asset must remain byte-identical');
// The old latched two-button rail was intentionally replaced in Nexa 1.0.7, but the original
// anti-flash contract remains: at rest absolutely no action layer is painted behind a card.
must(ui.includes('visibility: hidden; opacity: 0; pointer-events: none;'), 'closed To-Do action layer must not be painted');
must(/\.nexa-gesture-underlay\{[\s\S]*display:none!important;visibility:hidden!important;opacity:0!important/.test(ui), 'shared gesture underlay must be compositor-hidden at rest');
must(/\.nexa-swipe-active>\.nexa-gesture-underlay\{[\s\S]*display:block!important;visibility:visible!important;opacity:1!important/.test(ui), 'gesture underlay should exist only while physically dragging');
must(ui.includes('function setTodoSwipeRowX(row,x,animate)'), 'To-Do swipe position helper missing');
must(ui.includes("nexaSwipePaint(row,todoSwipeFront(row),todoSwipeUnderlay(row),Number(x)||0,'reminder'"), 'To-Do first left detent must be reminder');
must(ui.includes("distance >= thresholds.delete"), 'deep-delete detent missing');
console.log('PASS checklist-v1.30.10: closed action layer remains flash-safe after segmented swipe redesign');
