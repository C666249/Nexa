/* Mechanical, reproducible bridge build. Never modifies the original To-Do directory. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'migration','bridge-project');
if(fs.existsSync(dest))throw Error('Bridge already exists; use the existing project. No overwrite performed.');
const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.cpSync(from,to,{recursive:true});};
for(const file of ['settings.gradle.kts','build.gradle.kts','gradle.properties','gradlew','gradlew.bat','gradle','android/app/proguard-rules.pro'])copy(path.join(root,file),path.join(dest,file));
copy(path.join(root,'android/app/src/main'),path.join(dest,'android/app/src/main'));
copy(path.join(root,'android/app/build.gradle.kts'),path.join(dest,'android/app/build.gradle.kts'));
const rewrite=(file,fn)=>fs.writeFileSync(file,fn(fs.readFileSync(file,'utf8')));
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
for(const file of walk(path.join(dest,'android/app/src/main')))if(/\.(kt|xml)$/.test(file))rewrite(file,text=>text.replaceAll('com.nexa.app','com.todolist.app'));
rewrite(path.join(dest,'android/app/build.gradle.kts'),text=>text.replaceAll('com.nexa.app','com.todolist.app').replace(/versionCode = \d+/,'versionCode = 1407').replace('versionName = "1.0.0"','versionName = "1.40.7-migration"').replace(/Nexa-1\.0\.0-RC\d+/,'To-Do-1.40.7-Migration'));
rewrite(path.join(dest,'settings.gradle.kts'),text=>text.replace('"Nexa"','"ToDoMigrationBridge"'));
rewrite(path.join(dest,'android/app/src/main/res/values/strings.xml'),text=>text.replace('>Nexa<','>To-Do 迁移桥接<'));
const original=fs.readFileSync(path.join(root,'migration/legacy-todo.html'),'utf8');
const bridge=fs.readFileSync(path.join(root,'migration/bridge-export.js'),'utf8');
fs.writeFileSync(path.join(dest,'android/app/src/main/assets/todo.html'),original.replace('https://cdn.jsdelivr.net/npm/marked/marked.min.js','marked.umd.js').replace('</body>','<script>\n'+bridge+'\n</script></body>'));
console.log(dest);
