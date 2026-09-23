// AI Assistant IME docking regression for Tree Beta V1.3.1 / Stable V1.26.1.
// Run from project root: node tests/ai-ime-dock-v1.3.1.test.js
const fs=require('fs');
const src=fs.readFileSync('ui/todo.html','utf8');
const start=src.indexOf('// ===== Keyboard-aware AI sheet =====');
const end=src.indexOf('// ===== AI Config =====', start);
if(start<0||end<0) throw new Error('AI IME block not found');
if(src.includes("content.style.transform = diff > 100 ? 'translateY(-' + diff + 'px)' : ''")) throw new Error('legacy visualViewport-only transform still present');
if(!src.includes('installAiImeInsetAdapter')) throw new Error('native IME adapter missing');
const code=src.slice(start,end);
const style={vals:{},setProperty(k,v){this.vals[k]=v;}};
const classes=new Set(['active']);
const modal={style,classList:{contains:x=>classes.has(x),toggle(x,on){if(on)classes.add(x);else classes.delete(x);},remove:x=>classes.delete(x)}};
const input={listeners:{},addEventListener(k,fn){this.listeners[k]=fn;}};
const msgs={scrollTop:0,scrollHeight:777};
const vv={height:900,offsetTop:0,listeners:{},addEventListener(k,fn){this.listeners[k]=fn;}};
global.window={innerHeight:900,devicePixelRatio:3,visualViewport:vv,listeners:{},addEventListener(k,fn){this.listeners[k]=fn;}};
global.document={documentElement:{clientHeight:900},activeElement:input,getElementById(id){return id==='aiChatModal'?modal:id==='aiChatInput'?input:id==='aiChatMessages'?msgs:null;}};
global.requestAnimationFrame=fn=>{fn();return 1;};
eval(code);
function assert(c,m){if(!c)throw new Error(m);}
window.__onAiNativeImeInset(900,true);
assert(style.vals['--ai-ime-space']==='300px','native physical->CSS conversion failed');
assert(style.vals['--ai-available-height']==='592px','visible height cap failed');
assert(classes.has('ai-ime-visible'),'IME-visible state missing');
assert(msgs.scrollTop===777,'latest messages not kept visible');
vv.height=600; window.__onAiNativeImeInset(0,false); syncAiImeLayout();
assert(style.vals['--ai-ime-space']==='0px','native zero must remain authoritative over stale visualViewport');
aiNativeImeKnown=false; aiImeBaseHeight=900; vv.height=600; syncAiImeLayout();
assert(style.vals['--ai-ime-space']==='300px','visualViewport fallback failed before native source is known');
classes.delete('active'); window.__onAiNativeImeInset(900,true);
assert(style.vals['--ai-ime-space']==='0px','inactive AI sheet must not move for another screen IME');
console.log('AI Assistant IME docking regression: PASS');
