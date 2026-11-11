const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

test('Nexa 1.0.37 cloud coexistence identity is explicit', () => {
  const build = read('android/app/build.gradle.kts');
  assert.match(build, /namespace = "com\.nexa\.app"/);
  assert.match(build, /applicationId = "com\.nexa\.app\.cloud"/);
  assert.match(build, /versionName = "1\.0\.37"/);
  assert.match(build, /versionCode = 43/);
  assert.match(build, /Nexa-Cloud-1\.0\.37-/);
  assert.match(read('settings.gradle.kts'), /rootProject.name = "Nexa"/);
  const native = walk(path.join(root, 'android/app/src/main/java')).map(f => fs.readFileSync(f, 'utf8')).join('\n');
  assert.doesNotMatch(native, /com\.(todolist|listnote)\.app/);
});

test('launcher aliases keep visible Nexa name and three icon choices', () => {
  const manifest=read('android/app/src/main/AndroidManifest.xml'),strings=read('android/app/src/main/res/values/strings.xml');
  assert.match(manifest, /@style\/Theme.Nexa/);
  assert.match(manifest, /LauncherStar/);
  assert.match(manifest, /LauncherN/);
  assert.match(manifest, /LauncherWarm/);
  assert.match(manifest, /@mipmap\/ic_nexa_star/);
  assert.match(strings, />Nexa</);
});

test('web assets remain mirrored and storage keys retained', () => {
  const html = read('ui/todo.html');
  assert.equal(html, read('android/app/src/main/assets/todo.html'));
  for (const key of ['todo_glass_data', 'todo_glass_note_topics_v2', 'todo_glass_note_docs_v2', 'todo_glass_daily_tasks_v1', 'todo_glass_recycle']) assert.ok(html.includes(key), key);
  assert.match(html, /<title>Nexa<\/title>/);
  for (const asset of ['nexa.css','nexa-core.js','nexa-shell.js','nexa-space.js','nexa-toolbar.js','nexa-workspace.js','nexa-backup.js','nexa-restore.js','nexa-motion.js','nexa-mindspace.js','nexa-timeline.js','marked.umd.js']) {
    assert.equal(read('ui/'+asset),read('android/app/src/main/assets/'+asset),asset+' must be packaged without stale content');
  }
});
