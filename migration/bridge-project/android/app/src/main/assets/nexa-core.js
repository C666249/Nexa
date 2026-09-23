(function(root,factory){
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  else root.NexaCore=api;
})(typeof window==='undefined'?globalThis:window,function(){
  const routes=['home','todo','notes','daily','space'];
  function route(value){return routes.includes(value)?value:'home';}
  function back(value){return route(value)==='home'?null:'home';}
  function dateKey(date){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
  function summary(todos,notes,daily,now){
    const data=dashboard(todos,notes,daily,now);
    return {total:data.todayTotal,done:data.todayDone,percent:data.percent,notes:data.noteCount,daily:data.dailyCount};
  }
  function dashboard(todos,notes,daily,now){
    const key=dateKey(now);
    const sameDay=value=>Number(value)>0 && dateKey(new Date(Number(value)))===key;
    const today=todos.filter(t=>sameDay(t.createdAt)||sameDay(t.reminderAt));
    const eligible=daily.filter(t=>!Number(t.createdAt)||dateKey(new Date(Number(t.createdAt)))<=key);
    const completed=t=>t.status==='completed';
    const dailyDone=t=>(t.completedDates||[]).includes(key);
    const todayDone=today.filter(completed).length+eligible.filter(dailyDone).length;
    const todayTotal=today.length+eligible.length;
    const state=(done,time)=>done?'done':time<now.getTime()?'elapsed':'upcoming';
    const schedule=todos.filter(t=>sameDay(t.reminderAt)).map(t=>({
      kind:'todo',id:Number(t.id),text:String(t.text||'未命名任务'),time:Number(t.reminderAt),state:state(completed(t),Number(t.reminderAt))
    }));
    eligible.forEach(t=>{
      const hour=Number(t.hour),minute=Number(t.minute);
      if(!Number.isInteger(hour)||hour<0||hour>23||!Number.isInteger(minute)||minute<0||minute>59)return;
      const time=new Date(now.getFullYear(),now.getMonth(),now.getDate(),hour,minute).getTime();
      schedule.push({kind:'daily',id:Number(t.id),text:String(t.text||'每日事项'),time,state:state(dailyDone(t),time)});
    });
    schedule.sort((a,b)=>a.time-b.time||a.kind.localeCompare(b.kind)||a.id-b.id);
    return {todayTotal,todayDone,percent:todayTotal?Math.round(todayDone/todayTotal*100):0,
      taskTotal:today.length,taskDone:today.filter(completed).length,noteCount:notes.length,dailyCount:eligible.length,schedule,
      recentTodos:todos.slice().sort((a,b)=>(Number(b.createdAt)||0)-(Number(a.createdAt)||0)||Number(b.id)-Number(a.id)).slice(0,3),
      recentNotes:notes.slice().sort((a,b)=>(Number(b.updatedAt||b.createdAt)||0)-(Number(a.updatedAt||a.createdAt)||0)||Number(b.id)-Number(a.id)).slice(0,3)};
  }
  // Existing topic identities remain untouched; iterative traversal tolerates bad legacy trees.
  function topics(items){
    const byId=new Map(items.map(t=>[Number(t.id),t]));
    const children=new Map();
    items.forEach(t=>{const parent=Number(t.parentTopicId)||0; if(!children.has(parent))children.set(parent,[]); children.get(parent).push(t);});
    const result=[],seen=new Set();
    function visit(seed){
      const stack=[{topic:seed,depth:0}];
      while(stack.length){
        const {topic,depth}=stack.pop(),id=Number(topic.id);
        if(seen.has(id))continue; seen.add(id); result.push({...topic,id,depth});
        const child=children.get(id)||[];
        for(let i=child.length-1;i>=0;i--)stack.push({topic:child[i],depth:depth+1});
      }
    }
    items.filter(t=>!byId.has(Number(t.parentTopicId))).forEach(visit);
    items.forEach(t=>{if(!seen.has(Number(t.id)))visit(t);});
    return result;
  }
  return {route,back,dateKey,summary,dashboard,topics};
});
