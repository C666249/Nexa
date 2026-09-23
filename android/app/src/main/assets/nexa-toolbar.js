(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NexaToolbar=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const tools=[
  ['bold','加粗','[data-cmd="bold"]'],['italic','斜体','[data-cmd="italic"]'],['checklist','待办勾选','[onclick="insertCheckbox()"]'],['image','图片','#noteAddImageBtn'],
  ['highlight','文字高亮','[data-cmd="hiliteColor"]'],['strike','删除线','[data-cmd="strikeThrough"]'],['title','标题 T▾','#noteTitleBtn'],['bullet','无序列表','[data-cmd="insertUnorderedList"]'],['number','有序列表','[data-cmd="insertOrderedList"]'],['indent','增加缩进','[data-cmd="indent"]'],['outdent','减少缩进','[data-cmd="outdent"]'],['timestamp','时间戳','#noteTimestampBtn'],['file','文件','#noteAddFileBtn']
 ].map(([id,label,selector])=>({id,label,selector}));
 const defaults=tools.map(t=>t.id);
 function normalize(order){const seen=new Set(),result=[];for(const id of [...(Array.isArray(order)?order:[]),...defaults])if(defaults.includes(id)&&!seen.has(id)){seen.add(id);result.push(id);}return result;}
 function split(order){const all=normalize(order);return {primary:all.slice(0,4),more:all.slice(4)};}
 function move(order,id,index){const result=normalize(order);if(!result.includes(id))throw Error('工具不存在');result.splice(result.indexOf(id),1);result.splice(Math.max(0,Math.min(result.length,index)),0,id);return result;}
 return {tools,normalize,split,move};
});
