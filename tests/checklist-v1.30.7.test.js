const fs = require('fs');
const html = fs.readFileSync('ui/todo.html', 'utf8');
const required = [
  "function syncChecklistStatus(todo)",
  "progress.done === 0 ? 'todo' : progress.done >= progress.total ? 'completed' : 'in-progress'",
  "class=\"todo-checklist-toggle\"",
  "class=\"todo-checklist-shell",
  "data-todo-create-mode=\"single\"",
  "data-todo-create-mode=\"checklist\"",
  "每行一项",
  "function toggleChecklistItem(todoId, subId)",
  "function addChecklistItem(todoId)",
  "function deleteChecklistItem(todoId, subId)",
  "childMatch"
];
for (const needle of required) {
  if (!html.includes(needle)) throw new Error(`missing checklist contract: ${needle}`);
}
// 1.40.6 replaced the old grid animation with measured height, preserving content during collapse.
if (!html.includes("transition:height .24s") || !html.includes("const currentHeight = Math.max(0, shell.getBoundingClientRect().height)") || !html.includes("if (expanding) shell.classList.add('expanded')")) {
  throw new Error('missing measured-height, content-preserving expand/collapse motion');
}
const asset = fs.readFileSync('android/app/src/main/assets/todo.html', 'utf8');
if (asset !== html) throw new Error('ui/todo.html is not mirrored to Android asset');
console.log('PASS checklist-v1.30.7: inline checklist + automatic tri-state + mirrored Android asset');
