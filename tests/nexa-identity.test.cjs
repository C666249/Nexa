const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

function channel(){
  const build=read('android/app/build.gradle.kts');
  if(/applicationId = "com\.nexa\.app\.beta"/.test(build))return 'beta';
  if(/applicationId = "com\.nexa\.app\.clou"/.test(build))return 'clou';
  return 'stable';
}

test('Nexa 1.0.36 cloud channel identity, version and output name are explicit', () => {
  const build = read('android/app/build.gradle.kts'),ch=channel();
  const expected={stable:['com.nexa.app.cloud','1.0.36','Nexa-Cloud-1.0.36-'],beta:['com.nexa.app.beta','1.0.35-beta.1','Nexa-Beta-1.0.35-beta.1-'],clou:['com.nexa.app.clou','1.0.35-clou.1','Nexa-Clou-1.0.35-clou.1-']}[ch];
  assert.match(build, /namespace = "com\.nexa\.app"/);
  assert.ok(build.includes(`applicationId = "${expected[0]}"`));
  assert.ok(build.includes(`versionName = "${expected[1]}"`));
  assert.match(build, /versionCode = 42/);
  assert.ok(build.includes(expected[2]));
  assert.match(read('settings.gradle.kts'), /rootProject.name = "Nexa"/);
  const native = walk(path.join(root, 'android/app/src/main/java')).map(f => fs.readFileSync(f, 'utf8')).join('\n');
  assert.doesNotMatch(native, /com\.(todolist|listnote)\.app/);
});

test('brand resources reference the correct channel identity', () => {
  const ch=channel(),manifest=read('android/app/src/main/AndroidManifest.xml'),strings=read('android/app/src/main/res/values/strings.xml');
  assert.match(manifest, /@style\/Theme.Nexa/);
  assert.match(manifest, ch==='beta'?/@mipmap\/ic_nexa_beta/:/@mipmap\/ic_nexa/);
  assert.doesNotMatch(manifest, /com\.(todolist|listnote)\.app/);
  if(ch==='beta')assert.match(strings, />Nexa β</); else if(ch==='clou')assert.match(strings, />Nexa Clou</); else assert.match(strings, />Nexa</);
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
