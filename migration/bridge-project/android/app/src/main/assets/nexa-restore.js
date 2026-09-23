/* Runs before the legacy app reads or normalizes localStorage. Native staging is restartable. */
(function(){
 if(typeof AndroidBridge==='undefined'||!AndroidBridge.pendingNexaBackup)return;
 const raw=AndroidBridge.pendingNexaBackup();if(!raw)return;
 try{
  const pending=JSON.parse(raw);if(pending.error)throw Error(pending.error);
  NexaBackup.validate(pending.web);
  // A previously interrupted transaction may have written a subset of these exact values.
  const keys=new Set([...Object.keys(pending.before),...Object.keys(pending.web)]);
  for(const key of keys){const value=localStorage.getItem(key);if(value!==null&&value!==pending.before[key]&&value!==pending.web[key])throw Error('恢复期间数据发生变化，已停止覆盖');}
  NexaBackup.restore(localStorage,pending.web);
  const status=AndroidBridge.commitNexaBackup();
  if(status!=='ok'){
   for(const key of Object.keys(pending.web))if(!(key in pending.before))localStorage.removeItem(key);
   NexaBackup.restore(localStorage,pending.before);throw Error(status);
  }
  window.nexaRestoreMessage='完整恢复成功，旧 To-Do 数据未删除。请检查附件并避免两边重复提醒。';
 }catch(e){window.nexaRestoreMessage='恢复未完成：'+e.message+'。请保留备份，不要清除应用数据。';}
})();
