const{_android}=require('playwright');const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'../dev-logs/rc3');
(async()=>{const d=(await _android.devices()).find(d=>d.serial()==='emulator-5554');if(!d)throw Error('Isolated emulator required');
 try{const mode=process.argv[2],pkg=mode==='export'?'com.todolist.app':'com.nexa.app';await d.shell(`am start -n ${pkg}/.MainActivity`);const p=await(await d.webView({pkg})).page();await p.waitForSelector('#modeToggle',{state:'attached'});
  if(mode==='export'){
   await p.evaluate(()=>{
    // Fixture data on dedicated read-only emulator ONLY; never a user's phone.
    const now=Date.now();todos=[{id:101,text:'双端任务验证',status:'todo',category:'迁移测试',createdAt:now,checklist:[{id:102,text:'子任务',done:true},{id:103,text:'未完成子任务',done:false}]}];saveTodos();
    noteTopics=[{id:-4294967296,title:'旧版负数目录',parentTopicId:null,summary:'原始目录说明',createdAt:now,updatedAt:now}];
    notes=[{id:-123,title:'旧版负数笔记',topicId:-4294967296,content:'<p>中文 <b>加粗</b> <i>斜体</i></p><img src="https://note.local/image/migration-fixture.png" data-note-image-name="migration-fixture.png"><div data-note-file-name="migration-fixture.txt">中文附件</div>',createdAt:now,updatedAt:now}];saveNotes();
    dailyTasks=[{id:104,text:'每日事项迁移',hour:20,minute:30,createdAt:now,completedDates:['2026-09-05']}];saveDailyTasks();
    localStorage.setItem('todo_glass_history',JSON.stringify(['搜索保留']));
   });
   fs.writeFileSync(path.join(out,'export-web.json'),JSON.stringify(await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))));
   await p.locator('#backupExportBtn').click();await p.locator('#confirmOk').click();console.log('Export picker opened');
  }else if(mode==='reset-fixture'){
   // This package was installed by this test on this read-only emulator; reset only our exact fixture.
   a.deepEqual(await p.evaluate(()=>todos.map(t=>t.id)),[101]);a.deepEqual(await p.evaluate(()=>notes.map(n=>n.id)),[-123]);
   console.log(await d.shell('pm clear com.nexa.app'));
  }else if(mode==='import'){
   a.equal(await p.evaluate(()=>NexaBackup.populated(localStorage)),false);
   await p.evaluate(()=>NexaShell.navigate('space'));await p.locator('[data-nx-migration]').click();await p.locator('[data-nx-backup="import"]').click();console.log('Import picker opened');
  }else if(mode==='old-failure'){
   const message=await p.evaluate(()=>window.nexaRestoreMessage);a.match(message,/标识无效或重复/);a.ok(await p.evaluate(()=>!!AndroidBridge.pendingNexaBackup()));console.log('REPRODUCED original RC2: rejects valid negative IDs and retains stage');
  }else if(mode==='verify'){
   await p.waitForFunction(()=>!!window.nexaRestoreMessage);
   a.match(await p.evaluate(()=>window.nexaRestoreMessage),/完整恢复成功/);
   a.equal(await p.evaluate(()=>AndroidBridge.pendingNexaBackup()),'');
   const before=JSON.parse(fs.readFileSync(path.join(out,'export-web.json'),'utf8'));
   const after=await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
   for(const key of ['todo_glass_data','todo_glass_note_topics_v2','todo_glass_note_docs_v2','todo_glass_daily_tasks_v1','todo_glass_history'])a.deepEqual(JSON.parse(after[key]),JSON.parse(before[key]),key);
   a.deepEqual(await p.evaluate(()=>NexaWorkspace.model.assignments['note:-123']),['topic:-4294967296']);
   await p.locator('[data-nx-close]').click();await p.evaluate(()=>{NexaShell.navigate('notes');openNoteEditor(-123);});
   a.equal(await p.locator('#noteEditorBody img').evaluate(el=>el.complete&&el.naturalWidth>0),true);
   await p.screenshot({path:path.join(out,'restored-negative-note.png')});console.log('PASS actual old failed stage → new APK resume: tasks/checklist, negative Note/Topic IDs, HTML, Daily/history, shared tags and rendered image');
  }
 }finally{await d.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
