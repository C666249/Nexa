(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.NexaTimeline=api;
})(typeof window==='undefined'?globalThis:window,function(root){
 'use strict';
 const KEY='nexa_timeline_v1';
 const VERSION=1;
 const hasDOM=()=>typeof document!=='undefined'&&!!document.createElement;
 const reduced=()=>hasDOM()&&root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cssEscape=value=>root.CSS?.escape?root.CSS.escape(String(value)):String(value).replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c);
 const id=prefix=>prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
 const clone=value=>JSON.parse(JSON.stringify(value));
 const dateOk=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))&&!Number.isNaN(Date.parse(value+'T12:00:00'));
 function empty(){return {version:VERSION,events:[]};}
 function normalizePlan(raw){return {id:String(raw?.id||id('plan')),title:String(raw?.title||'').trim().slice(0,120),when:String(raw?.when||'').trim().slice(0,32),detail:String(raw?.detail||'').trim().slice(0,500),createdAt:Number(raw?.createdAt)||Date.now(),updatedAt:Number(raw?.updatedAt)||Date.now()};}
 function normalizeEvent(raw){
  const start=dateOk(raw?.start)?raw.start:new Date().toISOString().slice(0,10);
  const end=dateOk(raw?.end)?raw.end:start;
  const lo=start<=end?start:end,hi=start<=end?end:start;
  return {id:String(raw?.id||id('event')),title:String(raw?.title||'').trim().slice(0,160),start:lo,end:hi,description:String(raw?.description||'').trim().slice(0,1200),plans:Array.isArray(raw?.plans)?raw.plans.map(normalizePlan).filter(x=>x.title):[],createdAt:Number(raw?.createdAt)||Date.now(),updatedAt:Number(raw?.updatedAt)||Date.now()};
 }
 function validate(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Number(input.version)!==VERSION||!Array.isArray(input.events))throw Error('Timeline 数据格式无效');
  const seen=new Set();
  input.events.forEach((raw,index)=>{const e=normalizeEvent(raw);if(!e.title)throw Error('Timeline 第 '+(index+1)+' 个事件缺少标题');if(seen.has(e.id))throw Error('Timeline 事件标识重复');seen.add(e.id);const pids=new Set();e.plans.forEach(p=>{if(pids.has(p.id))throw Error('Timeline 安排标识重复');pids.add(p.id);});});
  return {version:VERSION,events:input.events.map(normalizeEvent)};
 }
 function load(storage){try{const raw=storage?.getItem?.(KEY);return raw?validate(JSON.parse(raw)):empty();}catch(e){return empty();}}
 function save(storage,model){const next=validate(model);storage?.setItem?.(KEY,JSON.stringify(next));return next;}
 function upsertEvent(model,event){const next=validate(clone(model));const value=normalizeEvent(event);if(!value.title)throw Error('请输入事件名称');const i=next.events.findIndex(x=>x.id===value.id);if(i>=0)next.events[i]=value;else next.events.push(value);next.events.sort((a,b)=>a.start.localeCompare(b.start)||a.end.localeCompare(b.end)||a.createdAt-b.createdAt);return next;}
 function removeEvent(model,eventId){const next=validate(clone(model));next.events=next.events.filter(e=>e.id!==String(eventId));return next;}
 function upsertPlan(model,eventId,plan){const next=validate(clone(model));const e=next.events.find(x=>x.id===String(eventId));if(!e)throw Error('事件不存在');const value=normalizePlan(plan);if(!value.title)throw Error('请输入安排内容');const i=e.plans.findIndex(x=>x.id===value.id);if(i>=0)e.plans[i]=value;else e.plans.push(value);e.updatedAt=Date.now();return next;}
 function removePlan(model,eventId,planId){const next=validate(clone(model));const e=next.events.find(x=>x.id===String(eventId));if(!e)return next;e.plans=e.plans.filter(p=>p.id!==String(planId));e.updatedAt=Date.now();return next;}
 function monthKey(date){return String(date).slice(0,7);}
 function monthSequence(model){
  const events=validate(model).events;if(!events.length)return [];
  const min=events.reduce((a,e)=>e.start<a?e.start:a,events[0].start),max=events.reduce((a,e)=>e.end>a?e.end:a,events[0].end);
  const cursor=new Date(min.slice(0,7)+'-01T12:00:00'),stop=new Date(max.slice(0,7)+'-01T12:00:00'),out=[];
  while(cursor<=stop&&out.length<120){out.push(cursor.getFullYear()+'-'+String(cursor.getMonth()+1).padStart(2,'0'));cursor.setMonth(cursor.getMonth()+1);}
  return out;
 }
 function statusFor(event,nowDate){const today=(nowDate||new Date()).toISOString().slice(0,10);if(today<event.start)return {id:'future',label:'即将开始'};if(today>event.end)return {id:'past',label:'已结束'};return {id:'active',label:'进行中'};}
 function daysBetween(a,b){return Math.max(0,Math.ceil((Date.parse(b+'T12:00:00')-Date.parse(a+'T12:00:00'))/86400000));}
 function markerDate(month,currentMonth){const today=new Date().toISOString().slice(0,10);return month===currentMonth?today:(month+'-01');}
 function formatMarkerDate(value){return String(value||'').replace(/-/g,'.');}
 const state={model:null,expanded:new Set(),planExpanded:new Set(),editor:null};
 function storage(){return root.localStorage;}
 function ensureModel(){if(!state.model)state.model=load(storage());return state.model;}
 function store(next){state.model=save(storage(),next);root.NexaShell?.dataChanged?.();return state.model;}
 function page(){return hasDOM()?document.getElementById('nexaTimeline'):null;}
 function icon(name){
  const paths={mind:'M12 3a8 8 0 1 0 8 8 M5 17c3-1 5-3 7-6 2 3 4 5 7 6 M12 8v8',plus:'M12 5v14M5 12h14',edit:'M5 19h4L19 9l-4-4L5 15v4Z',trash:'M5 7h14M9 7V4h6v3M8 10v8M12 10v8M16 10v8',chev:'M8 10l4 4 4-4'};
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(paths[name]||paths.plus)+'"/></svg>';
 }
 function mindspacePortal(){return '<span class="timeline-mindspace-portal" aria-hidden="true"><i class="orbit orbit-a"></i><i class="orbit orbit-b"></i><b class="portal-star"></b><em class="portal-spark"></em></span>';}
 function eventMarkup(e,index){
  const expanded=state.expanded.has(e.id),status=statusFor(e),totalDays=daysBetween(e.start,e.end)+1;
  const plans=e.plans.map((p,i)=>{const open=state.planExpanded.has(e.id+':'+p.id);return '<div class="timeline-plan '+(open?'is-plan-expanded':'')+'" style="--plan-index:'+i+'"><button class="timeline-plan-row" data-timeline-plan-toggle="'+esc(e.id)+':'+esc(p.id)+'" aria-expanded="'+open+'"><span class="timeline-plan-dot"></span><span class="timeline-plan-copy"><strong>'+esc(p.title)+'</strong>'+(p.when?'<small>'+esc(p.when)+'</small>':'')+'</span><span class="timeline-plan-chevron" aria-hidden="true"><i class="timeline-fmv-chevron"></i></span></button><div class="timeline-plan-note"><div><p>'+(p.detail?esc(p.detail):'暂无补充说明')+'</p><div class="timeline-plan-actions"><button data-timeline-plan-edit="'+esc(e.id)+':'+esc(p.id)+'">编辑</button><button data-timeline-plan-delete="'+esc(e.id)+':'+esc(p.id)+'">删除</button></div></div></div></div>';}).join('');
  return '<article class="timeline-event '+(expanded?'is-expanded':'')+'" data-timeline-event="'+esc(e.id)+'" style="--event-index:'+index+'">'+
   '<button class="timeline-event-head" data-timeline-event-toggle="'+esc(e.id)+'" aria-expanded="'+expanded+'">'+
    '<span class="timeline-event-state '+status.id+'"></span><span class="timeline-event-copy"><strong>'+esc(e.title)+'</strong><small>'+esc(e.start)+' → '+esc(e.end)+' · '+totalDays+' 天</small></span><span class="timeline-event-status '+status.id+'">'+status.label+'</span><span class="timeline-event-chevron" aria-hidden="true"><i class="timeline-fmv-chevron"></i></span></button>'+
   '<div class="timeline-event-fold"'+(expanded?' style="height:auto"':'')+'><div class="timeline-event-fold-inner">'+
    '<div class="timeline-event-body">'+(e.description?'<p class="timeline-event-description">'+esc(e.description)+'</p>':'')+
    '<div class="timeline-branch" aria-label="具体安排"><svg class="timeline-branch-trace" viewBox="0 0 32 '+Math.max(54,e.plans.length*64+30)+'" preserveAspectRatio="none" aria-hidden="true"><path d="M8 2 V '+Math.max(32,e.plans.length*64+8)+'"/></svg><div class="timeline-plan-list">'+(plans||'<p class="timeline-plan-empty">还没有具体安排。把每天或每周要做的动作放在这里。</p>')+'</div></div>'+
    '<div class="timeline-event-actions"><button data-timeline-plan-add="'+esc(e.id)+'">＋ 添加安排</button><button data-timeline-event-edit="'+esc(e.id)+'">编辑事件</button><button class="danger" data-timeline-event-delete="'+esc(e.id)+'">删除</button></div></div>'+
   '</div></div></article>';
 }
 function render(){
  if(!hasDOM())return;const el=page();if(!el)return;const model=ensureModel(),months=monthSequence(model),events=model.events;
  const active=events.filter(e=>statusFor(e).id==='active').length;
  let body='';
  if(!events.length){body='<section class="timeline-empty nexa-paper"><div class="timeline-empty-rail"><i></i><i></i><i></i></div><div><strong>把未来几个月的大事放到一条线上</strong><p>例如：准备六级、准备期末考、推进一个长期项目。每个事件都可以继续展开成每天或每周的具体安排。</p><button data-timeline-new>创建第一个大事件</button></div></section>';}
  else{
   const currentMonth=new Date().toISOString().slice(0,7);
   body='<section class="timeline-tree" aria-label="纵轴时间树">'+months.map((month,mi)=>{const started=events.filter(e=>monthKey(e.start)===month),ongoing=events.filter(e=>e.start<month+'-01'&&e.end>=month+'-01'),continuing=ongoing.length?'<div class="timeline-month-continuation has-events"><span>持续中</span>'+ongoing.map(e=>'<b>'+esc(e.title)+'</b>').join('')+'</div>':(!started.length?'<div class="timeline-month-continuation">留白，让节奏有呼吸</div>':'');const date=markerDate(month,currentMonth);return '<div class="timeline-month '+(mi===months.length-1?'last ':'')+(month===currentMonth?'is-current':'')+'"><div class="timeline-month-axis"><span class="timeline-month-node"></span><time datetime="'+esc(date)+'">'+esc(formatMarkerDate(date))+'</time>'+(month===currentMonth?'<em>现在</em>':'')+'</div><div class="timeline-month-content">'+started.map((e,i)=>eventMarkup(e,i)).join('')+continuing+'</div></div>';}).join('')+'</section>';
  }
  el.innerHTML='<header class="nexa-page-head timeline-page-head"><div><h1>Timeline</h1><p>把长期目标放进时间里，再逐层拆成可执行的安排。</p></div><button class="timeline-mindspace-entry" data-timeline-mindspace aria-label="打开 Mindspace">'+mindspacePortal()+'<span><b>Mindspace</b><small>长期状态星域</small></span></button></header>'+
   '<section class="timeline-overview"><div><span>时间跨度</span><strong>'+(months.length||0)+'</strong><small>个月</small></div><div><span>大事件</span><strong>'+events.length+'</strong><small>项</small></div><div><span>正在进行</span><strong>'+active+'</strong><small>项</small></div><button data-timeline-new aria-label="新建大事件">'+icon('plus')+'<span>新建事件</span></button></section>'+body;
  requestAnimationFrame(()=>root.NexaMotion?.mountOdometers?.(el));
 }

 // FMV 2.9.0 · Disclosure motion ------------------------------------------------
 // FMV-DISCLOSURE-TODO-001 + FMV-DISCLOSURE-CASCADE-001.
 function commitAndCancelAnimations(list){(list||[]).forEach(anim=>{try{anim.commitStyles?.();}catch(e){}try{anim.cancel?.();}catch(e){}});}
 function captureCascadeRows(card){
  const rows=Array.from(card.querySelectorAll('.timeline-plan,.timeline-event-actions'));
  commitAndCancelAnimations(card.__timelineRowAnimations);card.__timelineRowAnimations=[];
  return rows.map(row=>{const style=root.getComputedStyle?getComputedStyle(row):null;return {row,opacity:style?.opacity||'1',transform:style?.transform&&style.transform!=='none'?style.transform:'none'};});
 }
 function animateTimelineCascade(card,expanding,duration,snapshots){
  const items=snapshots||captureCascadeRows(card),rows=items.map(x=>x.row);if(reduced()||!rows.length||typeof rows[0].animate!=='function')return;
  const maxStagger=expanding?180:120,cap=expanding?42:32,step=rows.length>1?Math.min(cap,maxStagger/(rows.length-1)):0;
  const ordered=expanding?items:items.slice().reverse();
  card.__timelineRowAnimations=ordered.map((entry,index)=>{
   const delay=(expanding?58:0)+index*step;
   const fallbackStart=expanding?{opacity:0,transform:'translate3d(0,-9px,0) scaleY(.82)'}:{opacity:1,transform:'translate3d(0,0,0) scaleY(1)'};
   const start={opacity:entry.opacity??fallbackStart.opacity,transform:entry.transform&&entry.transform!=='none'?entry.transform:fallbackStart.transform,transformOrigin:'top center'};
   const frames=expanding?[start,{opacity:.72,offset:.62,transform:'translate3d(0,-1.5px,0) scaleY(.98)',transformOrigin:'top center'},{opacity:1,transform:'translate3d(0,0,0) scaleY(1)',transformOrigin:'top center'}]:[start,{opacity:.22,transform:'translate3d(0,-6px,0) scaleY(.90)',transformOrigin:'top center'},{opacity:0,transform:'translate3d(0,-9px,0) scaleY(.84)',transformOrigin:'top center'}];
   const anim=entry.row.animate(frames,{duration:expanding?245:175,delay,easing:expanding?'cubic-bezier(.18,.86,.25,1)':'cubic-bezier(.36,0,.70,.34)',fill:'both'});
   Promise.resolve(anim.finished).catch(()=>{}).then(()=>{try{anim.cancel();}catch(e){}});return anim;
  });
 }
 function animateEventDisclosure(card,expanding){
  if(!card)return;const fold=card.querySelector('.timeline-event-fold'),button=card.querySelector('[data-timeline-event-toggle]');if(!fold||!button)return;
  const currentHeight=Math.max(0,fold.getBoundingClientRect().height),snapshots=captureCascadeRows(card),rowCount=card.querySelectorAll('.timeline-plan,.timeline-event-actions').length;
  card.__timelineDisclosureSeq=(card.__timelineDisclosureSeq||0)+1;const seq=card.__timelineDisclosureSeq;
  clearTimeout(card.__timelineDisclosureTimer);
  fold.style.transition='none';fold.style.height=currentHeight+'px';void fold.offsetHeight;
  card.classList.add('timeline-disclosure-animating');card.classList.toggle('is-expanded',expanding);button.setAttribute('aria-expanded',String(expanding));
  const duration=expanding?Math.min(535,350+Math.min(rowCount,7)*24):Math.min(420,270+Math.min(rowCount,7)*18),target=expanding?fold.scrollHeight:0;
  animateTimelineCascade(card,expanding,duration,snapshots);
  requestAnimationFrame(()=>{if(card.__timelineDisclosureSeq!==seq)return;fold.style.transition='height '+duration+'ms '+(expanding?'cubic-bezier(.18,.82,.22,1)':'cubic-bezier(.28,.62,.30,1)');fold.style.height=target+'px';});
  const finish=()=>{if(card.__timelineDisclosureSeq!==seq)return;fold.style.transition='';fold.style.height=expanding?'auto':'0px';card.classList.remove('timeline-disclosure-animating');commitAndCancelAnimations(card.__timelineRowAnimations);card.__timelineRowAnimations=[];};
  const onEnd=e=>{if(e.target===fold&&e.propertyName==='height'){fold.removeEventListener('transitionend',onEnd);finish();}};fold.addEventListener('transitionend',onEnd);card.__timelineDisclosureTimer=setTimeout(()=>{fold.removeEventListener('transitionend',onEnd);finish();},duration+90);
 }
 function animatePlanDisclosure(plan,expanding){
  if(!plan)return;const button=plan.querySelector('.timeline-plan-row'),note=plan.querySelector('.timeline-plan-note');if(!button||!note)return;
  const currentHeight=Math.max(0,note.getBoundingClientRect().height);plan.__planSeq=(plan.__planSeq||0)+1;const seq=plan.__planSeq;clearTimeout(plan.__planTimer);
  note.style.transition='none';note.style.height=currentHeight+'px';void note.offsetHeight;
  plan.classList.add('timeline-plan-animating');plan.classList.toggle('is-plan-expanded',expanding);button.setAttribute('aria-expanded',String(expanding));
  const target=expanding?note.scrollHeight:0,duration=expanding?360:260;
  requestAnimationFrame(()=>{if(plan.__planSeq!==seq)return;note.style.transition='height '+duration+'ms '+(expanding?'cubic-bezier(.18,.82,.22,1)':'cubic-bezier(.28,.62,.30,1)');note.style.height=target+'px';});
  const finish=()=>{if(plan.__planSeq!==seq)return;note.style.transition='';note.style.height=expanding?'auto':'0px';plan.classList.remove('timeline-plan-animating');};
  const onEnd=e=>{if(e.target===note&&e.propertyName==='height'){note.removeEventListener('transitionend',onEnd);finish();}};note.addEventListener('transitionend',onEnd);plan.__planTimer=setTimeout(()=>{note.removeEventListener('transitionend',onEnd);finish();},duration+80);
 }

 // Keyboard-aware bottom sheets -------------------------------------------------
 let timelineImeBaseHeight=0,timelineNativeImeKnown=false,timelineNativeImeSpace=0,timelineVisualImeSpace=0;
 function editorOpen(){const o=hasDOM()&&document.getElementById('timelineEditorOverlay');return !!(o&&o.classList.contains('active'));}
 function measureVisualImeSpace(){const vv=root.visualViewport;if(!vv)return null;let layout=Math.max(timelineImeBaseHeight||0,root.innerHeight||0,document.documentElement?.clientHeight||0);if(!timelineImeBaseHeight||vv.height>=layout-40)timelineImeBaseHeight=Math.max(root.innerHeight||0,document.documentElement?.clientHeight||0,vv.height||0);layout=Math.max(timelineImeBaseHeight||0,root.innerHeight||0,document.documentElement?.clientHeight||0);const diff=Math.max(0,Math.round(layout-vv.height));return diff>=80?diff:0;}
 function keepFocusedFieldVisible(){if(!editorOpen())return;const o=document.getElementById('timelineEditorOverlay'),sheet=o?.querySelector('.timeline-editor-sheet'),active=document.activeElement;if(!sheet||!active||!sheet.contains(active))return;requestAnimationFrame(()=>{const sr=sheet.getBoundingClientRect(),ar=active.getBoundingClientRect(),pad=18;if(ar.bottom>sr.bottom-pad)sheet.scrollTop+=ar.bottom-(sr.bottom-pad);else if(ar.top<sr.top+pad)sheet.scrollTop-=sr.top+pad-ar.top;});}
 function applyTimelineImeSpace(next){const o=hasDOM()&&document.getElementById('timelineEditorOverlay');if(!o)return;next=Math.max(0,Math.round(Number(next)||0));if(next<80)next=0;const applied=editorOpen()?next:0,layout=Math.max(root.innerHeight||0,document.documentElement?.clientHeight||0,timelineImeBaseHeight||0);o.style.setProperty('--timeline-ime-space',applied+'px');o.style.setProperty('--timeline-available-height',Math.max(210,layout-applied-18)+'px');o.classList.toggle('timeline-ime-visible',applied>0);if(applied>0)keepFocusedFieldVisible();}
 function syncTimelineImeLayout(){const visual=measureVisualImeSpace();timelineVisualImeSpace=visual===null?0:visual;applyTimelineImeSpace(timelineNativeImeKnown?timelineNativeImeSpace:timelineVisualImeSpace);}
 root.__onTimelineNativeImeInset=function(insetPx,visible){timelineNativeImeKnown=true;const ratio=Math.max(1,Number(root.devicePixelRatio)||1),next=visible?((Number(insetPx)||0)/ratio):0;timelineNativeImeSpace=next>=80?next:0;applyTimelineImeSpace(timelineNativeImeSpace);};
 function installTimelineImeBridge(){if(!hasDOM())return;if(!root.__nexaTimelineImeAdapterInstalled){const previous=root.__onNativeImeInset;root.__onNativeImeInset=function(insetPx,visible){if(typeof previous==='function')previous.call(root,insetPx,visible);root.__onTimelineNativeImeInset?.(insetPx,visible);};root.__nexaTimelineImeAdapterInstalled=true;}if(root.visualViewport&&!root.__nexaTimelineViewportInstalled){root.visualViewport.addEventListener('resize',syncTimelineImeLayout);root.visualViewport.addEventListener('scroll',syncTimelineImeLayout);root.__nexaTimelineViewportInstalled=true;}if(!root.__nexaTimelineResizeInstalled){root.addEventListener?.('resize',()=>{if(!root.visualViewport)syncTimelineImeLayout();});root.__nexaTimelineResizeInstalled=true;}}

 function editorShell(){
  if(!hasDOM()||document.getElementById('timelineEditorOverlay'))return;
  const overlay=document.createElement('div');overlay.id='timelineEditorOverlay';overlay.className='timeline-editor-overlay';overlay.innerHTML='<section class="timeline-editor-sheet" role="dialog" aria-modal="true" aria-labelledby="timelineEditorTitle"><div class="timeline-editor-grab"></div><header><div><small id="timelineEditorKicker"></small><h2 id="timelineEditorTitle"></h2></div><button data-timeline-editor-close aria-label="关闭">×</button></header><div id="timelineEditorBody"></div></section>';document.body.appendChild(overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('[data-timeline-editor-close]'))closeEditor();});overlay.addEventListener('focusin',()=>{syncTimelineImeLayout();setTimeout(keepFocusedFieldVisible,70);});
 }
 function closeEditor(){const o=hasDOM()&&document.getElementById('timelineEditorOverlay');if(!o)return;o.classList.remove('active');state.editor=null;applyTimelineImeSpace(0);setTimeout(()=>{if(!o.classList.contains('active'))o.style.display='none';},220);}
 function back(){if(editorOpen()){closeEditor();return 'editor';}return 'none';}
 function openEventEditor(eventId){
  editorShell();const model=ensureModel(),existing=model.events.find(e=>e.id===String(eventId)),now=new Date().toISOString().slice(0,10),e=existing||normalizeEvent({id:id('event'),title:'',start:now,end:now});state.editor={type:'event',id:e.id,new:!existing};
  document.getElementById('timelineEditorKicker').textContent=existing?'时间线事件':'新的时间线事件';document.getElementById('timelineEditorTitle').textContent=existing?'编辑大事件':'创建大事件';
  document.getElementById('timelineEditorBody').innerHTML='<label class="timeline-field">事件名称<input id="timelineEventTitle" maxlength="160" value="'+esc(e.title)+'" placeholder="例如：准备英语六级"></label><div class="timeline-date-grid"><label class="timeline-field">开始<input id="timelineEventStart" type="date" value="'+esc(e.start)+'"></label><label class="timeline-field">结束<input id="timelineEventEnd" type="date" value="'+esc(e.end)+'"></label></div><label class="timeline-field">说明<textarea id="timelineEventDescription" maxlength="1200" rows="4" placeholder="这一阶段为什么重要、最终想达到什么状态">'+esc(e.description)+'</textarea></label><button class="timeline-editor-save" data-timeline-editor-save>保存事件</button>';
  openEditor();setTimeout(()=>{document.getElementById('timelineEventTitle')?.focus();syncTimelineImeLayout();},80);
 }
 function openPlanEditor(eventId,planId){
  editorShell();const e=ensureModel().events.find(x=>x.id===String(eventId));if(!e)return;const existing=e.plans.find(p=>p.id===String(planId)),p=existing||normalizePlan({id:id('plan'),title:'',when:''});state.editor={type:'plan',eventId:e.id,id:p.id,new:!existing};
  document.getElementById('timelineEditorKicker').textContent=e.title;document.getElementById('timelineEditorTitle').textContent=existing?'编辑具体安排':'添加具体安排';
  document.getElementById('timelineEditorBody').innerHTML='<label class="timeline-field">安排<input id="timelinePlanTitle" maxlength="120" value="'+esc(p.title)+'" placeholder="例如：练听力"></label><label class="timeline-field">时间 / 节奏<input id="timelinePlanWhen" maxlength="32" value="'+esc(p.when)+'" placeholder="例如：每天早上 / 周三晚上"></label><label class="timeline-field">具体说明<textarea id="timelinePlanDetail" maxlength="500" rows="4" placeholder="例如：精听 30 分钟，做完后复盘错题">'+esc(p.detail)+'</textarea></label><button class="timeline-editor-save" data-timeline-editor-save>保存安排</button>';
  openEditor();setTimeout(()=>{document.getElementById('timelinePlanTitle')?.focus();syncTimelineImeLayout();},80);
 }
 function openEditor(){const o=document.getElementById('timelineEditorOverlay');timelineImeBaseHeight=Math.max(root.innerHeight||0,document.documentElement?.clientHeight||0);o.style.display='flex';requestAnimationFrame(()=>{o.classList.add('active');const sheet=o.querySelector('.timeline-editor-sheet');if(sheet&&root.NexaMotion?.presentSheet)root.NexaMotion.presentSheet(sheet,{duration:460});syncTimelineImeLayout();});}
 function saveEditor(){
  const ed=state.editor;if(!ed)return;try{
   if(ed.type==='event'){
    const current=ensureModel().events.find(e=>e.id===ed.id);const next=normalizeEvent({...(current||{}),id:ed.id,title:document.getElementById('timelineEventTitle').value,start:document.getElementById('timelineEventStart').value,end:document.getElementById('timelineEventEnd').value,description:document.getElementById('timelineEventDescription').value,plans:current?.plans||[],createdAt:current?.createdAt||Date.now(),updatedAt:Date.now()});
    store(upsertEvent(ensureModel(),next));state.expanded.add(next.id);
   }else{
    const e=ensureModel().events.find(x=>x.id===ed.eventId),current=e?.plans.find(p=>p.id===ed.id);const p=normalizePlan({...current,id:ed.id,title:document.getElementById('timelinePlanTitle').value,when:document.getElementById('timelinePlanWhen').value,detail:document.getElementById('timelinePlanDetail').value,createdAt:current?.createdAt||Date.now(),updatedAt:Date.now()});store(upsertPlan(ensureModel(),ed.eventId,p));state.expanded.add(ed.eventId);
   }
   closeEditor();render();root.showToast?.('已保存到 Timeline');
  }catch(error){root.showToast?.(error.message||'保存失败');}
 }
 function confirmDelete(kind,eventId,planId){const run=()=>{if(kind==='event')store(removeEvent(ensureModel(),eventId));else store(removePlan(ensureModel(),eventId,planId));render();root.showToast?.('已删除');};if(typeof root.showConfirm==='function')root.showConfirm(kind==='event'?'删除这个大事件？':'删除这条安排？',run);else if(!hasDOM()||root.confirm?.('确认删除？'))run();}
 function onClick(event){const b=event.target.closest?.('button');if(!b)return;
  if(b.hasAttribute('data-timeline-new')){openEventEditor();return;}
  if(b.hasAttribute('data-timeline-mindspace')){root.NexaMindspace?.open?.();return;}
  if(b.dataset.timelineEventToggle){const k=b.dataset.timelineEventToggle,card=b.closest('.timeline-event'),expanding=!state.expanded.has(k);if(expanding)state.expanded.add(k);else state.expanded.delete(k);animateEventDisclosure(card,expanding);if(expanding)setTimeout(()=>card?.scrollIntoView({block:'nearest',behavior:reduced()?'auto':'smooth'}),120);return;}
  if(b.dataset.timelineEventEdit){openEventEditor(b.dataset.timelineEventEdit);return;}
  if(b.dataset.timelineEventDelete){confirmDelete('event',b.dataset.timelineEventDelete);return;}
  if(b.dataset.timelinePlanAdd){openPlanEditor(b.dataset.timelinePlanAdd);return;}
  if(b.dataset.timelinePlanToggle){const [eid,pid]=b.dataset.timelinePlanToggle.split(':'),k=eid+':'+pid,plan=b.closest('.timeline-plan'),expanding=!state.planExpanded.has(k);if(expanding)state.planExpanded.add(k);else state.planExpanded.delete(k);animatePlanDisclosure(plan,expanding);return;}
  if(b.dataset.timelinePlanEdit){const [eid,pid]=b.dataset.timelinePlanEdit.split(':');openPlanEditor(eid,pid);return;}
  if(b.dataset.timelinePlanDelete){const [eid,pid]=b.dataset.timelinePlanDelete.split(':');confirmDelete('plan',eid,pid);return;}
  if(b.hasAttribute('data-timeline-editor-save')){saveEditor();return;}
 }
 function install(){if(!hasDOM()||document.__nexaTimelineInstalled)return;document.__nexaTimelineInstalled=true;editorShell();installTimelineImeBridge();document.addEventListener('click',onClick);}
 if(hasDOM())install();
 return {KEY,VERSION,empty,validate,load,save,upsertEvent,removeEvent,upsertPlan,removePlan,monthSequence,statusFor,formatMarkerDate,render,install,openEventEditor,back,get model(){return ensureModel();}};
});
