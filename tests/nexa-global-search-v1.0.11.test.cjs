const {test}=require('node:test');
const a=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Space global search marks matching text and runs one Todo-style gradient sweep',()=>{
  const ws=read('ui/nexa-workspace.js'),css=read('ui/nexa.css');
  a.match(ws,/function searchMark\(value,query\)/);
  a.match(ws,/nexa-global-search-match/);
  a.match(ws,/nexa-global-search-hit/);
  a.match(ws,/visible\.map\(r=>resultRow\(r,\{highlight:true\}\)\)/);
  a.match(css,/\.nexa-library-row\.nexa-global-search-hit::after[^{]*\{[^}]*linear-gradient[^}]*animation:nexaGlobalSearchSweep/);
  a.match(css,/\.nexa-global-search-match\{[^}]*linear-gradient[^}]*animation:nexaGlobalSearchMatch/);
  a.match(css,/@media \(prefers-reduced-motion:reduce\)[^{]*\{[^}]*nexa-global-search-hit/);
});

test('opening a global result carries the query into its destination focus instead of dropping context',()=>{
  const ws=read('ui/nexa-workspace.js');
  a.match(ws,/if\(kind==='note'\)[\s\S]*openNoteEditor\(id,\{preserveKeyboard:false,forceRead:true,searchHighlight:q\}\)/);
  a.match(ws,/if\(kind==='todo'\)[\s\S]*searchQuery=nativeHit\?q:''[\s\S]*render\(\)/);
  a.match(ws,/nexaFlashTarget\(row,1650\)/);
});
