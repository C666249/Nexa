/* Shared Space and focused editing, layered on the existing record/gesture owners. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),S=NexaSpace,KEY='nexa_space_v1';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const SPACE_BATCH=36;
 let model,storageError=false,selectedTag='',kindFilter='',search='',favoriteKindFilter='',favoriteSearch='',spaceView='hub',libraryLimit=SPACE_BATCH,favoriteLimit=SPACE_BATCH,preserveSpaceViewOnEntry=false;
 const spaceScrolls={hub:0,library:0,favorites:0,labels:0,tools:0};
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
 const favoriteDetail=document.createElement('div');favoriteDetail.id='nexaFavoriteDetail';favoriteDetail.className='nexa-favorite-detail';favoriteDetail.hidden=true;favoriteDetail.innerHTML='<section class="nexa-favorite-detail__sheet" role="dialog" aria-modal="true" aria-labelledby="nexaFavoriteDetailTitle"><div class="nexa-favorite-detail__grab" aria-hidden="true"></div><header><button class="nexa-favorite-detail__back" data-nx-favorite-detail-close aria-label="返回收藏库"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><div><small>收藏库</small><h2 id="nexaFavoriteDetailTitle"></h2></div><button class="nexa-favorite-detail__star" data-nx-favorite-detail-star aria-label="切换收藏">★</button></header><div id="nexaFavoriteDetailBody" class="nexa-favorite-detail__body"></div></section>';document.body.append(favoriteDetail);
 let favoriteDetailState=null,favoriteDetailScroll=0,favoriteNoteReturn=null,favoriteTodoSaveTimer=0;
 function favoriteDetailOpen(){return !!(favoriteDetailState&&!favoriteDetail.hidden);}
 function restoreFavoriteScroll(top){requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:Math.max(0,Number(top)||0),behavior:'instant'})));}
 function saveFavoriteTodoTitle(immediate){if(!favoriteDetailState||favoriteDetailState.kind!=='todo')return;clearTimeout(favoriteTodoSaveTimer);const commit=()=>{const todo=todos.find(t=>Number(t.id)===Number(favoriteDetailState?.id)),input=$('nexaFavoriteTodoTitle');if(!todo||!input)return;const value=String(input.value||'').trim();if(!value){input.value=todo.text||'';showToast('待办标题不能为空');return;}if(value!==todo.text){todo.text=value;todo.updatedAt=Date.now();saveTodos();}};if(immediate)commit();else favoriteTodoSaveTimer=setTimeout(commit,360);}
 function favoriteTodoStatusLabel(todo){if(Array.isArray(todo?.checklist)&&todo.checklist.length){const progress=checklistProgress(todo);return progress.done+'/'+progress.total+' 已完成';}return todo?.status==='completed'?'已完成':todo?.status==='in-progress'?'进行中':'待处理';}
 function favoriteTodoReminderLabel(todo){const at=Number(todo?.reminderAt||0);if(!at)return '设置提醒';const d=new Date(at);return (d.getMonth()+1)+'/'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
 function renderFavoriteTodoDetail(){if(!favoriteDetailState||favoriteDetailState.kind!=='todo')return;const todo=todos.find(t=>Number(t.id)===Number(favoriteDetailState.id));if(!todo){closeFavoriteDetail({refresh:true});return;}$('nexaFavoriteDetailTitle').textContent='Todo';favoriteDetail.querySelector('[data-nx-favorite-detail-star]').textContent=S.isFavorite(model,'todo',todo.id)?'★':'☆';favoriteDetail.querySelector('[data-nx-favorite-detail-star]').setAttribute('aria-pressed',String(S.isFavorite(model,'todo',todo.id)));const checklist=Array.isArray(todo.checklist)?todo.checklist:[];const statusControls=checklist.length?'<div class="nexa-favorite-detail__status-line"><span>'+esc(favoriteTodoStatusLabel(todo))+'</span><div><button data-nx-fav-todo-all="done">全部完成</button><button data-nx-fav-todo-all="reset">全部重置</button></div></div>':'<div class="nexa-favorite-status" role="group" aria-label="待办状态">'+[['todo','待处理'],['in-progress','进行中'],['completed','已完成']].map(([k,t])=>'<button data-nx-fav-todo-status="'+k+'" aria-pressed="'+(todo.status===k)+'">'+t+'</button>').join('')+'</div>';const checklistHtml=checklist.length?'<section class="nexa-favorite-detail__section"><h3>子清单</h3><div class="nexa-favorite-checklist">'+checklist.map(item=>'<button class="nexa-favorite-check-item" data-nx-fav-sub="'+Number(item.id)+'" aria-pressed="'+!!item.done+'"><span class="nexa-favorite-check-item__box">'+(item.done?'✓':'')+'</span><span>'+esc(item.text)+'</span></button>').join('')+'</div></section>':'';$('nexaFavoriteDetailBody').innerHTML='<label class="nexa-field nexa-favorite-title-field">标题<input id="nexaFavoriteTodoTitle" maxlength="240" value="'+esc(todo.text||'')+'"></label>'+statusControls+checklistHtml+'<section class="nexa-favorite-detail__section"><h3>快捷操作</h3><div class="nexa-favorite-detail__actions"><button data-nx-fav-reminder>⏰ <span>'+esc(favoriteTodoReminderLabel(todo))+'</span></button><button data-nx-fav-tags>标签 <span>'+esc(labels('todo',todo.id)||'设置共享标签')+'</span></button></div></section><button class="nexa-favorite-detail__danger" data-nx-fav-delete>删除待办</button>';const title=$('nexaFavoriteTodoTitle');title?.addEventListener('input',()=>saveFavoriteTodoTitle(false));title?.addEventListener('blur',()=>saveFavoriteTodoTitle(true));}
 function openFavoriteTodo(id){const todo=todos.find(t=>Number(t.id)===Number(id));if(!todo)return;favoriteDetailScroll=window.scrollY||spaceScrolls.favorites||0;spaceScrolls.favorites=favoriteDetailScroll;favoriteDetailState={kind:'todo',id:Number(id)};favoriteDetail.hidden=false;favoriteDetail.classList.add('active');renderFavoriteTodoDetail();requestAnimationFrame(()=>{const sheet=favoriteDetail.querySelector('.nexa-favorite-detail__sheet');if(sheet&&window.NexaMotion?.presentSheet)NexaMotion.presentSheet(sheet);});}
 function closeFavoriteDetail(options){options=options||{};if(!favoriteDetailOpen())return false;saveFavoriteTodoTitle(true);clearTimeout(favoriteTodoSaveTimer);favoriteDetail.classList.remove('active');favoriteDetail.hidden=true;favoriteDetailState=null;if(options.refresh!==false&&window.NexaShell?.page==='space'&&spaceView==='favorites')renderSpace();restoreFavoriteScroll(favoriteDetailScroll);return true;}
 function finishFavoriteNoteReturn(){if(!favoriteNoteReturn)return;const top=favoriteNoteReturn.scroll;favoriteNoteReturn=null;document.body.classList.remove('nexa-favorite-note-open');if(window.NexaShell?.page==='space'){spaceView='favorites';spaceScrolls.favorites=top;renderSpace();restoreFavoriteScroll(top);}}
 function openFavoriteNote(id){if(typeof openNoteEditor!=='function'||!getNoteById(id))return;const top=window.scrollY||spaceScrolls.favorites||0;spaceScrolls.favorites=top;favoriteNoteReturn={id:Number(id),scroll:top};document.body.classList.add('nexa-favorite-note-open');openNoteEditor(Number(id),{preserveKeyboard:false,forceRead:true});}
 const noteEditorEl=$('noteEditor');if(noteEditorEl)new MutationObserver(()=>{if(favoriteNoteReturn&&!isNoteEditorVisible())finishFavoriteNoteReturn();}).observe(noteEditorEl,{attributes:true,attributeFilter:['style']});
 const reminderOverlayEl=$('reminderPickerOverlay');if(reminderOverlayEl)new MutationObserver(()=>{if(favoriteDetailOpen()&&favoriteDetailState?.kind==='todo'&&!reminderOverlayEl.classList.contains('active'))renderFavoriteTodoDetail();}).observe(reminderOverlayEl,{attributes:true,attributeFilter:['class']});
 favoriteDetail.addEventListener('click',e=>{if(e.target===favoriteDetail){closeFavoriteDetail();return;}const b=e.target.closest('button');if(!b||!favoriteDetailState)return;if(b.hasAttribute('data-nx-favorite-detail-close')){closeFavoriteDetail();return;}const todo=favoriteDetailState.kind==='todo'?todos.find(t=>Number(t.id)===Number(favoriteDetailState.id)):null;if(!todo)return;if(b.hasAttribute('data-nx-favorite-detail-star')){const next=!S.isFavorite(model,'todo',todo.id);if(setFavorite('todo',todo.id,next)){b.textContent=next?'★':'☆';b.setAttribute('aria-pressed',String(next));showToast(next?'已收藏':'已从收藏库移除');}return;}if(b.dataset.nxFavTodoStatus){todo.status=b.dataset.nxFavTodoStatus;todo.updatedAt=Date.now();saveTodos();renderFavoriteTodoDetail();return;}if(b.dataset.nxFavTodoAll){if(Array.isArray(todo.checklist)){const done=b.dataset.nxFavTodoAll==='done';todo.checklist.forEach(item=>item.done=done);syncChecklistStatus(todo);todo.updatedAt=Date.now();persistTodosWithoutRender();renderFavoriteTodoDetail();}return;}if(b.dataset.nxFavSub){const item=(todo.checklist||[]).find(x=>Number(x.id)===Number(b.dataset.nxFavSub));if(item){item.done=!item.done;syncChecklistStatus(todo);todo.updatedAt=Date.now();persistTodosWithoutRender();renderFavoriteTodoDetail();}return;}if(b.hasAttribute('data-nx-fav-reminder')){saveFavoriteTodoTitle(true);openTodoReminderPicker(todo.id);return;}if(b.hasAttribute('data-nx-fav-tags')){saveFavoriteTodoTitle(true);picker('todo',todo.id);return;}if(b.hasAttribute('data-nx-fav-delete')){saveFavoriteTodoTitle(true);showConfirm('确定删除这条待办？',()=>{const top=favoriteDetailScroll;deleteTodoById(todo.id);favoriteDetail.hidden=true;favoriteDetail.classList.remove('active');favoriteDetailState=null;setTimeout(()=>{if(window.NexaShell?.page==='space'){spaceView='favorites';renderSpace();restoreFavoriteScroll(top);}},40);});return;}});
 const originalBack=handleBackPress;
 handleBackPress=function(){if(window.NexaHighlight?.active){NexaHighlight.cancel();return 'note-highlight-gesture';}if(!overlay.hidden){close();return 'nexa-dialog';}if(favoriteNoteReturn&&isNoteEditorVisible()){const result=originalBack();if(!isNoteEditorVisible())finishFavoriteNoteReturn();return result;}if(document.getElementById('reminderPickerOverlay')?.classList.contains('active'))return originalBack();if(document.getElementById('confirmOverlay')?.style.display!=='none'||document.getElementById('promptOverlay')?.style.display!=='none')return originalBack();if(favoriteDetailOpen()){closeFavoriteDetail();return 'nexa-favorite-detail';}if(window.NexaShell?.page==='space'&&spaceView!=='hub'){spaceNavigate('hub');return 'nexa-space-hub';}if(noteTitleGesture){closeNoteTitleGesture(false);return 'note-title-gesture';}if(isNoteEditorVisible()&&$('noteFormatBar').classList.contains('nexa-expanded')){$('noteFormatBar').classList.remove('nexa-expanded');$('nexaFormatMore').setAttribute('aria-expanded','false');syncNoteImeLayout();return 'nexa-tools';}return originalBack();};
 const spaceIcons={library:'M4 5h16v14H4Z M8 9h8 M8 13h8 M8 17h5',favorites:'M12 3.8l2.45 4.96 5.48.8-3.97 3.87.94 5.46L12 16.31 7.1 18.89l.94-5.46L4.07 9.56l5.48-.8L12 3.8Z',labels:'M4 7h7l2 2h7v10H4Z M8 4h5l2 3',tools:'M5 7h14 M5 12h14 M5 17h14 M9 4v6 M15 9v6 M11 14v6',back:'M15 5l-7 7 7 7',plus:'M12 5v14 M5 12h14',chevron:'M9 5l7 7-7 7'};
 const spaceIcon=name=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+spaceIcons[name]+'"/></svg>';
 function records(){return [...todos.map(t=>({kind:'todo',id:t.id,title:t.text,sub:t.category||'任务',date:t.updatedAt||t.createdAt})),...notes.map(n=>({kind:'note',id:n.id,title:n.title||'未命名笔记',sub:notePlainPreview(n),date:n.updatedAt||n.createdAt})),...dailyTasks.map(t=>({kind:'daily',id:t.id,title:t.text,sub:dailyTimeLabel(t),date:t.createdAt}))].sort((a,b)=>(Number(b.date)||0)-(Number(a.date)||0));}
 function labels(kind,id){return (model.assignments[kind+':'+id]||[]).map(id=>model.nodes.find(n=>n.id===id)?.title).filter(Boolean).join(' · ');}
 function searchMark(value,query){
  const source=String(value??''),q=String(query??'').trim();if(!q)return esc(source);
  const lower=source.toLocaleLowerCase('zh-CN'),needle=q.toLocaleLowerCase('zh-CN');let at=lower.indexOf(needle),cursor=0,html='';
  while(at!==-1){html+=esc(source.slice(cursor,at));html+='<mark class="nexa-global-search-match">'+esc(source.slice(at,at+q.length))+'</mark>';cursor=at+q.length;at=lower.indexOf(needle,cursor);}
  return html+esc(source.slice(cursor));
 }
 function resultRow(r,options){options=options||{};const q=String(options.query!==undefined?options.query:(options.highlight?search:'')||'').trim();const meta=labels(r.kind,r.id)||r.sub;const favoriteControl=!!options.favoriteControl;const openAttr=favoriteControl?'data-nx-favorite-open':'data-nx-open';const trailing=favoriteControl?'<button class="nexa-favorite-row-btn" data-nx-favorite-toggle="'+r.kind+':'+Number(r.id)+'" aria-label="取消收藏 '+esc(r.title)+'" aria-pressed="true">★</button>':'<button class="nexa-tag-button" data-nx-tag="'+r.kind+':'+Number(r.id)+'" aria-label="设置 '+esc(r.title)+' 的标签">标签</button>';return '<div class="nexa-library-row'+(q?' nexa-global-search-hit':'')+'"><button '+openAttr+'="'+r.kind+':'+Number(r.id)+'"><span>'+searchMark(r.title,q)+'</span><small>'+({todo:'Todo',note:'Note',daily:'Daily'}[r.kind])+' · '+searchMark(meta,q)+'</small></button>'+trailing+'</div>';}
 function library(){const q=search.trim().toLocaleLowerCase();return records().filter(r=>(!kindFilter||r.kind===kindFilter)&&S.matches(model,r.kind,r.id,selectedTag)&&(!q||(r.title+' '+r.sub+' '+labels(r.kind,r.id)).toLocaleLowerCase().includes(q)));}
 function favoriteRecords(){const q=favoriteSearch.trim().toLocaleLowerCase();return records().filter(r=>(r.kind==='todo'||r.kind==='note')&&S.isFavorite(model,r.kind,r.id)&&(!favoriteKindFilter||r.kind===favoriteKindFilter)&&(!q||(r.title+' '+r.sub+' '+labels(r.kind,r.id)).toLocaleLowerCase().includes(q)));}
 function renderResults(){const el=$('nexaLibraryResults');if(!el)return;const list=library(),visible=list.slice(0,libraryLimit);el.innerHTML='<p class="nexa-muted">'+list.length+' 条内容'+(selectedTag?' · 包含子标签':'')+(list.length>visible.length?' · 当前显示 '+visible.length+' 条':'')+'</p>'+(visible.map(r=>resultRow(r,{highlight:true})).join('')||'<p class="nexa-empty">这里还没有内容。可在 Todo、Note 或 Daily 中创建，再为它设置标签。</p>')+(list.length>visible.length?'<button class="nexa-library-more" data-nx-more>再显示 '+Math.min(SPACE_BATCH,list.length-visible.length)+' 条</button>':'');}
 function renderFavoriteResults(){const el=$('nexaFavoriteResults');if(!el)return;const list=favoriteRecords(),visible=list.slice(0,favoriteLimit);el.innerHTML='<p class="nexa-muted">'+list.length+' 条收藏'+(list.length>visible.length?' · 当前显示 '+visible.length+' 条':'')+'</p>'+(visible.map(r=>resultRow(r,{query:favoriteSearch,favoriteControl:true})).join('')||'<p class="nexa-empty">还没有收藏。Todo 向右滑动可以收藏，Note 可使用五角星收藏。</p>')+(list.length>visible.length?'<button class="nexa-library-more" data-nx-favorite-more>再显示 '+Math.min(SPACE_BATCH,list.length-visible.length)+' 条</button>':'');}
 function spaceQuickNav(){return '<nav class="nexa-space-quick-nav" aria-label="Space 快速导航">'+[['library','library','内容库'],['favorites','favorites','收藏库'],['labels','labels','共享标签'],['tools','tools','工具与设置']].map(([view,iconName,label])=>'<button data-nx-space-view="'+view+'" aria-label="'+label+'" title="'+label+'" '+(spaceView===view?'aria-current="page"':'')+'>'+spaceIcon(iconName)+'</button>').join('')+'</nav>'; }
 function pageHead(title,subtitle,action){return '<header class="nexa-page-head nexa-space-page-head"><div class="nexa-space-title-wrap">'+(spaceView!=='hub'?'<button class="nexa-space-back" data-nx-space-back aria-label="返回 Space">'+spaceIcon('back')+'</button>':'')+'<div><h1>'+esc(title)+'</h1><p>'+esc(subtitle)+'</p></div></div><div class="nexa-space-head-actions">'+spaceQuickNav()+(action||'')+'</div></header>'; }
 function hubCard(view,icon,title,desc,meta,count,index){return '<button class="nexa-paper nexa-space-hub-card" data-nx-space-view="'+view+'" data-nexa-stack style="--nexa-stack-index:'+index+'"><span class="nexa-space-hub-icon">'+spaceIcon(icon)+'</span><span class="nexa-space-hub-copy"><strong>'+esc(title)+'</strong><span>'+esc(desc)+'</span><small>'+esc(meta)+'</small></span><span class="nexa-space-hub-count">'+esc(count)+'</span><span class="nexa-space-hub-chevron">'+spaceIcon('chevron')+'</span></button>';}
 function renderHub(el){
  const all=records(),todoCount=all.filter(r=>r.kind==='todo').length,noteCount=all.filter(r=>r.kind==='note').length,dailyCount=all.filter(r=>r.kind==='daily').length,favCount=all.filter(r=>(r.kind==='todo'||r.kind==='note')&&S.isFavorite(model,r.kind,r.id)).length;
  el.innerHTML=pageHead('Space','内容、收藏、标签和工具，各自有自己的入口。','<button class="nexa-icon-btn" data-nx-new aria-label="新建标签">'+spaceIcon('plus')+'</button>')+
   (storageError?'<p role="alert">原 Space 数据读取失败，暂时只读；没有覆盖原文件。</p>':'')+
   '<section class="nexa-space-hub" aria-label="Space 分区">'+
    hubCard('library','library','内容库','统一搜索 Todo、Note 与 Daily','Todo '+todoCount+' · Note '+noteCount+' · Daily '+dailyCount,all.length+'',0)+
    hubCard('favorites','favorites','收藏库','长期保留暂时不能处理的重要内容','Todo 与 Note · 独立搜索筛选',favCount+'',1)+
    hubCard('labels','labels','共享标签','把三种内容放进同一套多级标签','已建立 '+model.nodes.length+' 个标签',model.nodes.length+'',2)+
    hubCard('tools','tools','工具与设置','工具栏、AI、回收站、提醒与备份','常用功能集中在这里','',3)+
   '</section>';
  requestAnimationFrame(()=>window.NexaMotion?.enhanceStack(el));
 }
 function renderLabels(el){
  el.innerHTML=pageHead('共享标签','支持多级层级；点击标签会进入该标签的内容库。','<button class="nexa-icon-btn" data-nx-new aria-label="新建标签">'+spaceIcon('plus')+'</button>')+
   '<section class="nexa-paper nexa-space-tree"><div class="nexa-section-head"><h2>标签结构</h2><button data-nx-all>查看全部内容</button></div>'+S.tree(model).map(n=>'<div class="nexa-space-node" style="--depth:'+Math.min(n.depth,10)+'"><button data-nx-select="'+esc(n.id)+'" aria-pressed="'+(selectedTag===n.id)+'">'+esc(n.title)+'</button><button data-nx-manage="'+esc(n.id)+'" aria-label="管理 '+esc(n.title)+'">···</button></div>').join('')+(!model.nodes.length?'<p class="nexa-empty">建立第一个标签，让 Todo、Note 和 Daily 拥有共同的位置。</p>':'')+'</section>';
 }
 function renderLibrary(el){
  el.innerHTML=pageHead('内容库',selectedTag?'当前按共享标签筛选，可继续搜索。':'统一搜索所有内容，不再和工具设置挤在同一条长页面。','')+
   '<section class="nexa-paper nexa-library"><label class="nexa-field">搜索所有内容<input id="nexaLibrarySearch" placeholder="任务、笔记正文、Daily 或标签" value="'+esc(search)+'"></label><div class="nexa-filter-row">'+[['','全部'],['todo','Todo'],['note','Note'],['daily','Daily']].map(([k,t])=>'<button data-nx-kind="'+k+'" aria-pressed="'+(kindFilter===k)+'">'+t+'</button>').join('')+(selectedTag?'<button class="nexa-filter-clear" data-nx-clear-tag aria-label="清除标签筛选">清除标签</button>':'')+'</div><div id="nexaLibraryResults"></div></section>';
  $('nexaLibrarySearch').addEventListener('input',e=>{search=e.target.value;libraryLimit=SPACE_BATCH;renderResults();});renderResults();
 }
 function renderFavorites(el){
  el.innerHTML=pageHead('收藏库','重要 Todo 与 Note 独立收在这里，不和内容库筛选混在一起。','')+
   '<section class="nexa-paper nexa-library nexa-favorites-library"><label class="nexa-field">搜索收藏<input id="nexaFavoriteSearch" placeholder="搜索收藏的待办或笔记" value="'+esc(favoriteSearch)+'"></label><div class="nexa-filter-row">'+[['','全部'],['todo','Todo'],['note','Note']].map(([k,t])=>'<button data-nx-favorite-kind="'+k+'" aria-pressed="'+(favoriteKindFilter===k)+'">'+t+'</button>').join('')+'</div><div id="nexaFavoriteResults"></div></section>';
  $('nexaFavoriteSearch').addEventListener('input',e=>{favoriteSearch=e.target.value;favoriteLimit=SPACE_BATCH;renderFavoriteResults();});renderFavoriteResults();
 }
 function toolButton(label,sub,attrs){return '<button class="nexa-space-tool" '+attrs+'><span><strong>'+esc(label)+'</strong><small>'+esc(sub)+'</small></span><span class="nexa-space-tool-chevron">'+spaceIcon('chevron')+'</span></button>';}
 function renderTools(el){
  el.innerHTML=pageHead('工具与设置','常用工具独立成页，不再被上百条内容推到最底部。','')+
   '<section class="nexa-paper nexa-space-tools-group"><h2>个性化</h2>'+toolButton('笔记工具栏自定义','调整常驻工具和更多工具的顺序','data-nx-toolbar')+'</section>'+
   '<section class="nexa-paper nexa-space-tools-group"><h2>效率工具</h2>'+toolButton('AI 助手','用自然语言创建、查询和整理待办','data-nexa-action="ai"')+toolButton('回收站','恢复误删任务或永久清理','data-nexa-action="recycle"')+toolButton('每日总结提醒','设置每天固定时间的总结提醒','data-nexa-action="reminders"')+toolButton('使用指南','查看手势与主要功能说明','data-nexa-action="help"')+'</section>'+
   '<section class="nexa-paper nexa-space-tools-group"><h2>数据</h2>'+toolButton('数据迁移与备份','完整导出或从备份恢复 Nexa','data-nx-migration')+'</section>';
 }
 function renderSpace(){
  safe(sync);const el=$('nexaSpace');if(!el)return;
  el.classList.add('nexa-space-view');el.dataset.spaceView=spaceView;
  if(spaceView==='library')renderLibrary(el);else if(spaceView==='favorites')renderFavorites(el);else if(spaceView==='labels')renderLabels(el);else if(spaceView==='tools')renderTools(el);else renderHub(el);
  bindSpaceSwipe();
 }
 function spaceNavigate(next){
  if(!['hub','library','favorites','labels','tools'].includes(next))next='hub';
  const previous=spaceView,order=['hub','library','favorites','labels','tools'];
  if(window.NexaShell?.page==='space')spaceScrolls[spaceView]=window.scrollY||0;
  spaceView=next;if(next!=='library')libraryLimit=SPACE_BATCH;if(next!=='favorites')favoriteLimit=SPACE_BATCH;renderSpace();
  const root=$('nexaSpace');if(root){const axis=previous==='hub'&&next!=='hub'?'child':next==='hub'&&previous!=='hub'?'parent':order.indexOf(next)>=order.indexOf(previous)?'forward':'back';root.dataset.spaceMotion=axis;root.classList.remove('nexa-space-motion');void root.offsetWidth;root.classList.add('nexa-space-motion');setTimeout(()=>root.classList.remove('nexa-space-motion'),390);}
  requestAnimationFrame(()=>window.scrollTo({top:spaceScrolls[next]||0,behavior:'instant'}));
 }
 const spaceSwipe={x:0,y:0,target:null};
 function bindSpaceSwipe(){const el=$('nexaSpace');if(!el||el.dataset.nexaSwipeBound)return;el.dataset.nexaSwipeBound='1';
  el.addEventListener('touchstart',e=>{if(!e.touches?.length||e.target.closest('input,textarea,select,.nexa-space-quick-nav,.nexa-filter-row,.nexa-library-more')){spaceSwipe.target=null;return;}spaceSwipe.x=e.touches[0].clientX;spaceSwipe.y=e.touches[0].clientY;spaceSwipe.target=e.target;},{passive:true});
  el.addEventListener('touchend',e=>{if(!spaceSwipe.target||!e.changedTouches?.length)return;const dx=e.changedTouches[0].clientX-spaceSwipe.x,dy=e.changedTouches[0].clientY-spaceSwipe.y;spaceSwipe.target=null;if(Math.abs(dx)<72||Math.abs(dx)<Math.abs(dy)*1.35)return;const pages=['library','favorites','labels','tools'];const i=pages.indexOf(spaceView);if(i<0)return;const next=dx<0?pages[i+1]:pages[i-1];if(next)spaceNavigate(next);},{passive:true});
 }
 function picker(kind,id){safe(sync);const current=model.assignments[kind+':'+id]||[];dialog('共享标签','<p class="nexa-muted">同一标签可用于 Todo、Note 和 Daily，不改变原文件夹。</p>'+S.tree(model).map(n=>'<label class="nexa-check-label"><input type="checkbox" value="'+esc(n.id)+'" '+(current.includes(n.id)?'checked':'')+'><span style="padding-left:'+Math.min(n.depth,8)*12+'px">'+esc(n.title)+'</span></label>').join('')+(!model.nodes.length?'<p>请先在 Space 新建标签。</p>':'')+'<button class="nexa-primary" id="nexaTagsSave">保存标签</button>');$('nexaTagsSave').onclick=()=>safe(()=>{const keep=favoriteDetailOpen()?favoriteDetailScroll:null;store(S.assign(model,kind,Number(id),[...overlay.querySelectorAll('input:checked')].map(n=>n.value)));close();decorate();if(NexaShell.page==='space'){renderSpace();if(keep!==null){spaceScrolls.favorites=keep;restoreFavoriteScroll(keep);renderFavoriteTodoDetail();}}});}
 function manage(id){const n=model.nodes.find(n=>n.id===id);dialog(n?'管理标签':'新建标签','<label class="nexa-field">名称<input id="nexaLabelName" maxlength="100" value="'+esc(n?.title||'')+'"></label><label class="nexa-field">上级标签<select id="nexaLabelParent"><option value="">无上级</option>'+S.tree(model).filter(x=>x.id!==id).map(x=>'<option value="'+esc(x.id)+'" '+(n?.parent===x.id?'selected':'')+'>'+esc('　'.repeat(Math.min(x.depth,8))+x.title)+'</option>').join('')+'</select></label><button id="nexaLabelSave" class="nexa-primary">保存</button>'+(n?'<button id="nexaLabelDelete" class="nexa-secondary">移除标签（不删除内容）</button>':''));$('nexaLabelSave').onclick=()=>safe(()=>{let next=n?S.move(S.rename(model,id,$('nexaLabelName').value),id,$('nexaLabelParent').value||null):S.add(model,'label:'+crypto.randomUUID(),$('nexaLabelName').value,$('nexaLabelParent').value||null);store(next);close();renderSpace();});if(n)$('nexaLabelDelete').onclick=()=>safe(()=>{store(S.remove(model,id));if(selectedTag===id)selectedTag='';close();renderSpace();showToast('标签已移除，子标签和内容保留');});}
 function open(kind,id){
  const q=String((spaceView==='favorites'?favoriteSearch:search)||'').trim();closeDailyHistory();close();
  if(kind==='note'){
   NexaShell.navigate('notes');
   if(q&&typeof openNoteEditor==='function')openNoteEditor(id,{preserveKeyboard:false,forceRead:true,searchHighlight:q});else openNoteFromSurface(id);
   return;
  }
  if(kind==='todo'){
   NexaShell.navigate('todo');currentTab='all';selectedCategory='全部';
   const todo=todos.find(t=>Number(t.id)===Number(id));const ql=q.toLocaleLowerCase('zh-CN');
   const nativeHit=!!(q&&todo&&([todo.text,todo.category].concat((todo.checklist||[]).map(x=>x.text))).some(v=>String(v||'').toLocaleLowerCase('zh-CN').includes(ql)));
   searchQuery=nativeHit?q:'';searchInput.value=searchQuery;searchClear.classList.toggle('visible',!!searchQuery);searchIcon.style.display=searchQuery?'none':'';
   tabs.forEach(t=>t.classList.toggle('active',t.dataset.tab==='all'));renderCategoryBar();render();
  } else {
   NexaShell.navigate('daily');
  }
  setTimeout(()=>{const row=kind==='todo'?document.querySelector('.todo-item[data-id="'+id+'"]'):document.querySelector('.daily-item[data-daily-id="'+id+'"]');if(row){try{row.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){row.scrollIntoView();}if(typeof nexaFlashTarget==='function')nexaFlashTarget(row,1650);else{row.classList.add('highlight-flash');setTimeout(()=>row.classList.remove('highlight-flash'),1650);}}},120);
 }
 function setFavorite(kind,id,on){try{safe(sync);const keepScroll=window.NexaShell?.page==='space'&&spaceView==='favorites'?(window.scrollY||spaceScrolls.favorites||0):null;store(S.favorite(model,kind,Number(id),!!on));decorate();if(window.NexaShell?.page==='space'){renderSpace();if(keepScroll!==null){spaceScrolls.favorites=keepScroll;restoreFavoriteScroll(keepScroll);}}return true;}catch(e){showToast(e.message||'收藏操作未保存，请重试');return false;}}
 function isFavorite(kind,id){return S.isFavorite(model,kind,Number(id));}
 function decorate(){
  document.querySelectorAll('.note-node-icon').forEach(el=>{if(el.querySelector('svg'))return;const folder=/[📁📂]/u.test(el.textContent);el.classList.toggle('nexa-folder-icon',folder);el.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(folder?'M3 6h7l2 2h9v12H3Z':'M6 3h8l4 4v14H6Z M14 3v5h4 M9 12h6 M9 16h4')+'"/></svg>';});
  document.querySelectorAll('.daily-item__calendar').forEach(b=>{if(!b.querySelector('svg'))b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v15H4Z M8 3v6 M16 3v6 M4 11h16"/><path class="nexa-icon-accent" d="M8 15h3v3H8Z"/></svg>';b.setAttribute('aria-label','查看每日事项完成日历');});
  // Todo already exposes its native category chip in-row. A second Space tag button made every
  // task look duplicated and consumed density; shared labels remain fully editable from Space.
  document.querySelectorAll('.todo-item [data-nx-tag]').forEach(b=>b.remove());
  for(const [selector,kind,attr,host] of [['.daily-item[data-daily-id]','daily','data-daily-id','.daily-item__inner']])document.querySelectorAll(selector).forEach(row=>{const id=Number(row.getAttribute(attr));let b=row.querySelector('[data-nx-tag]');if(!b){b=document.createElement('button');b.className='nexa-tag-button';b.dataset.nxTag=kind+':'+id;(row.querySelector(host)||row).append(b);}const title=labels(kind,id)||'标签';if(b.textContent!==title)b.textContent=title;b.setAttribute('aria-label','设置共享标签');});
  const title=labels('note',currentNoteId)||'设置标签';if($('nexaNoteTags').textContent!==title)$('nexaNoteTags').textContent=title;
  const fav=S.isFavorite(model,'note',currentNoteId);$('nexaFavorite').textContent=fav?'★':'☆';$('nexaFavorite').setAttribute('aria-pressed',String(fav));
 }
 const noteMeta=document.createElement('div');noteMeta.className='nexa-note-meta';noteMeta.innerHTML='<button id="nexaNoteTags">设置标签</button><button id="nexaFavorite" aria-label="收藏笔记" aria-pressed="false">☆</button>';$('noteEditorBreadcrumb').after(noteMeta);
 $('nexaNoteTags').onclick=()=>picker('note',currentNoteId);$('nexaFavorite').onclick=()=>setFavorite('note',currentNoteId,!S.isFavorite(model,'note',currentNoteId));
 // Move existing nodes: no cloned handlers, synthetic formatting or selection replacement.
 const bar=$('noteFormatBar'),primary=document.createElement('div'),secondary=document.createElement('div');primary.className='nexa-format-primary';secondary.className='nexa-format-secondary';secondary.id='nexaFormatSecondary';
 const toolNodes=new Map(NexaToolbar.tools.map(tool=>[tool.id,bar.querySelector(tool.selector)]));
 [...bar.children].forEach(node=>{if(node.classList.contains('note-format-bar__sep'))node.hidden=true;secondary.append(node);});
 const more=document.createElement('button');more.id='nexaFormatMore';more.textContent='···';more.title='更多格式';more.setAttribute('aria-label','更多格式');more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls',secondary.id);more.addEventListener('pointerdown',e=>e.preventDefault());more.addEventListener('click',()=>{const on=bar.classList.toggle('nexa-expanded');more.setAttribute('aria-expanded',String(on));syncNoteImeLayout();});primary.append(more);bar.append(secondary,primary);
 let toolbarOrder;try{toolbarOrder=NexaToolbar.normalize(JSON.parse(localStorage.getItem('nexa_toolbar_v1')));}catch(e){toolbarOrder=NexaToolbar.normalize(null);}
 function layoutToolbar(){const parts=NexaToolbar.split(toolbarOrder);parts.primary.forEach(id=>primary.insertBefore(toolNodes.get(id),more));parts.more.forEach(id=>secondary.append(toolNodes.get(id)));syncNoteImeLayout();}
 layoutToolbar();
 function configureToolbar(){let draft=toolbarOrder.slice();dialog('自定义笔记工具栏','');const draw=()=>{
  $('nexaDialogBody').innerHTML='<p class="nexa-muted">前四个工具常驻下方；其余工具点击 ··· 展开。用上下按钮排序，也可以直接调整到常用区。</p>'+draft.map((id,index)=>{const tool=NexaToolbar.tools.find(t=>t.id===id);return (index===0?'<h3 class="nexa-toolbar-section">常用工具 · 4 个</h3>':index===4?'<h3 class="nexa-toolbar-section">更多工具</h3>':'')+'<div class="nexa-tool-order" data-tool="'+id+'"><span>'+esc(tool.label)+'</span><button data-order-up="'+id+'" aria-label="上移 '+esc(tool.label)+'" '+(index===0?'disabled':'')+'>↑</button><button data-order-down="'+id+'" aria-label="下移 '+esc(tool.label)+'" '+(index===draft.length-1?'disabled':'')+'>↓</button><button data-order-pin="'+id+'">'+(index<4?'移到更多':'设为常用')+'</button></div>';}).join('')+'<button id="nexaToolbarSave" class="nexa-primary">保存布局</button><button id="nexaToolbarReset" class="nexa-secondary">恢复默认顺序</button>';
  $('nexaDialogBody').querySelectorAll('[data-order-up],[data-order-down],[data-order-pin]').forEach(b=>b.onclick=()=>{const id=b.dataset.orderUp||b.dataset.orderDown||b.dataset.orderPin,index=draft.indexOf(id);draft=NexaToolbar.move(draft,id,b.dataset.orderUp?index-1:b.dataset.orderDown?index+1:index<4?4:3);const y=overlay.querySelector('section').scrollTop;draw();overlay.querySelector('section').scrollTop=y;});
  $('nexaToolbarSave').onclick=()=>safe(()=>{localStorage.setItem('nexa_toolbar_v1',JSON.stringify(draft));toolbarOrder=draft;layoutToolbar();close();showToast('工具栏顺序已保存');});
  $('nexaToolbarReset').onclick=()=>{draft=NexaToolbar.normalize(null);draw();};
 };draw();}
 const oldSheet=renderDailyHistorySheet;renderDailyHistorySheet=function(){oldSheet();const key=dailyHistorySelectedKey;if(!key)return;const rows=records().filter(r=>r.kind!=='daily'&&NexaCore.dateKey(new Date(Number(r.date)))===key);let section=$('nexaDateRecords');if(!section){section=document.createElement('div');section.id='nexaDateRecords';$('dailyHistorySheetList').after(section);}section.innerHTML='<h3>当天创建的记录</h3><p class="nexa-muted">任务 '+rows.filter(r=>r.kind==='todo').length+' · 笔记 '+rows.filter(r=>r.kind==='note').length+'（任务显示当前状态，并非历史完成快照）</p>'+rows.map(resultRow).join('');};
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-nx-tag')){e.preventDefault();e.stopImmediatePropagation();const[k,id]=b.dataset.nxTag.split(':');safe(()=>picker(k,Number(id)));return;}
  if(b.dataset.nexaAction==='search'){e.preventDefault();e.stopImmediatePropagation();selectedTag='';kindFilter='';spaceView='library';libraryLimit=SPACE_BATCH;spaceScrolls.library=0;preserveSpaceViewOnEntry=true;NexaShell.navigate('space');renderSpace();requestAnimationFrame(()=>$('nexaLibrarySearch')?.focus());return;}
  if(b.dataset.nxFavoriteOpen){const[k,id]=b.dataset.nxFavoriteOpen.split(':');spaceScrolls.favorites=window.scrollY||spaceScrolls.favorites||0;if(k==='note')openFavoriteNote(Number(id));else if(k==='todo')openFavoriteTodo(Number(id));return;}
  if(b.dataset.nxOpen){const[k,id]=b.dataset.nxOpen.split(':');open(k,Number(id));return;}
  if(b.dataset.nxSpaceView){spaceNavigate(b.dataset.nxSpaceView);return;}
  if(b.hasAttribute('data-nx-space-back')){spaceNavigate('hub');return;}
  if(b.hasAttribute('data-nx-more')){libraryLimit+=SPACE_BATCH;renderResults();return;}
  if(b.hasAttribute('data-nx-favorite-more')){favoriteLimit+=SPACE_BATCH;renderFavoriteResults();return;}
  if(b.hasAttribute('data-nx-new')){manage(null);return;}
  if(b.hasAttribute('data-nx-toolbar')){configureToolbar();return;}
  if(b.dataset.nxManage){manage(b.dataset.nxManage);return;}
  if(b.hasAttribute('data-nx-select')){selectedTag=b.dataset.nxSelect;libraryLimit=SPACE_BATCH;spaceNavigate('library');return;}
  if(b.hasAttribute('data-nx-all')){selectedTag='';libraryLimit=SPACE_BATCH;spaceNavigate('library');return;}
  if(b.hasAttribute('data-nx-clear-tag')){selectedTag='';libraryLimit=SPACE_BATCH;renderSpace();return;}
  if(b.hasAttribute('data-nx-kind')){kindFilter=b.dataset.nxKind;libraryLimit=SPACE_BATCH;renderSpace();return;}
  if(b.hasAttribute('data-nx-favorite-kind')){favoriteKindFilter=b.dataset.nxFavoriteKind;favoriteLimit=SPACE_BATCH;renderSpace();return;}
  if(b.dataset.nxFavoriteToggle){const[k,id]=b.dataset.nxFavoriteToggle.split(':');if(setFavorite(k,Number(id),false))showToast('已从收藏库移除');return;}
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
 new MutationObserver(schedule).observe($('noteList'),{childList:true,subtree:true});
 new MutationObserver(entries=>{const entry=entries[entries.length-1];if(NexaShell.page==='space'){if(entry?.oldValue!=='space'){if(!preserveSpaceViewOnEntry){spaceView='hub';libraryLimit=SPACE_BATCH;if(favoriteNoteReturn)spaceView='favorites';}preserveSpaceViewOnEntry=false;}renderSpace();}else if(entry?.oldValue==='space'&&!favoriteNoteReturn&&!favoriteDetailOpen()){spaceView='hub';libraryLimit=SPACE_BATCH;spaceScrolls.hub=0;}}).observe(document.body,{attributes:true,attributeFilter:['data-nexa-page'],attributeOldValue:true});
 window.NexaWorkspace={get model(){return model;},get view(){return spaceView;},renderSpace,spaceNavigate,picker,manage,open,sync,decorate,setFavorite,isFavorite};decorate();
 window.__nexaBackupFinished=message=>{document.body.classList.remove('nexa-backup-busy');showToast(message);};
 if(window.nexaRestoreMessage)setTimeout(()=>dialog('数据恢复结果','<p>'+esc(window.nexaRestoreMessage)+'</p><p class="nexa-muted">请确认任务、笔记、图片与附件。备份和旧 To-Do 数据保留不动。</p>'),500);
})();
