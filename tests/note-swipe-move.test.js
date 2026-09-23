function moveSwipeNoteToTopic(topicId) {
  var note=getNoteById(noteSwipeMoveNoteId);if(!note){closeNoteSwipeTopicPicker();return;}
  var normalized=topicId==null||topicId===''?null:Number(topicId);
  if((note.topicId==null&&normalized==null)||Number(note.topicId)===Number(normalized)){
    closeNoteSwipeTopicPicker();showToast('已经在这里');return;
  }
  var container=document.getElementById('noteContainer'),top=container?container.scrollTop:0;
  if(moveNoteToTopic(note.id,normalized)){
    closeNoteSwipeTopicPicker();renderNoteList();
    requestAnimationFrame(function(){if(container)container.scrollTop=top;});
    showToast(normalized==null?'已移到未分类':'已移动到主题');
  }
}

let noteSwipeMoveNoteId=7;
let recorded=[]; let toast=''; let rendered=0; let closed=0;
const note={id:7,title:'A',topicId:3};
function getNoteById(id){return Number(id)===7?note:null}
function closeNoteSwipeTopicPicker(){closed++;noteSwipeMoveNoteId=null}
function showToast(x){toast=x}
function moveNoteToTopic(id,topic){recorded.push([id,topic]);note.topicId=topic;return true}
function renderNoteList(){rendered++}
function requestAnimationFrame(fn){fn()}
global.document={getElementById(id){if(id==='noteContainer')return {scrollTop:77};return null}};
function assert(c,m){if(!c)throw new Error(m)}
moveSwipeNoteToTopic(null);
assert(recorded.length===1 && recorded[0][0]===7 && recorded[0][1]===null,'null move failed');
assert(rendered===1 && toast==='已移到未分类','null move render/toast failed');
// reset for nested topic
noteSwipeMoveNoteId=7;note.topicId=null;recorded=[];rendered=0;closed=0;toast='';
moveSwipeNoteToTopic('9');
assert(recorded.length===1 && recorded[0][1]===9,'topic normalization failed');
assert(toast==='已移动到主题','topic toast failed');
// same topic must not rewrite/touch updatedAt
noteSwipeMoveNoteId=7;note.topicId=9;recorded=[];rendered=0;closed=0;toast='';
moveSwipeNoteToTopic('9');
assert(recorded.length===0 && rendered===0 && toast==='已经在这里','same-topic guard failed');
console.log('PASS note swipe move routing + same-topic guard');
