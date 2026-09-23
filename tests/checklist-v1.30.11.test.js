const fs = require('fs');
const path = require('path');
const ui = fs.readFileSync(path.join(__dirname, '..', 'ui', 'todo.html'), 'utf8');
function must(ok, msg) { if (!ok) { console.error('FAIL checklist-v1.30.11:', msg); process.exit(1); } }
must(ui.includes('.category-picker.create-top-layer'), 'page-level create picker CSS missing');
must(ui.includes('touch-action:pan-y'), 'picker vertical touch scrolling missing');
must(ui.includes('overscroll-behavior:contain'), 'picker overscroll containment missing');
must(ui.includes("categoryPicker.classList.add('create-top-layer')"), 'create picker top-layer activation missing');
must(!ui.includes('todoCreateFoot.appendChild(categoryPicker)'), 'create picker must not be reparented into composer footer');
must(ui.includes('categoryPicker.style.maxHeight = `${allowedHeight}px`'), 'dynamic picker max-height missing');
must(ui.includes("if (pickerContext === 'create' && categoryPicker && categoryPicker.classList.contains('active')) scheduleCategoryPickerPosition();"), 'IME-coupled picker reposition missing');
must(ui.includes('flex:0 0 auto; width:auto; min-width:0; max-width:142px'), 'compact create category control missing');
must(ui.includes('.todo-create-cancel { margin-left:auto;'), 'footer right-side button alignment missing');
must(ui.includes('visibility: hidden; opacity: 0; pointer-events: none;'), 'closed swipe rail anti-flash rule missing');
console.log('PASS checklist-v1.30.11: top-layer scrollable category picker + compact category control');
