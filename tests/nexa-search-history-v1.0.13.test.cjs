const { test } = require('node:test');
const a = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'ui/todo.html'), 'utf8');

test('1.0.13 search curtain opens slowly in four visibly stepped levels', () => {
  a.match(html, /Search History · 1\.0\.13 slow stepped curtain/);
  a.match(html, /max-height \.54s cubic-bezier/);
  a.match(html, /clip-path \.56s cubic-bezier/);
  a.match(html, /opacity \.28s ease, transform \.42s cubic-bezier/);
  a.match(html, /active \.search-history__item:nth-child\(1\)[^{]*\{ transition-delay: \.08s/);
  a.match(html, /active \.search-history__item:nth-child\(2\)[^{]*\{ transition-delay: \.20s/);
  a.match(html, /active \.search-history__item:nth-child\(3\)[^{]*\{ transition-delay: \.32s/);
  a.match(html, /active \.search-history__item:nth-child\(4\)[^{]*\{ transition-delay: \.44s/);
});

test('1.0.13 reverse curtain collapses bottom-to-top and waits for motion before DOM refresh', () => {
  a.match(html, /nth-child\(1\)[^{]*\{[^}]*transition-delay: \.36s/);
  a.match(html, /nth-child\(2\)[^{]*\{[^}]*transition-delay: \.24s/);
  a.match(html, /nth-child\(3\)[^{]*\{[^}]*transition-delay: \.12s/);
  a.match(html, /nth-child\(4\)[^{]*\{[^}]*transition-delay: 0s/);
  a.match(html, /function deferSearchHistoryRender\(\)[\s\S]*\}, 820\)/);
});
