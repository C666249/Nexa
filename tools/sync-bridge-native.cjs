// Update only our generated bridge, never the original To-Do source.
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),dest=path.join(root,'migration/bridge-project');
if(!fs.readFileSync(path.join(dest,'settings.gradle.kts'),'utf8').includes('ToDoMigrationBridge'))throw Error('Not the generated bridge');
for(const name of ['MainActivity.kt','NexaBackupStore.kt']){
 const source=fs.readFileSync(path.join(root,'android/app/src/main/java/com/nexa/app',name),'utf8');
 fs.writeFileSync(path.join(dest,'android/app/src/main/java/com/nexa/app',name),source.replaceAll('com.nexa.app','com.todolist.app'));
}
for(const name of ['values/styles.xml','values-v27/styles.xml']){const target=path.join(dest,'android/app/src/main/res',name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,'android/app/src/main/res',name),target);}
console.log('Generated bridge native backup and compatibility fixes synchronized.');
