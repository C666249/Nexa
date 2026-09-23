const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync(__dirname + '/../ui/todo.html', 'utf8');
const start = html.indexOf('(function bindNoteReadEditShell(){');
const end = html.indexOf('})();', start) + 5;
assert(start >= 0 && end > start, 'bindNoteReadEditShell block missing');
const block = html.slice(start, end);

class FakeEl {
  constructor(id){ this.id=id; this.handlers={}; this.scrollTop=0; this.readOnly=true; }
  addEventListener(type, fn){ (this.handlers[type] ||= []).push(fn); }
  dispatch(type, e={}){ for(const fn of (this.handlers[type]||[])) fn(e); }
}
const body = new FakeEl('noteEditorBody');
const title = new FakeEl('noteEditorTitle');
let noteEditorMode = 'read';
let enterCalls = [];
let setCalls = [];
const context = {
  document: { getElementById(id){ return id==='noteEditorBody'?body:id==='noteEditorTitle'?title:null; } },
  noteEditorMode,
  isNoteReadInteractionTarget(t){ return !!(t && t.isIsland); },
  setNoteEditorMode(mode){ context.noteEditorMode=mode; setCalls.push(mode); },
  enterNoteEditMode(opts){ context.noteEditorMode='edit'; enterCalls.push(opts); },
  Math,
};
vm.createContext(context);
vm.runInContext(block, context);

function ev(pointerId,x,y,target={}){
  return {pointerId,pointerType:'touch',isPrimary:true,clientX:x,clientY:y,target,prevented:false,preventDefault(){this.prevented=true;}};
}

// 1) Real scroll/drag must stay Read.
let d=ev(1,120,500); body.dispatch('pointerdown',d); assert(d.prevented,'read pointerdown should suppress premature contenteditable focus');
body.dispatch('pointermove',ev(1,120,455));
body.scrollTop=48; body.dispatch('scroll',{});
body.dispatch('pointerup',ev(1,120,455));
assert.strictEqual(context.noteEditorMode,'read');
assert.strictEqual(enterCalls.length,0,'scroll must not enter edit');

// 2) Even movement without scrollTop change is a drag.
body.scrollTop=0; body.dispatch('pointerdown',ev(2,80,300));
body.dispatch('pointermove',ev(2,95,300));
body.dispatch('pointerup',ev(2,95,300));
assert.strictEqual(context.noteEditorMode,'read');
assert.strictEqual(enterCalls.length,0,'drag beyond slop must not enter edit');

// 3) Native pointercancel (browser takes over pan) must stay Read.
body.dispatch('pointerdown',ev(3,90,340));
body.dispatch('pointercancel',ev(3,90,320));
body.dispatch('pointerup',ev(3,90,320));
assert.strictEqual(context.noteEditorMode,'read');
assert.strictEqual(enterCalls.length,0,'pointercancel must not enter edit');

// 4) A true tap enters edit once at the release coordinates.
body.dispatch('pointerdown',ev(4,130,360));
let u=ev(4,133,363); body.dispatch('pointerup',u);
assert(u.prevented,'confirmed tap should own the final default action');
assert.strictEqual(context.noteEditorMode,'edit');
assert.strictEqual(enterCalls.length,1);
assert.deepStrictEqual(JSON.parse(JSON.stringify(enterCalls[0])),{x:133,y:363});

// Reset to read for interaction-island test.
context.noteEditorMode='read';
body.dispatch('pointerdown',ev(5,100,220,{isIsland:true}));
body.dispatch('pointerup',ev(5,100,220,{isIsland:true}));
assert.strictEqual(enterCalls.length,1,'image/file/link/timestamp island must not enter text edit');

console.log('PASS note-read-tap-gate-v1.3.3');
