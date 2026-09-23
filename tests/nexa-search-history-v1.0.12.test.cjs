const { test } = require('node:test');
const a = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'ui/todo.html'), 'utf8');

test('Todo search history is anchored below the search field and hidden during ordinary browsing', () => {
  a.match(html, /\.search-history \{[\s\S]*position: absolute; top: calc\(100% \+ 8px\); left: 0; right: 0;[\s\S]*max-height: 0;/);
  a.match(html, /\.search-history \{[\s\S]*opacity: 0; visibility: hidden; pointer-events: none;/);
  a.match(html, /<div class="search-wrap">[\s\S]*id="search-input"[\s\S]*id="searchHistory"/);
  a.doesNotMatch(html, /\.search-history \{[\s\S]{0,120}position: fixed/);
});

test('focusing Todo search opens a staggered curtain instead of typing forcing it permanently open', () => {
  a.match(html, /\.search-history\.active[\s\S]*max-height: 260px; opacity: 1; visibility: visible; pointer-events: auto/);
  a.match(html, /\.search-history\.active \.search-history__item:nth-child\(1\)[\s\S]*\.08s/);
  a.match(html, /\.search-history\.active \.search-history__item:nth-child\(4\)[\s\S]*\.44s/);
  a.match(html, /searchInput\.addEventListener\('focus',[\s\S]*currentMode !== 'notes'[\s\S]*showSearchHistory\(\)/);

  const inputHandler = html.match(/searchInput\.addEventListener\('input',[\s\S]*?\n\}\);/);
  a.ok(inputHandler, 'input handler should exist');
  a.doesNotMatch(inputHandler[0], /showSearchHistory\(\)|classList\.add\('active'\)/);
});

test('confirming a query or choosing history reverses the painted curtain before refreshing hidden history', () => {
  a.match(html, /if \(e\.isComposing \|\| e\.keyCode === 229\) return;/);
  a.match(html, /if \(e\.key === 'Enter' && searchInput\.value\.trim\(\)\)[\s\S]*const term = searchInput\.value\.trim\(\);[\s\S]*hideSearchHistory\(\);[\s\S]*addSearchHistory\(term, \{ render: false \}\);[\s\S]*deferSearchHistoryRender\(\);[\s\S]*searchInput\.blur\(\)/);
  a.match(html, /const item = e\.target\.closest\('\.search-history__item'\);[\s\S]*searchQuery = term;[\s\S]*hideSearchHistory\(\);[\s\S]*addSearchHistory\(term, \{ render: false \}\);[\s\S]*deferSearchHistoryRender\(\);[\s\S]*searchInput\.blur\(\);[\s\S]*updateCounts\(\);[\s\S]*render\(\)/);
  a.match(html, /function deferSearchHistoryRender\(\)[\s\S]*setTimeout\(function\(\)[\s\S]*renderSearchHistory\(\);[\s\S]*\}, 820\)/);
  a.match(html, /function hideSearchHistory\(\)[\s\S]*classList\.remove\('active'\)[\s\S]*aria-hidden', 'true'/);
  a.match(html, /\.search-history__item:nth-child\(1\)[^{]*\{[^}]*transition-delay: \.36s/);
  a.match(html, /\.search-history__item:nth-child\(4\)[^{]*\{[^}]*transition-delay: 0s/);
});

test('route changes force-close search history so normal Todo browsing never inherits the curtain', () => {
  const shell = fs.readFileSync(path.join(root, 'ui/nexa-shell.js'), 'utf8');
  a.match(shell, /closeNoteSearchModeDrawer\(\); closeNoteCreateMenu\(\); closeCategoryPicker\(\);[\s\S]*if\(typeof hideSearchHistory==='function'\)hideSearchHistory\(\);/);
});

test('reduced motion keeps search history usable without animation', () => {
  a.match(html, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.search-history,\.search-history__item \{ transition: none !important; \}/);
});
