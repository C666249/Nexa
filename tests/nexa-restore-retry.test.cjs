const {test}=require('node:test'),a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const b=require('../ui/nexa-backup.js');
test('validation failure releases native staging without modifying storage, enabling another import',()=>{
 const values=new Map([['safe','original']]);let cancelled=0;
 const context={NexaBackup:b,AndroidBridge:{pendingNexaBackup:()=>JSON.stringify({before:{safe:'original'},web:{todo_glass_data:'[{"id":0}]'}}),cancelNexaBackup:()=>{cancelled++;return 'ok';}},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
 context.window=context;vm.runInNewContext(fs.readFileSync(require.resolve('../ui/nexa-restore.js'),'utf8'),context);
 a.equal(cancelled,1);a.deepEqual([...values],[['safe','original']]);a.match(context.nexaRestoreMessage,/恢复未完成/);
});
