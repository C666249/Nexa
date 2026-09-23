(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NexaBackup=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const recordKeys=['todo_glass_data','todo_glass_recycle','todo_glass_note_topics_v2','todo_glass_note_docs_v2','todo_glass_notes','todo_glass_daily_tasks_v1'];
 function populated(storage){return recordKeys.some(k=>{const raw=storage.getItem(k);if(!raw)return false;try{const v=JSON.parse(raw);return !Array.isArray(v)||v.length>0;}catch(e){return true;}});}
 function validate(data){if(!data||Array.isArray(data)||typeof data!=='object')throw Error('备份格式无效');for(const[k,v]of Object.entries(data)){if(typeof v!=='string'||k.length>300)throw Error('备份数据无效');if(recordKeys.includes(k)&&!Array.isArray(JSON.parse(v)))throw Error('备份记录无效');}return data;}
 function restore(storage,data){validate(data);const before=Object.entries(data).map(([k])=>[k,storage.getItem(k)]);try{for(const[k,v]of Object.entries(data))storage.setItem(k,v);for(const[k,v]of Object.entries(data))if(storage.getItem(k)!==v)throw Error('存储校验失败');}catch(e){for(const[k,v]of before){if(v===null)storage.removeItem(k);else storage.setItem(k,v);}throw e;}}
 return {populated,validate,restore};
});
