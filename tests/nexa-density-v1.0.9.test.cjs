const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('ui/todo.html'),css=read('ui/nexa.css'),workspace=read('ui/nexa-workspace.js');

test('Todo and Note list cards use the 1.0.9 compact information-density rhythm',()=>{
  a.match(css,/\.todo-item__main\{padding:9px 12px;gap:10px;min-height:60px\}/);
  a.match(css,/\.todo-item__text\{font-size:14\.5px;line-height:1\.34/);
  a.match(css,/\.todo-item\{margin-bottom:8px;border-radius:14px/);
  a.match(css,/\.note-topic-card,\.note-doc-card,\.note-recent-card\{padding:8px 10px;border-radius:13px;gap:7px/);
  a.match(css,/\.note-node-title\{font-size:14px;font-weight:590/);
  a.match(css,/\.folder-sidebar__tree-row\{gap:6px;padding:7px 7px;border-radius:9px;min-height:38px\}/);
});

test('Todo main list exposes one category chip instead of a duplicate Space tag button',()=>{
  a.match(html,/<button type="button" class="todo-item__category has-menu"/);
  a.match(workspace,/document\.querySelectorAll\('\.todo-item \[data-nx-tag\]'\)\.forEach\(b=>b\.remove\(\)\)/);
  a.doesNotMatch(workspace,/\['\.todo-item\[data-id\]'\s*,\s*'todo'/);
});

test('category picker is a reversible animated control and composer category keeps IME focus',()=>{
  a.match(html,/pickerAnchorEl === catEl[\s\S]*closeCategoryPicker\(true\);[\s\S]*return false/);
  a.match(html,/catEl\?\.classList\.add\('picker-open'\)/);
  a.match(html,/pickerAnchorEl\.classList\.remove\('picker-open'\)/);
  a.match(html,/\.todo-create-category\.picker-open::after \{ transform:rotate\(180deg\)/);
  a.match(html,/@keyframes nexaCategoryPickerIn/);
  a.match(html,/categoryPicker\.classList\.add\('closing'\)/);
  a.match(html,/todoCreateCategory\?\.addEventListener\('pointerdown'[\s\S]*e\.preventDefault\(\)/);
  a.match(html,/categoryPicker\.addEventListener\('pointerdown'[\s\S]*pickerContext === 'create'[\s\S]*e\.preventDefault\(\)/);
  a.match(html,/function onListScrollWhilePickerOpen\(\)[\s\S]*scheduleCategoryPickerPosition\(\)/);
  a.match(html,/function getTodoById\(id\)[\s\S]*todos\.find/);
  a.match(html,/function detachCategoryPickerListeners\(\)[\s\S]*cancelAnimationFrame\(categoryPickerPositionRaf\)/);
});

test('new Todo composer can carry a reminder into the created task and native schedule',()=>{
  a.match(html,/id="todoCreateReminder"/);
  a.match(html,/let todoCreateReminderAt = null/);
  a.match(html,/function openTodoCreateReminderPicker\(\)/);
  a.match(html,/if \(reminderEditingDraft\) \{[\s\S]*todoCreateReminderAt = date\.getTime\(\)/);
  a.match(html,/reminderAt: Number\(todoCreateReminderAt \|\| 0\) > Date\.now\(\) \+ 5000/);
  a.match(html,/AndroidBridge\.scheduleTodoReminder\(String\(todo\.id\), todo\.text \|\| '', todo\.status \|\| 'todo', String\(todo\.reminderAt\)\)/);
});
