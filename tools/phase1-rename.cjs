// One-time, narrowly scoped mechanical identity rewrite in the independent Nexa copy.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const javaRoot = path.join(root, 'android/app/src/main/java');
for (const file of walk(javaRoot).filter(f => f.endsWith('.kt'))) {
  const old = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, old.replaceAll('com.todolist.app', 'com.nexa.app').replaceAll('com.listnote.app', 'com.nexa.app').replaceAll('To-Do', 'Nexa'));
}
const oldDir = path.join(javaRoot, 'com/todolist/app');
const newDir = path.join(javaRoot, 'com/nexa/app');
if (fs.existsSync(oldDir)) {
  fs.mkdirSync(path.dirname(newDir), { recursive: true });
  if (fs.existsSync(newDir)) throw new Error('Destination exists; refusing to overwrite');
  fs.renameSync(oldDir, newDir);
}
const manifest = path.join(root, 'android/app/src/main/AndroidManifest.xml');
fs.writeFileSync(manifest, fs.readFileSync(manifest, 'utf8')
  .replaceAll('com.listnote.app', 'com.nexa.app').replaceAll('com.todolist.app', 'com.nexa.app')
  .replaceAll('Theme.AppTemplate', 'Theme.Nexa')
  .replaceAll('@mipmap/ic_launcher_v2_round', '@mipmap/ic_nexa')
  .replaceAll('@mipmap/ic_launcher_v2', '@mipmap/ic_nexa'));
for (const relative of ['ui/todo.html', 'android/app/src/main/assets/todo.html']) {
  const file = path.join(root, relative);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8')
    .replace('<title>To-Do</title>', '<title>Nexa</title>')
    .replace('<meta name="theme-color" content="#4A90D9">', '<meta name="theme-color" content="#F7F2E8">'));
}
