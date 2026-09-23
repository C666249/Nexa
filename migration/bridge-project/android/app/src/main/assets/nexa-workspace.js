/* Shared Space and focused editing, layered on the existing record/gesture owners. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),S=NexaSpace,KEY='nexa_space_v1';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let model,storageError=false,selectedTag='',kindFilter='',onlyFavorites=false,search='';
 try{model=localStorage.getItem(KEY)?S.validate(JSON.parse(localStorage.getItem(KEY))):S.empty();}
 catch(e){storageError=true;model=S.empty();setTimeout(()=>showToast('Space 数据读取失败，已保护原数据，请勿清除应用数据'),500);}
 function store(next){if(storageError)throw Error('Space 数据受保护，暂不可修改');S.validate(next);localStorage.setItem(KEY,JSON.stringify(next));model=next;}
 function sync(){if(storageError)return;const next=S.seed(model,todos,noteTopics,notes);if(JSON.stringify(next)!==JSON.stringify(model))store(next);}
 function safe(fn){try{fn();}catch(e){showToast(e.message||'操作未保存，请重试');}}
 safe(sync);
 const overlay=document.createElement('div');overlay.id='nexaDialog';overlay.className='nexa-dialog';overlay.hidden=true;
 overlay.innerHTML='<section role="dialog" aria-modal="true" aria-labelledby="nexaDialogTitle"><header><h2 id="nexaDialogTitle"></h2><button data-nx-close aria-label="关闭">×</button></header><div id="nexaDialogBody"></div></section>';
 document.body.append(overlay);let returnFocus=null;
 function close(){overlay.hidden=true;returnFocus?.focus({preventScroll:true});}
 function dialog(title,html){returnFocus=document.activeElement;overlay.hidden=false;$('nexaDialogTitle').textContent=title;$('nexaDialogBody').innerHTML=html;overlay.querySelector('input,select,button').focus({preventScroll:true});}
 overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('[data-nx-close]'))close();});
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const all=[...overlay.querySelectorAll('button,input,select')].filter(n=>!n.disabled);const first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 const originalBack=handleBackPress;
 handleBackPress=function(){if(!overlay.hidden){close();return 'nexa-dialog';}if($('noteFormatBar').classList.contains('nexa-expanded')){$('noteFormatBar').classList.remove('nexa-expanded');$('nexaFormatMore').setAttribute('aria-expanded','false');syncNoteImeLayout();return 'nexa-tools';}return originalBack();};
 function records(){return [...todos.map(t=>({kind:'todo',id:t.id,title:t.text,sub:t.category||'任务',date:t.createdAt})),...notes.map(n=>({kind:'note',id:n.id,title:n.title||'未命名笔记',sub:notePlainPreview(n),date:n.createdAt})),...dailyTasks.map(t=>({kind:'daily',id:t.id,title:t.text,sub:dailyTimeLabel(t),date:t.createdAt}))];}
 function labels(kind,id){return (model.assignments[kind+':'+id]||[]).map(id=>model.nodes.find(n=>n.id===id)?.title).filter(Boolean).join(' · ');}
 function resultRow(r){return '<div class="nexa-library-row"><button data-nx-open="'+r.kind+':'+Number(r.id)+'"><span>'+esc(r.title)+'</span><small>'+({todo:'Todo',note:'Note',daily:'Daily'}[r.kind])+' · '+esc(labels(r.kind,r.id)||r.sub)+'</small></button><button class="nexa-tag-button" data-nx-tag="'+r.kind+':'+Number(r.id)+'" aria-label="设置 '+esc(r.title)+' 的标签">标签</button></div>';}
 function library(){const q=search.trim().toLocaleLowerCase();return records().filter(r=>(!kindFilter||r.kind===kindFilter)&&(!onlyFavorites||r.kind==='note'&&model.favorites[String(r.id)])&&S.matches(model,r.kind,r.id,selectedTag)&&(!q||(r.title+' '+r.sub+' '+labels(r.kind,r.id)).toLocaleLowerCase().includes(q)));}
 function renderResults(){const el=$('nexaLibraryResults');if(!el)return;const list=library();el.innerHTML='<p class="nexa-muted">'+list.length+' 条内容'+(selectedTag?' · 包含子标签':'')+'</p>'+(list.map(resultRow).join('')||'<p class="nexa-empty">这里还没有内容。可在 Todo、Note 或 Daily 中创建，再为它设置标签。</p>');}
 function renderSpace(){
  safe(sync);const el=$('nexaSpace');
  el.innerHTML='<header class="nexa-page-head"><div><h1>Space</h1><p>任务、笔记与日常，连在一起。</p></div><button class="nexa-icon-btn" data-nx-new aria-label="新建标签">＋</button></header>'+
   (storageError?'<p role="alert">原 Space 数据读取失败，暂时只读；没有覆盖原文件。</p>':'')+
   '<section class="nexa-paper nexa-space-tree"><div class="nexa-section-head"><h2>共享标签</h2><button data-nx-all>全部内容</button></div>'+S.tree(model).map(n=>'<div class="nexa-space-node" style="--depth:'+Math.min(n.depth,10)+'"><button data-nx-select="'+esc(n.id)+'" aria-pressed="'+(selectedTag===n.id)+'">'+esc(n.title)+'</button><button data-nx-manage="'+esc(n.id)+'" aria-label="管理 '+esc(n.title)+'">···</button></div>').join('')+(!model.nodes.length?'<p class="nexa-empty">建立第一个标签，让三种记录拥有共同的位置。</p>':'')+'</section>'+
   '<section class="nexa-paper nexa-library"><label class="nexa-field">搜索所有内容<input id="nexaLibrarySearch" placeholder="任务、笔记正文、Daily 或标签" value="'+esc(search)+'"></label><div class="nexa-filter-row">'+[['','全部'],['todo','Todo'],['note','Note'],['daily','Daily']].map(([k,t])=>'<button data-nx-kind="'+k+'" aria-pressed="'+(kindFilter===k&&!onlyFavorites)+'">'+t+'</button>').join('')+'<button data-nx-favorites aria-pressed="'+onlyFavorites+'">收藏</button></div><div id="nexaLibraryResults"></div></section>'+
   '<section class="nexa-paper nexa-tools"><button data-nexa-action="ai">AI 助手</button><button data-nexa-action="recycle">回收站</button><button data-nexa-action="reminders">每日总结提醒</button><button data-nexa-action="help">使用指南</button><button data-nx-migration>数据迁移与备份说明</button></section>';
  $('nexaLibrarySearch').addEventListener('input',e=>{search=e.target.value;renderResults();});renderResults();
 }
 function picker(kind,id){safe(sync);const current=model.assignments[kind+':'+id]||[];dialog('共享标签','<p class="nexa-muted">同一标签可用于 Todo、Note 和 Daily，不改变原文件夹。</p>'+S.tree(model).map(n=>'<label class="nexa-check-label"><input type="checkbox" value="'+esc(n.id)+'" '+(current.includes(n.id)?'checked':'')+'><span style="padding-left:'+Math.min(n.depth,8)*12+'px">'+esc(n.title)+'</span></label>').join('')+(!model.nodes.length?'<p>请先在 Space 新建标签。</p>':'')+'<button class="nexa-primary" id="nexaTagsSave">保存标签</button>');$('nexaTagsSave').onclick=()=>safe(()=>{store(S.assign(model,kind,Number(id),[...overlay.querySelectorAll('input:checked')].map(n=>n.value)));close();decorate();if(NexaShell.page==='space')renderSpace();});}
 function manage(id){const n=model.nodes.find(n=>n.id===id);dialog(n?'管理标签':'新建标签','<label class="nexa-field">名称<input id="nexaLabelName" maxlength="100" value="'+esc(n?.title||'')+'"></label><label class="nexa-field">上级标签<select id="nexaLabelParent"><option value="">无上级</option>'+S.tree(model).filter(x=>x.id!==id).map(x=>'<option value="'+esc(x.id)+'" '+(n?.parent===x.id?'selected':'')+'>'+esc('　'.repeat(Math.min(x.depth,8))+x.title)+'</option>').join('')+'</select></label><button id="nexaLabelSave" class="nexa-primary">保存</button>'+(n?'<button id="nexaLabelDelete" class="nexa-secondary">移除标签（不删除内容）</button>':''));$('nexaLabelSave').onclick=()=>safe(()=>{let next=n?S.move(S.rename(model,id,$('nexaLabelName').value),id,$('nexaLabelParent').value||null):S.add(model,'label:'+crypto.randomUUID(),$('nexaLabelName').value,$('nexaLabelParent').value||null);store(next);close();renderSpace();});if(n)$('nexaLabelDelete').onclick=()=>safe(()=>{store(S.remove(model,id));if(selectedTag===id)selectedTag='';close();renderSpace();showToast('标签已移除，子标签和内容保留');});}
 function open(kind,id){closeDailyHistory();close();if(kind==='note'){NexaShell.navigate('notes');openNoteFromSurface(id);}else if(kind==='todo'){NexaShell.navigate('todo');searchQuery='';searchInput.value='';currentTab='all';document.querySelector('.tab[data-tab="all"]').click();selectCategory('全部');}else NexaShell.navigate('daily');const row=kind==='todo'?document.querySelector('.todo-item[data-id="'+id+'"]'):kind==='daily'?document.querySelector('[data-daily-id="'+id+'"]'):null;if(row){row.scrollIntoView({block:'center'});row.classList.add('highlight-flash');setTimeout(()=>row.classList.remove('highlight-flash'),1600);}}
 function decorate(){
  for(const [selector,kind,attr,host] of [['.todo-item[data-id]','todo','data-id','.todo-item__main'],['.daily-item[data-daily-id]','daily','data-daily-id','.daily-item__inner']])document.querySelectorAll(selector).forEach(row=>{const id=Number(row.getAttribute(attr));let b=row.querySelector('[data-nx-tag]');if(!b){b=document.createElement('button');b.className='nexa-tag-button';b.dataset.nxTag=kind+':'+id;(row.querySelector(host)||row).append(b);}const title=labels(kind,id)||'标签';if(b.textContent!==title)b.textContent=title;b.setAttribute('aria-label','设置共享标签');});
  const title=labels('note',currentNoteId)||'设置标签';if($('nexaNoteTags').textContent!==title)$('nexaNoteTags').textContent=title;
  const fav=!!model.favorites[String(currentNoteId)];$('nexaFavorite').textContent=fav?'★':'☆';$('nexaFavorite').setAttribute('aria-pressed',String(fav));
 }
 const noteMeta=document.createElement('div');noteMeta.className='nexa-note-meta';noteMeta.innerHTML='<button id="nexaNoteTags">设置标签</button><button id="nexaFavorite" aria-label="收藏笔记" aria-pressed="false">☆</button>';$('noteEditorBreadcrumb').after(noteMeta);
 $('nexaNoteTags').onclick=()=>picker('note',currentNoteId);$('nexaFavorite').onclick=()=>safe(()=>{store(S.favorite(model,currentNoteId,!model.favorites[String(currentNoteId)]));decorate();});
 // Move existing nodes: no cloned handlers, synthetic formatting or selection replacement.
 const bar=$('noteFormatBar'),primary=document.createElement('div'),secondary=document.createElement('div');primary.className='nexa-format-primary';secondary.className='nexa-format-secondary';secondary.id='nexaFormatSecondary';
 const first=[bar.querySelector('[data-cmd="bold"]'),bar.querySelector('[data-cmd="italic"]'),bar.querySelector('[onclick="insertCheckbox()"]'),$('noteAddImageBtn')];
 [...bar.children].forEach(node=>{if(first.includes(node))return;secondary.append(node);});first.forEach(node=>primary.append(node));
 const more=document.createElement('button');more.id='nexaFormatMore';more.textContent='···';more.title='更多格式';more.setAttribute('aria-label','更多格式');more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls',secondary.id);more.addEventListener('pointerdown',e=>e.preventDefault());more.addEventListener('click',()=>{const on=bar.classList.toggle('nexa-expanded');more.setAttribute('aria-expanded',String(on));syncNoteImeLayout();});primary.append(more);bar.append(secondary,primary);
 const oldSheet=renderDailyHistorySheet;renderDailyHistorySheet=function(){oldSheet();const key=dailyHistorySelectedKey;if(!key)return;const rows=records().filter(r=>r.kind!=='daily'&&NexaCore.dateKey(new Date(Number(r.date)))===key);let section=$('nexaDateRecords');if(!section){section=document.createElement('div');section.id='nexaDateRecords';$('dailyHistorySheetList').after(section);}section.innerHTML='<h3>当天创建的记录</h3><p class="nexa-muted">任务 '+rows.filter(r=>r.kind==='todo').length+' · 笔记 '+rows.filter(r=>r.kind==='note').length+'（任务显示当前状态，并非历史完成快照）</p>'+rows.map(resultRow).join('');};
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-nx-tag')){e.preventDefault();e.stopImmediatePropagation();const[k,id]=b.dataset.nxTag.split(':');safe(()=>picker(k,Number(id)));return;}
  if(b.dataset.nexaAction==='search'){e.preventDefault();e.stopImmediatePropagation();NexaShell.navigate('space');selectedTag='';kindFilter='';onlyFavorites=false;renderSpace();$('nexaLibrarySearch').focus();return;}
  if(b.dataset.nxOpen){const[k,id]=b.dataset.nxOpen.split(':');open(k,Number(id));}
  if(b.hasAttribute('data-nx-new'))manage(null);
  if(b.dataset.nxManage)manage(b.dataset.nxManage);
  if(b.hasAttribute('data-nx-select')){selectedTag=b.dataset.nxSelect;renderSpace();}
  if(b.hasAttribute('data-nx-all')){selectedTag='';renderSpace();}
  if(b.hasAttribute('data-nx-kind')){kindFilter=b.dataset.nxKind;onlyFavorites=false;renderSpace();}
  if(b.hasAttribute('data-nx-favorites')){onlyFavorites=!onlyFavorites;kindFilter=onlyFavorites?'note':'';renderSpace();}
  if(b.hasAttribute('data-nx-migration'))dialog('数据迁移与备份','<p>完整备份包含任务、笔记、标签、Daily、附件和设置（也可能包含 AI 密钥），只保存在你选择的位置，请勿公开分享。</p><p>旧 To-Do 需先安装同签名的迁移桥接更新，再导出备份；Nexa 仅在没有已有记录和附件时恢复，不自动覆盖。旧应用保留不动。</p><button class="nexa-primary" data-nx-backup="export">导出完整备份</button><button class="nexa-secondary" data-nx-backup="import">从完整备份恢复</button>');
  if(b.dataset.nxBackup)safe(()=>{
   if(typeof AndroidBridge==='undefined'||!AndroidBridge.beginNexaBackup)throw Error('请在 Android 应用中使用完整备份');
   if(b.dataset.nxBackup==='import'&&NexaBackup.populated(localStorage))throw Error('Nexa 已有内容，为避免覆盖，暂不支持合并恢复');
   if(isNoteEditorVisible())saveCurrentNote();window.__pullNativeTodoMutations?.();window.__pullNativeDailyTaskMutations?.();
   const data={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);data[key]=localStorage.getItem(key);}
   const status=AndroidBridge.beginNexaBackup(JSON.stringify(data),b.dataset.nxBackup==='import');if(status!=='ok')throw Error(status);
   close();document.body.classList.add('nexa-backup-busy');
  });
 },true);
 let frame=0;const schedule=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;safe(sync);decorate();});};
 new MutationObserver(schedule).observe($('todo-list'),{childList:true,subtree:true});
 new MutationObserver(schedule).observe($('dailyList'),{childList:true,subtree:true});
 new MutationObserver(schedule).observe($('noteEditorBreadcrumb'),{childList:true});
 new MutationObserver(()=>{if(NexaShell.page==='space')renderSpace();}).observe(document.body,{attributes:true,attributeFilter:['data-nexa-page']});
 window.NexaWorkspace={get model(){return model;},renderSpace,picker,manage,open,sync,decorate};decorate();
 window.__nexaBackupFinished=message=>{document.body.classList.remove('nexa-backup-busy');showToast(message);};
 if(window.nexaRestoreMessage)setTimeout(()=>showToast(window.nexaRestoreMessage),500);
})();
