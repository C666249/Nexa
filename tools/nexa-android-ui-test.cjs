const {_android}=require('playwright');const a=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const device=(await _android.devices()).find(d=>d.serial()==='emulator-5554');if(!device)throw Error('Dedicated emulator not found');let page;
 try{await device.shell('am start -n com.nexa.app/.MainActivity');page=await (await device.webView({pkg:'com.nexa.app'})).page();await page.reload();await page.waitForSelector('#nexaNav');}catch(e){await device.close();throw e;}
 const out=path.resolve(__dirname,'../dev-logs/rc1-android');fs.mkdirSync(out,{recursive:true});
 try{
  const state=await page.evaluate(()=>({url:location.href,todos:todos.length,notes:notes.length,daily:dailyTasks.length}));a.equal(state.url,'file:///android_asset/todo.html');
  // Test data only on dedicated emulator; never point this harness at a user's phone.
  await page.evaluate(()=>{NexaShell.navigate('todo');openTodoCreateComposer();});
  await page.locator('#todoCreateTitle').fill('Android 验收任务');await page.locator('#todoCreateSubmit').click();
  await page.locator('.todo-item').filter({hasText:'Android 验收任务'}).first().locator('[data-nx-tag]').click();a.equal(await page.locator('#nexaDialog').isVisible(),true);
  a.equal(await page.evaluate(()=>handleBackPress()),'nexa-dialog');
  await page.evaluate(()=>{NexaShell.navigate('space');});await page.waitForTimeout(100);
  await page.locator('[data-nx-new]').click();await page.locator('#nexaLabelName').fill('共同项目');await page.locator('#nexaLabelSave').click();
  await page.locator('#nexaLibraryResults [data-nx-tag]').first().click();await page.locator('#nexaDialog input[type=checkbox]').last().check();await page.locator('#nexaTagsSave').click();
  await page.locator('[data-nx-select]').filter({hasText:'共同项目'}).last().click();a.ok((await page.locator('#nexaLibraryResults').innerText()).includes('Android 验收任务'));
  await page.evaluate(()=>{NexaShell.navigate('notes');const n=createNote('Android 富文本验收',null);openNoteEditor(n.id,{enterEdit:true});});await page.waitForTimeout(300);
  await page.evaluate(()=>{const b=document.getElementById('noteEditorBody');b.innerHTML='<p>原有中文</p>';const r=document.createRange();r.selectNodeContents(b.firstChild);r.collapse(false);getSelection().removeAllRanges();getSelection().addRange(r);b.focus();});
  await page.locator('#nexaFormatMore').click();a.equal(await page.locator('#noteTitleBtn').isVisible(),true);a.equal(await page.locator('#noteAddFileBtn').isVisible(),true);
  await page.screenshot({path:path.join(out,'note-tools.png')});
  const rect=await page.locator('#noteTitleBtn').boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.waitForTimeout(240);
  a.equal(await page.locator('#noteTitleGesture').isVisible(),true);const gesture=await page.evaluate(()=>({step:noteTitleGesture.step,direction:noteTitleGesture.direction}));
  await page.mouse.move(rect.x+rect.width/2+gesture.step*2*gesture.direction,rect.y+rect.height/2);await page.mouse.up();
  a.equal(await page.evaluate(()=>_noteTitleActive),'T3');
  await page.evaluate(()=>document.execCommand('insertText',false,'新标题文字'));
  a.equal(await page.evaluate(()=>document.getElementById('noteEditorBody').querySelector('font')?.textContent),'新标题文字');
  a.ok(await page.evaluate(()=>document.getElementById('noteEditorBody').textContent.startsWith('原有中文')));
  a.equal(await page.evaluate(()=>handleBackPress()),'nexa-tools');a.equal(await page.locator('#noteTitleBtn').isVisible(),false);
  await page.locator('#nexaFavorite').click();a.equal(await page.locator('#nexaFavorite').getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{closeNoteEditor();NexaShell.navigate('space');});await page.waitForTimeout(100);await page.locator('[data-nx-all]').click();await page.locator('[data-nx-favorites]').click();a.ok((await page.locator('#nexaLibraryResults').innerText()).includes('Android 富文本验收'));
  await page.evaluate(()=>NexaShell.navigate('daily'));await page.screenshot({path:path.join(out,'daily.png')});
  await page.locator('[data-nexa-day]').first().click();a.equal(await page.locator('#nexaDateRecords').isVisible(),true);await page.evaluate(()=>closeDailyHistory());
  await page.evaluate(()=>NexaShell.navigate('home'));await page.screenshot({path:path.join(out,'home.png')});
  for(const route of ['home','todo','notes','space']){await page.evaluate(()=>NexaShell.navigate('daily'));await page.evaluate(r=>NexaShell.navigate(r),route);const frames=await page.evaluate(async()=>{const values=[];for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);values.push(getComputedStyle(document.getElementById('dailyDrawerOverlay')).display);}return values;});a.ok(frames.every(v=>v==='none'));}
  const originalTitle=await page.locator('#noteTitleBtn').elementHandle();await page.locator('[data-nx-toolbar]').click();await page.locator('[data-order-pin="title"]').click();await page.locator('#nexaToolbarSave').click();
  a.equal(await originalTitle.evaluate(el=>el===document.getElementById('noteTitleBtn')&&el.parentElement.classList.contains('nexa-format-primary')),true);
  await page.locator('[data-nx-toolbar]').click();await page.locator('#nexaToolbarReset').click();await page.locator('#nexaToolbarSave').click();
  console.log('PASS: Android actual WebView task creation, shared tags, global filtering, compact toolbar/more/back, favorite, Daily date details.');
  console.log('PASS: horizontal T3 future-input-only, RC2 four-route Daily exit frames, custom toolbar original button identity and reset.');
 }finally{await device.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
