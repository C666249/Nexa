const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const uiPath = path.join(root, 'ui', 'todo.html');
const assetPath = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'todo.html');
const ui = fs.readFileSync(uiPath, 'utf8');
const asset = fs.readFileSync(assetPath, 'utf8');

function must(cond, msg) {
  if (!cond) {
    console.error('FAIL checklist-v1.30.9:', msg);
    process.exit(1);
  }
}

must(ui === asset, 'ui/todo.html and Android asset must remain byte-identical');
must(!ui.includes("el.className = 'todo-item';"), 'status refresh must not reset structural checklist classes');
must(ui.includes("el.classList.toggle('completed', todo.status === 'completed')"), 'surgical status update missing');
must(ui.includes("let todoCreateSelectedCategory = '全部';"), 'composer category state missing');
must(ui.includes("openCategoryPicker(todoCreateCategory, null, 'create')"), 'composer category picker trigger missing');
must(ui.includes("category: todoCreateSelectedCategory || '全部'"), 'new todo must persist composer-selected category');
must(ui.includes("if (pickerContext === 'create')"), 'category picker create-context branch missing');
must(ui.includes("transform: translate3d(-50%,0,0);"), 'fixed bottom compositor guard missing');
console.log('PASS checklist-v1.30.9: no structural class reset + stable bottom layers + composer category picker');
