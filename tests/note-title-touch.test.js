const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync(__dirname + '/../ui/todo.html', 'utf8');
const mainActivity = fs.readFileSync(__dirname + '/../android/app/src/main/java/com/nexa/app/MainActivity.kt', 'utf8');

function extractFunction(name) {
  const start = html.indexOf('function ' + name + '(');
  assert(start >= 0, name + ' function missing');
  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = bodyStart; i < html.length; i += 1) {
    const ch = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error(name + ' function is incomplete');
}

function extractTitleBinding() {
  const start = html.indexOf("var titleBtn=document.getElementById('noteTitleBtn');");
  const end = html.indexOf('// Format bar button clicks', start);
  assert(start >= 0 && end > start, 'title binding block missing');
  return html.slice(start, end);
}

// Gesture C must use one pointer state machine, not competing click/touch/long-press handlers.
const binding = extractTitleBinding();
assert(/pointerdown/.test(binding), 'title gesture must start on pointerdown');
assert(/pointermove/.test(binding), 'title gesture must track horizontal movement');
assert(/pointerup/.test(binding), 'title gesture must commit on pointerup');
assert(/setPointerCapture/.test(binding), 'gesture must retain ownership outside the tiny toolbar button');
assert(!/addEventListener\('touch/.test(binding), 'legacy touch/click race must be removed');
assert(/NOTE_TITLE_HOLD_MS/.test(binding), 'hold threshold must be explicit and testable');
assert(/openNoteTitleGesture/.test(binding), 'hold/horizontal drag must reveal the level rail');
assert(/toggleNoteTitleTyping/.test(binding), 'short tap must toggle the last-used title level');
assert(/NOTE_TITLE_CANCEL_Y_PX/.test(binding), 'vertical drift must have an explicit cancellation boundary');
assert(!/NOTE_TITLE_CANCEL_X_PX/.test(binding), 'the old horizontal-cancellation rule must be removed');

const dragLevel = extractFunction('noteTitleLevelFromHorizontalDrag');
{
  const context = { Math };
  vm.createContext(context);
  vm.runInContext(dragLevel, context);
  assert.strictEqual(context.noteTitleLevelFromHorizontalDrag(100, 100, 44, 1), 1, 'the origin is T1');
  assert.strictEqual(context.noteTitleLevelFromHorizontalDrag(100, 144, 44, 1), 2, 'one rightward slot selects T2');
  assert.strictEqual(context.noteTitleLevelFromHorizontalDrag(100, 320, 44, 1), 6, 'a long rightward slide reaches T6');
  assert.strictEqual(context.noteTitleLevelFromHorizontalDrag(100, 70, 44, 1), 0, 'moving opposite the rail cancels');
  assert.strictEqual(context.noteTitleLevelFromHorizontalDrag(300, 256, 44, -1), 2, 'a left-opening rail mirrors level selection');
}

const openGesture = extractFunction('openNoteTitleGesture');
assert(/window\.innerWidth/.test(openGesture), 'horizontal rail must adapt to the current viewport width');
assert(/state\.direction/.test(openGesture), 'horizontal rail must remember its opening direction');
assert(/availableRight/.test(openGesture) && /availableLeft/.test(openGesture), 'hold-open must choose the side with more thumb room');
// RC3 intentionally removed the line running through the T1-T6 options while keeping
// the same horizontal gesture geometry. The stale pre-RC3 assertion must not require it back.
assert(!/note-title-gesture__rail/.test(openGesture), 'RC3 title palette must not recreate the track line through T1-T6');
assert(/visualOriginX/.test(openGesture) && /span/.test(openGesture), 'level positions must remain horizontally distributed');

const applyTitle = extractFunction('applyNoteTitle');
const syncTitle = extractFunction('syncNoteTitleTypingCommand');
const deactivateTitle = extractFunction('deactivateNoteTitleTyping');

assert(!applyTitle.includes("execCommand('formatBlock'"), 'arming a title must never rewrite the existing paragraph');
assert(!html.includes("execCommand('formatBlock', false, '<h'"), 'the old whole-paragraph heading path must be removed');
assert(/collapseNoteSelectionForFutureInput/.test(applyTitle), 'an existing selection must collapse without formatting old text');
assert(/_noteTitleLastLevel\s*=\s*level/.test(applyTitle), 'the last chosen T level must be remembered');
assert(/_noteTitleActive\s*=\s*'T'\s*\+\s*level/.test(applyTitle), 'title action must arm future-input state');
assert(/execCommand\('fontSize'/.test(syncTitle), 'future title input must use collapsed-caret inline font state');
assert(/noteTitleFontCommandValue/.test(syncTitle), 'T1-T6 must map through one controlled size table');
assert(/_noteTitleBodyResetPending/.test(deactivateTitle), 'leaving title mode must schedule a body-size typing reset');

// Android IME remains native: composition is not cancelled or manually reinserted.
const beforeInputStart = html.indexOf("noteBodyForTypingFormat.addEventListener('beforeinput'");
const beforeInputEnd = html.indexOf('// H pointer ownership lives in nexa-highlight.js', beforeInputStart);
assert(beforeInputStart >= 0 && beforeInputEnd > beforeInputStart, 'typing-format beforeinput block missing');
const beforeInput = html.slice(beforeInputStart, beforeInputEnd);
assert(/insertCompositionText/.test(beforeInput), 'Android composition input must be covered');
assert(/syncNoteTitleTypingCommand/.test(beforeInput), 'armed title state must be restored before native IME insertion');
assert(!/preventDefault\s*\(/.test(beforeInput), 'native IME events must never be cancelled');

// Persisted inline ranges are visibly distinct without semantic H1/H2 block conversion.
for (let size = 2; size <= 7; size += 1) {
  assert(new RegExp('font\\[size=["\\\']' + size + '["\\\']\\]').test(html), 'missing persisted inline style for font size ' + size);
}
assert(/noteTitleControl\.textContent\s*=\s*_noteTitleActive/.test(html), 'toolbar must display the armed T1-T6 level');
assert(/noteTitleControl\.classList\.toggle\('toolbar-active',\s*!!_noteTitleActive\)/.test(html), 'armed title level must be visibly highlighted');
assert(/performNoteTitleHaptic/.test(html), 'level transitions must request native haptic feedback when available');
assert(/@JavascriptInterface\s+fun performNoteTitleHaptic\(\)/.test(mainActivity), 'Android bridge must expose title haptics');
assert(/HapticFeedbackConstants\.CLOCK_TICK/.test(mainActivity), 'title haptics must use a restrained clock-tick pulse');

assert(/按住横滑/.test(html), 'accessibility copy must describe the horizontal gesture');

console.log('PASS note-title-horizontal-gesture-inline-input-contract');
