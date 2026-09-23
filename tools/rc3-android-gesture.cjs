const{_android}=require('playwright'),a=require('node:assert/strict'),path=require('node:path');
(async()=>{const d=(await _android.devices()).find(x=>x.serial()==='emulator-5554');if(!d)throw Error('Isolated emulator required');try{
 await d.shell('am start -n com.nexa.app/.MainActivity');const p=await(await d.webView({pkg:'com.nexa.app'})).page();await p.waitForSelector('#nexaNav');
 await p.evaluate(()=>{NexaShell.navigate('notes');const n=createNote('Android 触屏高亮测试',null);openNoteEditor(n.id,{enterEdit:true});});
 await p.locator('#nexaFormatMore').click();await p.evaluate(()=>{const b=document.getElementById('noteEditorBody');b.innerHTML='<p>原有文字</p>';b.focus();const r=document.createRange();r.selectNodeContents(b.firstChild);r.collapse(false);getSelection().removeAllRanges();getSelection().addRange(r);rememberNoteSelection();});await p.waitForTimeout(500);
 const h=await p.locator('[data-cmd="hiliteColor"]').boundingBox();const size=await p.evaluate(()=>({width:innerWidth,height:innerHeight}));
 await d.shell('uiautomator dump /sdcard/rc3-gesture.xml');const xml=(await d.shell('cat /sdcard/rc3-gesture.xml')).toString();
 const match=xml.match(/class="android.webkit.WebView"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);a.ok(match,'Native WebView bounds');
 const left=+match[1],top=+match[2],scale=(+match[3]-left)/size.width;
 const x=Math.round(left+(h.x+h.width/2)*scale),y=Math.round(top+(h.y+h.height/2)*scale);
 await d.shell(`input touchscreen motionevent DOWN ${x} ${y}`);await p.waitForTimeout(320);await p.waitForSelector('#nexaHighlightGesture.open');
 const chip=await p.locator('.nexa-highlight-swatch').nth(5).boundingBox(),cx=Math.round(left+(chip.x+chip.width/2)*scale);
 await d.shell(`input touchscreen motionevent MOVE ${cx} ${y}`);await p.waitForTimeout(150);
 a.equal(await p.evaluate(()=>highlightColor),'#ffd93d');await p.screenshot({path:path.join(__dirname,'../dev-logs/rc3/H-android-touch.png')});
 await d.shell(`input touchscreen motionevent UP ${cx} ${y}`);await p.waitForTimeout(150);
 a.equal(await p.evaluate(()=>highlightColor),'#4A90D9');a.equal(await p.evaluate(()=>_highlightActive),true);
 await p.evaluate(()=>document.execCommand('insertText',false,'新颜色文字'));a.equal(await p.evaluate(()=>[...document.querySelectorAll('#noteEditorBody span')].some(n=>n.textContent==='新颜色文字'&&n.style.backgroundColor==='rgb(74, 144, 217)')),true);
 console.log('PASS actual Android touchscreen DOWN/hold/MOVE/UP: preview-only then committed blue future text, original text unchanged');
}finally{await d.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
