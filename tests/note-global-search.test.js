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

const topicFixtures = [
  { id: 1, title: 'Work', parentTopicId: null, updatedAt: 100 },
  { id: 2, title: 'Alpha Folder', parentTopicId: 1, updatedAt: 200 },
];
const context = {
  noteSearchMode: 'title', // Explicitly exercise title-only mode in the current dual-mode search.
  notes: [
    { id: 11, title: 'Alpha Project', content: '<p>not searched</p>', topicId: 2, updatedAt: 300 },
    { id: 12, title: 'Meeting notes', content: '<p>Alpha only in body</p>', topicId: null, updatedAt: 200 },
    { id: 13, title: 'ALPHABET', content: '', topicId: null, updatedAt: 100 },
  ],
  noteTopics: topicFixtures,
  getTopicPath(topicId) {
    if (topicId === 2) return topicFixtures;
    return [];
  },
  escapeHtml(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },
};
vm.createContext(context);
['normalizeNoteSearchQuery', 'getNoteGlobalSearchResults', 'highlightNoteSearchText'].forEach((name) => {
  vm.runInContext(extractFunction(name), context);
});

const results = context.getNoteGlobalSearchResults('  alpha ');
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(results.map((item) => [item.kind, item.id]))),
  [['topic', 2], ['note', 11], ['note', 13]],
  'global search should match folder and note titles, but not note bodies'
);
assert.strictEqual(results[1].pathLabel, 'Work › Alpha Folder');
assert.strictEqual(context.getNoteGlobalSearchResults('   ').length, 0);

assert.strictEqual(
  context.highlightNoteSearchText('<Alpha>', 'alpha'),
  '&lt;<mark class="note-search-match">Alpha</mark>&gt;',
  'highlighting must preserve case and escape user titles before adding markup'
);

assert(/if \(isNotes\)[\s\S]*searchWrap\.style\.display = ''/.test(html), 'Note mode must keep the global search field visible');
assert(html.includes('renderNoteSearchResults(listEl, emptyEl, summaryEl)'), 'both Note home views must share global search results');
assert(html.includes('function openNoteSearchResult('), 'search results need a dedicated navigation path');
assert(/\.note-search-match\{[^}]*background:linear-gradient\(135deg,[^}]*box-decoration-break:clone/.test(html), 'matched title text must use a full-height cloned highlight background');
assert(!html.includes('transparent 42%,rgba(71,201,190,.30) 42%'), 'matched title text must not use a partial-height underline highlight');

console.log('PASS note-global-search');
