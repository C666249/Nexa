const{chromium}=require('playwright');const a=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const server=http.createServer((req,res)=>{let name=req.url.split('?')[0].slice(1)||'todo.html';if(name.includes('..')){res.writeHead(403);return res.end();}const file=path.join(__dirname,'../ui',name);if(!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const out=path.join(__dirname,'../dev-logs/rc3');fs.mkdirSync(out,{recursive:true});
 try{for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:820}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.evaluate(()=>{NexaShell.navigate('notes');const n=createNote('手势验收',null);openNoteEditor(n.id,{enterEdit:true});});
  await page.locator('#nexaFormatMore').click();
  async function caret(){await page.evaluate(()=>{const body=document.getElementById('noteEditorBody');body.innerHTML='<p>已经输入的中文</p>';body.focus();const r=document.createRange();r.selectNodeContents(body.firstChild);r.collapse(false);getSelection().removeAllRanges();getSelection().addRange(r);rememberNoteSelection();_highlightActive=false;highlightColor=highlightColors[0];syncCollapsedNoteTypingFormat();updateToolbarState();});}
  async function hold(){const h=page.locator('[data-cmd="hiliteColor"]');await h.scrollIntoViewIfNeeded();const r=await h.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.waitForTimeout(280);await page.waitForSelector('#nexaHighlightGesture.open');return r;}
  await caret();const before=await page.locator('#noteEditorBody').innerHTML(),r=await hold();
  const sw=await page.locator('.nexa-highlight-swatch').nth(4).boundingBox();await page.mouse.move(sw.x+sw.width/2,r.y+r.height/2);
  a.equal(await page.locator('#noteEditorBody').innerHTML(),before);a.equal(await page.evaluate(()=>highlightColor),'#ffd93d');
  a.equal(await page.locator('[data-cmd="hiliteColor"]').evaluate(el=>el.classList.contains('nexa-highlight-preview')),true);
  await page.screenshot({path:path.join(out,`H-preview-${width}.png`)});await page.mouse.up();
  a.equal(await page.evaluate(()=>highlightColor),'#2EC4B6');a.equal(await page.evaluate(()=>_highlightActive),true);
  await page.evaluate(()=>document.execCommand('insertText',false,'新的高亮文字'));
  a.ok((await page.locator('#noteEditorBody').innerHTML()).includes('已经输入的中文'));a.equal(await page.evaluate(()=>{const b=document.getElementById('noteEditorBody');return [...b.querySelectorAll('span')].some(el=>el.textContent==='新的高亮文字'&&el.style.backgroundColor==='rgb(46, 196, 182)');}),true);
  await caret();await hold();const raw=await page.locator('#noteEditorBody').innerHTML();a.equal(await page.evaluate(()=>handleBackPress()),'note-highlight-gesture');await page.mouse.up();a.equal(await page.locator('#noteEditorBody').innerHTML(),raw);a.equal(await page.evaluate(()=>_highlightActive),false);
  // Selected text is recolored only on release, without enabling future typing.
  await caret();await page.evaluate(()=>{const t=document.getElementById('noteEditorBody').firstChild.firstChild,r=document.createRange();r.setStart(t,0);r.setEnd(t,2);getSelection().removeAllRanges();getSelection().addRange(r);rememberNoteSelection();});
  const sr=await hold(),pink=await page.locator('.nexa-highlight-swatch').nth(2).boundingBox();await page.mouse.move(pink.x+pink.width/2,sr.y+sr.height/2);await page.mouse.up();
  a.equal(await page.evaluate(()=>_highlightActive),false);a.equal(await page.evaluate(()=>[...document.getElementById('noteEditorBody').querySelectorAll('span')].some(el=>el.textContent==='已经'&&el.style.backgroundColor==='rgb(255, 135, 135)')),true);
  // Existing T horizontal mapping and future-text-only command remain intact.
  await caret();const title=page.locator('#noteTitleBtn');await title.scrollIntoViewIfNeeded();const tr=await title.boundingBox();await page.mouse.move(tr.x+tr.width/2,tr.y+tr.height/2);await page.mouse.down();await page.waitForTimeout(250);
  a.equal(await page.locator('.note-title-gesture__rail').count(),0);const g=await page.evaluate(()=>({step:noteTitleGesture.step,direction:noteTitleGesture.direction}));
  await page.mouse.move(tr.x+tr.width/2+g.step*2*g.direction,tr.y+tr.height/2);await page.screenshot({path:path.join(out,`T-preview-${width}.png`)});await page.mouse.up();
  a.equal(await page.evaluate(()=>_noteTitleActive),'T3');await page.evaluate(()=>document.execCommand('insertText',false,'新标题'));
  a.equal(await page.evaluate(()=>document.getElementById('noteEditorBody').querySelector('font')?.textContent),'新标题');a.deepEqual(errors,[]);await page.close();
 }console.log('PASS H preview/release/caret-only/selection/cancel and T3 future-only at 320/390px; no browser errors');}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
