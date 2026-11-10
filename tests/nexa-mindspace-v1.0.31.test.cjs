const {test}=require('node:test');
const a=require('node:assert/strict');
const fs=require('node:fs');

test('1.0.31 uses crystalline starbursts instead of purple/yellow orb nodes',()=>{
  const js=fs.readFileSync('ui/nexa-mindspace.js','utf8');
  const css=fs.readFileSync('ui/nexa.css','utf8');
  a.match(js,/mindspace-node-mark/);
  a.doesNotMatch(js,/mindspace-node-orb/);
  a.match(css,/\.mindspace-node-mark i\{[^}]*transform:rotate\(45deg\)/);
  a.match(css,/\.mindspace-node-mark::before,\.mindspace-node-mark::after/);
  a.doesNotMatch(css,/\.mindspace-node-orb\{/);
});

test('1.0.31 star nodes breathe softly, selected star brightens, and reduced motion stays functional',()=>{
  const css=fs.readFileSync('ui/nexa.css','utf8');
  a.match(css,/@keyframes mindspaceCrystalBreath/);
  a.match(css,/@keyframes mindspaceHaloBreath/);
  a.match(css,/@keyframes mindspaceSelectedStar/);
  a.match(css,/\.mindspace-node\.is-selected \.mindspace-node-mark\{animation:mindspaceSelectedStar/);
  a.match(css,/@media\(prefers-reduced-motion:reduce\)[\s\S]*\.mindspace-node-mark,\.mindspace-node-halo\{animation:none!important/);
});

test('1.0.31 focus synchronizes live DOM state and never leaves a second node title behind the detail card',()=>{
  const js=fs.readFileSync('ui/nexa-mindspace.js','utf8');
  const css=fs.readFileSync('ui/nexa.css','utf8');
  a.match(js,/node\.classList\.toggle\('is-selected',selected\)/);
  a.match(js,/querySelector\('\[data-mindspace-node-title\]'\)/);
  a.match(css,/\.mindspace-node\.is-selected \.mindspace-node-copy\{opacity:0!important/);
  a.match(css,/\.mindspace\.has-selection \.mindspace-node\.is-dimmed \.mindspace-node-copy\{opacity:\.08\}/);
});
