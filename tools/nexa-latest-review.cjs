const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),a=require('node:assert/strict');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dev-logs/rc2-screenshots');fs.mkdirSync(out,{recursive:true});
const allowed=fs.readdirSync(path.join(root,'ui')).filter(f=>/^(todo\.html|nexa-[\w-]+\.js|nexa\.css|marked\.umd\.js)$/.test(f));
const server=http.createServer((req,res)=>{const name=req.url.slice(1);if(!allowed.includes(name)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(fs.readFileSync(path.join(root,'ui',name)));});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/todo.html');await page.waitForSelector('#nexaNav');
 await page.evaluate(()=>{todos=[{id:771,text:'昨天留下的待办',createdAt:Date.now()-86400000,status:'todo',category:'工作'}];saveTodos();dailyTasks=[{id:772,text:'记录今天的灵感',hour:21,minute:30,createdAt:Date.now()-86400000,completedDates:[]}];saveDailyTasks();});await page.waitForTimeout(100);
 a.ok((await page.locator('.nexa-metrics [data-nexa-route="todo"]').innerText()).includes('1'));
 // Route switch sampling: old drawer must be absent, not animating out over the new page.
 for(const next of ['home','todo','notes','space']){
  await page.evaluate(()=>NexaShell.navigate('daily'));await page.evaluate(r=>NexaShell.navigate(r),next);
  const frames=await page.evaluate(async()=>{const results=[];for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);results.push(getComputedStyle(document.getElementById('dailyDrawerOverlay')).display);}return results;});a.ok(frames.every(v=>v==='none'),'Daily outgoing drawer leaked: '+frames);
 }
 await page.evaluate(()=>NexaShell.navigate('daily'));a.equal(await page.locator('.daily-item__calendar svg').count(),1);a.equal(await page.locator('.daily-item__calendar').evaluate(el=>getComputedStyle(el).filter),'none');
 await page.locator('[data-nexa-day]').first().click();a.equal(await page.locator('.daily-history-day.selected .daily-history-day__num').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
 await page.screenshot({path:path.join(out,'daily-selected.png')});await page.evaluate(()=>closeDailyHistory());
 await page.evaluate(()=>NexaShell.navigate('space'));await page.locator('[data-nx-toolbar]').click();await page.locator('[data-order-pin="title"]').click();await page.locator('[data-order-up="title"]').click();await page.locator('#nexaToolbarSave').click();
 a.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('nexa_toolbar_v1')).slice(0,4)),['bold','italic','title','checklist']);
 await page.reload();await page.waitForSelector('#nexaNav');await page.evaluate(()=>{NexaShell.navigate('notes');const n=createNote('自定义工具栏',null);openNoteEditor(n.id,{enterEdit:true});});await page.waitForTimeout(100);
 a.equal(await page.locator('.nexa-format-primary #noteTitleBtn').count(),1);a.equal(await page.locator('.nexa-format-primary>button').count(),5);a.equal(await page.locator('#noteFormatBar button').count(),14);
 await page.screenshot({path:path.join(out,'custom-toolbar.png')});
 await page.evaluate(()=>{closeNoteEditor();NexaShell.navigate('space');});await page.locator('[data-nx-toolbar]').click();await page.locator('#nexaToolbarReset').click();await page.locator('#nexaToolbarSave').click();
 for(const width of [320,360,390,430]){await page.setViewportSize({width,height:844});for(const route of ['home','todo','notes','daily','space']){await page.evaluate(r=>NexaShell.navigate(r),route);a.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' '+width);if(width===390)await page.screenshot({path:path.join(out,route+'.png')});}}
 a.deepEqual(errors,[]);console.log('PASS: yesterday backlog, 12-frame Daily exits to four routes, vector calendar, number-only selected dates, custom toolbar order/persist/restart/reset, four widths and no JS errors.');
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
