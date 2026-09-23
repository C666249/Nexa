const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'ui/todo.html'),'utf8');
const css=fs.readFileSync(path.join(root,'ui/nexa.css'),'utf8');

test('composer category is compact beside reminder',()=>{
  a.match(css,/\.todo-create-options \.todo-create-category\{flex:0 0 auto;min-width:0;max-width:142px\}/);
  a.match(html,/\.todo-create-category \{[\s\S]*flex:0 0 auto;[\s\S]*min-width:0;[\s\S]*height:38px/);
});

test('new-todo reminder is an inline reversible curtain rather than a second overlay',()=>{
  a.match(html,/id="todoCreateReminderCurtain"/);
  a.match(html,/\.todo-create-reminder-curtain\.active \{ max-height:220px; opacity:1/);
  a.match(html,/function toggleTodoCreateReminderCurtain\(\)/);
  a.match(html,/todoCreateReminder\?\.addEventListener\('click'[\s\S]*toggleTodoCreateReminderCurtain\(\)/);
  a.match(html,/function openTodoCreateReminderPicker\(\) \{[\s\S]*setTodoCreateReminderCurtain\(true\)/);
  const fn=html.match(/function openTodoCreateReminderPicker\(\) \{[\s\S]*?\n\}/)?.[0]||'';
  a.doesNotMatch(fn,/reminderPickerOverlay/);
});

test('inline reminder choices stay open while values change and only update draft state',()=>{
  a.match(html,/\[todoCreateReminderDate,todoCreateReminderTime\][\s\S]*commitTodoCreateInlineReminder\(false\)/);
  a.match(html,/function setTodoCreateReminderQuick\(kind\)[\s\S]*commitTodoCreateInlineReminder\(false\)/);
  a.doesNotMatch(html,/\[todoCreateReminderDate,todoCreateReminderTime\][\s\S]{0,400}setTodoCreateReminderCurtain\(false/);
});

test('system Back consumes inline reminder then composer before shell navigation',()=>{
  const backStart=html.indexOf('function handleBackPress()');
  const back=html.slice(backStart, backStart+9000);
  const category=back.indexOf("return 'todo-create-category'");
  const curtain=back.indexOf("return 'todo-create-reminder'");
  const composer=back.indexOf("return 'todo-create'");
  const shell=back.indexOf('window.NexaShell.back()');
  a.ok(category>=0 && curtain>category && composer>curtain && shell>composer, 'Back order must be category -> reminder curtain -> composer -> shell');
});
