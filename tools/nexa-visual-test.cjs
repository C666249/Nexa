const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'dev-logs','phase3-screenshots');fs.mkdirSync(output,{recursive:true});
const allowed=['todo.html','nexa.css','nexa-core.js','nexa-shell.js','nexa-space.js','nexa-toolbar.js','nexa-workspace.js','nexa-backup.js','nexa-restore.js','marked.umd.js'];
const server=http.createServer((req,res)=>{
  const name=(req.url||'').split('?')[0].slice(1);
  if(!allowed.includes(name)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');
  res.end(fs.readFileSync(path.join(root,'ui',name)));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
    await context.route('https://**',route=>route.abort());
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      localStorage.setItem('todo_glass_onboarding_v1','skipped');
      if(localStorage.getItem('nexa_test_seeded'))return;
      const now=Date.now();
      localStorage.setItem('todo_glass_data',JSON.stringify([
        {id:101,text:'完成产品文档草稿',status:'in-progress',createdAt:now,category:'工作',checklistExpanded:true,checklist:[{id:1,text:'确定文档结构',done:true},{id:2,text:'收集并整理需求资料',done:true},{id:3,text:'撰写核心章节',done:false}]},
        {id:102,text:'阅读《深度工作》',status:'todo',createdAt:now-1000,category:'学习'},
        {id:103,text:'整理设计资源',status:'completed',createdAt:now-2000,category:'工作'}]));
      localStorage.setItem('todo_glass_note_schema_version','2');
      localStorage.setItem('todo_glass_note_topics_v2',JSON.stringify([{id:201,title:'工作',parentTopicId:null,createdAt:now,updatedAt:now},{id:202,title:'产品',parentTopicId:201,createdAt:now,updatedAt:now}]));
      localStorage.setItem('todo_glass_note_docs_v2',JSON.stringify([{id:301,title:'Nexa 设计思考',topicId:202,createdAt:now,updatedAt:now,content:'<p>Nexa 的设计目标，是在功能完备的基础上，为用户保留一片安静与专注的空间。</p><p>我们相信，好的工具应当克制、轻盈、可靠，陪伴你专注于真正重要的事情。</p><p>设计，<i>不只是视觉的表达</i>，更是对注意力的尊重。</p>'},{id:302,title:'用户访谈要点',topicId:201,content:'<p>用清晰的层级整理待办与想法。</p>',createdAt:now,updatedAt:now-1000}]));
      localStorage.setItem('todo_glass_daily_tasks_v1',JSON.stringify([{id:401,text:'阅读半小时',hour:21,minute:0,createdAt:now-86400000*20,completedDates:[]}]));
      localStorage.setItem('nexa_test_seeded','1');
    });
    await page.goto('http://127.0.0.1:'+server.address().port+'/todo.html');
    await page.waitForSelector('#nexaNav');
    assert.equal(await page.locator('body').getAttribute('data-nexa-page'),'home');
    for(const route of ['home','todo','notes','daily','space']){
      await page.locator('#nexaNav [data-nexa-route="'+route+'"]').click();
      await page.waitForTimeout(350);
      assert.equal(await page.locator('body').getAttribute('data-nexa-page'),route);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'page overflows: '+route);
      await page.screenshot({path:path.join(output,route+'.png')});
    }
    await page.locator('#nexaNav [data-nexa-route="home"]').click();
    const unchangedNote=await page.locator('#nexaHome [data-nexa-note="301"]').elementHandle();
    await page.evaluate(()=>{todos.find(t=>t.id===102).status='completed';persistTodosWithoutRender();});
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.nexa-progress strong').innerText(),'50%','home updates after persistence without reopening');
    assert.equal(await unchangedNote.evaluate(el=>el===document.querySelector('#nexaHome [data-nexa-note="301"]')),true,'unchanged home sections keep their nodes');
    await page.screenshot({path:path.join(output,'home-full.png'),fullPage:true});
    await page.locator('[data-nexa-action="schedule"]').click();
    await page.waitForTimeout(400);
    await page.locator('#nexaSchedule [data-nexa-daily="401"]').click();
    assert.equal(await page.evaluate(()=>NexaShell.page),'daily');
    await page.locator('#nexaNav [data-nexa-route="home"]').click();
    await page.locator('#nexaHome [data-nexa-todo="102"]').click();
    assert.equal(await page.evaluate(()=>NexaShell.page),'todo');
    assert.equal(await page.locator('.todo-item[data-id="102"]').isVisible(),true);
    await page.locator('#nexaNav [data-nexa-route="notes"]').click();
    await page.locator('[data-note-open-id="301"]').click();
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#noteEditor').isVisible(),true);
    await page.screenshot({path:path.join(output,'note-reading.png')});
    await page.evaluate(()=>{enterNoteEditMode();document.getElementById('noteEditorBody').innerHTML+='<p>保存回归验证</p>';});
    await page.evaluate(()=>NexaShell.navigate('home'));
    assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('todo_glass_note_docs_v2')).find(n=>n.id===301).content.includes('保存回归验证')));
    // Scoped Note search Back must remain in the selected workspace.
    await page.evaluate(()=>{NexaShell.navigate('notes');noteHomeView='tree';renderNoteList();});
    await page.locator('#search-input').fill('设计');await page.waitForTimeout(350);
    assert.equal(await page.evaluate(()=>handleBackPress()),'note-search');
    assert.equal(await page.evaluate(()=>NexaShell.page),'notes');
    assert.equal(await page.evaluate(()=>noteHomeView),'tree');
    // Reset any contextual layers before checking root Back.
    await page.evaluate(()=>{closeContextCoach(false);navigateNoteRoot();});
    assert.equal(await page.evaluate(()=>handleBackPress()),'nexa-home');
    assert.equal(await page.evaluate(()=>handleBackPress()),'none');
    await page.evaluate(()=>NexaShell.navigate('daily'));
    const list=await page.locator('[data-daily-id="401"]').elementHandle();
    await page.locator('[data-daily-check="401"]').click();
    assert.equal(await list.evaluate(el=>el===document.querySelector('[data-daily-id="401"]')),true);
    assert.equal(await page.evaluate(()=>dailyTasks.find(t=>t.id===401).completedDates.includes(dailyDateKey())),true);
    await page.locator('#dailyAddBtn').click();
    await page.locator('#dailyEditorName').fill('每日事项创建验证');
    await page.evaluate(()=>saveDailyEditor());
    assert.equal(await page.locator('.daily-item__text').filter({hasText:'每日事项创建验证'}).count(),1);
    await page.evaluate(()=>{openDailyEditor(401);document.getElementById('dailyEditorName').value='阅读四十分钟';saveDailyEditor();});
    assert.equal(await page.locator('.daily-item__text').filter({hasText:'阅读四十分钟'}).count(),1);
    await page.evaluate(()=>deleteDailyTask(401));await page.locator('#confirmOk').click();
    assert.equal(await page.locator('[data-daily-id="401"]').count(),0);
    await page.evaluate(()=>NexaShell.navigate('todo'));
    const checklist=await page.locator('.todo-item[data-id="101"]').elementHandle();
    const child=await page.locator('.todo-item[data-id="101"] .todo-subitem').first().elementHandle();
    await page.locator('.todo-item[data-id="101"] .todo-checklist-toggle').click();
    await page.waitForTimeout(320);
    assert.equal(await checklist.evaluate(el=>el===document.querySelector('.todo-item[data-id="101"]')),true);
    assert.equal(await child.evaluate(el=>el.isConnected),true,'collapse must keep children in DOM');
    await page.locator('.todo-item[data-id="101"] .todo-checklist-toggle').click();
    await page.waitForTimeout(320);
    assert.equal(await child.evaluate(el=>el===document.querySelector('.todo-item[data-id="101"] .todo-subitem')),true);
    await page.locator('#fab').click();
    await page.locator('#todoCreateTitle').fill('新增任务回归验证');
    await page.locator('#todoCreateSubmit').click();
    assert.equal(await page.locator('.todo-item__text').filter({hasText:'新增任务回归验证'}).count(),1);
    await page.reload();await page.waitForSelector('#nexaNav');
    assert.ok(await page.evaluate(()=>todos.some(t=>t.text==='新增任务回归验证')),'created task survives restart');
    assert.ok(await page.evaluate(()=>getNoteById(301).content.includes('保存回归验证')),'edited note survives restart');
    for(const width of [320,360,430]){
      await page.setViewportSize({width,height:844});
      for(const route of ['home','todo','notes','daily','space']){
        await page.evaluate(r=>NexaShell.navigate(r),route);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'overflow '+width+' '+route);
      }
    }
    assert.deepEqual(errors,[]);
    // Separate clean profile: no fake seed data or old onboarding over the new home.
    const clean=await browser.newContext({viewport:{width:390,height:844}});
    await clean.route('https://**',route=>route.abort());
    const empty=await clean.newPage();await empty.goto('http://127.0.0.1:'+server.address().port+'/todo.html');
    await empty.waitForSelector('#nexaNav');await empty.waitForTimeout(750);
    assert.equal(await empty.evaluate(()=>todos.length),0);
    assert.equal(await empty.locator('#onboardingWelcome').isVisible(),false);
    await empty.screenshot({path:path.join(output,'home-empty.png')});
    await empty.locator('[data-nexa-action="add-note"]').click();
    await empty.waitForTimeout(150);
    assert.equal(await empty.locator('#noteEditor').isVisible(),true);
    assert.equal(await empty.evaluate(()=>noteEditorMode),'edit');
    await empty.locator('#noteEditorTitle').fill('首页快速笔记');
    await empty.evaluate(()=>{document.getElementById('noteEditorBody').innerHTML='<p>测试保存</p>';closeNoteEditor();NexaShell.navigate('home');});
    assert.equal(await empty.locator('#nexaHome [data-nexa-note]').count(),1);
    await clean.close();
    console.log('PASS: Dashboard live statistics, retained nodes, schedule/task navigation, quick note; routes, four widths, note save/restart, search Back, Daily CRUD/checklist DOM, task create/restart and clean install; no JS errors.');
    await context.close();
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
