const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'../ui',f),'utf8');
test('route cleanup uses existing Daily reset API and never forces body layout',()=>{
 const shell=read('nexa-shell.js'),html=read('todo.html'),motion=read('nexa-motion.js');
 a.doesNotMatch(shell,/closeOtherDailySwipeItems/);a.match(shell,/resetAllDailySwipeItems\(null\)/);a.match(html,/function resetAllDailySwipeItems/);
 const mark=motion.slice(motion.indexOf('function markRouteMotion'),motion.indexOf('function installPressPhysics'));
 a.doesNotMatch(mark,/offsetWidth|offsetHeight|getBoundingClientRect/);
 a.match(mark,/__nexaHeaderMotion\?\.cancel/);a.match(mark,/if\(reduced\(\)\)return/);
 a.doesNotMatch(read('nexa.css'),/body\.nexa-route-animate\[data-nexa-motion-axis[^\n]+/);
});
test('cached surfaces invalidate through all three persistence owners and midnight',()=>{
 const html=read('todo.html'),shell=read('nexa-shell.js');
 for(const [fn,key] of [['saveTodos','todo'],['persistNoteSchemaV2','notes'],['persistDailyTasksWithoutRender','daily']])a.match(html,new RegExp('function '+fn+'\\(\\) \\{\\s*nexaSurfaceState\\(\\)\\.'+key+' = true'));
 for(const key of ['todo','notes','daily'])a.ok(html.includes('nexaSurfaceState().'+key+' = false'));
 a.ok(shell.includes('nexaSurfaceState().day!==dailyDateKey()'));
 a.ok(html.includes("if (mode === 'notes' && !window.NexaShell) loadNotes()"));
});
test('Note Move handles Back before leaving Note and route cleanup closes its overlay',()=>{
 const html=read('todo.html'),shell=read('nexa-shell.js');
 a.match(html,/if \(el && el.classList.contains\('active'\)\) \{ closeNoteSwipeTopicPicker\(\); return 'note-move'; \}/);
 a.ok(shell.includes('closeNoteSwipeTopicPicker();'));
 a.ok(shell.includes('homeMarkup.get(old)===markup'));
});
