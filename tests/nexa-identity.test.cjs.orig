const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

test('Nexa channel identity, version and output name are explicit', () => {
  const build = read('android/app/build.gradle.kts');
  const beta = /applicationId = "com\.nexa\.app\.beta"/.test(build);
  assert.match(build, /namespace = "com\.nexa\.app"/);
  assert.match(build, beta ? /applicationId = "com\.nexa\.app\.beta"/ : /applicationId = "com\.nexa\.app"/);
  assert.match(build, beta ? /versionName = "1\.0\.18-beta\.1"/ : /versionName = "1\.0\.18"/);
  assert.match(build, /versionCode = 23/);
  assert.match(build, beta ? /Nexa-Beta-1\.0\.18-beta\.1/ : /Nexa-Stable-1\.0\.18/);
  assert.match(read('settings.gradle.kts'), /rootProject.name = "Nexa"/);
  const native = walk(path.join(root, 'android/app/src/main/java')).map(f => fs.readFileSync(f, 'utf8')).join('\n');
  assert.doesNotMatch(native, /com\.(todolist|listnote)\.app/);
  assert.ok(fs.existsSync(path.join(root, 'android/app/src/main/java/com/nexa/app/MainActivity.kt')));
});

test('brand resources reference the Nexa theme and the correct channel icon', () => {
  const build = read('android/app/build.gradle.kts');
  const beta = /applicationId = "com\.nexa\.app\.beta"/.test(build);
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  assert.match(manifest, /@style\/Theme.Nexa/);
  assert.match(manifest, beta ? /@mipmap\/ic_nexa_beta/ : /@mipmap\/ic_nexa/);
  assert.doesNotMatch(manifest, /com\.(todolist|listnote)\.app/);
  assert.match(read('android/app/src/main/res/values/strings.xml'), beta ? />Nexa β</ : />Nexa</);
  const icon = beta ? 'android/app/src/main/res/mipmap-anydpi-v26/ic_nexa_beta.xml' : 'android/app/src/main/res/mipmap-anydpi-v26/ic_nexa.xml';
  assert.match(read(icon), /adaptive-icon/);
});

test('web assets remain mirrored and storage keys retained', () => {
  const html = read('ui/todo.html');
  assert.equal(html, read('android/app/src/main/assets/todo.html'));
  for (const key of ['todo_glass_data', 'todo_glass_note_topics_v2', 'todo_glass_note_docs_v2', 'todo_glass_daily_tasks_v1', 'todo_glass_recycle']) assert.ok(html.includes(key), key);
  assert.match(html, /<title>Nexa<\/title>/);
  for (const asset of ['nexa.css','nexa-core.js','nexa-shell.js','nexa-space.js','nexa-toolbar.js','nexa-workspace.js','nexa-backup.js','nexa-restore.js','nexa-motion.js','marked.umd.js']) {
    assert.equal(read('ui/'+asset),read('android/app/src/main/assets/'+asset),asset+' must be packaged without stale content');
    assert.ok(html.includes(asset));
  }
});
