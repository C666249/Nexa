const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync(require.resolve('../ui/todo.html'), 'utf8');
const css = fs.readFileSync(require.resolve('../ui/nexa.css'), 'utf8');

test('H-off uses Nexa editor neutral background instead of legacy To-Do beige', () => {
  assert.match(css, /\.note-editor,\.note-editor__body\{background:#F7F2E8\}/);
  assert.match(html, /var EDITOR_BG_HEX = '#f7f2e8';/);
  assert.match(html, /var LEGACY_EDITOR_BG_HEX = '#f5ecd8';/);
  assert.match(html, /document\.execCommand\('backColor', false, getNoteEditorNeutralBackColor\(\)\);/);
  assert.match(html, /selectedIsHighlighted \? getNoteEditorNeutralBackColor\(\) : highlightColor/);
});

test('legacy neutral spans are visually migrated when a note opens', () => {
  assert.match(html, /function normalizeLegacyNoteNeutralBackgrounds\(bodyEl\)/);
  assert.match(html, /normalizeLegacyNoteNeutralBackgrounds\(bodyEl\); cleanupNoteFileAnnotations/);
  assert.match(html, /normalizeNoteCssColor\(LEGACY_EDITOR_BG_COLOR\)/);
  assert.match(html, /el\.style\.backgroundColor = liveNeutral/);
});
