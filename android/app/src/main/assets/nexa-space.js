/* Additive shared labels. Legacy category/topic records are never rewritten. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NexaSpace=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const copy=m=>JSON.parse(JSON.stringify(m));
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function empty(){return {version:1,nodes:[],assignments:{},favorites:{},legacy:{}};}
 function validate(m){
  if(!m||m.version!==1)throw Error('Space 数据版本不支持');
  if(!Array.isArray(m.nodes)||!m.assignments||!m.favorites||!m.legacy)throw Error('Space 数据不完整');
  const ids=new Set();for(const n of m.nodes){if(typeof n.id!=='string'||!n.id||ids.has(n.id)||typeof n.title!=='string'||!n.title.trim())throw Error('Space 标签损坏');ids.add(n.id);}
  const parents=new Map(m.nodes.map(n=>[n.id,n.parent]));const done=new Set();
  for(const n of m.nodes){const trail=new Set();let id=n.id;while(id!=null&&!done.has(id)){if(!ids.has(id)||trail.has(id))throw Error('Space 层级损坏或循环');trail.add(id);id=parents.get(id);}trail.forEach(x=>done.add(x));}
  for(const [key,value] of Object.entries(m.assignments)){if(!/^((todo|daily):[1-9]\d*|note:-?[1-9]\d*)$/.test(key)||!Array.isArray(value)||value.some(id=>!ids.has(id)))throw Error('Space 关联损坏');}
  return m;
 }
 function tree(m){const children=new Map();for(const n of m.nodes){const p=n.parent||null;if(!children.has(p))children.set(p,[]);children.get(p).push(n);}const result=[],seen=new Set(),stack=(children.get(null)||[]).slice().reverse().map(n=>[n,0]);while(stack.length){const[n,depth]=stack.pop();if(seen.has(n.id))continue;seen.add(n.id);result.push({...n,depth});const list=children.get(n.id)||[];for(let i=list.length-1;i>=0;i--)stack.push([list[i],depth+1]);}return result;}
 function seed(input,todos,topics,notes){
  const m=copy(validate(input)),known=new Set(m.nodes.map(n=>n.id));
  for(const t of topics){const key='topic:'+t.id;if(!own(m.legacy,key)){m.nodes.push({id:key,title:String(t.title||'未命名主题'),parent:null});known.add(key);m.legacy[key]=key;}}
  // Only new mappings adopt old hierarchy; user reorganizations stay authoritative.
  for(const t of topics){const key='topic:'+t.id;if(!own(input.legacy,key)){const n=m.nodes.find(n=>n.id===key),parent=m.legacy['topic:'+t.parentTopicId];if(n&&parent&&parent!==key){let p=parent,cycle=false;const seen=new Set([key]);while(p){if(seen.has(p)){cycle=true;break;}seen.add(p);p=m.nodes.find(n=>n.id===p)?.parent;}if(!cycle)n.parent=parent;}}}
  for(const t of todos){if(!t.category)continue;const key='category:'+t.category;if(!own(m.legacy,key)){const same=m.nodes.find(n=>n.parent===null&&n.title===t.category);const id=same?.id||key;if(!same)m.nodes.push({id,title:String(t.category),parent:null});m.legacy[key]=id;}const record='todo:'+t.id;if(!own(m.assignments,record))m.assignments[record]=m.legacy[key]?[m.legacy[key]]:[];}
  for(const n of notes){const key='note:'+n.id;if(!own(m.assignments,key)&&m.legacy['topic:'+n.topicId])m.assignments[key]=[m.legacy['topic:'+n.topicId]];}
  return validate(m);
 }
 function add(input,id,title,parent){const m=copy(input);title=String(title).trim();if(!title||title.length>100)throw Error('标签名称需为 1–100 字');if(m.nodes.some(n=>n.id===id))throw Error('标签已存在');if(parent&&!m.nodes.some(n=>n.id===parent))throw Error('上级不存在');m.nodes.push({id,title,parent:parent||null});return validate(m);}
 function rename(input,id,title){const m=copy(input),n=m.nodes.find(n=>n.id===id);if(!n)throw Error('标签不存在');if(!String(title).trim()||String(title).trim().length>100)throw Error('标签名称需为 1–100 字');n.title=String(title).trim();return m;}
 function move(input,id,parent){const m=copy(input),n=m.nodes.find(n=>n.id===id);if(!n||parent&&!m.nodes.some(n=>n.id===parent))throw Error('标签不存在');let p=parent;while(p){if(p===id)throw Error('不能形成循环层级');p=m.nodes.find(n=>n.id===p)?.parent;}n.parent=parent||null;return validate(m);}
 function remove(input,id){const m=copy(input),n=m.nodes.find(n=>n.id===id);if(!n)return m;m.nodes=m.nodes.filter(x=>x.id!==id);m.nodes.forEach(x=>{if(x.parent===id)x.parent=n.parent;});for(const k of Object.keys(m.assignments))m.assignments[k]=m.assignments[k].filter(x=>x!==id);for(const k of Object.keys(m.legacy))if(m.legacy[k]===id)m.legacy[k]=null;return validate(m);}
 function assign(input,kind,id,ids){if(!['todo','note','daily'].includes(kind)||!Number.isSafeInteger(Number(id))||Number(id)===0||(kind!=='note'&&Number(id)<0))throw Error('记录不存在');const m=copy(input);if(ids.some(id=>!m.nodes.some(n=>n.id===id)))throw Error('标签不存在');m.assignments[kind+':'+id]=[...new Set(ids)];return validate(m);}
 function favorite(input,kind,id,on){
  const m=copy(input);
  // Backward compatibility: the original Note-only API was favorite(model,id,on).
  // New callers use favorite(model,kind,id,on) so Todo and Note ids can never collide.
  if(arguments.length===3){on=id;id=kind;kind='';}
  const numeric=Number(id);if(!Number.isSafeInteger(numeric)||numeric===0)throw Error('记录不存在');
  const key=kind?(String(kind)+':'+numeric):String(numeric);
  if(kind&&kind!=='todo'&&kind!=='note')throw Error('收藏类型不支持');
  if(on)m.favorites[key]=true;else{delete m.favorites[key];if(kind==='note')delete m.favorites[String(numeric)];}
  return m;
 }
 function isFavorite(m,kind,id){const numeric=Number(id);if(!m||!m.favorites||!Number.isFinite(numeric))return false;return !!m.favorites[String(kind)+':'+numeric]||(kind==='note'&&!!m.favorites[String(numeric)]);}
 function matches(m,kind,id,tag){if(!tag)return true;const parents=new Map(m.nodes.map(n=>[n.id,n.parent]));return (m.assignments[kind+':'+id]||[]).some(id=>{const seen=new Set();while(id&&!seen.has(id)){if(id===tag)return true;seen.add(id);id=parents.get(id);}return false;});}
 return {empty,validate,tree,seed,add,rename,move,remove,assign,favorite,isFavorite,matches};
});
