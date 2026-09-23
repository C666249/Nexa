const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync(__dirname + '/../ui/todo.html', 'utf8');

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

function runBackFromSearch(homeView) {
  let switchCount = 0;
  let clearOptions = null;
  const hidden = { classList: { contains: () => false, remove() {} }, style: { display: 'none' } };
  const context = {
    document: { getElementById: () => hidden },
    categoryPicker: null,
    recycleModal: null,
    calendarModal: null,
    searchHistoryEl: null,
    topicSummaryEditing: false,
    currentMode: 'notes',
    currentTopicId: null,
    currentVirtualNoteFolder: null,
    noteSearchQuery: '项目',
    noteHomeView: homeView,
    normalizeNoteSearchQuery: (value) => String(value || '').trim(),
    clearNoteGlobalSearch(options) {
      clearOptions = options;
      context.noteSearchQuery = '';
    },
    switchMode() { switchCount += 1; },
  };
  vm.createContext(context);
  vm.runInContext(extractFunction('handleBackPress'), context);
  const result = context.handleBackPress();
  return { result, context, clearOptions, switchCount };
}

for (const homeView of ['recent', 'tree']) {
  const state = runBackFromSearch(homeView);
  assert.strictEqual(state.result, 'note-search', 'system Back should consume the Note search layer');
  assert.strictEqual(state.context.noteSearchQuery, '', 'system Back should clear the Note search query');
  assert.strictEqual(state.context.currentMode, 'notes', 'system Back should stay in Note mode');
  assert.strictEqual(state.context.noteHomeView, homeView, 'system Back should preserve the active Note home view');
  assert.strictEqual(state.clearOptions && state.clearOptions.focus, false, 'clearing from system Back should not open the keyboard');
  assert.strictEqual(state.switchCount, 0, 'system Back must not switch to To-Do while search is active');
}

console.log('PASS note-global-search-back');
