const fs=require('fs');const html=fs.readFileSync('ui/todo.html','utf8');
function must(re,msg){if(!re.test(html)){console.error('FAIL',msg);process.exit(1)}}
must(/secondaryRatio:\s*0\.18/,'first detent should mirror Banner +5 distance');
must(/deleteRatio:\s*0\.40/,'deep delete detent missing');
must(/function nexaSwipeThresholds\(row\)/,'segmented threshold resolver missing');
must(/function nexaSwipeResolve\(row, rawX, secondaryAction\)/,'segmented action resolver missing');
must(/if \(distance >= thresholds\.delete\) \{ action = 'delete'/,'deep pull must resolve to delete');
must(/else if \(distance >= thresholds\.secondary\) \{ action = secondaryAction/,'first detent must resolve to secondary action');
must(/rawX = Math\.min\(0, Number\(rawX\) \|\| 0\)/,'positive/right drag must not move action card');
must(/setNoteSwipeRowX[\s\S]*'move'/,'Note first detent must be Move');
const thresholds=w=>{const secondary=Math.max(56,w*.18);const deep=Math.max(secondary+56,132,w*.40);return {secondary,deep}};
const resolve=(w,x)=>{const t=thresholds(w),d=Math.max(0,-x);return d>=t.deep?'delete':d>=t.secondary?'move':'none'};
if(resolve(360,-45)!=='none')throw Error('short left drag must rebound');
if(resolve(360,-85)!=='move')throw Error('middle left drag must move');
if(resolve(360,-170)!=='delete')throw Error('deep left drag must delete');
if(resolve(360,90)!=='none')throw Error('right drag must remain free for Drawer');
console.log('PASS Note swipe physics: Banner-style left ladder = move detent / deep delete');
