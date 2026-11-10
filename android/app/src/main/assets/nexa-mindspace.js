(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.NexaMindspace=api;
})(typeof window==='undefined'?globalThis:window,function(root){
 'use strict';
 const KEY='nexa_mindspace_v1',VERSION=2,TAU=Math.PI*2;
 const STAR_COUNT=190,NEAR_Z=.18,FAR_Z=1.18;
 const hasDOM=()=>typeof document!=='undefined'&&!!document.createElement;
 const reduced=()=>hasDOM()&&root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cssEscape=value=>root.CSS?.escape?root.CSS.escape(String(value)):String(value).replace(/[^a-zA-Z0-9_-]/g,c=>'\\'+c);
 const clone=v=>JSON.parse(JSON.stringify(v));
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const uid=(prefix='mind')=>(prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8));
 function empty(){return {version:VERSION,items:[],links:[]};}
 function normalize(raw){return {id:String(raw?.id||uid()),title:String(raw?.title||'').trim().slice(0,80),note:String(raw?.note||'').trim().slice(0,1000),category:String(raw?.category||'状态').trim().slice(0,24)||'状态',pinned:!!raw?.pinned,archived:!!raw?.archived,createdAt:Number(raw?.createdAt)||Date.now(),updatedAt:Number(raw?.updatedAt)||Date.now(),touchedAt:Number(raw?.touchedAt)||Number(raw?.createdAt)||Date.now()};}
 function normalizeLink(raw,itemIds){
  const from=String(raw?.from||''),to=String(raw?.to||'');
  if(!from||!to||from===to||!itemIds.has(from)||!itemIds.has(to))return null;
  const pair=[from,to].sort();
  return {id:String(raw?.id||('link_'+pair[0]+'__'+pair[1])),from,to,createdAt:Number(raw?.createdAt)||Date.now()};
 }
 function validate(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||![1,2].includes(Number(input.version))||!Array.isArray(input.items))throw Error('Mindspace 数据格式无效');
  const seen=new Set();
  const items=input.items.map((raw,index)=>{const item=normalize(raw);if(!item.title)throw Error('Mindspace 第 '+(index+1)+' 条缺少标题');if(seen.has(item.id))throw Error('Mindspace 标识重复');seen.add(item.id);return item;});
  const rawLinks=Number(input.version)===2&&Array.isArray(input.links)?input.links:[],linkIds=new Set(),pairs=new Set(),links=[];
  for(const raw of rawLinks){const value=normalizeLink(raw,seen);if(!value)continue;const pair=[value.from,value.to].sort().join('::');if(linkIds.has(value.id)||pairs.has(pair))continue;linkIds.add(value.id);pairs.add(pair);links.push(value);}
  return {version:VERSION,items,links};
 }
 function load(storage){try{const raw=storage?.getItem?.(KEY);return raw?validate(JSON.parse(raw)):empty();}catch(e){return empty();}}
 function save(storage,model){const next=validate(model);storage?.setItem?.(KEY,JSON.stringify(next));return next;}
 function upsert(model,item){const next=validate(clone(model)),value=normalize(item);if(!value.title)throw Error('写下一句真正想长期记住的话');const i=next.items.findIndex(x=>x.id===value.id);if(i>=0)next.items[i]=value;else next.items.push(value);return next;}
 function archive(model,itemId,on=true){const next=validate(clone(model)),item=next.items.find(x=>x.id===String(itemId));if(item){item.archived=!!on;item.updatedAt=Date.now();}return next;}
 function touch(model,itemId){const next=validate(clone(model)),item=next.items.find(x=>x.id===String(itemId));if(item){item.touchedAt=Date.now();item.updatedAt=Date.now();}return next;}
 function pin(model,itemId,on){const next=validate(clone(model)),item=next.items.find(x=>x.id===String(itemId));if(item){item.pinned=!!on;item.updatedAt=Date.now();}return next;}
 function connect(model,from,to){
  const next=validate(clone(model)),a=String(from),b=String(to);if(!a||!b||a===b)throw Error('请选择另一颗思想节点');
  const ids=new Set(next.items.filter(x=>!x.archived).map(x=>x.id));if(!ids.has(a)||!ids.has(b))throw Error('关联节点不存在或已封存');
  const pair=[a,b].sort();if(next.links.some(x=>[x.from,x.to].sort().join('::')===pair.join('::')))return next;
  next.links.push({id:'link_'+pair[0]+'__'+pair[1],from:a,to:b,createdAt:Date.now()});return next;
 }
 function disconnect(model,linkId){const next=validate(clone(model));next.links=next.links.filter(x=>x.id!==String(linkId));return next;}
 function connectedIds(model,itemId){const id=String(itemId),out=new Set();for(const l of validate(model).links){if(l.from===id)out.add(l.to);else if(l.to===id)out.add(l.from);}return [...out];}

 const state={model:null,open:false,selected:null,overviewOpen:false,overviewFilter:'all',overviewQuery:'',raf:0,stars:[],starSeed:9281,starLastTime:0,world:new Map(),clusterAnchors:new Map(),screenLayout:new Map(),yaw:0,pitch:0,zoom:1,targetYaw:0,targetPitch:0,targetZoom:1,vyaw:0,vpitch:0,vzoom:0,pointers:new Map(),gesture:null,nodePress:null,linkDraft:null,suppressClickUntil:0,lastBlankTap:0,editor:null};
 const storage=()=>root.localStorage;
 function ensure(){if(!state.model)state.model=load(storage());return state.model;}
 function store(next){state.model=save(storage(),next);root.NexaShell?.dataChanged?.();return state.model;}
 function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
 function icon(name){const paths={back:'M15 5l-7 7 7 7',plus:'M12 5v14M5 12h14',overview:'M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z',close:'M6 6l12 12M18 6L6 18',search:'M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14Zm5 12l4 4',pin:'M8 4h8l-1 6 3 3H6l3-3-1-6 M12 13v7',edit:'M5 19h4L19 9l-4-4L5 15v4Z',archive:'M4 7h16v13H4Z M3 4h18v4H3 M9 12h6',link:'M9.5 14.5l5-5M7.2 16.8l-1 1a3 3 0 0 1-4.2-4.2l3.4-3.4A3 3 0 0 1 9.6 10M14.4 14a3 3 0 0 0 4.2-.2l3.4-3.4a3 3 0 0 0-4.2-4.2l-1 1'};return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(paths[name]||paths.plus)+'"/></svg>';}
 function ensureDOM(){
  if(!hasDOM()||document.getElementById('nexaMindspace'))return;
  const rootEl=document.createElement('div');rootEl.id='nexaMindspace';rootEl.className='mindspace';rootEl.hidden=true;
  rootEl.innerHTML='<canvas class="mindspace-stars" aria-hidden="true"></canvas><header class="mindspace-head"><button data-mindspace-close aria-label="返回 Timeline">'+icon('back')+'</button><span aria-hidden="true"></span><button data-mindspace-overview aria-label="打开全部思想总览">'+icon('overview')+'</button></header><button class="mindspace-add-fab" data-mindspace-new aria-label="添加长期提醒">'+icon('plus')+'</button><div class="mindspace-scene" id="mindspaceScene" aria-label="可旋转缩放的思想星域"><div class="mindspace-clusters" id="mindspaceClusters"></div><div class="mindspace-nodes" id="mindspaceNodes"></div><div class="mindspace-empty" id="mindspaceEmpty"><strong>把一句长期提醒放进这片空间</strong><p>它不是待办，没有“完成”。只在你需要的时候被重新想起。</p><button data-mindspace-new>写下第一句</button></div></div><section class="mindspace-detail" id="mindspaceDetail" aria-live="polite"></section><div class="mindspace-overview-backdrop" data-mindspace-overview-close></div><aside class="mindspace-overview" id="mindspaceOverview" aria-hidden="true"><header><div><small>ALL THOUGHTS</small><strong>思想总览</strong></div><button data-mindspace-overview-close aria-label="关闭总览">'+icon('close')+'</button></header><div class="mindspace-overview-stats" id="mindspaceOverviewStats"></div><label class="mindspace-overview-search">'+icon('search')+'<input id="mindspaceOverviewSearch" type="search" placeholder="搜索想法、原则或类别" autocomplete="off"></label><nav class="mindspace-overview-filters" aria-label="思想筛选"><button data-mindspace-filter="all" class="active">全部</button><button data-mindspace-filter="pinned">置顶</button><button data-mindspace-filter="recent">最近</button><button data-mindspace-filter="archived">封存</button></nav><div class="mindspace-overview-list" id="mindspaceOverviewList"></div></aside>';
  document.body.append(rootEl);
  const ed=document.createElement('div');ed.id='mindspaceEditorOverlay';ed.className='mindspace-editor-overlay';ed.innerHTML='<section class="mindspace-editor" role="dialog" aria-modal="true" aria-labelledby="mindspaceEditorTitle"><div class="mindspace-editor-grab"></div><header><div><small>LONG-TERM NOTE</small><h2 id="mindspaceEditorTitle"></h2></div><button data-mindspace-editor-close aria-label="关闭">×</button></header><div id="mindspaceEditorBody"></div></section>';document.body.append(ed);
  rootEl.addEventListener('click',onClick);rootEl.addEventListener('input',onInput);ed.addEventListener('click',onClick);ed.addEventListener('focusin',()=>{syncMindspaceImeLayout();setTimeout(keepFocusedFieldVisible,70);});
  bindGestures(rootEl.querySelector('.mindspace-scene'));installMindspaceImeBridge();
 }
 function activeItems(){return ensure().items.filter(x=>!x.archived).sort((a,b)=>(b.pinned-a.pinned)||(b.touchedAt-a.touchedAt));}
 function activeLinks(){const ids=new Set(activeItems().map(x=>x.id));return ensure().links.filter(x=>ids.has(x.from)&&ids.has(x.to));}
 function uniqueCategories(items=activeItems()){return [...new Set(items.map(x=>x.category||'状态'))];}
 function categoryAnchor(category,index,total){
  if(state.clusterAnchors.has(category))return state.clusterAnchors.get(category);
  const hx=hash('x:'+category)>>>0,hy=hash('y:'+category)>>>0,hz=hash('z:'+category)>>>0;
  const nx=((hx%10007)/10006)-.5,ny=((hy%10009)/10008)-.5,nz=((hz%10037)/10036)-.5;
  const p={x:nx*660,y:ny*440,z:nz*360};state.clusterAnchors.set(category,p);return p;
 }
 function shortTitle(value,max=11){const chars=[...String(value||'')];return chars.length>max?chars.slice(0,max).join('')+'…':chars.join('');}
 function importanceScore(item){const linked=Math.min(4,connectionCount(item.id));return clamp(1+(item.pinned?.24:0)+linked*.11,1,1.62);}
 function spawnCandidate(item,index,attempt,cats){
  const anchor=categoryAnchor(item.category,cats.indexOf(item.category),cats.length),hx=hash(item.id+'#x#'+attempt)>>>0,hy=hash(item.id+'#y#'+attempt)>>>0,hz=hash(item.id+'#z#'+attempt)>>>0;
  const rx=((hx%10007)/10006)-.5,ry=((hy%10009)/10008)-.5,rz=((hz%10037)/10036)-.5,blend=.16;
  return {x:clamp(rx*930*(1-blend)+anchor.x*blend,-510,510),y:clamp(ry*650*(1-blend)+anchor.y*blend,-360,360),z:clamp(rz*560*(1-blend)+anchor.z*blend,-330,330),vx:0,vy:0,vz:0};
 }
 function chooseOpenSpawn(item,index,cats,existing){
  let best=null,bestScore=-Infinity;for(let attempt=0;attempt<48;attempt++){const p=spawnCandidate(item,index,attempt,cats),nearest=existing.length?Math.min(...existing.map(q=>Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z))):999,anchor=categoryAnchor(item.category,cats.indexOf(item.category),cats.length),catDist=Math.hypot(p.x-anchor.x,p.y-anchor.y,p.z-anchor.z),edge=Math.max(0,Math.abs(p.x)-455)+Math.max(0,Math.abs(p.y)-320)+Math.max(0,Math.abs(p.z)-295),score=nearest*1.72-Math.max(0,catDist-430)*.09-edge*.34;if(score>bestScore){bestScore=score;best=p;}}return best||spawnCandidate(item,index,0,cats);
 }
 function seedPreview(items){const list=(items||[]).map(normalize).filter(x=>!x.archived),cats=uniqueCategories(list),map=new Map(),existing=[];list.forEach((item,index)=>{const p=chooseOpenSpawn(item,index,cats,existing);map.set(item.id,p);existing.push(p);});return map;}
 function seedWorld(){
  const items=activeItems(),cats=uniqueCategories(items),valid=new Set(items.map(x=>x.id));
  for(const key of [...state.world.keys()])if(!valid.has(key))state.world.delete(key);
  for(const key of [...state.clusterAnchors.keys()])if(!cats.includes(key))state.clusterAnchors.delete(key);
  cats.forEach((cat,i)=>categoryAnchor(cat,i,cats.length));
  const existing=[...state.world.values()];items.forEach((item,index)=>{if(state.world.has(item.id))return;const p=chooseOpenSpawn(item,index,cats,existing);state.world.set(item.id,p);existing.push(p);});
 }
 function simulateGraph(dt){
  const items=activeItems();if(!items.length)return;seedWorld();const cats=uniqueCategories(items);
  for(const item of items){const p=state.world.get(item.id),anchor=categoryAnchor(item.category,cats.indexOf(item.category),cats.length),dx=anchor.x-p.x,dy=anchor.y-p.y,dz=anchor.z-p.z,dist=Math.max(1,Math.hypot(dx,dy,dz));if(dist>390){const force=(dist-390)*.00011*dt;p.vx+=dx/dist*force;p.vy+=dy/dist*force;p.vz+=dz/dist*force;}}
  for(const l of activeLinks()){const a=state.world.get(l.from),b=state.world.get(l.to);if(!a||!b)continue;let dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,dist=Math.max(1,Math.hypot(dx,dy,dz)),force=(dist-245)*.00066*dt,fx=dx/dist*force,fy=dy/dist*force,fz=dz/dist*force;a.vx+=fx;a.vy+=fy;a.vz+=fz;b.vx-=fx;b.vy-=fy;b.vz-=fz;}
  const cap=Math.min(items.length,120);for(let i=0;i<cap;i++){const a=state.world.get(items[i].id);for(let j=i+1;j<cap;j++){const b=state.world.get(items[j].id),dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,d2=dx*dx+dy*dy+dz*dz;if(d2>1&&d2<52900){const d=Math.sqrt(d2),f=(1-d/230)*.092*dt,fx=dx/d*f,fy=dy/d*f,fz=dz/d*f;a.vx-=fx;a.vy-=fy;a.vz-=fz;b.vx+=fx;b.vy+=fy;b.vz+=fz;}}}
  for(const item of items){const p=state.world.get(item.id);if(Math.abs(p.x)>510)p.vx-=Math.sign(p.x)*(Math.abs(p.x)-510)*.005*dt;if(Math.abs(p.y)>360)p.vy-=Math.sign(p.y)*(Math.abs(p.y)-360)*.005*dt;if(Math.abs(p.z)>330)p.vz-=Math.sign(p.z)*(Math.abs(p.z)-330)*.004*dt;const damp=Math.pow(.835,dt);p.vx*=damp;p.vy*=damp;p.vz*=damp;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;}
 }
 function rotate(point){const cy=Math.cos(state.yaw),sy=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);let x=point.x*cy-point.z*sy,z=point.x*sy+point.z*cy,y=point.y;const y2=y*cp-z*sp,z2=y*sp+z*cp;return {x,y:y2,z:z2};}
 function project(point,w,h){const p=rotate(point),camera=680,den=Math.max(220,camera+p.z),s=(camera/den)*state.zoom;return {x:w/2+p.x*s,y:h*.49+p.y*s,scale:s,z:p.z};}
 function connectionCount(id){return ensure().links.reduce((n,l)=>n+(l.from===id||l.to===id?1:0),0);}
 function neighborSet(id){return new Set(connectedIds(ensure(),id));}
 function nodeMarkup(item,index){const weight=importanceScore(item),font=clamp(14.5+(weight-1)*11.5,14.5,21.5);return '<button class="mindspace-node '+(item.pinned?'is-pinned ':'')+'" data-mindspace-node="'+esc(item.id)+'" style="--mind-index:'+index+';--mind-font:'+font.toFixed(2)+'px;--mind-weight:'+weight.toFixed(3)+'" aria-label="'+esc(item.title)+'"><span class="mindspace-node-halo"></span><span class="mindspace-node-mark" aria-hidden="true"><i></i></span><span class="mindspace-node-copy"><strong data-mindspace-node-title>'+esc(shortTitle(item.title,13))+'</strong></span></button>';}
 function clusterMarkup(){return '';}
 function render(){if(!hasDOM())return;ensureDOM();seedWorld();const items=activeItems(),nodes=document.getElementById('mindspaceNodes'),clusters=document.getElementById('mindspaceClusters'),emptyEl=document.getElementById('mindspaceEmpty');nodes.innerHTML=items.map((item,i)=>nodeMarkup(item,i)).join('');clusters.innerHTML='';emptyEl.hidden=!!items.length;renderDetail();renderOverview();layoutNodes(performance.now());}
 function estimateNodeBox(item,pt,lod,selected){const title=lod==='near'?item.title:shortTitle(item.title,lod==='far'?8:13),chars=[...title].length,weight=importanceScore(item),font=clamp(14.5+(weight-1)*11.5,14.5,21.5)*(lod==='far'?.84:lod==='near'?1.06:1),scale=clamp(pt.scale*(selected?1.12:1),.7,1.62),w=clamp(22+chars*font*.58,48,246)*scale,h=(font*1.42+8)*scale;return {w,h};}
 function boxesOverlap(a,b,pad=8){return Math.abs(a.x-b.x)<(a.w+b.w)/2+pad&&Math.abs(a.y-b.y)<(a.h+b.h)/2+pad;}
 function computeScreenLayout(w,h,time){
  const items=activeItems(),now=Number(time)||performance.now(),neighbors=state.selected?neighborSet(state.selected):new Set(),lod=state.zoom<.86?'far':state.zoom>1.5?'near':'mid',layout=[];
  for(let i=0;i<items.length;i++){const item=items[i],base=state.world.get(item.id);if(!base)continue;const float=reduced()?0:Math.sin(now*.00045+i*1.61)*2.8,pt=project({x:base.x,y:base.y+float,z:base.z},w,h),selected=state.selected===item.id,related=neighbors.has(item.id),box=estimateNodeBox(item,pt,lod,selected);layout.push({item,pt,selected,related,x:pt.x,y:pt.y,w:box.w,h:box.h});}
  const margin=16,iterations=items.length>45?4:7;for(let pass=0;pass<iterations;pass++){for(let i=0;i<layout.length;i++){const a=layout[i];for(let j=i+1;j<layout.length;j++){const b=layout[j];if(!boxesOverlap(a,b,7))continue;let dx=b.x-a.x,dy=b.y-a.y;if(Math.abs(dx)<.1&&Math.abs(dy)<.1){const ang=((hash(a.item.id+b.item.id+pass)%628)/100);dx=Math.cos(ang);dy=Math.sin(ang);}const ax=(a.w+b.w)/2+8-Math.abs(dx),ay=(a.h+b.h)/2+8-Math.abs(dy);if(ax<=0||ay<=0)continue;const horizontal=ax<ay,norm=Math.max(1,Math.hypot(dx,dy)),ux=dx/norm,uy=dy/norm,push=Math.min(22,(horizontal?ax:ay)*.56);if(horizontal){a.x-=Math.sign(dx||1)*push;b.x+=Math.sign(dx||1)*push;}else{a.y-=Math.sign(dy||1)*push;b.y+=Math.sign(dy||1)*push;}if(!horizontal&&Math.abs(ux)>.78){a.x-=ux*push*.24;b.x+=ux*push*.24;}if(horizontal&&Math.abs(uy)>.78){a.y-=uy*push*.24;b.y+=uy*push*.24;}}}
    for(const p of layout){const halfW=p.w/2,halfH=p.h/2;p.x=clamp(p.x,margin+halfW,w-margin-halfW);p.y=clamp(p.y,88+halfH,h-84-halfH);}
  }
  state.screenLayout=new Map(layout.map(p=>[p.item.id,p]));return {lod,layout};
 }
 function layoutNodes(time){
  if(!state.open||!hasDOM())return;const scene=document.getElementById('mindspaceScene');if(!scene)return;const r=scene.getBoundingClientRect(),items=activeItems(),screen=computeScreenLayout(r.width,r.height,time),neighbors=state.selected?neighborSet(state.selected):new Set();
  document.getElementById('nexaMindspace')?.setAttribute('data-mindspace-lod',screen.lod);
  for(const entry of screen.layout){const {item,pt,selected,related}=entry,node=scene.querySelector('[data-mindspace-node="'+cssEscape(item.id)+'"]');if(!node)continue;const dim=state.selected&&!selected&&!related,front=clamp(1-(pt.z+420)/920,.18,1),baseScale=clamp(pt.scale,.62,1.38),scale=baseScale*(selected?1.18:related?1.06:1);node.style.transform='translate3d('+entry.x+'px,'+entry.y+'px,0) translate(-6px,-50%) scale('+scale+')';node.style.zIndex=String(Math.round(660-pt.z));node.style.opacity=String(dim?.08:clamp(front+(selected||related?.25:0),.22,1));node.classList.toggle('is-selected',selected);node.classList.toggle('is-related',related);node.classList.toggle('is-pinned',!!item.pinned);node.classList.toggle('is-dimmed',!!dim);const title=node.querySelector('[data-mindspace-node-title]');if(title){const next=screen.lod==='near'?item.title:shortTitle(item.title,screen.lod==='far'?8:13);if(title.textContent!==next)title.textContent=next;}node.style.setProperty('--mind-depth',String(pt.z));if(selected)positionDetail({x:entry.x,y:entry.y,scale:pt.scale,z:pt.z},r.width,r.height);}

 }
 function positionDetail(pt,w,h){const detail=document.getElementById('mindspaceDetail');if(!detail||!detail.classList.contains('active'))return;const width=Math.min(330,w-28),left=clamp(pt.x-width/2,14,w-width-14),top=clamp(pt.y+52,100,h-250);detail.style.width=width+'px';detail.style.left=left+'px';detail.style.top=top+'px';}
 function relatedMarkup(item){const model=ensure(),links=model.links.filter(l=>l.from===item.id||l.to===item.id);if(!links.length)return '<div class="mindspace-related-empty">长按这颗星并拖向另一颗星，可建立思想关联。</div>';return '<div class="mindspace-related-list">'+links.map(l=>{const other=model.items.find(x=>x.id===(l.from===item.id?l.to:l.from));return other?'<span><b>'+esc(other.title)+'</b><button data-mindspace-unlink="'+esc(l.id)+'" aria-label="解除与 '+esc(other.title)+' 的关联">×</button></span>':'';}).join('')+'</div>';}
 function renderDetail(){
  if(!hasDOM())return;const detail=document.getElementById('mindspaceDetail');if(!detail)return;const item=ensure().items.find(x=>x.id===state.selected&&!x.archived);document.getElementById('nexaMindspace')?.classList.toggle('has-selection',!!item);
  if(!item){detail.classList.remove('active');detail.innerHTML='';return;}
  detail.innerHTML='<div class="mindspace-detail-kicker"><span>'+esc(item.category)+'</span>'+(item.pinned?'<b>置顶</b>':'')+'<i>'+connectionCount(item.id)+' 个连接</i></div><h2>'+esc(item.title)+'</h2>'+(item.note?'<p>'+esc(item.note)+'</p>':'<p class="muted">还没有写下为什么要记住它。</p>')+'<div class="mindspace-related">'+relatedMarkup(item)+'</div><div class="mindspace-detail-meta">上次想起 · '+new Date(item.touchedAt).toLocaleDateString('zh-CN',{month:'long',day:'numeric'})+'</div><div class="mindspace-detail-actions"><button data-mindspace-touch="'+esc(item.id)+'">想起</button><button data-mindspace-link-mode="'+esc(item.id)+'">关联</button><button data-mindspace-pin="'+esc(item.id)+'">'+(item.pinned?'取消置顶':'置顶')+'</button><button data-mindspace-edit="'+esc(item.id)+'">编辑</button><button data-mindspace-archive="'+esc(item.id)+'">封存</button></div>';requestAnimationFrame(()=>detail.classList.add('active'));
 }
 function renderOverview(){
  if(!hasDOM())return;const stats=document.getElementById('mindspaceOverviewStats'),list=document.getElementById('mindspaceOverviewList');if(!stats||!list)return;const model=ensure(),active=model.items.filter(x=>!x.archived),cats=new Set(active.map(x=>x.category)),valid=new Set(active.map(x=>x.id)),links=model.links.filter(l=>valid.has(l.from)&&valid.has(l.to));stats.innerHTML='<b>'+active.length+'</b><span>个想法</span><i></i><b>'+cats.size+'</b><span>个星群</span><i></i><b>'+links.length+'</b><span>条关联</span>';
  let rows=state.overviewFilter==='archived'?model.items.filter(x=>x.archived):active.slice();if(state.overviewFilter==='pinned')rows=rows.filter(x=>x.pinned);if(state.overviewFilter==='recent')rows.sort((a,b)=>b.touchedAt-a.touchedAt).splice(24);const q=state.overviewQuery.trim().toLowerCase();if(q)rows=rows.filter(x=>(x.title+' '+x.note+' '+x.category).toLowerCase().includes(q));
  const groups=new Map();for(const item of rows){const key=state.overviewFilter==='archived'?'已封存':item.category||'状态';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}if(!rows.length){list.innerHTML='<div class="mindspace-overview-empty">没有符合条件的内容。</div>';return;}list.innerHTML=[...groups].map(([cat,items])=>'<section><h3>'+esc(cat)+'<span>'+items.length+'</span></h3>'+items.map(item=>'<div class="mindspace-overview-row"><button data-mindspace-overview-item="'+esc(item.id)+'" '+(item.archived?'disabled':'')+'><span><strong>'+esc(item.title)+'</strong><small>'+esc(item.category)+' · '+connectionCount(item.id)+' 个连接</small></span><i>›</i></button>'+(item.archived?'<button class="restore" data-mindspace-restore="'+esc(item.id)+'">恢复</button>':'')+'</div>').join('')+'</section>').join('');
  document.querySelectorAll('.mindspace-overview-filters button').forEach(b=>b.classList.toggle('active',b.dataset.mindspaceFilter===state.overviewFilter));
 }
 function setOverview(open){state.overviewOpen=!!open;const rootEl=document.getElementById('nexaMindspace'),drawer=document.getElementById('mindspaceOverview');if(!rootEl||!drawer)return;rootEl.classList.toggle('overview-open',state.overviewOpen);drawer.setAttribute('aria-hidden',String(!state.overviewOpen));if(state.overviewOpen){renderOverview();}else document.getElementById('mindspaceOverviewSearch')?.blur();}
 function nearestAngle(current,target){while(target-current>Math.PI)target-=TAU;while(target-current<-Math.PI)target+=TAU;return target;}
 function focusNode(itemId,fromOverview=false){seedWorld();const p=state.world.get(String(itemId));if(!p)return;state.selected=String(itemId);const yaw=Math.atan2(p.x,p.z||.0001),radial=Math.max(1,Math.hypot(p.x,p.z)),pitch=Math.atan2(p.y,radial);state.targetYaw=nearestAngle(state.yaw,yaw);state.targetPitch=clamp(pitch,-1.18,1.18);state.targetZoom=Math.max(state.targetZoom,1.28);if(fromOverview)setOverview(false);renderDetail();layoutNodes();}
 function resetCamera(){state.selected=null;state.targetYaw=nearestAngle(state.yaw,0);state.targetPitch=0;state.targetZoom=1;state.vyaw=state.vpitch=state.vzoom=0;renderDetail();}

 // Lunaxy V133 default StarfieldView behavior, ported to a WebView Canvas.
 function starRandom(){state.starSeed=(Math.imul(state.starSeed,1664525)+1013904223)>>>0;return state.starSeed/4294967296;}
 function resetStar(star,z){star.x=(starRandom()*2-1)*1.34;star.y=(starRandom()*2-1)*2.12;if(Math.abs(star.x)<.055)star.x+=star.x<0?-.08:.08;if(Math.abs(star.y)<.055)star.y+=star.y<0?-.08:.08;star.z=z;star.size=.34+starRandom()*.82;star.twinkle=.38+starRandom()*.92;star.phase=starRandom()*TAU;star.speed=.78+starRandom()*.48;star.cool=starRandom()<.18;}
 function seedParticles(){if(state.stars.length)return;state.starSeed=9281;for(let i=0;i<STAR_COUNT;i++){const star={};resetStar(star,NEAR_Z+starRandom()*(FAR_Z-NEAR_Z));state.stars.push(star);}}
 function drawGraph(ctx,w,h){
  const selected=state.selected,neighbors=selected?neighborSet(selected):new Set(),positions=new Map();for(const item of activeItems()){const laid=state.screenLayout.get(item.id);if(laid)positions.set(item.id,{x:laid.x,y:laid.y,z:laid.pt.z,scale:laid.pt.scale});else{const p=state.world.get(item.id);if(p)positions.set(item.id,project(p,w,h));}}
  ctx.lineCap='round';for(const l of activeLinks()){const a=positions.get(l.from),b=positions.get(l.to);if(!a||!b)continue;const hot=selected&&(l.from===selected||l.to===selected),dim=selected&&!hot;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=hot?'rgba(210,196,238,.72)':dim?'rgba(196,207,229,.035)':'rgba(176,190,220,.19)';ctx.lineWidth=hot?1.15:.58;ctx.stroke();if(hot){ctx.beginPath();ctx.fillStyle='rgba(210,187,248,.52)';ctx.arc((a.x+b.x)/2,(a.y+b.y)/2,1.6,0,TAU);ctx.fill();}}
  if(state.linkDraft){const a=positions.get(state.linkDraft.from);if(a){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(state.linkDraft.x,state.linkDraft.y);ctx.setLineDash([5,6]);ctx.strokeStyle='rgba(220,197,255,.88)';ctx.lineWidth=1.25;ctx.stroke();ctx.setLineDash([]);}}
 }
 function drawParticles(time){
  const canvas=document.querySelector('#nexaMindspace .mindspace-stars');if(!canvas)return;const rect=canvas.getBoundingClientRect(),dpr=Math.min(1.5,root.devicePixelRatio||1),w=Math.max(1,rect.width),h=Math.max(1,rect.height);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#030407';ctx.fillRect(0,0,w,h);seedParticles();const now=Number(time)||performance.now(),last=state.starLastTime||now,dt=Math.min(.05,Math.max(.001,(now-last)/1000));state.starLastTime=now;const t=now/1000,focal=Math.min(w,h)*.54,centerX=w*.5+Math.sin(t*.055)*w*.0035,centerY=h*.47+Math.cos(t*.043)*h*.0022,forward=.052,parallaxX=Math.sin(state.yaw)*.72,parallaxY=Math.sin(state.pitch)*.92;
  for(const star of state.stars){if(!reduced())star.z-=forward*star.speed*dt;if(star.z<=NEAR_Z)resetStar(star,FAR_Z);const invZ=1/star.z,depth=clamp((FAR_Z-star.z)/(FAR_Z-NEAR_Z),0,1),px=parallaxX*w*(.018+depth*.158),py=parallaxY*h*(.012+depth*.115),sx=centerX+star.x*focal*invZ+px,sy=centerY+star.y*focal*invZ+py;if(sx<-80||sx>w+80||sy<-80||sy>h+80){resetStar(star,FAR_Z*(.92+starRandom()*.08));continue;}const twinkle=.82+.18*Math.sin(t*star.twinkle+star.phase),alpha=clamp((.32+.68*depth)*twinkle,.18,1),radius=star.size*(.50+depth*1.85);if(depth>.66){ctx.beginPath();ctx.fillStyle='rgba(194,178,242,'+(alpha*.10)+')';ctx.arc(sx,sy,radius*2.6,0,TAU);ctx.fill();}const cool=star.cool,tint=depth*.12,base=cool?[226,235,255]:[250,250,255],accent=[202,181,246],rr=Math.round(base[0]+(accent[0]-base[0])*tint),gg=Math.round(base[1]+(accent[1]-base[1])*tint),bb=Math.round(base[2]+(accent[2]-base[2])*tint);ctx.beginPath();ctx.fillStyle='rgba('+rr+','+gg+','+bb+','+alpha+')';ctx.arc(sx,sy,Math.max(.45,radius),0,TAU);ctx.fill();}
  drawGraph(ctx,w,h);
 }
 function applyPitchPhysics(){const soft=1.16,hard=1.43;if(Math.abs(state.targetPitch)>soft){const sign=Math.sign(state.targetPitch),excess=Math.abs(state.targetPitch)-soft;state.targetPitch-=sign*excess*.105;state.vpitch*=.76;}state.targetPitch=clamp(state.targetPitch,-hard,hard);}
 function frame(time){if(!state.open)return;const now=Number(time)||performance.now(),dt=Math.min(2.2,Math.max(.35,(now-(state._lastFrame||now))/16.67));state._lastFrame=now;if(!state.gesture&&!state.linkDraft){state.targetYaw+=state.vyaw*dt;state.targetPitch+=state.vpitch*dt;state.targetZoom=clamp(state.targetZoom+state.vzoom*dt,.62,2.35);}state.vyaw*=Math.pow(.91,dt);state.vpitch*=Math.pow(.885,dt);state.vzoom*=Math.pow(.84,dt);applyPitchPhysics();state.yaw+=(state.targetYaw-state.yaw)*(reduced()?1:.14);state.pitch+=(state.targetPitch-state.pitch)*(reduced()?1:.14);state.zoom+=(state.targetZoom-state.zoom)*(reduced()?1:.13);simulateGraph(dt);layoutNodes(time);drawParticles(time);state.raf=requestAnimationFrame(frame);}
 function start(){cancelAnimationFrame(state.raf);state.starLastTime=0;state._lastFrame=0;state.raf=requestAnimationFrame(frame);}
 function stop(){cancelAnimationFrame(state.raf);state.raf=0;state.starLastTime=0;state._lastFrame=0;}
 function pointerDistance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
 function pointerCentroid(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
 function clearNodePress(){if(state.nodePress?.timer)clearTimeout(state.nodePress.timer);state.nodePress=null;}
 function clearLinkTarget(){document.querySelectorAll?.('.mindspace-node.is-link-target').forEach(el=>el.classList.remove('is-link-target'));}
 function beginLink(from,x,y){state.linkDraft={from,x,y,to:null};state.gesture='link';state.suppressClickUntil=performance.now()+650;document.getElementById('nexaMindspace')?.classList.add('is-linking');root.showToast?.('拖到另一颗思想星上建立关联');}
 function endLink(){const draft=state.linkDraft;clearLinkTarget();document.getElementById('nexaMindspace')?.classList.remove('is-linking');state.linkDraft=null;state.gesture=null;if(draft?.to&&draft.to!==draft.from){try{store(connect(ensure(),draft.from,draft.to));state.selected=draft.from;render();root.showToast?.('已建立关联');}catch(e){root.showToast?.(e.message||'关联失败');}}}
 function bindGestures(scene){
  if(!scene||scene.dataset.bound)return;scene.dataset.bound='1';scene.style.touchAction='none';
  const updatePointer=e=>{state.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,target:e.target});};
  const startOrbit=(p)=>{state.gesture={type:'orbit',lastX:p.x,lastY:p.y,t:performance.now(),moved:0};state.vyaw=state.vpitch=0;};
  scene.addEventListener('pointerdown',e=>{
   if(e.target.closest?.('.mindspace-detail,.mindspace-head,.mindspace-add-fab,.mindspace-overview'))return;scene.setPointerCapture?.(e.pointerId);updatePointer(e);const pts=[...state.pointers.values()];
   if(pts.length>=2){clearNodePress();const [a,b]=pts;state.gesture={type:'pinch',startDist:pointerDistance(a,b),startZoom:state.targetZoom,lastCentroid:pointerCentroid(a,b)};state.vzoom=0;return;}
   const node=e.target.closest?.('.mindspace-node');if(node){const p=pts[0];state.nodePress={id:node.dataset.mindspaceNode,startX:p.x,startY:p.y,lastX:p.x,lastY:p.y,t:performance.now(),timer:setTimeout(()=>{if(state.nodePress&&state.pointers.size===1)beginLink(state.nodePress.id,state.nodePress.lastX,state.nodePress.lastY);},430)};return;}
   startOrbit(pts[0]);
  });
  scene.addEventListener('pointermove',e=>{
   if(!state.pointers.has(e.pointerId))return;updatePointer(e);const pts=[...state.pointers.values()];
   if(state.linkDraft){const p=state.pointers.get(e.pointerId);state.linkDraft.x=p.x;state.linkDraft.y=p.y;clearLinkTarget();const hit=document.elementFromPoint?.(p.x,p.y)?.closest?.('.mindspace-node'),to=hit?.dataset?.mindspaceNode;if(to&&to!==state.linkDraft.from){state.linkDraft.to=to;hit.classList.add('is-link-target');}else state.linkDraft.to=null;if(e.cancelable)e.preventDefault();return;}
   if(pts.length>=2){clearNodePress();const [a,b]=pts,dist=Math.max(24,pointerDistance(a,b));if(state.gesture?.type!=='pinch')state.gesture={type:'pinch',startDist:dist,startZoom:state.targetZoom,lastCentroid:pointerCentroid(a,b)};const ratio=dist/Math.max(24,state.gesture.startDist);state.targetZoom=clamp(state.gesture.startZoom*ratio,.62,2.35);state.zoom+=(state.targetZoom-state.zoom)*.32;if(e.cancelable)e.preventDefault();return;}
   const p=pts[0];if(!p)return;
   if(state.nodePress){state.nodePress.lastX=p.x;state.nodePress.lastY=p.y;const moved=Math.hypot(p.x-state.nodePress.startX,p.y-state.nodePress.startY);if(moved>9){const seed={x:state.nodePress.startX,y:state.nodePress.startY};clearNodePress();startOrbit(seed);}}
   if(state.gesture?.type==='orbit'){const now=performance.now(),dx=p.x-state.gesture.lastX,dy=p.y-state.gesture.lastY,dt=Math.max(8,now-state.gesture.t),soft=1.16,abs=Math.abs(state.targetPitch),resist=abs<=soft?1:clamp(1-(abs-soft)/.34,.18,1);state.targetYaw+=dx*.0049;state.targetPitch+=dy*.0041*resist;state.vyaw=dx/dt*.0115;state.vpitch=dy/dt*.0092*resist;state.gesture.lastX=p.x;state.gesture.lastY=p.y;state.gesture.t=now;state.gesture.moved+=Math.abs(dx)+Math.abs(dy);applyPitchPhysics();if(e.cancelable)e.preventDefault();}
  },{passive:false});
  const finish=e=>{
   const had=state.pointers.has(e.pointerId),p=state.pointers.get(e.pointerId);if(had)state.pointers.delete(e.pointerId);
   if(state.linkDraft){endLink();clearNodePress();return;}
   if(state.pointers.size===1){const left=[...state.pointers.values()][0];startOrbit(left);return;}
   if(state.pointers.size===0){const gesture=state.gesture,nodePress=state.nodePress;state.gesture=null;clearNodePress();if(nodePress&&p&&Math.hypot(p.x-nodePress.startX,p.y-nodePress.startY)<7)return;if(gesture?.type==='orbit'&&gesture.moved<10&&p&&!document.elementFromPoint?.(p.x,p.y)?.closest?.('.mindspace-node')){const now=performance.now();if(now-state.lastBlankTap<310){resetCamera();state.lastBlankTap=0;root.showToast?.('已回到思想星图全景');}else{state.lastBlankTap=now;if(state.selected){state.selected=null;renderDetail();}}}}
  };
  scene.addEventListener('pointerup',finish);scene.addEventListener('pointercancel',finish);
 }
 function open(){if(!hasDOM())return;ensureDOM();state.open=true;state.selected=null;state.overviewOpen=false;const el=document.getElementById('nexaMindspace');el.hidden=false;document.body.classList.add('nexa-mindspace-open');render();requestAnimationFrame(()=>el.classList.add('active'));start();}
 function close(){if(!hasDOM()||!state.open)return;state.open=false;state.selected=null;setOverview(false);stop();const el=document.getElementById('nexaMindspace');el.classList.remove('active');document.body.classList.remove('nexa-mindspace-open');setTimeout(()=>{if(!state.open)el.hidden=true;},300);}

 // Keyboard-aware Mindspace editor ---------------------------------------------
 let mindImeBaseHeight=0,mindNativeImeKnown=false,mindNativeImeSpace=0,mindVisualImeSpace=0;
 function mindEditorOpen(){const o=hasDOM()&&document.getElementById('mindspaceEditorOverlay');return !!(o&&o.classList.contains('active'));}
 function measureVisualImeSpace(){const vv=root.visualViewport;if(!vv)return null;let layout=Math.max(mindImeBaseHeight||0,root.innerHeight||0,document.documentElement?.clientHeight||0);if(!mindImeBaseHeight||vv.height>=layout-40)mindImeBaseHeight=Math.max(root.innerHeight||0,document.documentElement?.clientHeight||0,vv.height||0);layout=Math.max(mindImeBaseHeight||0,root.innerHeight||0,document.documentElement?.clientHeight||0);const diff=Math.max(0,Math.round(layout-vv.height));return diff>=80?diff:0;}
 function keepFocusedFieldVisible(){if(!mindEditorOpen())return;const o=document.getElementById('mindspaceEditorOverlay'),sheet=o?.querySelector('.mindspace-editor'),active=document.activeElement;if(!sheet||!active||!sheet.contains(active))return;requestAnimationFrame(()=>{const sr=sheet.getBoundingClientRect(),ar=active.getBoundingClientRect(),pad=18;if(ar.bottom>sr.bottom-pad)sheet.scrollTop+=ar.bottom-(sr.bottom-pad);else if(ar.top<sr.top+pad)sheet.scrollTop-=sr.top+pad-ar.top;});}
 function applyMindspaceImeSpace(next){const o=hasDOM()&&document.getElementById('mindspaceEditorOverlay');if(!o)return;next=Math.max(0,Math.round(Number(next)||0));if(next<80)next=0;const applied=mindEditorOpen()?next:0,layout=Math.max(root.innerHeight||0,document.documentElement?.clientHeight||0,mindImeBaseHeight||0);o.style.setProperty('--mindspace-ime-space',applied+'px');o.style.setProperty('--mindspace-available-height',Math.max(210,layout-applied-18)+'px');o.classList.toggle('mindspace-ime-visible',applied>0);if(applied>0)keepFocusedFieldVisible();}
 function syncMindspaceImeLayout(){const visual=measureVisualImeSpace();mindVisualImeSpace=visual===null?0:visual;applyMindspaceImeSpace(mindNativeImeKnown?mindNativeImeSpace:mindVisualImeSpace);}
 root.__onMindspaceNativeImeInset=function(insetPx,visible){mindNativeImeKnown=true;const ratio=Math.max(1,Number(root.devicePixelRatio)||1),next=visible?((Number(insetPx)||0)/ratio):0;mindNativeImeSpace=next>=80?next:0;applyMindspaceImeSpace(mindNativeImeSpace);};
 function installMindspaceImeBridge(){if(!hasDOM())return;if(!root.__nexaMindspaceImeAdapterInstalled){const previous=root.__onNativeImeInset;root.__onNativeImeInset=function(insetPx,visible){if(typeof previous==='function')previous.call(root,insetPx,visible);root.__onMindspaceNativeImeInset?.(insetPx,visible);};root.__nexaMindspaceImeAdapterInstalled=true;}if(root.visualViewport&&!root.__nexaMindspaceViewportInstalled){root.visualViewport.addEventListener('resize',syncMindspaceImeLayout);root.visualViewport.addEventListener('scroll',syncMindspaceImeLayout);root.__nexaMindspaceViewportInstalled=true;}if(!root.__nexaMindspaceResizeInstalled){root.addEventListener?.('resize',()=>{if(!root.visualViewport)syncMindspaceImeLayout();});root.__nexaMindspaceResizeInstalled=true;}}
 function openEditor(itemId){ensureDOM();const item=ensure().items.find(x=>x.id===String(itemId))||normalize({id:uid(),title:'',category:'状态'});state.editor={id:item.id,new:!ensure().items.some(x=>x.id===item.id)};const o=document.getElementById('mindspaceEditorOverlay');document.getElementById('mindspaceEditorTitle').textContent=state.editor.new?'写下一句长期提醒':'编辑这颗星';document.getElementById('mindspaceEditorBody').innerHTML='<label class="mindspace-field">一句话<input id="mindspaceTitle" maxlength="80" value="'+esc(item.title)+'" placeholder="例如：少想多做"></label><label class="mindspace-field">类别<input id="mindspaceCategory" maxlength="24" value="'+esc(item.category)+'" placeholder="学习 / 工作 / 生活 / 状态"></label><label class="mindspace-field">为什么要记住它<textarea id="mindspaceNote" maxlength="1000" rows="5" placeholder="记录这句话背后的经验、触发条件或提醒">'+esc(item.note)+'</textarea></label><label class="mindspace-pin-row"><input id="mindspacePinned" type="checkbox" '+(item.pinned?'checked':'')+'><span>在星图中显示得更醒目</span></label><button class="mindspace-editor-save" data-mindspace-editor-save>放进 Mindspace</button>';mindImeBaseHeight=Math.max(root.innerHeight||0,document.documentElement?.clientHeight||0);o.style.display='flex';requestAnimationFrame(()=>{o.classList.add('active');const sheet=o.querySelector('.mindspace-editor');if(root.NexaMotion?.presentSheet)root.NexaMotion.presentSheet(sheet,{duration:480});syncMindspaceImeLayout();});setTimeout(()=>{document.getElementById('mindspaceTitle')?.focus();syncMindspaceImeLayout();},80);}
 function closeEditor(){const o=hasDOM()&&document.getElementById('mindspaceEditorOverlay');if(!o)return;o.classList.remove('active');state.editor=null;applyMindspaceImeSpace(0);setTimeout(()=>{if(!o.classList.contains('active'))o.style.display='none';},220);}
 function cancelLink(){if(!state.linkDraft&&!document.getElementById('nexaMindspace')?.classList.contains('is-linking'))return false;clearLinkTarget();document.getElementById('nexaMindspace')?.classList.remove('is-linking');state.linkDraft=null;state.gesture=null;clearNodePress();return true;}
 function back(){
  if(!state.open)return 'none';
  if(mindEditorOpen()){closeEditor();return 'editor';}
  if(cancelLink())return 'link';
  if(state.overviewOpen){setOverview(false);return 'overview';}
  if(state.selected){state.selected=null;renderDetail();layoutNodes(performance.now());return 'detail';}
  return 'none';
 }
 function saveEditor(){if(!state.editor)return;try{const old=ensure().items.find(x=>x.id===state.editor.id),item=normalize({...old,id:state.editor.id,title:document.getElementById('mindspaceTitle').value,category:document.getElementById('mindspaceCategory').value,note:document.getElementById('mindspaceNote').value,pinned:document.getElementById('mindspacePinned').checked,createdAt:old?.createdAt||Date.now(),touchedAt:old?.touchedAt||Date.now(),updatedAt:Date.now()});store(upsert(ensure(),item));state.world.delete(item.id);state.selected=item.id;closeEditor();render();focusNode(item.id);root.showToast?.('已放进 Mindspace');}catch(e){root.showToast?.(e.message||'保存失败');}}
 function onInput(e){if(e.target?.id==='mindspaceOverviewSearch'){state.overviewQuery=e.target.value||'';renderOverview();}}
 function onClick(e){
  if(performance.now()<state.suppressClickUntil&&e.target.closest?.('.mindspace-node')){e.preventDefault();return;}
  const backdrop=e.target.closest?.('[data-mindspace-overview-close]');if(backdrop&&!e.target.closest?.('button')){setOverview(false);return;}
  const b=e.target.closest?.('button');if(!b)return;
  if(b.hasAttribute('data-mindspace-close')){if(back()==='none')close();return;}if(b.hasAttribute('data-mindspace-new')){openEditor();return;}if(b.hasAttribute('data-mindspace-overview')){setOverview(true);return;}if(b.hasAttribute('data-mindspace-overview-close')){setOverview(false);return;}
  if(b.dataset.mindspaceFilter){state.overviewFilter=b.dataset.mindspaceFilter;renderOverview();return;}if(b.dataset.mindspaceOverviewItem){focusNode(b.dataset.mindspaceOverviewItem,true);return;}if(b.dataset.mindspaceRestore){store(archive(ensure(),b.dataset.mindspaceRestore,false));render();renderOverview();root.showToast?.('已恢复到星域');return;}
  if(b.dataset.mindspaceNode){focusNode(b.dataset.mindspaceNode);return;}if(b.dataset.mindspaceTouch){store(touch(ensure(),b.dataset.mindspaceTouch));focusNode(b.dataset.mindspaceTouch);renderOverview();return;}if(b.dataset.mindspacePin){const item=ensure().items.find(x=>x.id===b.dataset.mindspacePin);if(item)store(pin(ensure(),item.id,!item.pinned));state.world.delete(b.dataset.mindspacePin);state.selected=b.dataset.mindspacePin;render();focusNode(b.dataset.mindspacePin);return;}if(b.dataset.mindspaceEdit){openEditor(b.dataset.mindspaceEdit);return;}if(b.dataset.mindspaceArchive){store(archive(ensure(),b.dataset.mindspaceArchive,true));state.world.delete(b.dataset.mindspaceArchive);state.selected=null;render();root.showToast?.('已封存');return;}if(b.dataset.mindspaceUnlink){store(disconnect(ensure(),b.dataset.mindspaceUnlink));render();root.showToast?.('已解除关联');return;}if(b.dataset.mindspaceLinkMode){const node=document.querySelector('[data-mindspace-node="'+cssEscape(b.dataset.mindspaceLinkMode)+'"]');if(node){const r=node.getBoundingClientRect();beginLink(b.dataset.mindspaceLinkMode,r.left+r.width/2,r.top+r.height/2);}return;}
  if(b.hasAttribute('data-mindspace-editor-close')){closeEditor();return;}if(b.hasAttribute('data-mindspace-editor-save')){saveEditor();return;}
 }
 function isOpen(){return state.open;}
 if(hasDOM())ensureDOM();
 return {KEY,VERSION,empty,validate,load,save,upsert,archive,touch,pin,connect,disconnect,connectedIds,open,close,back,isOpen,render,openEditor,focusNode,resetCamera,shortTitle,seedPreview,get model(){return ensure();}};
});
