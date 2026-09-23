(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NexaBackup=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const recordKeys=['todo_glass_data','todo_glass_recycle','todo_glass_note_topics_v2','todo_glass_note_docs_v2','todo_glass_notes','todo_glass_daily_tasks_v1'];
 function populated(storage){const space=storage.getItem('nexa_space_v1');if(space){try{const m=JSON.parse(space);if(!Array.isArray(m.nodes)||m.nodes.length||Object.keys(m.favorites||{}).length)return true;}catch(e){return true;}}return recordKeys.some(k=>{const raw=storage.getItem(k);if(!raw)return false;try{const v=JSON.parse(raw);return !Array.isArray(v)||v.length>0;}catch(e){return true;}});}
 function validate(data){
  if(!data||Array.isArray(data)||typeof data!=='object')throw Error('备份格式无效');
  for(const[k,v]of Object.entries(data)){
   if(typeof v!=='string'||k.length>300)throw Error('备份数据无效');
   if(!recordKeys.includes(k))continue;
   const rows=JSON.parse(v);if(!Array.isArray(rows))throw Error('备份记录无效：'+k);
   if(!['todo_glass_data','todo_glass_note_docs_v2','todo_glass_note_topics_v2','todo_glass_daily_tasks_v1'].includes(k))continue;
   const ids=new Set(),legacyNote=k==='todo_glass_note_docs_v2'||k==='todo_glass_note_topics_v2';
   for(const [index,row] of rows.entries()){
    const id=Number(row?.id);
    // To-Do's stableLegacySyntheticId deliberately creates negative Note/Topic IDs.
    // Preserve them and their parent references; zero, fractions and duplicate IDs remain invalid.
    if(!['number','string'].includes(typeof row?.id)||!Number.isSafeInteger(id)||id===0||(!legacyNote&&id<0)||ids.has(id))throw Error('备份记录标识无效或重复：'+k+' 第 '+(index+1)+' 条（ID '+String(row?.id)+'）');
    ids.add(id);if(k==='todo_glass_note_docs_v2'&&typeof row.content!=='string')throw Error('笔记正文无效：第 '+(index+1)+' 条');
   }
  }
  return data;
 }
 function restore(storage,data){validate(data);const before=Object.entries(data).map(([k])=>[k,storage.getItem(k)]);try{for(const[k,v]of Object.entries(data))storage.setItem(k,v);for(const[k,v]of Object.entries(data))if(storage.getItem(k)!==v)throw Error('存储校验失败');}catch(e){for(const[k,v]of before){if(v===null)storage.removeItem(k);else storage.setItem(k,v);}throw e;}}
 return {populated,validate,restore};
});
