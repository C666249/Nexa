/* To-Do bridge only: export its own storage through an explicit system file picker. */
(function(){
 const button=document.createElement('button');button.textContent='迁移备份';button.title='导出到 Nexa';
 button.style.cssText='border:1px solid #c5b59d;background:#fffdf8;color:#65523c;border-radius:10px;padding:9px;font-size:12px;flex:none';
 document.querySelector('.header__top').append(button);
 button.onclick=()=>showConfirm('导出完整备份用于 Nexa 恢复。包含全部记录、附件和设置（可能包含 AI 密钥），请妥善保存，不要公开分享。旧数据不会删除。',()=>{
  try{
   if(isNoteEditorVisible())saveCurrentNote();window.__pullNativeTodoMutations?.();window.__pullNativeDailyTaskMutations?.();
   const data={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);data[key]=localStorage.getItem(key);}
   const status=AndroidBridge.beginNexaBackup(JSON.stringify(data),false);if(status!=='ok')throw Error(status);
   const mask=document.createElement('div');mask.id='bridgeBusy';mask.style.cssText='position:fixed;inset:0;background:#fffdf8ee;z-index:99999;display:grid;place-items:center';mask.textContent='正在导出完整备份…';document.body.append(mask);
  }catch(e){showToast('备份未完成：'+e.message);}
 });
 window.__nexaBackupFinished=message=>{document.getElementById('bridgeBusy')?.remove();showToast(message);};
})();
