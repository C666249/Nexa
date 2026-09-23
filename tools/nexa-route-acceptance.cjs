// Real Chromium hit-testing: no programmatic navigate() shortcuts for route acceptance.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),ui=path.join(root,'ui');
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0].slice(1));if(!fs.readdirSync(ui).includes(name)){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(fs.readFileSync(path.join(ui,name)));});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{for(const count of [100,300,500]){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(n=>{const now=Date.now();localStorage.setItem('todo_glass_onboarding_v1','done');localStorage.setItem('todo_glass_data',JSON.stringify(Array.from({length:n},(_,i)=>({id:1000+i,text:'验收任务 '+i,createdAt:now-i,status:'todo',category:'工作'}))));localStorage.setItem('todo_glass_note_schema_version','2');localStorage.setItem('todo_glass_note_topics_v2','[]');localStorage.setItem('todo_glass_note_docs_v2',JSON.stringify(Array.from({length:n},(_,i)=>({id:2000+i,title:'验收笔记 '+i,content:'<p>正文 '+i+'</p>',createdAt:now,updatedAt:now-i,topicId:null}))));localStorage.setItem('todo_glass_daily_tasks_v1',JSON.stringify([{id:3001,text:'每日验收',hour:9,minute:0,createdAt:now,completedDates:[]}]))},count);
  await page.goto('http://127.0.0.1:'+server.address().port+'/todo.html');await page.waitForSelector('#nexaNav');
  await page.addLocatorHandler(page.locator('#contextCoach.active'),async()=>{await page.locator('#contextCoachOk').tap();});
  const route=async name=>{await page.locator('#nexaNav [data-nexa-route="'+name+'"]').tap();assert.deepEqual(errors,[],'navigation JS errors');assert.equal(await page.evaluate(()=>NexaShell.page),name);};
  await route('todo');await route('notes');await route('daily');await route('home');
  await page.evaluate(()=>{window.retained={todo:document.querySelector('.todo-item'),note:document.querySelector('.note-recent-card'),daily:document.querySelector('.daily-item')};window.changes={todo:0,note:0,daily:0};for(const [key,id] of [['todo','todo-list'],['note','noteList'],['daily','dailyList']])new MutationObserver(e=>{changes[key]+=e.filter(x=>x.type==='childList'&&x.target.id===id).length}).observe(document.getElementById(id),{childList:true});});
  for(let cycle=0;cycle<10;cycle++)for(const name of ['todo','notes','daily','space','home']){
   await route(name);
   assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('dailyDrawerOverlay')).display),name==='daily'?'block':'none');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  assert.deepEqual(await page.evaluate(()=>changes),{todo:0,note:0,daily:0},'unchanged routes must retain list DOM');
  assert.ok(await page.evaluate(()=>Object.values(retained).every(el=>el?.isConnected)),'original cards remain attached');
  await page.evaluate(()=>{window.homeCards=[...document.querySelectorAll('#nexaHome [data-nexa-stack]')];NexaShell.renderHome();});
  assert.ok(await page.evaluate(()=>homeCards.length===3&&homeCards.every(x=>x.isConnected)),'Home animation nodes survive unchanged refresh');
  await route('todo');await page.evaluate(()=>window.scrollTo(0,1200));await page.waitForTimeout(400);
  const scroll=await page.evaluate(()=>window.scrollY);await route('daily');await route('todo');await page.waitForTimeout(400);
  assert.ok(Math.abs((await page.evaluate(()=>window.scrollY))-scroll)<3,'Todo scroll restored');
  assert.equal(await page.locator('#todo-list').evaluate(x=>getComputedStyle(x).animationName),'none');
  assert.equal(await page.locator('#noteContainer').evaluate(x=>getComputedStyle(x).animationName),'none');
  await page.emulateMedia({reducedMotion:'reduce'});for(const name of ['notes','daily','space','home'])await route(name);await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{todos[0].text='更新后的任务';saveTodos();updateNote(notes[0].id,{title:'更新后的笔记'});dailyTasks[0].text='更新后的每日事项';saveDailyTasks();});
  for(const [name,selector,text] of [['todo','.todo-item','更新后的任务'],['notes','.note-recent-card','更新后的笔记'],['daily','.daily-item','更新后的每日事项']]){await route(name);assert.ok((await page.locator(selector).first().innerText()).includes(text),'dirty '+name+' refreshed');}
  await route('home');await page.locator('.nexa-metrics [data-nexa-route="todo"]').tap();assert.equal(await page.evaluate(()=>NexaShell.page),'todo');
  assert.deepEqual(errors,[]);console.log('PASS '+count+' records: 10 real-touch navigation cycles, retained nodes, data invalidation, Home shortcut, no page errors');await page.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
