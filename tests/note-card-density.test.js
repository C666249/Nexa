const fs=require('fs');
const html=fs.readFileSync('ui/todo.html','utf8');
function must(re,msg){if(!re.test(html)){console.error('FAIL',msg);process.exit(1)}}
must(/\.note-recent-card\{[^}]*gap:4px;[^}]*padding:9px 11px[^}]*\}/,'recent card compact padding/gap');
must(/\.note-recent-card__preview\{[^}]*display:block;[^}]*text-overflow:ellipsis;[^}]*white-space:nowrap;[^}]*\}/,'recent preview exactly one visual line');
if(/\.note-recent-card__preview\{[^}]*-webkit-line-clamp:2/.test(html)){console.error('FAIL old two-line clamp remains');process.exit(1)}
must(/\.note-swipe-inner>\.note-doc-card\{padding:9px 11px;gap:8px\}/,'workspace swipe note rows compact');
must(/\.nexa-gesture-underlay\{[^}]*inset:0!important[^}]*width:auto!important/s,'Note action underlay must cover the full card instead of a fixed rail');
must(/setNoteSwipeRowX[\s\S]*'move'/,'Note compact card keeps the shared Move/Delete gesture ladder');
console.log('PASS note-card-density: one-line recent preview + compact cards + full-card gesture underlay');
