const fs = require('fs');
const path = require('path');
const assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '..', 'ui', 'todo.html'), 'utf8');
const m = html.match(/\/\/ ===== AI Sent-message edit \/ copy \/ undo =====([\s\S]*?)\/\/ ===== AI Chat =====/);
assert(m, 'AI message action block missing');
assert(html.includes('data-ai-msg-action="copy"'), 'copy action missing');
assert(html.includes('data-ai-msg-action="edit"'), 'edit action missing');
assert(html.includes('data-ai-msg-action="undo"'), 'undo action missing');
assert(html.includes('ai-chat__edit-banner'), 'edit banner missing');

var todos=[]; var recycleBin=[];
var document={
  querySelector:()=>null,
  querySelectorAll:()=>[],
  getElementById:()=>({value:'',classList:{add(){},remove(){}},setAttribute(){},focus(){},setSelectionRange(){}}),
  createElement:()=>({style:{},select(){},remove(){}}), body:{appendChild(){}}
};
var navigator={};
var native=[];
var AndroidBridge={cancelTodoReminder:(id)=>native.push(['cancel',id]),scheduleTodoReminder:(...x)=>native.push(['schedule',...x])};
function showToast(){} function saveTodos(){} function saveRecycleBin(){} function render(){} function saveAiChatHistory(){}
eval(m[0].replace('// ===== AI Chat =====',''));

aiChatMessageRecords.m={id:'m',text:'x',transaction:null,transactionUndone:false,pending:false,historyBefore:null};
aiChatUserOrder=['m'];
todos=[{id:1,text:'A',status:'todo',createdAt:1,category:'全部'}]; recycleBin=[];
let before=aiCaptureTaskState();
todos.unshift({id:2,text:'B',status:'todo',createdAt:2,category:'全部'});
let after=aiCaptureTaskState();
aiStoreTaskTransaction('m',before,after);
assert(aiChatMessageRecords.m.transaction, 'transaction not stored');
assert.strictEqual(aiUndoMessageTransaction('m',{silent:true}), true);
assert.deepStrictEqual(todos, before.todos, 'undo did not restore exact task state');

// Conflict guard: later changes must block rollback.
aiChatMessageRecords.m.transaction={before,after}; aiChatMessageRecords.m.transactionUndone=false;
todos=JSON.parse(JSON.stringify(after.todos)); recycleBin=[]; todos.push({id:3,text:'later'});
assert.strictEqual(aiUndoMessageTransaction('m',{silent:true}), false, 'conflict should block undo');
assert(todos.some(t=>t.id===3), 'conflict rollback overwrote later data');

// Reminder changes must reuse native cancel/schedule when undo restores old state.
const now=Date.now();
const b2={todos:[{id:4,text:'R',status:'todo',reminderAt:now+600000}],recycleBin:[]};
const a2={todos:[{id:4,text:'R2',status:'todo',reminderAt:now+1200000}],recycleBin:[]};
aiChatMessageRecords.m.transaction={before:b2,after:a2}; aiChatMessageRecords.m.transactionUndone=false;
todos=JSON.parse(JSON.stringify(a2.todos)); recycleBin=[]; native=[];
assert.strictEqual(aiUndoMessageTransaction('m',{silent:true}), true);
assert(native.some(x=>x[0]==='cancel'), 'native reminder cancel not called');
assert(native.some(x=>x[0]==='schedule'), 'native reminder restore schedule not called');

console.log('PASS ai-message-actions-v1.3.2');
