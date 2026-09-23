/* Nexa Motion 2.0 — purposeful, interruptible motion primitives for WebView surfaces. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.NexaMotion=api;})(typeof window==='undefined'?globalThis:window,function(root){
 'use strict';
 const ease={
  standard:'cubic-bezier(.20,.80,.20,1)',
  emphasized:'cubic-bezier(.16,1,.30,1)',
  settle:'cubic-bezier(.18,.88,.24,1)',
  spring:'cubic-bezier(.18,1.12,.32,1)',
  depart:'cubic-bezier(.32,.05,.18,1)',
  accelerate:'cubic-bezier(.40,0,.80,.20)'
 };
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const hasDOM=()=>typeof document!=='undefined'&&!!document.documentElement;
 function reduced(){return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;}
 function raf2(fn){if(typeof requestAnimationFrame!=='function'){fn();return;}requestAnimationFrame(()=>requestAnimationFrame(fn));}
 function motionKey(el){
  if(!el||!el.getAttribute)return '';
  const ds=el.dataset||{};
  if(ds.id)return 'todo:'+ds.id;
  if(ds.dailyId)return 'daily:'+ds.dailyId;
  if(ds.noteSwipeId)return 'note:'+ds.noteSwipeId;
  if(ds.topicSwipeId)return 'topic:'+ds.topicSwipeId;
  if(ds.nxOpen)return 'library:'+ds.nxOpen;
  return '';
 }
 function flowRows(container){return [...(container?.querySelectorAll?.('.todo-item[data-id],.daily-item[data-daily-id],.note-swipe-row[data-note-swipe-id],.topic-swipe-row[data-topic-swipe-id],.nexa-library-row')||[])];}
 function captureFlow(container){const map=new Map();flowRows(container).forEach(el=>{const k=motionKey(el);if(k&&el.getBoundingClientRect)map.set(k,el.getBoundingClientRect());});return map;}
 function animateReflow(before,container){
  if(!before||!container||reduced())return;
  flowRows(container).forEach(el=>{const k=motionKey(el),old=k&&before.get(k);if(!old||!el.getBoundingClientRect)return;const now=el.getBoundingClientRect(),dx=old.left-now.left,dy=old.top-now.top;if(Math.abs(dx)<.5&&Math.abs(dy)<.5)return;
   if(typeof el.animate==='function')el.animate([{transform:`translate3d(${dx}px,${dy}px,0)`,offset:0},{transform:'translate3d(0,0,0)',offset:1}],{duration:430,easing:ease.spring});
   else{el.style.transition='none';el.style.transform=`translate3d(${dx}px,${dy}px,0)`;raf2(()=>{el.style.transition=`transform 420ms ${ease.spring}`;el.style.transform='';});}
  });
 }
 function departureTrace(element,options){
  options=options||{};
  const rect=element?.getBoundingClientRect?element.getBoundingClientRect():{width:280,height:72};
  const direction=options.direction===-1?-1:1;
  const fromX=Number(options.fromX)||0;
  const x=direction*clamp((Number(rect.width)||280)*.58,132,224);
  const lift=-clamp((Number(rect.height)||72)*.68,34,78);
  const rotate=direction*clamp((Number(rect.width)||280)/64,3.6,6.2);
  const frames=[
   {offset:0,transform:`translate3d(${fromX}px,0,0) rotate(0deg) scale(1)`,opacity:1,filter:'blur(0)'},
   {offset:.22,transform:`translate3d(${fromX+x*.08}px,${Math.abs(lift)*.04}px,0) rotate(${rotate*.12}deg) scale(1.006)`,opacity:1,filter:'blur(0)'},
   {offset:.56,transform:`translate3d(${fromX+x*.34}px,${lift*.26}px,0) rotate(${rotate*.42}deg) scale(.975)`,opacity:.92,filter:'blur(0)'},
   {offset:.82,transform:`translate3d(${fromX+x*.72}px,${lift*.72}px,0) rotate(${rotate*.78}deg) scale(.88)`,opacity:.48,filter:'blur(.55px)'},
   {offset:1,transform:`translate3d(${fromX+x}px,${lift}px,0) rotate(${rotate}deg) scale(.78)`,opacity:0,filter:'blur(1.4px)'}
  ];
  return {direction,fromX,x,lift,rotate,duration:470,frames};
 }
 function curveAway(element,done,options){
  options=options||{};let finished=false;
  const container=options.container||element?.parentElement;const before=options.reflow===false?null:captureFlow(container);
  const complete=()=>{if(finished)return;finished=true;element?.classList?.remove('nexa-departing');if(typeof done==='function')done();if(before&&container)raf2(()=>animateReflow(before,container));};
  if(!element){complete();return Promise.resolve();}
  const trace=departureTrace(element,options);if(typeof options.capture==='function')options.capture(trace);
  if(reduced()){complete();return Promise.resolve(trace);}
  element.classList.add('nexa-departing');
  if(typeof element.animate!=='function'){
   const last=trace.frames[trace.frames.length-1];
   element.style.transition=`transform 430ms ${ease.depart}, opacity 360ms ease-out, filter 360ms ease-out`;
   element.style.transform=last.transform;element.style.opacity='0';element.style.filter='blur(1.4px)';setTimeout(complete,450);return Promise.resolve(trace);
  }
  const animation=element.animate(trace.frames,{duration:trace.duration,easing:ease.depart,fill:'forwards'});
  const promise=animation.finished.catch(()=>{}).then(()=>{complete();return trace;});setTimeout(complete,560);return promise;
 }
 function favoriteCurve(element,done,options){
  options=options||{};let finished=false;
  const finish=()=>{if(finished)return;finished=true;element?.classList?.remove('nexa-favoriting');element?.style?.removeProperty('transform');element?.style?.removeProperty('opacity');element?.style?.removeProperty('filter');if(typeof done==='function')done();};
  if(!element||reduced()){finish();return Promise.resolve();}
  const fromX=Number(options.fromX)||0;
  const rect=element.getBoundingClientRect?.()||{width:280,height:72};
  const x=clamp((Number(rect.width)||280)*.34,92,148),lift=-clamp((Number(rect.height)||72)*.36,20,42),rotate=clamp((Number(rect.width)||280)/86,2.6,4.4);
  const frames=[
   {offset:0,transform:`translate3d(${fromX}px,0,0) rotate(0deg) scale(1)`,opacity:1,filter:'blur(0)'},
   {offset:.34,transform:`translate3d(${fromX+x*.58}px,${lift*.42}px,0) rotate(${rotate*.48}deg) scale(1.012)`,opacity:.96,filter:'blur(0)'},
   {offset:.58,transform:`translate3d(${fromX+x}px,${lift}px,0) rotate(${rotate}deg) scale(.965)`,opacity:.78,filter:'blur(.35px)'},
   {offset:.76,transform:`translate3d(${Math.max(18,fromX*.34)}px,4px,0) rotate(${rotate*.18}deg) scale(1.008)`,opacity:1,filter:'blur(0)'},
   {offset:1,transform:'translate3d(0,0,0) rotate(0deg) scale(1)',opacity:1,filter:'blur(0)'}
  ];
  element.classList.add('nexa-favoriting');
  if(typeof element.animate!=='function'){
   element.style.transition=`transform 520ms ${ease.spring}, opacity 360ms ease-out`;element.style.transform='translate3d(0,0,0)';element.style.opacity='1';setTimeout(finish,540);return Promise.resolve();
  }
  const animation=element.animate(frames,{duration:560,easing:'cubic-bezier(.16,.78,.18,1)',fill:'both'});
  const promise=animation.finished.catch(()=>{}).then(()=>{try{animation.cancel();}catch(e){}finish();});setTimeout(finish,650);return promise;
 }
 function curveReturn(element,trace,done,options){
  options=options||{};let finished=false;
  const finish=()=>{if(finished)return;finished=true;element?.classList?.remove('nexa-returning');element?.style?.removeProperty('transform');element?.style?.removeProperty('opacity');element?.style?.removeProperty('filter');if(typeof done==='function')done();};
  if(!element){finish();return Promise.resolve();}
  trace=trace&&Array.isArray(trace.frames)?trace:departureTrace(element,{direction:trace?.direction||-1,fromX:Number(trace?.fromX)||0});
  if(reduced()){finish();return Promise.resolve();}
  element.classList.add('nexa-returning');
  const reversed=trace.frames.slice().reverse().map((frame,index,arr)=>{
   const oldOffset=Number(frame.offset);return Object.assign({},frame,{offset:Number.isFinite(oldOffset)?1-oldOffset:index/(arr.length-1)});
  }).sort((a,b)=>a.offset-b.offset);
  const settleFrom=Number(trace.fromX)||0;
  const reverseEase='cubic-bezier(.82,0,.68,.95)';
  const settle=()=>{
   if(Math.abs(settleFrom)<.5){finish();return Promise.resolve();}
   if(typeof element.animate==='function'){
    const a=element.animate([{transform:`translate3d(${settleFrom}px,0,0)`},{transform:'translate3d(0,0,0)'}],{duration:210,easing:ease.spring,fill:'both'});
    return a.finished.catch(()=>{}).then(finish);
   }
   element.style.transition=`transform 210ms ${ease.spring}`;element.style.transform='translate3d(0,0,0)';setTimeout(finish,230);return Promise.resolve();
  };
  if(typeof element.animate!=='function'){
   const first=reversed[0];element.style.transform=first.transform;element.style.opacity=String(first.opacity);element.style.filter=first.filter;
   raf2(()=>{element.style.transition=`transform ${trace.duration}ms ${reverseEase}, opacity ${trace.duration}ms ease-out, filter ${trace.duration}ms ease-out`;const last=reversed[reversed.length-1];element.style.transform=last.transform;element.style.opacity=String(last.opacity);element.style.filter=last.filter;setTimeout(settle,trace.duration+24);});return Promise.resolve();
  }
  const animation=element.animate(reversed,{duration:Number(trace.duration)||470,easing:reverseEase,fill:'both'});
  return animation.finished.catch(()=>{}).then(settle);
 }
 function softSettle(element,done,options){
  options=options||{};let completed=false;const finish=()=>{if(completed)return;completed=true;element?.classList?.remove('nexa-completing');if(typeof done==='function')done();};
  if(!element||reduced()){finish();return Promise.resolve();}
  element.classList.add('nexa-completing');
  if(typeof element.animate!=='function'){setTimeout(finish,390);return Promise.resolve();}
  const a=element.animate([
   {offset:0,transform:'translate3d(0,0,0) scale(1)',opacity:1},
   {offset:.42,transform:'translate3d(0,3px,0) scale(.995)',opacity:.86},
   {offset:1,transform:'translate3d(0,9px,0) scale(.985)',opacity:.68}
  ],{duration:400,easing:ease.emphasized,fill:'none'});
  const p=a.finished.catch(()=>{}).then(finish);setTimeout(finish,470);return p;
 }

 let stackCleanup=null;
 function enhanceStack(scope){
  if(stackCleanup){stackCleanup();stackCleanup=null;}
  const cards=[...(scope?.querySelectorAll?.('[data-nexa-stack]')||[])];
  if(!cards.length||reduced())return function(){};
  cards.forEach((card,index)=>card.style.setProperty('--nexa-stack-index',String(index)));
  let frame=0;
  const update=()=>{frame=0;cards.forEach((card,index)=>{
   const next=cards[index+1];if(!next){card.style.setProperty('--nexa-stack-scale','1');card.style.setProperty('--nexa-stack-dim','1');return;}
   const top=16+index*12,rect=card.getBoundingClientRect(),nextRect=next.getBoundingClientRect();
   const approach=clamp(1-(nextRect.top-(top+rect.height))/96,0,1);const pinned=rect.top<=top+1?1:clamp((top+48-rect.top)/48,0,1);const amount=approach*pinned;
   card.style.setProperty('--nexa-stack-scale',String(1-amount*.035));card.style.setProperty('--nexa-stack-dim',String(1-amount*.08));
  });};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});update();
  stackCleanup=()=>{removeEventListener('scroll',schedule);removeEventListener('resize',schedule);if(frame)cancelAnimationFrame(frame);};return stackCleanup;
 }

 let listStackCleanup=null;
 function enhanceListStack(container,options){
  options=options||{};if(listStackCleanup){listStackCleanup();listStackCleanup=null;}if(!container||reduced())return function(){};
  const selector=options.selector||'.todo-item[data-id]';let rows=[];let groups=[];let frame=0;let enabled=false;let activeGroup=null;const fallbackTop=Number(options.top)||12;const minItems=Math.max(10,Number(options.minItems)||12);const minGroupItems=4;const maxLayers=4;
  const resetCard=c=>{if(!c)return;c.classList.remove('nexa-list-stack-card','nexa-list-stack-front');['--nexa-list-z','--nexa-list-depth','--nexa-list-scale','--nexa-list-y','--nexa-list-opacity'].forEach(k=>c.style.removeProperty(k));c.style.removeProperty('pointer-events');};
  const releaseGroup=g=>{g?.cards?.forEach(resetCard);if(activeGroup===g)activeGroup=null;};
  const collect=()=>{
   rows.forEach(resetCard);rows=[...container.querySelectorAll(selector)];groups=[];activeGroup=null;
   let current=null,serial=0;
   [...container.children].forEach(child=>{
    if(child.classList?.contains('date-divider')){current={id:serial++,kind:'active',date:child.dataset.date||'',cards:[],start:child,boundary:null,stackable:false};groups.push(current);return;}
    if(child.classList?.contains('todo-completed-divider')){if(current)current.boundary=child;current={id:serial++,kind:'completed',date:current?.date||'',cards:[],start:child,boundary:null,stackable:false};groups.push(current);return;}
    if(!child.matches?.(selector))return;
    if(!current){current={id:serial++,kind:child.dataset.statusGroup==='completed'?'completed':'active',date:child.dataset.dateKey||'',cards:[],start:null,boundary:null,stackable:false};groups.push(current);}
    current.cards.push(child);
   });
   for(let i=0;i<groups.length-1;i++)if(!groups[i].boundary)groups[i].boundary=groups[i+1].start||groups[i+1].cards[0]||null;
   const activeCount=groups.reduce((n,g)=>n+(g.kind==='active'?g.cards.length:0),0),longList=activeCount>=minItems;groups.forEach(g=>{g.stackable=longList&&g.kind==='active'&&g.cards.length>=minGroupItems;});enabled=groups.some(g=>g.stackable);
   container.classList.toggle('nexa-list-stack-enabled',enabled);
  };
  const suspended=()=>container.classList.contains('nexa-list-reflowing')||!!container.querySelector('.checklist-expanded,.checklist-animating,.swipe-open,.nexa-reorder-source,.nexa-departing,.todo-item__text.editing,.nexa-swipe-active');
  const anchorTop=()=>{const header=document.querySelector('.sticky-header');const rect=header?.getBoundingClientRect?.();return Math.max(fallbackTop,Math.round((rect?.bottom||header?.offsetHeight||0)+8));};
  const naturalTop=(el,containerRect)=>{if(!el)return Infinity;return (containerRect?.top||container.getBoundingClientRect().top)+(Number(el.offsetTop)||0)-(Number(container.scrollTop)||0);};
  const setActiveGroup=g=>{if(activeGroup===g)return;if(activeGroup)releaseGroup(activeGroup);activeGroup=g||null;if(activeGroup)activeGroup.cards.forEach(c=>c.classList.add('nexa-list-stack-card'));};
  const styleActiveGroup=(group,anchor,containerRect)=>{
   const cards=group.cards;let current=-1;
   for(let i=0;i<cards.length;i++){if(naturalTop(cards[i],containerRect)<=anchor+1)current=i;else break;}
   if(current<0)return;
   let incoming=0;
   if(current+1<cards.length){const nextTop=naturalTop(cards[current+1],containerRect),height=cards[current].getBoundingClientRect?.().height||72,travel=clamp(height*.88,58,92);incoming=clamp(1-(nextTop-anchor)/travel,0,1);}
   cards.forEach((card,i)=>{
    card.classList.toggle('nexa-list-stack-front',i===current);
    if(i>current){card.style.setProperty('--nexa-list-z','70');card.style.setProperty('--nexa-list-depth','-1');card.style.setProperty('--nexa-list-scale','1');card.style.setProperty('--nexa-list-y','0px');card.style.setProperty('--nexa-list-opacity','1');card.style.removeProperty('pointer-events');return;}
    const depth=(current-i)+incoming;
    if(depth>=maxLayers){card.style.setProperty('--nexa-list-z','60');card.style.setProperty('--nexa-list-depth',String(depth));card.style.setProperty('--nexa-list-scale','.965');card.style.setProperty('--nexa-list-y','-18px');card.style.setProperty('--nexa-list-opacity','0');card.style.pointerEvents='none';return;}
    const bounded=Math.min(depth,maxLayers-1);card.style.setProperty('--nexa-list-z',String(Math.round(80-bounded*4)));card.style.setProperty('--nexa-list-depth',String(depth));card.style.setProperty('--nexa-list-scale',String(1-bounded*.0105));card.style.setProperty('--nexa-list-y',(-bounded*6)+'px');card.style.setProperty('--nexa-list-opacity',String(1-bounded*.035));if(depth>=.98)card.style.pointerEvents='none';else card.style.removeProperty('pointer-events');
   });
  };
  const update=()=>{
   frame=0;if(document.body.dataset.nexaPage&&document.body.dataset.nexaPage!=='todo')return;
   if(!rows.length)collect();const anchor=anchorTop();container.style.setProperty('--nexa-list-stack-top',anchor+'px');
   if(!enabled){container.classList.remove('nexa-list-stack-suspended');setActiveGroup(null);return;}
   if(suspended()){container.classList.add('nexa-list-stack-suspended');return;}
   container.classList.remove('nexa-list-stack-suspended');const cr=container.getBoundingClientRect();let nextActive=null;
   for(const g of groups){if(!g.stackable||!g.cards.length)continue;const firstTop=naturalTop(g.cards[0],cr);const boundaryTop=g.boundary?naturalTop(g.boundary,cr):Infinity;const lastHeight=g.cards[g.cards.length-1].getBoundingClientRect?.().height||72;const started=firstTop<=anchor+1;const ended=boundaryTop<=anchor+Math.min(58,lastHeight*.68);if(started&&!ended)nextActive=g;}
   setActiveGroup(nextActive);if(activeGroup)styleActiveGroup(activeGroup,anchor,cr);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};const mo=new MutationObserver(()=>{collect();schedule();});mo.observe(container,{childList:true,subtree:false});
  const routeObserver=new MutationObserver(schedule);routeObserver.observe(document.body,{attributes:true,attributeFilter:['data-nexa-page']});
  addEventListener('scroll',schedule,{passive:true});container.addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});collect();update();
  listStackCleanup=()=>{mo.disconnect();routeObserver.disconnect();removeEventListener('scroll',schedule);container.removeEventListener('scroll',schedule);removeEventListener('resize',schedule);if(frame)cancelAnimationFrame(frame);container.classList.remove('nexa-list-stack-suspended','nexa-list-stack-enabled','nexa-list-reflowing');container.style.removeProperty('--nexa-list-stack-top');rows.forEach(resetCard);activeGroup=null;};return listStackCleanup;
 }

 const odometerValues=new Map();
 function mountOdometer(el,target,key){
  if(!el)return;target=Math.max(0,Math.round(Number(target)||0));key=String(key||el.dataset?.nexaOdometer||'value');const text=String(target),oldRaw=odometerValues.has(key)?String(odometerValues.get(key)):'';odometerValues.set(key,target);
  if(reduced()){el.textContent=text;return;}
  const width=Math.max(text.length,oldRaw.length||1),next=text.padStart(width,'0'),prev=(oldRaw||'0').padStart(width,'0');let html='';
  for(let i=0;i<width;i++){const s=Number(prev[i]||0),t=Number(next[i]||0),end=t>=s?t:t+10;const digits=Array.from({length:20},(_,d)=>'<span>'+String(d%10)+'</span>').join('');html+='<span class="nexa-odometer-column"><span class="nexa-odometer-track" style="--nexa-odo-start-y:'+(-s*1.08)+'em;--nexa-odo-end-y:'+(-end*1.08)+'em">'+digits+'</span></span>';}
  el.innerHTML=html;el.setAttribute('aria-label',text);raf2(()=>{el.querySelectorAll('.nexa-odometer-track').forEach(track=>track.classList.add('run'));});
 }
 function mountOdometers(scope){(scope?.querySelectorAll?.('[data-nexa-odometer]')||[]).forEach(el=>mountOdometer(el,el.dataset.nexaValue,el.dataset.nexaOdometer));}
 let homeEntry=0,ringEntry=-1;
 function enterHome(){homeEntry++;}
 function drawRings(scope){const rings=[...(scope?.querySelectorAll?.('.nexa-ring .value[data-nexa-progress]')||[])];if(!rings.length)return;const play=ringEntry!==homeEntry;ringEntry=homeEntry;rings.forEach(circle=>{const target=clamp(Number(circle.dataset.nexaProgress)||0,0,100);circle.setAttribute('stroke-dasharray',target+' 100');if(!play||reduced())return;if(typeof circle.animate==='function')circle.animate([{strokeDasharray:'0 100',opacity:.25},{strokeDasharray:target+' 100',opacity:1}],{duration:720,easing:ease.emphasized,fill:'none'});});}

 function navIndicator(nav,active){
  if(!nav||!active)return;let indicator=nav.querySelector('.nexa-nav-indicator');if(!indicator){indicator=document.createElement('span');indicator.className='nexa-nav-indicator';indicator.setAttribute('aria-hidden','true');nav.prepend(indicator);}
  const nr=nav.getBoundingClientRect(),ar=active.getBoundingClientRect();const x=ar.left-nr.left,y=ar.top-nr.top,w=ar.width,h=ar.height;indicator.style.setProperty('--nexa-nav-x',x+'px');indicator.style.setProperty('--nexa-nav-y',y+'px');indicator.style.setProperty('--nexa-nav-w',w+'px');indicator.style.setProperty('--nexa-nav-h',h+'px');
 }
 function routeAxis(from,to){const order=['home','todo','notes','daily','space'],a=order.indexOf(from),b=order.indexOf(to);if(from==='home'&&to!=='home')return 'child';if(to==='home'&&from!=='home')return 'parent';if(a>=0&&b>=0)return b>a?'forward':'back';return 'forward';}
 function markRouteMotion(body,from,to){
  if(!body)return;body.dataset.nexaMotionAxis=routeAxis(from,to);
  // Animate a bounded header only. Never flush body layout or promote an entire long list.
  body.__nexaHeaderMotion?.cancel();
  clearTimeout(body.__nexaRouteTimer);body.classList.add('nexa-route-animate');
  body.__nexaRouteTimer=setTimeout(()=>body.classList.remove('nexa-route-animate'),300);
  if(reduced())return;
  const header=to==='home'?document.querySelector('#nexaHome .nexa-page-head'):to==='space'?document.querySelector('#nexaSpace .nexa-page-head'):to==='daily'?document.querySelector('#dailyDrawer .daily-drawer__header'):document.querySelector('.header__top');
  if(header?.animate)body.__nexaHeaderMotion=header.animate([{transform:'translateY(3px)'},{transform:'none'}],{duration:220,easing:ease.emphasized});
 }

 function installPressPhysics(){if(!hasDOM()||document.__nexaPressInstalled)return;document.__nexaPressInstalled=true;let pressed=null;
  const release=()=>{if(!pressed)return;pressed.classList.remove('nexa-pressing');pressed=null;};
  document.addEventListener('pointerdown',e=>{const b=e.target.closest?.('button,.category-bar__item,[role="button"]');if(!b||b.disabled||b.classList.contains('nexa-no-press'))return;const r=b.getBoundingClientRect();const min=Math.min(r.width||60,r.height||44);b.style.setProperty('--nexa-press-scale',min<34?'.92':min<52?'.955':'.975');b.classList.add('nexa-pressing');pressed=b;},{capture:true,passive:true});
  document.addEventListener('pointerup',release,true);document.addEventListener('pointercancel',release,true);document.addEventListener('pointerleave',e=>{if(pressed&&e.target===pressed)release();},true);
 }

 function installStateWriting(){if(!hasDOM()||document.__nexaStateWritingInstalled)return;document.__nexaStateWritingInstalled=true;document.addEventListener('click',e=>{const c=e.target.closest?.('.checkbox,.daily-check,.todo-subcheck');if(!c||reduced())return;c.classList.remove('nexa-state-write');void c.offsetWidth;c.classList.add('nexa-state-write');setTimeout(()=>c.classList.remove('nexa-state-write'),390);},true);}

 function installCollapsingSpaceHeader(){if(!hasDOM()||document.__nexaSpaceHeaderInstalled)return;document.__nexaSpaceHeaderInstalled=true;let frame=0;const update=()=>{frame=0;const root=document.getElementById('nexaSpace');if(!root||document.body.dataset.nexaPage!=='space')return;const head=root.querySelector('.nexa-space-page-head');if(!head)return;const r=root.getBoundingClientRect();const p=clamp((-r.top)/74,0,1);head.style.setProperty('--nexa-space-collapse',String(p));head.classList.toggle('is-compact',p>.55);};const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['data-nexa-page']});new MutationObserver(schedule).observe(document.getElementById('nexaSpace')||document.body,{childList:true,subtree:true});schedule();}

 const sheetBindings=new WeakSet();
 const sheetEntryAnimations=new WeakMap();
 function sheetDismiss(sheet){const map=[['#todoCreateOverlay','#todoCreateCancel'],['#dailyEditorOverlay','#dailyEditorClose'],['#dailyCalendarOverlay','#dailyCalendarClose'],['#dailyHistorySheet','#dailyHistorySheetClose'],['#dailyHistoryOverlay','#dailyHistoryClose'],['#timePickerOverlay','#timePickerClose'],['#reminderPickerOverlay','#reminderPickerClose'],['#noteSwipeTopicOverlay','#noteSwipeTopicClose'],['#noteFileImportOverlay','#noteFileImportCancel'],['#noteFileActionsOverlay','#noteFileActionsCancel'],['#aiChatModal','#aiChatClose'],['#recycleModal','#recycleClose'],['#nexaDialog','[data-nx-close]']];for(const[owner,close]of map){const o=sheet.closest(owner)||sheet.matches?.(owner)&&sheet;if(o){o.querySelector(close)?.click();return;}}sheet.dispatchEvent(new CustomEvent('nexa:sheet-dismiss',{bubbles:true}));}
 function bindSheet(sheet){if(!sheet||sheetBindings.has(sheet))return;sheetBindings.add(sheet);sheet.classList.add('nexa-spring-sheet');let grab=sheet.querySelector('.nexa-sheet-grab');if(!grab){grab=document.createElement('div');grab.className='nexa-sheet-grab';grab.setAttribute('aria-hidden','true');sheet.prepend(grab);}let state=null;
  grab.addEventListener('pointerdown',e=>{if(reduced())return;state={id:e.pointerId,start:e.clientY,last:e.clientY,lastT:performance.now(),v:0,dy:0};grab.setPointerCapture?.(e.pointerId);sheet.classList.add('nexa-sheet-dragging');sheet.style.transition='none';e.preventDefault();});
  grab.addEventListener('pointermove',e=>{if(!state||state.id!==e.pointerId)return;const now=performance.now(),raw=e.clientY-state.start,dy=raw<0?-Math.min(14,Math.abs(raw)*.18):raw;const dt=Math.max(8,now-state.lastT);state.v=(e.clientY-state.last)/dt;state.last=e.clientY;state.lastT=now;state.dy=dy;sheet.style.transform=`translate3d(0,${dy}px,0)`;e.preventDefault();});
  const end=e=>{if(!state||e&&state.id!==e.pointerId)return;const s=state;state=null;sheet.classList.remove('nexa-sheet-dragging');sheet.style.transition='';const should=s.dy>Math.min(150,(sheet.getBoundingClientRect().height||400)*.28)||s.v>.72;if(should){if(typeof sheet.animate==='function'){const dismissAnim=sheet.animate([{transform:`translate3d(0,${s.dy}px,0)`},{transform:'translate3d(0,105%,0)'}],{duration:240,easing:ease.accelerate,fill:'forwards'});dismissAnim.finished.catch(()=>{}).then(()=>{try{dismissAnim.cancel();}catch(err){}sheet.style.transform='';sheetDismiss(sheet);});}else sheetDismiss(sheet);}else{sheet.style.transform='';sheet.classList.add('nexa-sheet-rebound');setTimeout(()=>sheet.classList.remove('nexa-sheet-rebound'),360);}};
  grab.addEventListener('pointerup',end);grab.addEventListener('pointercancel',end);
 }
 function presentSheet(sheet,options){
  options=options||{};if(!sheet||reduced())return Promise.resolve();bindSheet(sheet);
  const previous=sheetEntryAnimations.get(sheet);try{previous?.cancel?.();}catch(e){}
  sheet.classList.remove('nexa-sheet-presenting-fallback');sheet.classList.add('nexa-sheet-presenting');
  sheet.style.removeProperty('transform');sheet.style.removeProperty('opacity');
  const rect=sheet.getBoundingClientRect?.()||{height:320};
  const viewport=Math.max(480,Number(root.innerHeight)||720);
  // Start genuinely below the viewport, then carry a tiny amount of velocity beyond the
  // resting point. The last 30% slows down and settles, matching the Banner's physical feel.
  const travel=Math.max(170,Math.min(viewport*.72,(Number(rect.height)||320)+viewport*.42));
  const frames=[
   {offset:0,transform:`translate3d(0,${travel}px,0) scale(.986)`,opacity:.94},
   {offset:.66,transform:'translate3d(0,-8px,0) scale(1.003)',opacity:1},
   {offset:.84,transform:'translate3d(0,2.5px,0) scale(.999)',opacity:1},
   {offset:1,transform:'translate3d(0,0,0) scale(1)',opacity:1}
  ];
  const finish=()=>{sheet.classList.remove('nexa-sheet-presenting');sheetEntryAnimations.delete(sheet);};
  if(typeof sheet.animate!=='function'){
   sheet.style.setProperty('--nexa-sheet-enter-distance',travel+'px');sheet.classList.add('nexa-sheet-presenting-fallback');
   return new Promise(resolve=>setTimeout(()=>{sheet.classList.remove('nexa-sheet-presenting-fallback','nexa-sheet-presenting');sheet.style.removeProperty('--nexa-sheet-enter-distance');resolve();},500));
  }
  const animation=sheet.animate(frames,{duration:Number(options.duration)||480,easing:'cubic-bezier(.16,.78,.18,1)',fill:'both'});sheetEntryAnimations.set(sheet,animation);
  return animation.finished.catch(()=>{}).then(()=>{try{animation.cancel();}catch(e){}finish();});
 }
 function scanSheets(){if(!hasDOM())return;const selectors=['.todo-create-sheet','.daily-editor','.daily-calendar','.daily-history-card','.daily-history-sheet','.time-picker','.reminder-picker','.note-swipe-topic-sheet','.note-file-import-sheet','.note-file-actions-sheet','.ai-chat-modal__content','.recycle-modal__content','.nexa-dialog>section'];selectors.forEach(s=>document.querySelectorAll(s).forEach(bindSheet));}
 function installSheets(){if(!hasDOM()||document.__nexaSheetsInstalled)return;document.__nexaSheetsInstalled=true;scanSheets();new MutationObserver(scanSheets).observe(document.body,{childList:true,subtree:true});}

 function showPeek(source,kind,id){if(!hasDOM()||!source||reduced())return;closePeek();const overlay=document.createElement('div');overlay.className='nexa-peek-overlay';overlay.dataset.kind=kind;overlay.dataset.id=String(id);const card=document.createElement('section');card.className='nexa-peek-card';let content='';
  if(kind==='todo'){const title=source.querySelector('.todo-item__text')?.textContent?.trim()||'任务';const meta=source.querySelector('.todo-item__category')?.textContent?.trim()||'';const checklist=[...source.querySelectorAll('.todo-subitem__text')].slice(0,4).map(n=>'<li>'+escapeHTML(n.textContent)+'</li>').join('');content='<div class="nexa-peek-kicker">Todo · '+escapeHTML(meta)+'</div><h3>'+escapeHTML(title)+'</h3>'+(checklist?'<ul>'+checklist+'</ul>':'')+'<div class="nexa-peek-actions"><button data-peek-action="open">定位</button><button data-peek-action="toggle">完成状态</button><button data-peek-action="reminder">提醒</button><button data-peek-action="delete">删除</button></div>';}
  else{const cardSource=source.matches?.('[data-note-open-id]')?source:source.querySelector?.('[data-note-open-id]');const title=cardSource?.querySelector('.note-node-title')?.textContent?.trim()||'笔记';const preview=cardSource?.querySelector('.note-recent-card__preview')?.textContent?.trim()||'';content='<div class="nexa-peek-kicker">Note</div><h3>'+escapeHTML(title)+'</h3><p>'+escapeHTML(preview||'打开查看完整内容')+'</p><div class="nexa-peek-actions"><button data-peek-action="open">打开</button><button data-peek-action="tag">标签</button></div>';}
  card.innerHTML=content;overlay.append(card);document.body.append(overlay);requestAnimationFrame(()=>overlay.classList.add('active'));let sy=0,sx=0;overlay.addEventListener('pointerdown',e=>{sy=e.clientY;sx=e.clientX;},{passive:true});overlay.addEventListener('pointerup',e=>{const dy=e.clientY-sy,dx=e.clientX-sx;if(dy<-58&&Math.abs(dy)>Math.abs(dx)){document.dispatchEvent(new CustomEvent('nexa:peek-action',{detail:{kind,id:Number(id),action:'open'}}));closePeek();}},{passive:true});overlay.addEventListener('click',e=>{const b=e.target.closest('[data-peek-action]');if(b){document.dispatchEvent(new CustomEvent('nexa:peek-action',{detail:{kind,id:Number(id),action:b.dataset.peekAction}}));closePeek();return;}if(e.target===overlay)closePeek();});
 }
 function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function closePeek(){const old=hasDOM()&&document.querySelector('.nexa-peek-overlay');if(!old)return;old.classList.remove('active');setTimeout(()=>old.remove(),220);}

 let reorderBinding=null;
 function enableTodoReorder(container){
  if(reorderBinding){reorderBinding();reorderBinding=null;}if(!container||reduced())return function(){};let hold=0,peekTimer=0,state=null,clone=null,suppressUntil=0;
  const cancelHold=()=>{if(hold){clearTimeout(hold);hold=0;}if(peekTimer){clearTimeout(peekTimer);peekTimer=0;}};
  const eligible=e=>{const row=e.target.closest?.('.todo-item[data-id]');if(!row||e.target.closest?.('button,.checkbox,.todo-checklist-shell,.todo-item__category,.todo-item__text.editing'))return null;return row;};
  const prep=(row,x,y,id)=>{state={row,startX:x,startY:y,x,y,id,ready:false,dragging:false,peekShown:false,date:row.dataset.dateKey||'',status:row.dataset.statusGroup||'active',offsetY:0};cancelHold();hold=setTimeout(()=>{hold=0;if(!state||state.row!==row)return;state.ready=true;row.classList.add('nexa-longpress-ready');try{root.AndroidBridge?.performHaptic?.('tick');}catch(e){}peekTimer=setTimeout(()=>{peekTimer=0;if(!state||state.row!==row||state.dragging)return;state.peekShown=true;suppressUntil=Date.now()+700;showPeek(row,'todo',Number(row.dataset.id));},150);},330);};
  const startDrag=()=>{if(!state||state.dragging||state.peekShown)return;const row=state.row,r=row.getBoundingClientRect();state.dragging=true;state.offsetY=state.y-r.top;cancelHold();row.classList.remove('nexa-longpress-ready');row.classList.add('nexa-reorder-source');container.classList.add('nexa-reorder-active');clone=row.cloneNode(true);clone.classList.add('nexa-reorder-clone');clone.style.left=r.left+'px';clone.style.top=r.top+'px';clone.style.width=r.width+'px';clone.style.height=r.height+'px';document.body.append(clone);};
  const siblings=()=>[...container.querySelectorAll('.todo-item[data-id]')].filter(r=>r.dataset.dateKey===state.date&&r.dataset.statusGroup===state.status&&r!==state.row);
  const move=(x,y,prevent)=>{if(!state)return;state.x=x;state.y=y;if(state.peekShown){if(y-state.startY<-54){document.dispatchEvent(new CustomEvent('nexa:peek-action',{detail:{kind:'todo',id:Number(state.row.dataset.id),action:'open'}}));closePeek();state.row.classList.remove('nexa-longpress-ready');state=null;suppressUntil=Date.now()+600;}return;}if(!state.ready){if(Math.hypot(x-state.startX,y-state.startY)>9){cancelHold();state=null;}return;}if(!state.dragging&&Math.hypot(x-state.startX,y-state.startY)>8)startDrag();if(!state||!state.dragging)return;if(prevent)prevent();clone.style.top=(y-state.offsetY)+'px';clone.style.transform='scale(1.018) rotate('+clamp((x-state.startX)/90,-2,2)+'deg)';const targets=siblings();let before=null;for(const t of targets){const r=t.getBoundingClientRect();if(y<r.top+r.height/2){before=t;break;}}const oldRects=new Map(targets.map(t=>[t,t.getBoundingClientRect()]));if(before)container.insertBefore(state.row,before);else{const same=[...container.querySelectorAll('.todo-item[data-id]')].filter(r=>r.dataset.dateKey===state.date&&r.dataset.statusGroup===state.status);const last=same.at(-1);if(last&&last!==state.row)last.after(state.row);}targets.forEach(t=>{const old=oldRects.get(t),now=t.getBoundingClientRect(),dy=old.top-now.top;if(Math.abs(dy)>.5&&typeof t.animate==='function')t.animate([{transform:`translateY(${dy}px) scale(.985)`},{transform:'translateY(0) scale(1)'}],{duration:320,easing:ease.spring});});};
  const finish=()=>{cancelHold();if(!state)return;const s=state;state=null;s.row.classList.remove('nexa-longpress-ready');if(s.peekShown){suppressUntil=Date.now()+520;return;}if(!s.ready)return;if(!s.dragging){suppressUntil=Date.now()+420;showPeek(s.row,'todo',Number(s.row.dataset.id));return;}const target=s.row.getBoundingClientRect();const done=()=>{clone?.remove();clone=null;s.row.classList.remove('nexa-reorder-source');container.classList.remove('nexa-reorder-active');const ids=[...container.querySelectorAll('.todo-item[data-id]')].filter(r=>r.dataset.dateKey===s.date&&r.dataset.statusGroup===s.status).map(r=>Number(r.dataset.id));document.dispatchEvent(new CustomEvent('nexa:todo-reorder',{detail:{dateKey:s.date,statusGroup:s.status,ids,movedId:Number(s.row.dataset.id)}}));};if(clone&&typeof clone.animate==='function'){const cr=clone.getBoundingClientRect(),dx=target.left-cr.left,dy=target.top-cr.top;clone.animate([{transform:clone.style.transform||'none'},{transform:`translate3d(${dx}px,${dy}px,0) scale(1)`}],{duration:300,easing:ease.spring,fill:'forwards'}).finished.catch(()=>{}).then(done);}else done();suppressUntil=Date.now()+500;};
  const onTouchStart=e=>{if(!e.touches?.length)return;const row=eligible(e);if(row)prep(row,e.touches[0].clientX,e.touches[0].clientY,'touch');};
  const onTouchMove=e=>{if(!state||!e.touches?.length)return;move(e.touches[0].clientX,e.touches[0].clientY,()=>e.preventDefault());};const onTouchEnd=()=>finish();
  const onMouseDown=e=>{if(e.button!==0||e.pointerType==='touch')return;const row=eligible(e);if(row)prep(row,e.clientX,e.clientY,e.pointerId);};const onMouseMove=e=>{if(!state||state.id==='touch')return;move(e.clientX,e.clientY,()=>e.preventDefault());};const onMouseUp=()=>{if(state&&state.id!=='touch')finish();};
  const clickGuard=e=>{if(Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}};
  container.addEventListener('touchstart',onTouchStart,{passive:true,capture:true});container.addEventListener('touchmove',onTouchMove,{passive:false,capture:true});container.addEventListener('touchend',onTouchEnd,{passive:true,capture:true});container.addEventListener('touchcancel',onTouchEnd,{passive:true,capture:true});container.addEventListener('pointerdown',onMouseDown,true);addEventListener('pointermove',onMouseMove,true);addEventListener('pointerup',onMouseUp,true);container.addEventListener('click',clickGuard,true);
  reorderBinding=()=>{cancelHold();container.removeEventListener('touchstart',onTouchStart,true);container.removeEventListener('touchmove',onTouchMove,true);container.removeEventListener('touchend',onTouchEnd,true);container.removeEventListener('touchcancel',onTouchEnd,true);container.removeEventListener('pointerdown',onMouseDown,true);removeEventListener('pointermove',onMouseMove,true);removeEventListener('pointerup',onMouseUp,true);container.removeEventListener('click',clickGuard,true);clone?.remove();};return reorderBinding;
 }

 let chipReorderBinding=null;
 function enableChipReorder(container){
  if(chipReorderBinding){chipReorderBinding();chipReorderBinding=null;}if(!container||reduced())return function(){};let timer=0,state=null,clone=null,suppress=0;
  const cancelTimer=()=>{if(timer){clearTimeout(timer);timer=0;}};
  const down=e=>{if(e.button!=null&&e.button!==0)return;const chip=e.target.closest?.('.category-bar__item[data-category]');if(!chip||chip.dataset.category==='全部')return;state={chip,id:e.pointerId,x0:e.clientX,y0:e.clientY,x:e.clientX,ready:false,dragging:false,offsetX:0};timer=setTimeout(()=>{timer=0;if(!state||state.chip!==chip)return;state.ready=true;chip.classList.add('nexa-chip-longpress');try{root.AndroidBridge?.performHaptic?.('tick');}catch(err){}},320);};
  const start=()=>{if(!state||state.dragging)return;const r=state.chip.getBoundingClientRect();state.dragging=true;state.offsetX=state.x-r.left;state.chip.classList.remove('nexa-chip-longpress');state.chip.classList.add('nexa-chip-reorder-source');container.classList.add('nexa-chip-reorder-active');clone=state.chip.cloneNode(true);clone.classList.add('nexa-chip-reorder-clone');clone.style.left=r.left+'px';clone.style.top=r.top+'px';clone.style.width=r.width+'px';clone.style.height=r.height+'px';document.body.append(clone);};
  const move=e=>{if(!state||e.pointerId!==state.id)return;state.x=e.clientX;const dx=e.clientX-state.x0,dy=e.clientY-state.y0;if(!state.ready){if(Math.hypot(dx,dy)>9){cancelTimer();state=null;}return;}if(!state.dragging&&Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy))start();if(!state||!state.dragging)return;e.preventDefault();clone.style.left=(e.clientX-state.offsetX)+'px';clone.style.transform='scale(1.04) rotate('+clamp(dx/110,-1.6,1.6)+'deg)';const items=[...container.querySelectorAll('.category-bar__item[data-category]')].filter(c=>c!==state.chip&&c.dataset.category!=='全部');const rects=new Map(items.map(c=>[c,c.getBoundingClientRect()]));let before=null;for(const c of items){const r=c.getBoundingClientRect();if(e.clientX<r.left+r.width/2){before=c;break;}}if(before)container.insertBefore(state.chip,before);else items.at(-1)?.after(state.chip);items.forEach(c=>{const a=rects.get(c),b=c.getBoundingClientRect(),delta=a.left-b.left;if(Math.abs(delta)>.5&&typeof c.animate==='function')c.animate([{transform:`translateX(${delta}px) scale(.96)`},{transform:'translateX(0) scale(1)'}],{duration:300,easing:ease.spring});});};
  const up=e=>{if(!state||e.pointerId!==state.id)return;cancelTimer();const s=state;state=null;s.chip.classList.remove('nexa-chip-longpress');if(!s.dragging)return;const target=s.chip.getBoundingClientRect();const done=()=>{clone?.remove();clone=null;s.chip.classList.remove('nexa-chip-reorder-source');container.classList.remove('nexa-chip-reorder-active');const order=[...container.querySelectorAll('.category-bar__item[data-category]')].map(c=>c.dataset.category);document.dispatchEvent(new CustomEvent('nexa:category-reorder',{detail:{order}}));};if(clone&&typeof clone.animate==='function'){const r=clone.getBoundingClientRect();clone.animate([{transform:clone.style.transform||'none'},{transform:`translate3d(${target.left-r.left}px,${target.top-r.top}px,0) scale(1)`}],{duration:290,easing:ease.spring,fill:'forwards'}).finished.catch(()=>{}).then(done);}else done();suppress=Date.now()+450;};
  const guard=e=>{if(Date.now()<suppress){e.preventDefault();e.stopImmediatePropagation();}};
  container.addEventListener('pointerdown',down,true);addEventListener('pointermove',move,{capture:true,passive:false});addEventListener('pointerup',up,true);addEventListener('pointercancel',up,true);container.addEventListener('click',guard,true);
  chipReorderBinding=()=>{cancelTimer();container.removeEventListener('pointerdown',down,true);removeEventListener('pointermove',move,true);removeEventListener('pointerup',up,true);removeEventListener('pointercancel',up,true);container.removeEventListener('click',guard,true);clone?.remove();};return chipReorderBinding;
 }

 function installNotePeek(){if(!hasDOM()||document.__nexaNotePeekInstalled)return;document.__nexaNotePeekInstalled=true;const list=document.getElementById('noteList');if(!list)return;let timer=0,row=null,x=0,y=0,peekId=0,suppress=0;const clear=()=>{if(timer)clearTimeout(timer);timer=0;row=null;peekId=0;};list.addEventListener('touchstart',e=>{if(!e.touches.length||e.target.closest('.note-swipe-actions,.note-recent-card__path,button'))return;const r=e.target.closest('.note-swipe-row[data-note-swipe-id]');if(!r)return;row=r;peekId=0;x=e.touches[0].clientX;y=e.touches[0].clientY;timer=setTimeout(()=>{timer=0;if(!row)return;peekId=Number(row.dataset.noteSwipeId);suppress=Date.now()+650;showPeek(row,'note',peekId);},390);},{passive:true,capture:true});list.addEventListener('touchmove',e=>{if(!row||!e.touches.length)return;const dx=e.touches[0].clientX-x,dy=e.touches[0].clientY-y;if(peekId&&dy<-54&&Math.abs(dy)>Math.abs(dx)){document.dispatchEvent(new CustomEvent('nexa:peek-action',{detail:{kind:'note',id:peekId,action:'open'}}));closePeek();clear();suppress=Date.now()+650;return;}if(!peekId&&Math.hypot(dx,dy)>10)clear();},{passive:true,capture:true});list.addEventListener('touchend',()=>{if(timer)clear();else{row=null;peekId=0;}},{passive:true,capture:true});list.addEventListener('touchcancel',clear,{passive:true,capture:true});list.addEventListener('click',e=>{if(Date.now()<suppress){e.preventDefault();e.stopImmediatePropagation();}},true);}

 function noteMorph(source,openFn){
  if(!source||typeof openFn!=='function'||reduced()||!hasDOM()){openFn?.();return;}
  const editor=document.getElementById('noteEditor'),srcTitle=source.querySelector('.note-node-title'),dstTitle=document.getElementById('noteEditorTitle');
  if(typeof document.startViewTransition==='function'&&editor){source.style.viewTransitionName='nexa-note-card';if(srcTitle)srcTitle.style.viewTransitionName='nexa-note-title';const vt=document.startViewTransition(()=>{source.style.viewTransitionName='';if(srcTitle)srcTitle.style.viewTransitionName='';openFn();editor.style.viewTransitionName='nexa-note-card';if(dstTitle)dstTitle.style.viewTransitionName='nexa-note-title';});vt.finished.catch(()=>{}).then(()=>{source.style.viewTransitionName='';if(srcTitle)srcTitle.style.viewTransitionName='';editor.style.viewTransitionName='';if(dstTitle)dstTitle.style.viewTransitionName='';});return;}
  const r=source.getBoundingClientRect();openFn();if(!editor)return;const cx=r.left+r.width/2,cy=r.top+r.height/2,dx=cx-innerWidth/2,dy=cy-innerHeight/2;editor.animate?.([{opacity:.15,transform:`translate3d(${dx*.18}px,${dy*.18}px,0) scale(.94)`,borderRadius:'18px'},{opacity:1,transform:'none',borderRadius:'0'}],{duration:360,easing:ease.emphasized});
 }

 function install(){if(!hasDOM()||document.__nexaMotionInstalled)return;document.__nexaMotionInstalled=true;installPressPhysics();installStateWriting();installSheets();installCollapsingSpaceHeader();installNotePeek();const todo=document.getElementById('todo-list');if(todo){enhanceListStack(todo);enableTodoReorder(todo);}const chips=document.getElementById('categoryScroll');if(chips)enableChipReorder(chips);const nav=document.getElementById('nexaNav');if(nav){const active=nav.querySelector('[aria-current="page"]');if(active)navIndicator(nav,active);}if(document.body.dataset.nexaPage==='home'){enterHome();mountOdometers(document.getElementById('nexaHome'));drawRings(document.getElementById('nexaHome'));}}
 if(hasDOM()){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else setTimeout(install,0);}
 return {ease,reduced,captureFlow,curveAway,curveReturn,favoriteCurve,softSettle,enhanceStack,enhanceListStack,animateReflow,mountOdometer,mountOdometers,enterHome,drawRings,navIndicator,routeAxis,markRouteMotion,scanSheets,presentSheet,showPeek,closePeek,enableTodoReorder,enableChipReorder,noteMorph,install};
});
