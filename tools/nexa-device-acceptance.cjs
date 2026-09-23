// Run only against the read-only emulator, never an attached personal phone.
const { _android }=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const d=(await _android.devices()).find(x=>x.serial()==='emulator-5554');assert.ok(d,'isolated emulator required');
 try{
  await d.shell('am start -n com.nexa.app.beta/com.nexa.app.MainActivity');
  const page=await(await d.webView({pkg:'com.nexa.app.beta'})).page(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.waitForSelector('#nexaNav');
  await page.evaluate(()=>{
   if(todos.some(t=>t.id<910000||t.id>920000)||notes.some(n=>n.id<910000||n.id>920000))throw Error('Refuse to overwrite non-fixture data');
   localStorage.setItem('todo_glass_onboarding_v1','skipped');
   const now=Date.now();todos=[{id:910001,text:'设备验收清单',createdAt:now,status:'todo',category:'工作',checklist:[{id:910011,text:'子任务一',done:false},{id:910012,text:'子任务二',done:false}],checklistExpanded:false},{id:910002,text:'设备验收普通任务',createdAt:now-1,status:'todo',category:'工作'}];saveTodos();
   notes=[{id:910003,title:'设备验收笔记',content:'<p>保留的正文</p>',topicId:null,createdAt:now,updatedAt:now}];noteTopics=[];saveNotes();
   dailyTasks=[{id:910004,text:'设备验收 Daily',hour:9,minute:0,createdAt:now,completedDates:[]}];saveDailyTasks();
  });await page.reload();await page.waitForSelector('#nexaNav');
  const session=await page.context().newCDPSession(page);
  const tap=async selector=>{const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();const r=await el.boundingBox();assert.ok(r);const p={x:r.x+r.width/2,y:r.y+r.height/2};await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);};
  const route=async name=>{await tap('#nexaNav [data-nexa-route="'+name+'"]');await page.waitForFunction(r=>NexaShell.page===r,name);};
  const swipe=async(selector,distance)=>{
   const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();await page.waitForTimeout(350);const r=await el.boundingBox();assert.ok(r);
   const x=distance<0?r.x+r.width-32:r.x+32,y=r.y+Math.min(r.height/2,35);
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=8;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+distance*i/8,y}]});await page.waitForTimeout(16);}
   const armed=await el.evaluate(e=>e.closest('.todo-item,.note-swipe-row,.daily-item')?.getAttribute('data-swipe-action'));
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});return armed;
  };
  for(let i=0;i<6;i++)for(const r of ['todo','notes','daily','space','home'])await route(r);
  console.log('PASS Android: 30 real-touch route switches');
  await route('todo');await tap('.todo-checklist-toggle');await page.waitForFunction(()=>document.querySelector('.todo-checklist-toggle').getAttribute('aria-expanded')==='true');await page.waitForTimeout(400);await tap('.todo-subcheck');await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>todos[0].checklist[0].done),true);await tap('.todo-checklist-toggle');
  for(const [r,selector,overlay] of [['todo','.todo-item__text','#reminderPickerOverlay'],['daily','.daily-item__text','#dailyEditorOverlay'],['notes','.note-recent-card','#noteSwipeTopicOverlay']]){
   await route(r);await swipe(selector,-90);await page.waitForSelector(overlay+'.active');
   await d.shell('input keyevent 4');await page.waitForTimeout(200);
   // Daily's focused IME may consume first Back; the second closes its sheet.
   if(await page.locator(overlay).evaluate(el=>el.classList.contains('active')))await d.shell('input keyevent 4');
   await page.waitForFunction(id=>!document.querySelector(id).classList.contains('active'),overlay);assert.equal(await page.evaluate(()=>NexaShell.page),r);
   console.log('PASS Android secondary action and system Back: '+r);
  }
  await route('todo');await swipe('.todo-item__text',-220);await page.waitForSelector('#toast-undo');assert.equal(await page.evaluate(()=>todos.length),1);await tap('#toast-undo');await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>todos.length),2);
  await route('notes');await swipe('.note-recent-card',120);await page.waitForSelector('#folderSidebar.folder-sidebar--open');await d.shell('input keyevent 4');await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>NexaShell.page),'notes');
  await tap('.note-recent-card');await page.waitForTimeout(500);assert.equal(await page.locator('#noteEditorBody').innerText(),'保留的正文');await d.shell('input keyevent 4');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>NexaShell.page),'notes');
  await d.shell('input keyevent 3');await d.shell('am start -n com.nexa.app.beta/com.nexa.app.MainActivity');await page.waitForTimeout(450);await route('daily');await route('home');
  const out=path.join(__dirname,'../dev-logs/1.0.8-screenshots');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'android-home.png')});
  assert.deepEqual(errors,[]);console.log('PASS Android: Checklist, swipe delete/Undo, Note right Drawer, reading/Back, background/resume, no JS errors');
 }finally{await d.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
