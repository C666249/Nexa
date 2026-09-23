const fs=require('fs');const html=fs.readFileSync('ui/todo.html','utf8');
function must(re,msg){if(!re.test(html)){console.error('FAIL',msg);process.exit(1)}}
// Note leaf actions must capture only left drags. Right drags are yielded to the tree Drawer.
must(/function nexaSwipeGestureShouldLock\(dx,dy\)\{[\s\S]*return dx < -NEXA_CARD_SWIPE\.slop/,'card action lock must be left-only');
must(/function nexaSwipeIsRightNavigation\(dx,dy\)/,'right-navigation arbitration helper missing');
must(/nexaSwipeIsRightNavigation\(dx,dy\)\|\|Math\.abs\(dy\)>Math\.abs\(dx\)\)noteSwipeGesture\.row=null/,'Note card must yield right swipe to Drawer');
must(/!swipeRowWasOpen&&dx>50&&dx>dy[\s\S]*openFolderSidebar\(\)/,'closed Note/Topic row right-swipe must open Drawer');
// Topic cards keep their legacy left rail; a closed topic also yields right drag to Drawer.
must(/g\.baseX>=-1&&dx>0\)\{topicSwipeGesture\.row=null;return;/,'closed Topic card must yield right-swipe to Drawer');
function owner({dx,dy,distance=0,secondary=65,deep=145,topicOpen=false}){
  if(Math.abs(dy)>Math.abs(dx))return 'scroll';
  if(dx>6){return topicOpen?'rail-close':'drawer'}
  if(dx>=-6)return 'none';
  const d=Math.max(distance,-dx);
  return d>=deep?'delete':d>=secondary?'secondary':'preview';
}
const cases=[
 [{dx:80,dy:5},'drawer'],
 [{dx:-40,dy:5},'preview'],
 [{dx:-90,dy:5},'secondary'],
 [{dx:-170,dy:5},'delete'],
 [{dx:10,dy:80},'scroll']
];
for(const [input,want] of cases){const got=owner(input);if(got!==want)throw new Error(JSON.stringify(input)+' '+got+' != '+want)}
console.log('PASS directional arbitration: left=segmented card actions, right=Drawer, vertical=scroll');
