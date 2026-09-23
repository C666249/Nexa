/* H pointer gesture; selection/IME/undo remain owned by the existing editor. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.NexaHighlight=api;api.mount();}})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 function indexAt(x,left,width,count){return Math.max(0,Math.min(count-1,Math.floor((x-left)/width*count)));}
 let state=null,button=null,ignoreClickUntil=0;
 const names=['暖黄','珊瑚红','柔粉','紫藤','薄荷绿','湖蓝','杏橙','樱粉'];
 function sync(){
  if(!button)return;
  const preview=state?.open&&state.index>=0?highlightColors[state.index]:highlightColor;
  button.style.setProperty('--nexa-highlight',preview);
  button.classList.toggle('nexa-highlight-on',!!_highlightActive);
  button.classList.toggle('nexa-highlight-preview',!!state?.open&&state.index>=0);
  button.setAttribute('aria-pressed',String(!!_highlightActive));
  button.setAttribute('aria-label','文字高亮，长按横向滑动选色；当前'+(names[highlightColors.indexOf(highlightColor)]||'颜色'));
 }
 function update(index){
  if(!state?.open)return;
  if(state.index!==index&&index>=0)performNoteTitleHaptic();
  state.index=index;
  state.overlay.querySelectorAll('.nexa-highlight-swatch').forEach((el,i)=>el.classList.toggle('active',i===index));
  state.hint.textContent=index<0?'松开取消':'松开使用 · '+names[index];
  state.overlay.classList.toggle('cancelled',index<0);sync();
 }
 function open(){
  if(!state||state.open||!isNoteEditorVisible())return;
  const r=button.getBoundingClientRect(),view=window.visualViewport;
  const width=Math.min(360,(view?.width||innerWidth)-24),left=(view?.offsetLeft||0)+((view?.width||innerWidth)-width)/2;
  const top=Math.max((view?.offsetTop||0)+34,r.top-76);
  const overlay=document.createElement('div');overlay.id='nexaHighlightGesture';overlay.className='nexa-highlight-palette';
  overlay.style.cssText=`left:${left}px;top:${top}px;width:${width}px`;overlay.setAttribute('aria-hidden','true');
  const hint=document.createElement('div');hint.className='nexa-highlight-hint';overlay.append(hint);
  const row=document.createElement('div');row.className='nexa-highlight-colors';
  highlightColors.forEach((color,i)=>{const swatch=document.createElement('span');swatch.className='nexa-highlight-swatch';swatch.dataset.index=i;swatch.style.setProperty('--swatch',color);row.append(swatch);});
  overlay.append(row);document.body.append(overlay);
  Object.assign(state,{open:true,overlay,hint,left:left+8,width:width-16});
  update(Math.max(0,highlightColors.indexOf(highlightColor)));performNoteTitleHaptic();
  requestAnimationFrame(()=>{if(overlay.isConnected)overlay.classList.add('open');});
 }
 function move(e){
  if(!state||e.pointerId!==state.pointerId)return;
  e.preventDefault();state.x=e.clientX;state.y=e.clientY;
  if(!state.open){if(Math.hypot(e.clientX-state.startX,e.clientY-state.startY)>12)cancel();return;}
  if(Math.abs(e.clientY-state.startY)>86)update(-1);
  else if(Math.abs(e.clientX-state.startX)>6)update(indexAt(e.clientX,state.left,state.width,highlightColors.length));
 }
 function close(commit){
  const previous=state;if(!previous)return;clearTimeout(previous.timer);state=null;
  if(previous.overlay){previous.overlay.classList.remove('open');setTimeout(()=>previous.overlay.remove(),150);}
  if(commit&&previous.index>=0&&isNoteEditorVisible()&&String(currentNoteId)===previous.noteId){
   noteLastSelectionRange=previous.range;
   const body=focusNoteBodyPreserveSelection(),range=getNoteEditorSelectionRange();
   if(body&&range){
    highlightColor=highlightColors[previous.index];
    if(range.collapsed){_highlightActive=true;syncCollapsedNoteTypingFormat();}
    else document.execCommand('backColor',false,highlightColor);
    rememberNoteSelection();saveCurrentNote();updateToolbarState();
   }
  }
  sync();
 }
 function cancel(){close(false);}
 function mount(){
  button=document.querySelector('#noteFormatBar [data-cmd="hiliteColor"]');if(!button)return;
  button.title='文字高亮 · 长按横向滑动选色';sync();
  button.addEventListener('pointerdown',e=>{
   if(e.button!=null&&e.button!==0)return;e.preventDefault();e.stopPropagation();cancel();
   rememberNoteSelection();
   state={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,range:noteLastSelectionRange?.cloneRange()||null,noteId:String(currentNoteId),open:false,index:-1};
   try{button.setPointerCapture(e.pointerId);}catch(_){}
   state.timer=setTimeout(open,240);
  });
  button.addEventListener('pointermove',move);
  button.addEventListener('pointerup',e=>{
   if(!state||state.pointerId!==e.pointerId)return;e.preventDefault();e.stopPropagation();
   const wasOpen=state.open,short=!wasOpen&&Math.hypot(e.clientX-state.startX,e.clientY-state.startY)<=12;
   if(wasOpen)move(e);close(wasOpen);ignoreClickUntil=performance.now()+800;
   if(short){toggleHighlight();saveCurrentNote();sync();}
   try{button.releasePointerCapture(e.pointerId);}catch(_){}
  });
  button.addEventListener('pointercancel',()=>{ignoreClickUntil=performance.now()+800;cancel();});
  button.addEventListener('lostpointercapture',cancel);
  button.addEventListener('contextmenu',e=>e.preventDefault());
  button.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(e.detail===0&&performance.now()>ignoreClickUntil){toggleHighlight();saveCurrentNote();sync();}},true);
  window.addEventListener('blur',cancel);window.addEventListener('resize',cancel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
 }
 return {indexAt,mount,sync,cancel,get active(){return !!state;}};
});
