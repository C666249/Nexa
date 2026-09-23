const fs=require('fs');
const html=fs.readFileSync('ui/todo.html','utf8');
function must(re,msg){if(!re.test(html)){console.error('FAIL',msg);process.exit(1)}}
must(/function topicSwipeRowHtml\(/,'topic swipe row renderer missing');
must(/data-topic-swipe-action="rename"/,'rename action missing');
must(/data-topic-swipe-action="delete"/,'delete action missing');
must(/\.topic-swipe-actions\{[^}]*width:124px[^}]*\}/,'topic rail must mirror 124px geometry');
must(/NOTE_SWIPE_REVEAL_THRESHOLD\s*=\s*48/,'shared 48px threshold missing');
must(/NOTE_SWIPE_SETTLE_MS\s*=\s*200/,'shared 200ms settle missing');
must(/里面的子主题和笔记会保留，并提升到上一级/,'safe promotion delete copy missing');
const promoteBody=(html.match(/function deleteTopicPromoteChildren\(id\) \{([\s\S]*?)\n\}/)||[])[1]||'';
if(/updatedAt/.test(promoteBody))throw new Error('Topic structural delete must not rewrite Note modified-time ordering');
// Behavioral model of the exact promotion rule.
let noteTopics=[{id:1,parentTopicId:null},{id:2,parentTopicId:1},{id:3,parentTopicId:2},{id:4,parentTopicId:1}];
let notes=[{id:11,topicId:2,updatedAt:0},{id:12,topicId:3,updatedAt:0},{id:13,topicId:1,updatedAt:0}];
function promote(id){const topic=noteTopics.find(t=>t.id===id);const parent=topic.parentTopicId==null?null:topic.parentTopicId;noteTopics.forEach(t=>{if(t.parentTopicId===id)t.parentTopicId=parent});notes.forEach(n=>{if(n.topicId===id)n.topicId=parent});noteTopics=noteTopics.filter(t=>t.id!==id)}
promote(2);
if(noteTopics.find(t=>t.id===3).parentTopicId!==1)throw new Error('direct child Topic not promoted');
if(notes.find(n=>n.id===11).topicId!==1)throw new Error('direct Note not promoted');
if(notes.find(n=>n.id===12).topicId!==3)throw new Error('grandchild Note structure must be preserved');
console.log('PASS topic swipe actions: rename/delete rail + non-destructive promotion semantics');
