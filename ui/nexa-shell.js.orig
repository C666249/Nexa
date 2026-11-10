/* Nexa presentation shell. Existing editors, persistence and gesture handlers remain owners. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const icons={
    home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
    todo:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M8 12l3 3 5-6',
    notes:'M6 3h8l4 4v14H6Z M14 3v5h5 M9 12h6 M9 16h4',
    daily:'M4 5h16v16H4Z M8 3v5 M16 3v5 M4 10h16',
    space:'M4 4h6v6H4Z M14 4h6v6h-6Z M4 14h6v6H4Z M14 14h6v6h-6Z',
    search:'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',
    settings:'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
    clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2',
    folder:'M3 6h7l2 2h9v12H3Z',
    trash:'M4 6h16 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
    ai:'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z'
  };
  const icon=name=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+icons[name]+'"/></svg>';
  const labels={home:'首页',todo:'Todo',notes:'Note',daily:'Daily',space:'Space'};
  let active='home', navigating=false;
  const scrolls={};
  const homeMarkup=new WeakMap();
  let calendarCursor=new Date();
  const shell=document.createElement('main');
  shell.id='nexaPages'; shell.className='nexa-pages';
  shell.innerHTML='<section id="nexaHome" class="nexa-page" aria-label="首页"></section><section id="nexaSpace" class="nexa-page" aria-label="Space"></section>';
  document.body.appendChild(shell);
  const nav=document.createElement('nav'); nav.className='nexa-nav'; nav.id='nexaNav'; nav.setAttribute('aria-label','主导航');
  nav.innerHTML=Object.entries(labels).map(([key,label])=>'<button type="button" data-nexa-route="'+key+'" aria-label="'+label+'">'+icon(key)+'<span>'+label+'</span></button>').join('');
  document.body.appendChild(nav);
  const calendar=document.createElement('div'); calendar.id='nexaDailyCalendar'; calendar.className='nexa-calendar nexa-paper';
  $('dailyDrawer').insertBefore(calendar,$('dailyList'));
  function header(title,subtitle,action){
    return '<header class="nexa-page-head"><div><h1>'+title+'</h1><p>'+subtitle+'</p></div>'+ (action||'')+'</header>';
  }
  function pageState(page){
    active=NexaCore.route(page); document.body.dataset.nexaPage=active;
    let selectedButton=null;
    nav.querySelectorAll('button').forEach(button=>{
      const selected=button.dataset.nexaRoute===active;
      button.setAttribute('aria-current',selected?'page':'false');
      if(selected)selectedButton=button;
    });
    if(selectedButton&&window.NexaMotion)requestAnimationFrame(()=>NexaMotion.navIndicator(nav,selectedButton));
    const title=document.querySelector('.header__title');
    if(title)title.textContent=active==='notes'?'Note':'Todo';
  }
  function navigate(page){
    page=NexaCore.route(page);
    if(navigating||page===active)return;
    const from=active;
    navigating=true;
    try{
      // A programmatic destination must persist an open editor before changing its surface.
      if(isNoteEditorVisible())closeNoteEditor();
      if(topicSummaryEditing)saveTopicSummaryEdit();
      if(editingEl)commitEdit();
      if(document.activeElement && document.activeElement!==document.body)document.activeElement.blur();
      scrolls[active]=window.scrollY;
      closeNoteSearchModeDrawer(); closeNoteCreateMenu(); closeCategoryPicker();
      if(typeof hideSearchHistory==='function')hideSearchHistory();
      closeNoteSwipeTopicPicker();
      closeDailyHistory(); closeDailyCalendar(); resetAllDailySwipeItems(null);
      closeFolderSidebar(); clearModeDrawerPreview();
      $('dailyDrawerOverlay').classList.remove('active','prepared');
      if(page==='todo'||page==='notes')applyMode(page);
      else if(currentMode!=='todo')applyMode('todo');
      pageState(page);
      if(page==='home'){if(window.NexaMotion)NexaMotion.enterHome();renderHome();}
      // Workspace's route observer owns its entry state and render; do not render twice.
      if(page==='space'&&!window.NexaWorkspace)renderSpace();
      if(page==='daily'){
        if(nexaSurfaceState().daily||nexaSurfaceState().day!==dailyDateKey())renderDailyDrawer();
        renderCalendar();
      }
      if(window.NexaMotion)NexaMotion.markRouteMotion(document.body,from,page);
      window.scrollTo({top:scrolls[page]||0,behavior:'instant'});
    } finally {navigating=false;}
  }
  function syncMode(mode){if(!navigating)pageState(mode==='notes'?'notes':'todo');}
  function back(){const next=NexaCore.back(active);if(next===null)return 'none';navigate(next);return 'nexa-home';}
  function renderHome(){
    const now=new Date(),stats=NexaCore.dashboard(todos,notes,dailyTasks,now);
    const date=now.toLocaleDateString('zh-CN',{month:'long',day:'numeric'})+'　'+now.toLocaleDateString('zh-CN',{weekday:'long'});
    const recent=stats.recentTodos,recentNotes=stats.recentNotes;
    const timeLabel=value=>new Date(value).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});
    const stamp=value=>{if(!(Number(value)>0))return '';const d=new Date(Number(value));return (NexaCore.dateKey(d)===NexaCore.dateKey(now)?'今天':(d.getMonth()+1)+'月'+d.getDate()+'日')+' '+timeLabel(value);};
    const html=header('Nexa',date,'<button class="nexa-icon-btn" data-nexa-action="search" aria-label="搜索笔记">'+icon('search')+'</button>')+
      '<section class="nexa-paper nexa-progress"><div><p>今日事项完成</p><strong><span data-nexa-odometer="home-percent" data-nexa-value="'+stats.percent+'">'+stats.percent+'</span><small>%</small></strong><span>'+ (stats.todayTotal?'每一步，都算数。':'从一件小事开始今天。')+'</span></div><svg class="nexa-ring" viewBox="0 0 100 100" aria-label="今日完成 '+stats.percent+'%"><circle class="track" cx="50" cy="50" r="41"/><circle class="value" cx="50" cy="50" r="41" pathLength="100" data-nexa-progress="'+stats.percent+'" stroke-dasharray="'+stats.percent+' 100"/></svg></section>'+
      '<p class="nexa-stat-caption">今日新建或提醒的任务 + 每日事项 · '+stats.todayDone+' / '+stats.todayTotal+' 完成</p>'+
      '<section class="nexa-paper nexa-metrics"><button data-nexa-route="todo" aria-label="全部未完成待办 '+stats.pendingTaskCount+' 项；全部 '+stats.allTaskCount+' 项任务，查看任务"><span class="nexa-metric-icon">'+icon('todo')+'</span><span>待办</span><strong><span data-nexa-odometer="home-todo" data-nexa-value="'+stats.pendingTaskCount+'">'+stats.pendingTaskCount+'</span><small> 项</small></strong></button><button data-nexa-route="notes"><span class="nexa-metric-icon">'+icon('notes')+'</span><span>笔记</span><strong><span data-nexa-odometer="home-note" data-nexa-value="'+stats.noteCount+'">'+stats.noteCount+'</span></strong></button><button data-nexa-action="schedule"><span class="nexa-metric-icon">'+icon('daily')+'</span><span>今日日程</span><strong><span data-nexa-odometer="home-daily" data-nexa-value="'+stats.schedule.length+'">'+stats.schedule.length+'</span></strong></button></section>'+
      '<section class="nexa-paper nexa-recent nexa-home-stack-card" data-nexa-stack style="--nexa-stack-index:0"><div class="nexa-section-head"><h2>最近任务</h2><button data-nexa-route="todo">查看全部</button></div>'+
      (recent.length?recent.map(t=>'<button class="nexa-row" data-nexa-todo="'+Number(t.id)+'"><span class="nexa-status '+(t.status==='completed'?'done':t.status==='in-progress'?'progress':'')+'">'+(t.status==='completed'?'✓':t.status==='in-progress'?'−':'')+'</span><span class="nexa-row-main">'+escapeHtml(t.text)+'<small>'+escapeHtml(t.category||'未分类')+'</small></span><span class="nexa-row-date">'+stamp(t.createdAt)+'</span><span class="nexa-chevron">›</span></button>').join(''):'<p class="nexa-empty">留一点空间，给今天重要的事。</p>')+
      '<button class="nexa-add-row" data-nexa-action="add-todo">＋ 添加任务</button></section>'+
      '<section class="nexa-paper nexa-recent nexa-home-stack-card" data-nexa-stack style="--nexa-stack-index:1"><div class="nexa-section-head"><h2>最近笔记</h2><button data-nexa-route="notes">查看全部</button></div>'+
      (recentNotes.length?recentNotes.map(n=>'<button class="nexa-row" data-nexa-note="'+Number(n.id)+'"><span class="nexa-row-main">'+escapeHtml(n.title||'未命名笔记')+'<small>'+escapeHtml(notePlainPreview(n)||'开始记录你的想法')+'</small></span><span class="nexa-row-date">'+stamp(n.updatedAt||n.createdAt)+'</span><span class="nexa-chevron">›</span></button>').join(''):'<p class="nexa-empty">想法、灵感与记录，都可以留在这里。</p>')+'<button class="nexa-add-row" data-nexa-action="add-note">＋ 写一篇笔记</button></section>'+
      '<section class="nexa-paper nexa-recent nexa-home-stack-card" data-nexa-stack style="--nexa-stack-index:2" id="nexaSchedule"><div class="nexa-section-head"><h2>今日日程</h2><button data-nexa-route="daily">每日事项 ›</button></div>'+
      (stats.schedule.length?stats.schedule.map(s=>'<button class="nexa-row nexa-schedule-row" data-nexa-'+s.kind+'="'+s.id+'"><time>'+timeLabel(s.time)+'</time><span class="nexa-row-main">'+escapeHtml(s.text)+'<small>'+ (s.kind==='daily'?'每日事项':'任务提醒')+'</small></span><span class="nexa-schedule-state '+s.state+'">'+({done:'已完成',elapsed:'时间已过',upcoming:'待进行'}[s.state])+'</span></button>').join(''):'<p class="nexa-empty">今天没有定时安排。<br>为任务设置提醒，或添加每日事项，就会显示在这里。</p>')+'</section>';
    // Keep unchanged sections and their focused buttons alive during background refresh.
    const template=document.createElement('template');template.innerHTML=html;
    const parent=$('nexaHome'),next=Array.from(template.content.children);
    next.forEach((element,index)=>{
      const old=parent.children[index],markup=element.outerHTML;
      // Compare source markup, not odometer/stack DOM modified by animation after mounting.
      if(old&&homeMarkup.get(old)===markup)return;
      homeMarkup.set(element,markup);if(old)old.replaceWith(element);else parent.appendChild(element);
    });
    while(parent.children.length>next.length)parent.lastElementChild.remove();
    requestAnimationFrame(()=>{if(!window.NexaMotion)return;NexaMotion.enhanceStack(parent);NexaMotion.mountOdometers(parent);NexaMotion.drawRings(parent);});
  }
  function renderSpace(){
    const topics=NexaCore.topics(noteTopics);
    const cats=[...new Set(todos.map(t=>t.category).filter(Boolean))];
    $('nexaSpace').innerHTML=header('Space','为事情找到位置')+
      '<section class="nexa-paper nexa-recent"><div class="nexa-section-head"><h2>笔记主题</h2><button data-nexa-action="new-topic">＋ 新建</button></div>'+
      (topics.length?topics.map(t=>'<button class="nexa-row nexa-topic" style="--depth:'+Math.min(t.depth,8)+'" data-nexa-topic="'+t.id+'">'+icon('folder')+'<span class="nexa-row-main">'+escapeHtml(t.title||'未命名主题')+'</span><span class="nexa-count">'+notes.filter(n=>Number(n.topicId)===t.id).length+'</span><span class="nexa-chevron">›</span></button>').join(''):'<p class="nexa-empty">用主题，将零散的笔记慢慢连起来。</p>')+'</section>'+
      '<section class="nexa-paper nexa-recent"><div class="nexa-section-head"><h2>任务分类</h2></div>'+(cats.length?cats.map((c,i)=>'<button class="nexa-row" data-nexa-category="'+i+'">'+icon('space')+'<span class="nexa-row-main">'+escapeHtml(c)+'</span><span class="nexa-count">'+todos.filter(t=>t.category===c).length+'</span><span class="nexa-chevron">›</span></button>').join(''):'<p class="nexa-empty">创建任务时添加分类，即可在这里聚合查看。</p>')+'</section>'+
      '<section class="nexa-paper nexa-tools"><button data-nexa-action="ai">'+icon('ai')+'AI 助手</button><button data-nexa-action="recycle">'+icon('trash')+'回收站</button><button data-nexa-action="reminders">'+icon('clock')+'每日总结提醒</button><button data-nexa-action="help">'+icon('settings')+'使用指南</button></section>';
    $('nexaSpace').querySelectorAll('[data-nexa-category]').forEach(button=>button.addEventListener('click',()=>{navigate('todo');selectCategory(cats[Number(button.dataset.nexaCategory)]);}));
  }
  function renderCalendar(){
    const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),today=NexaCore.dateKey(new Date());
    let html='<div class="nexa-section-head"><h2>'+y+'年'+(m+1)+'月</h2><div><button data-nexa-month="-1" aria-label="上个月">‹</button><button data-nexa-month="1" aria-label="下个月">›</button></div></div><div class="nexa-calendar-grid">'+['日','一','二','三','四','五','六'].map(w=>'<span>'+w+'</span>').join('');
    for(let i=0;i<new Date(y,m,1,12).getDay();i++)html+='<span></span>';
    for(let d=1;d<=new Date(y,m+1,0,12).getDate();d++){
      const key=NexaCore.dateKey(new Date(y,m,d,12)),state=getDailyAggregateForDate(key);
      html+='<button class="'+(key===today?'today':'')+'" data-nexa-day="'+key+'" aria-label="'+key+'，完成 '+state.done+'/'+state.eligible+'">'+d+'<i class="'+(state.eligible?(state.done===state.eligible?'complete':state.done?'partial':'pending'):'')+'"></i></button>';
    }
    calendar.innerHTML=html+'</div><div class="nexa-calendar-legend"><span>○ 未完成</span><span>◐ 部分完成</span><span>● 已完成</span></div>';
  }
  document.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.nexaRoute)navigate(target.dataset.nexaRoute);
    if(target.dataset.nexaNote){navigate('notes');openNoteFromSurface(Number(target.dataset.nexaNote));}
    if(target.dataset.nexaDaily){navigate('daily');const row=document.querySelector('[data-daily-id="'+Number(target.dataset.nexaDaily)+'"]');if(row){row.scrollIntoView({block:'center'});row.classList.add('highlight-flash');setTimeout(()=>row.classList.remove('highlight-flash'),1600);}}
    if(target.dataset.nexaTopic){navigate('notes');navigateBreadcrumbTopic(Number(target.dataset.nexaTopic));}
    if(target.dataset.nexaTodo){navigate('todo');searchQuery='';searchInput.value='';document.querySelector('.tab[data-tab="all"]').click();selectCategory('全部');const row=document.querySelector('.todo-item[data-id="'+Number(target.dataset.nexaTodo)+'"]');if(row){row.scrollIntoView({block:'center'});row.classList.add('highlight-flash');setTimeout(()=>row.classList.remove('highlight-flash'),1600);}}
    if(target.dataset.nexaMonth){calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+Number(target.dataset.nexaMonth),1,12);renderCalendar();}
    if(target.dataset.nexaDay){openDailyHistory();dailyHistorySelectedKey=target.dataset.nexaDay;dailyHistoryCursor=new Date(dailyHistorySelectedKey+'T12:00:00');renderDailyHistoryCalendar();renderDailyHistorySheet();}
    const action=target.dataset.nexaAction;
    if(action==='search'){navigate('notes');searchInput.focus();}
    if(action==='schedule')$('nexaSchedule').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    if(action==='add-todo'){navigate('todo');$('fab').click();}
    if(action==='add-note'){navigate('notes');const note=createNote('',null);noteOpenOrigin=captureNoteSurfaceContext();openNoteEditor(note.id,{enterEdit:true,focusTitle:true});}
    if(action==='new-topic')showPrompt('新建主题','主题名称',value=>{if(value.trim()){createTopic(value.trim(),null);renderSpace();}});
    if(action==='ai')openAiChat();
    if(action==='recycle')openRecycleModal();
    if(action==='reminders')$('timePickerBtn').click();
    if(action==='help')openHelpGuide();
  });
  [['calendarBtn','daily'],['timePickerBtn','clock'],['search-icon','search'],['fabRecycle','trash'],['fabAi','ai']].forEach(([id,name])=>{if($(id))$(id).innerHTML=icon(name);});
  document.querySelector('#noteViewSwitch [data-note-view="tree"]').innerHTML=icon('space');
  document.querySelector('#noteViewSwitch [data-note-view="recent"]').innerHTML=icon('clock');
  let refreshFrame=0;
  function dataChanged(){
    if(refreshFrame)return;
    refreshFrame=requestAnimationFrame(()=>{refreshFrame=0;if(active==='home')renderHome();});
  }
  window.NexaShell={navigate,syncMode,back,renderHome,dataChanged,refreshDaily:renderCalendar,get page(){return active;}};
  pageState('home');renderHome();
  // App resumes across midnight: read-only aggregate refresh; never changes persisted records.
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(active==='home')renderHome();if(active==='daily'){if(nexaSurfaceState().daily||nexaSurfaceState().day!==dailyDateKey())renderDailyDrawer();renderCalendar();}}});
  setInterval(()=>{if(!document.hidden&&active==='home')renderHome();},60000);
})();
