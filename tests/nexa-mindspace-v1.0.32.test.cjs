const {test}=require('node:test');
const a=require('node:assert/strict');
const fs=require('node:fs');
const mind=fs.readFileSync('ui/nexa-mindspace.js','utf8');
const shell=fs.readFileSync('ui/nexa-shell.js','utf8');
const timeline=fs.readFileSync('ui/nexa-timeline.js','utf8');
const css=fs.readFileSync('ui/nexa.css','utf8');

test('Mindspace owns a local hierarchical back stack before shell exit',()=>{
  a.match(mind,/function back\(\)\{/);
  const start=mind.indexOf('function back(){'), end=mind.indexOf('function saveEditor',start);
  const body=mind.slice(start,end);
  a.ok(body.indexOf('mindEditorOpen()') < body.indexOf('cancelLink()'));
  a.ok(body.indexOf('cancelLink()') < body.indexOf('state.overviewOpen'));
  a.ok(body.indexOf('state.overviewOpen') < body.indexOf('state.selected'));
  a.match(body,/if\(state\.selected\)\{state\.selected=null;renderDetail\(\);layoutNodes\(performance\.now\(\)\);return 'detail';\}/);
  a.match(mind,/open,close,back,isOpen/);
});

test('System/top-left back delegates to Mindspace local layer before closing the workspace',()=>{
  a.match(shell,/const layer=NexaMindspace\.back\?\.\(\)\|\|'none'/);
  a.match(shell,/if\(layer!=='none'\)return 'mindspace-'\+layer;NexaMindspace\.close\(\)/);
  a.match(mind,/data-mindspace-close[^\n]+if\(back\(\)==='none'\)close\(\)/);
});

test('Timeline Mindspace entry is a miniature starfield portal rather than a plain line icon',()=>{
  a.match(timeline,/function mindspacePortal\(\)/);
  a.match(timeline,/timeline-mindspace-portal/);
  a.match(timeline,/portal-star/);
  a.match(timeline,/portal-spark/);
  a.match(css,/\.timeline-mindspace-portal\{/);
  a.match(css,/\.timeline-mindspace-portal \.orbit-a/);
  a.match(css,/@keyframes timelinePortalSpark/);
  a.match(css,/prefers-reduced-motion:reduce[\s\S]*timeline-mindspace-portal \.portal-spark\{animation:none!important/);
});
