const fs = require('fs');
const html = fs.readFileSync('ui/todo.html','utf8');
function must(re, msg){ if(!re.test(html)){ console.error('FAIL:',msg); process.exit(1); } }
// Golden To-Do foreground is a solid #fffefa layer; Note swipe must use the same masking idea.
must(/\.todo-item__inner\s*\{[^}]*background:\s*#fffefa/s, 'Golden To-Do solid foreground missing');
must(/\.note-swipe-row\s*\{[^}]*background:\s*#fffefa/s, 'Note swipe row lacks opaque base');
must(/\.note-swipe-inner\s*\{[^}]*background:\s*#fffefa[^}]*border-radius:\s*15px/s, 'Note swipe foreground lacks opaque rounded mask');
must(/\.note-swipe-inner>\.note-doc-card,\.note-swipe-inner>\.note-recent-card\s*\{\s*background:\s*#fffefa\s*\}/s, 'Swipeable Note cards remain translucent');
must(/\.note-swipe-actions\s*\{[^}]*z-index:\s*1/s, 'Action rail z-index changed');
must(/\.note-swipe-inner\s*\{[^}]*z-index:\s*2/s, 'Foreground must remain above action rail');
console.log('PASS note-swipe-mask: opaque Golden-style foreground fully covers rail until edge reveal');
