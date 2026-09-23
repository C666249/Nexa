const fs=require('fs');const html=fs.readFileSync('ui/todo.html','utf8');
function must(re,msg){if(!re.test(html)){console.error('FAIL',msg);process.exit(1)}}
must(/currentVirtualNoteFolder\s*=\s*null/,'virtual-folder state missing');
must(/function renderUnfiledVirtualFolder\(/,'virtual unfiled renderer missing');
must(/data-unfiled-open="1"/,'virtual folder open target missing');
must(/function enterUnfiledWorkspace\(/,'unfiled workspace missing');
must(/currentVirtualNoteFolder='unfiled'/,'unfiled workspace state missing');
must(/function renderUnfiledWorkspace\(/,'unfiled workspace renderer missing');
must(/function selectUnfiledFromDrawer\(/,'drawer unfiled navigation missing');
if(/createTopic\(['"]未分类['"]/.test(html))throw new Error('未分类 must never be persisted as a real Topic');
console.log('PASS unfiled virtual folder: folder UI/workspace without schema Topic');
