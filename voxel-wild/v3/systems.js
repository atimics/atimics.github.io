/* Voxel Wild 3.0 — deterministic crafting, fluid updates and workshop machines.
 * Original rules, not a Minecraft compatibility implementation. MIT-0.
 * Simulation advances in 100 ms ticks. All work is bounded and serializable.
 */
(function(V) {
'use strict';
const B=V.blocks,I=V.items,K=V.key;
const D=[[0,0,-1],[1,0,0],[0,0,1],[-1,0,0]],N=[...D,[0,1,0],[0,-1,0]];
const pos=k=>k.split(',').map(Number),add=(p,d)=>p.map((v,i)=>v+d[i]);
const validPos=k=>typeof k==='string'&&/^-?\d+,\d+,-?\d+$/.test(k)&&pos(k).every(Number.isSafeInteger)&&Math.abs(pos(k)[0])<=1000000&&Math.abs(pos(k)[2])<=1000000&&pos(k)[1]>0&&pos(k)[1]<V.H;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
function block(id,name,color,extra={}) { B[id]=I[id]={id,name,color,hard:1,tool:'pick',tier:0,stack:64,block:true,solid:true,...extra}; }
block(40,'Signal ore','#bf5e45',{hard:3,tier:2,drop:140});
block(41,'Signal wire','#8b3b32',{hard:.1,solid:false,transparent:true,tool:null,height:.06});
block(42,'Powered wire','#ff8656',{...B[41],id:42,name:'Powered wire',color:'#ff8656',drop:41,hidden:true});
block(43,'Lever','#8d8b79',{hard:.4,tool:null,solid:false,transparent:true,height:.45});
block(44,'Lever on','#e8b961',{...B[43],id:44,name:'Lever on',color:'#e8b961',drop:43,hidden:true});
block(45,'Signal lamp','#8b744c',{hard:.8});
block(46,'Lit signal lamp','#ffe3a3',{...B[45],id:46,name:'Lit signal lamp',color:'#ffe3a3',light:14,drop:45,hidden:true});
block(47,'Piston','#a79768',{hard:2,tier:1});
block(48,'Extended piston','#a79768',{...B[47],id:48,name:'Extended piston',drop:47,hidden:true});
block(49,'Piston head','#bca477',{hard:2,drop:0,hidden:true});
block(50,'Hopper','#737e81',{hard:2,tier:1,height:.85});
block(51,'Flowing water','#4d99b7',{...B[13],id:51,name:'Flowing water',hidden:true});
block(52,'Flowing lava','#ff813d',{...B[31],id:52,name:'Flowing lava',hidden:true});
block(53,'Repeater','#aaaba1',{hard:.25,solid:false,transparent:true,tool:null,height:.13});
block(55,'Pressure plate','#aa9c79',{hard:.5,tool:null,height:.09});
block(56,'Pressed plate','#d4bb81',{...B[55],id:56,name:'Pressed plate',color:'#d4bb81',drop:55,hidden:true});
block(57,'Sticky piston','#8cab70',{...B[47],id:57,name:'Sticky piston',color:'#8cab70'});
block(58,'Extended sticky piston','#8cab70',{...B[57],id:58,name:'Extended sticky piston',drop:57,hidden:true});
block(59,'Powered repeater','#e2a071',{...B[53],id:59,name:'Powered repeater',color:'#e2a071',drop:53,hidden:true});
block(60,'Push button','#aaa899',{hard:.25,solid:false,transparent:true,tool:null,height:.2});
block(61,'Pressed button','#e6b16e',{...B[60],id:61,name:'Pressed button',color:'#e6b16e',drop:60,hidden:true});
block(62,'Stone slab','#8e9290',{hard:1.2,tier:1,height:.5});
block(63,'Oak slab','#c39964',{hard:1,tool:'axe',height:.5,fuel:3});
I[140]={id:140,name:'Signal dust',color:'#f47b4c',stack:64};
I[141]={id:141,name:'Resin',color:'#a7c779',stack:64};
const kinds={41:'wire',42:'wire',43:'lever',44:'lever',45:'lamp',46:'lamp',47:'piston',48:'piston',50:'hopper',53:'repeater',55:'plate',56:'plate',57:'sticky',58:'sticky',59:'repeater',60:'button',61:'button'};
V.machineKind=id=>kinds[id]||null;V.directions=D;
V.isWater=t=>t===13||t===51;V.isLava=t=>t===31||t===52;
V.fluidKind=t=>V.isWater(t)?13:V.isLava(t)?31:0;

// All recipes have explicit shapes. Translations and horizontal mirrors match;
// rotations, extra items, wrong ingredient positions and hidden state IDs do not.
const patterns={7:[[5]],100:[[7],[7]],19:[[7,7],[7,7]],22:[[101],[100]],20:[[15,15,15],[15,0,15],[15,15,15]],21:[[7,7,7],[7,0,7],[7,7,7]],25:[[7,7],[7,7],[7,7]],24:[[23,23,23],[7,7,7]],111:[[110,110,110]],8:[[113,113],[113,113]],114:[[105,0,105],[0,105,0]],117:[[105,0,105],[105,105,105],[105,105,105]]};
for(const t of Object.values(I).filter(t=>t.tool&&t.durability)) {
 const m=t.material;
 patterns[t.id]=t.tool==='pick'?[[m,m,m],[0,100,0],[0,100,0]]:t.tool==='axe'?[[m,m],[m,100],[0,100]]:t.tool==='shovel'?[[m],[100],[100]]:t.tool==='sword'?[[m],[m],[100]]:[[m,m],[0,100],[0,100]];
}
function recipe(out,n,pattern,station='bench') {
 const cost={};for(const row of pattern)for(const id of row)if(id)cost[id]=(cost[id]||0)+1;
 V.recipes.push({name:I[out].name,out,n,cost,station});patterns[out]=pattern;
}
recipe(41,8,[[140]],'hand');recipe(43,1,[[100],[15]],'hand');
recipe(45,1,[[9,140,9],[140,22,140],[9,140,9]]);
recipe(47,1,[[7,7,7],[15,105,15],[15,140,15]]);
recipe(50,1,[[105,0,105],[105,21,105],[0,105,0]]);
recipe(53,1,[[22,140,22],[3,3,3]]);recipe(55,1,[[3,3]],'hand');
recipe(141,1,[[30,30],[30,30]],'hand');recipe(57,1,[[141],[47]],'hand');
recipe(60,1,[[3]],'hand');recipe(62,6,[[3,3,3]]);recipe(63,6,[[7,7,7]]);
V.patterns=patterns;
V.matchGrid=function(slots,size=3) {
 if(![2,3].includes(size)||!Array.isArray(slots))return null;
 let minX=size,minY=size,maxX=-1,maxY=-1;
 for(let i=0;i<size*size;i++)if(slots[i]?.count>0){minX=Math.min(minX,i%size);maxX=Math.max(maxX,i%size);minY=Math.min(minY,Math.floor(i/size));maxY=Math.max(maxY,Math.floor(i/size));}
 if(maxX<0)return null;
 for(const r of V.recipes){const p=patterns[r.out];if(!p||p.length!==maxY-minY+1||p[0].length!==maxX-minX+1||r.station==='bench'&&size<3)continue;
  for(const mirror of [false,true]){let ok=true;for(let y=0;y<p.length;y++)for(let x=0;x<p[0].length;x++)if((slots[(y+minY)*size+x+minX]?.id||0)!==p[y][mirror?p[0].length-1-x:x])ok=false;if(ok)return r;}
 }return null;
};
V.craftGrid=function(slots,size,inventory) {
 const r=V.matchGrid(slots,size);if(!r)return false;
 const trial=new V.Inventory(inventory.slots.length,inventory.slots);if(trial.add(r.out,r.n))return false;
 for(let i=0;i<size*size;i++)if(slots[i]&&--slots[i].count===0)slots[i]=null;
 inventory.slots=trial.slots;return r;
};
V.fillGrid=function(slots,size,inventory,r) {
 if(!V.recipes.includes(r)||r.station==='bench'&&size<3)return false;
 const p=patterns[r.out];if(!p||p.length>size||p[0].length>size)return false;
 const trial=new V.Inventory(inventory.slots.length,inventory.slots);
 for(const s of slots)if(s&&trial.add(s.id,s.count,s.dur))return false;
 if(Object.entries(r.cost).some(([id,n])=>trial.count(id)<n))return false;
 const next=Array(size*size).fill(null);
 for(let y=0;y<p.length;y++)for(let x=0;x<p[0].length;x++){const id=p[y][x];if(id){trial.take(id);next[y*size+x]={id,count:1};}}
 inventory.slots=trial.slots;slots.splice(0,slots.length,...next);return true;
};

class WorkQueue {
 constructor(keys=[]) {this.list=[];this.offset=0;this.set=new Set();for(const k of keys)this.add(k);}
 add(k) {if(!this.set.has(k)&&this.set.size<65536){this.set.add(k);this.list.push(k);}}
 take(){if(this.offset>=this.list.length)return null;const k=this.list[this.offset++];this.set.delete(k);if(this.offset>4096&&this.offset>this.list.length/2){this.list=this.list.slice(this.offset);this.offset=0;}return k;}
 export(){return this.list.slice(this.offset);}
 get size(){return this.set.size;}
}
V.WorkQueue=WorkQueue;
function wake(w,p) {for(const d of [[0,0,0],...N]){const a=add(p,d);if(a[1]>0&&a[1]<V.H)w.updates.add(K(...a));}}
function mark(w,p) {const x=Math.floor(p[0]/16),z=Math.floor(p[2]/16);for(const[a,b]of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])w.dirty.add(V.ckey(x+a,z+b));}
const BaseWorld=V.World;
class LivingWorld extends BaseWorld {
 constructor(seed){super(seed);this.logic={};this.flows={};this.updates=new WorkQueue();this.simTick=0;this.workshop=false;}
 generate(cx,cz){const c=super.generate(cx,cz);if(!c.living){c.living=true;const edits=this.edits.get(V.ckey(cx,cz));for(let y=2;y<24;y++)for(let z=0;z<16;z++)for(let x=0;x<16;x++){const i=x+16*(z+16*y);if(c.data[i]===3&&!edits?.has(i)&&V.hash(this.s,cx*16+x+y*91,cz*16+z,769)>.988)c.data[i]=40;}}return c;}
 set(x,y,z,t){if(![x,y,z,t].every(Number.isInteger)||y<=0||y>=V.H||Math.abs(x)>1000000||Math.abs(z)>1000000||(t!==0&&!B[t]))return false;if(kinds[t]&&!this.logic[K(x,y,z)]&&Object.keys(this.logic).length>=4096)return false;
  const old=this.get(x,y,z);if(!super.set(x,y,z,t))return false;const k=K(x,y,z),kind=kinds[t];
  if(kind){if(this.logic[k]?.kind!==kind)this.logic[k]={kind,dir:0,delay:2,power:0,on:t===44,output:t===59,extended:t===48||t===58};}
  else delete this.logic[k];
  if(t!==51&&t!==52)delete this.flows[k];
  wake(this,[x,y,z]);return true;
 }
 export(){return{...super.export(),logic:this.logic,flows:this.flows,updates:this.updates.export(),simTick:this.simTick,workshop:this.workshop};}
 import(data){
  // Validate extension data before any mutation, including queue bounds.
  const logic=Object.entries(data?.logic||{}),flows=Object.entries(data?.flows||{}),updates=data?.updates||[];
  if(logic.length>4096||flows.length>65536||!Array.isArray(updates)||updates.length>65536)throw Error('Simulation state limit exceeded.');
  if(logic.some(([k,v])=>!validPos(k)||!v||typeof v!=='object')||flows.some(([k,v])=>!validPos(k)||!v||![13,31].includes(v.kind)||!Number.isInteger(v.level)||v.level<1||v.level>7)||updates.some(k=>!validPos(k)))throw Error('Invalid simulation state.');
  super.import(data);this.logic={};this.flows={};this.updates=new WorkQueue(updates);this.simTick=clamp(Math.floor(data.simTick||0),0,1e10);this.workshop=data.workshop===true;
  const registry=new Map(logic),fluidRegistry=new Map(flows);
  for(const [ck,edits]of this.edits){const[cx,cz]=ck.split(',').map(Number);for(const[i,t]of edits){const p=[cx*16+i%16,Math.floor(i/256),cz*16+Math.floor(i%256/16)],k=K(...p),kind=kinds[t];
   if(kind){if(Object.keys(this.logic).length>=4096)throw Error('Machine limit exceeded.');const s=registry.get(k)||{};this.logic[k]={kind,dir:Math.floor(clamp(s.dir,0,3)),delay:Math.floor(clamp(s.delay||2,1,4)),power:0,on:t===44,output:t===59,extended:t===48||t===58,until:clamp(s.until,0,1e10),pending:typeof s.pending==='boolean'?s.pending:null,due:clamp(s.due,0,1e10)};}
   if(t===51||t===52){const f=fluidRegistry.get(k);if(f&&f.kind!==(t===51?13:31))throw Error('Fluid kind disagrees with its block.');this.flows[k]=f?{kind:f.kind,level:f.level,falling:f.falling===true}:{kind:t===51?13:31,level:7,falling:false};wake(this,p);}
   if(t===13||t===31)wake(this,p);
  }}
  for(const[k,e]of Object.entries(data.entities||{})){if(e?.kind==='hopper'&&validPos(k)&&this.logic[k]?.kind==='hopper')this.entities[k]={kind:'hopper',slots:new V.Inventory(5,e.slots).slots};}
 }
}
const importLiving=LivingWorld.prototype.import;
LivingWorld.prototype.import=function(data){const fields=['edits','chunks','dirty','entities','crops','logic','flows','updates','simTick','workshop'],before=Object.fromEntries(fields.map(k=>[k,this[k]]));try{return importLiving.call(this,data);}catch(e){Object.assign(this,before);throw e;}};
V.World=LivingWorld;

function flowLevel(w,p,kind){const t=w.get(...p);return t===kind?0:V.fluidKind(t)===kind?(w.flows[K(...p)]?.level||7):99;}
function canFlow(t){return t===0||t===51||t===52;}
function fluidUpdate(w,p){
 const k=K(...p),t=w.get(...p),kind=V.fluidKind(t);
 if(kind){for(const d of N){const q=add(p,d),other=V.fluidKind(w.get(...q));if(other&&other!==kind){if(kind===31){w.set(...p,t===31?33:15);return;}const ot=w.get(...q);w.set(...q,ot===31?33:15);}}}
 if(t===13||t===31){for(const d of [[0,-1,0],...D]){const q=add(p,d);if(q[1]>0&&canFlow(w.get(...q)))w.updates.add(K(...q));}return;}
 if(!canFlow(t))return;
 let choice=null;
 for(const fluid of [13,31]){
  const up=add(p,[0,1,0]),ut=w.get(...up);let level=99,falling=false;
  if(V.fluidKind(ut)===fluid){level=1;falling=true;}
  else for(const d of D){const q=add(p,d),qt=w.get(...q),below=w.get(q[0],q[1]-1,q[2]);if(V.fluidKind(qt)!==fluid)continue;
   // Falling columns do not spread laterally until they meet a floor or pool.
   if(!(B[below]?.solid||V.fluidKind(below)===fluid&&!w.flows[K(q[0],q[1]-1,q[2])]?.falling))continue;
   if((qt===51||qt===52)&&w.flows[K(...q)]?.falling&&!(B[below]?.solid||V.fluidKind(below)===fluid))continue;
   level=Math.min(level,flowLevel(w,q,fluid)+1);
  }
  const limit=fluid===13?7:3;if(level<=limit){choice={kind:fluid,level,falling};break;}
 }
 if(choice){const ft=choice.kind===13?51:52,old=w.flows[k];w.set(...p,ft);if(!old||old.level!==choice.level||old.falling!==choice.falling||old.kind!==choice.kind){w.flows[k]=choice;mark(w,p);wake(w,p);}}
 else if(t===51||t===52)w.set(...p,0);
}

function poweredToward(w,levels,k,to){const s=w.logic[k];if(!s)return 0;if(s.kind==='wire')return levels.get(k)||0;if(s.kind==='lever')return s.on?15:0;if(s.kind==='button'||s.kind==='plate')return s.on?15:0;
 if(s.kind==='repeater'&&s.output){const q=add(pos(k),D[s.dir]);return K(...q)===to?15:0;}return 0;}
function inputPower(w,levels,p){const k=K(...p);return Math.max(0,...N.map(d=>poweredToward(w,levels,K(...add(p,d)),k)));}
V.intersectsBlock=function(p,actors){return actors.some(a=>a.x+.3>p[0]&&a.x-.3<p[0]+1&&a.z+.3>p[2]&&a.z-.3<p[2]+1&&a.y+1.8>p[1]&&a.y<p[1]+1);};
function pushable(w,p){const t=w.get(...p);return !!B[t]?.solid&&!kinds[t]&&![12,19,20,21,24,25,26,49].includes(t)&&!w.entities[K(...p)];}
V.piston=function(w,k,extend,actors=[]) {
 const s=w.logic[k];if(!s||!['piston','sticky'].includes(s.kind)||s.extended===extend)return false;
 const p=pos(k),d=D[s.dir],front=add(p,d),sticky=s.kind==='sticky';
 if(extend){const line=[];let q=front.slice();for(let n=0;n<=12;n++){const t=w.get(...q);if(t===0)break;if(n===12||!pushable(w,q))return false;line.push({p:q.slice(),t});q=add(q,d);}
  const writes=[{p:front,t:49},...line.map(b=>({p:add(b.p,d),t:b.t}))];
  if(writes.some(b=>!validPos(K(...b.p))||V.intersectsBlock(b.p,actors)))return false;
  for(let i=line.length-1;i>=0;i--)w.set(...add(line[i].p,d),line[i].t);
  w.set(...front,49);w.set(...p,sticky?58:48);s.extended=true;return true;
 }
 if(w.get(...front)===49)w.set(...front,0);
 if(sticky){const q=add(front,d);if(pushable(w,q)&&!V.intersectsBlock(front,actors)){const t=w.get(...q);w.set(...q,0);w.set(...front,t);}}
 w.set(...p,sticky?57:47);s.extended=false;return true;
};

// One item is removed only after a valid destination has accepted it.
function insert(e,item) {
 if(!e||!item)return false;
 if(e.kind==='chest'||e.kind==='hopper'){const inv=new V.Inventory(e.kind==='chest'?27:5,e.slots);if(inv.add(item.id,1,item.dur))return false;e.slots=inv.slots;return true;}
 if(e.kind==='furnace'){const prop=V.smelts[item.id]?'input':I[item.id]?.fuel?'fuel':null;if(!prop)return false;const cur=e[prop];if(cur&&cur.id!==item.id||cur&&cur.count>=I[item.id].stack)return false;e[prop]=cur?{...cur,count:cur.count+1}:{...item,count:1};return true;}return false;
}
function takeSlot(e,index){if(e.kind==='furnace'){if(--e.output.count<=0)e.output=null;}else if(--e.slots[index].count<=0)e.slots[index]=null;}
function stacks(e){return !e?[]:e.kind==='furnace'?[[0,e.output]]:(e.slots||[]).map((s,i)=>[i,s]);}
V.hopper=function(w,k){const s=w.logic[k];if(!s||s.kind!=='hopper'||s.power>0)return 0;const p=pos(k);let e=w.entities[k];if(!e||e.kind!=='hopper')e=w.entities[k]={kind:'hopper',slots:Array(5).fill(null)};
 let moved=0;const below=w.entities[K(...add(p,[0,-1,0]))],above=w.entities[K(...add(p,[0,1,0]))];
 for(const[i,item]of stacks(e))if(item&&insert(below,item)){takeSlot(e,i);moved++;break;}
 for(const[i,item]of stacks(above))if(item&&insert(e,item)){takeSlot(above,i);moved++;break;}
 return moved;
};
V.tickSystems=function(w,actor={x:0,y:1,z:0},radius=4,mobs=[]) {
 w.simTick++;const active=k=>{const p=pos(k);return Math.abs(p[0]-actor.x)<radius*16&&Math.abs(p[2]-actor.z)<radius*16;};
 const entries=Object.entries(w.logic).filter(([k])=>active(k)).sort(([a],[b])=>a.localeCompare(b));
 for(const[k,s]of entries){const p=pos(k);
  if(s.kind==='plate'){s.on=V.intersectsBlock([p[0],p[1]-.1,p[2]],[actor,...mobs])&&[actor,...mobs].some(a=>Math.abs(a.y-(p[1]+.09))<.22&&Math.abs(a.x-p[0]-.5)<.8&&Math.abs(a.z-p[2]-.5)<.8);w.set(...p,s.on?56:55);}
  if(s.kind==='button'){s.on=(s.until||0)>w.simTick;w.set(...p,s.on?61:60);}
  if(s.kind==='repeater'&&typeof s.pending==='boolean'&&s.due<=w.simTick){s.output=s.pending;s.pending=null;w.set(...p,s.output?59:53);}
 }
 const levels=new Map(),queue=[];
 for(const[k,s]of entries)if(s.kind==='wire'){const p=pos(k),power=Math.max(0,...N.map(d=>{const q=K(...add(p,d));return w.logic[q]?.kind==='wire'?0:poweredToward(w,levels,q,k);}));if(power){levels.set(k,power);queue.push(k);}}
 for(let i=0;i<queue.length;i++){const k=queue[i],level=levels.get(k)-1;if(level<=0)continue;for(const d of N){const q=K(...add(pos(k),d));if(w.logic[q]?.kind==='wire'&&active(q)&&level>(levels.get(q)||0)){levels.set(q,level);queue.push(q);}}}
 for(const[k,s]of entries){const p=pos(k);s.power=s.kind==='wire'?(levels.get(k)||0):inputPower(w,levels,p);
  if(s.kind==='wire')w.set(...p,s.power?42:41);
  if(s.kind==='lamp')w.set(...p,s.power?46:45);
  if(s.kind==='repeater'){const d=D[s.dir],q=p.map((v,i)=>v-d[i]),target=poweredToward(w,levels,K(...q),k)>0;if(target===s.output){s.pending=null;}else if(s.pending!==target){s.pending=target;s.due=w.simTick+s.delay;}}
  if(s.kind==='piston'||s.kind==='sticky')V.piston(w,k,s.power>0,[actor,...mobs]);
 }
 if(w.simTick%4===0)for(const[k,s]of entries)if(s.kind==='hopper')V.hopper(w,k);
 const count=Math.min(w.updates.size,256);
 for(let i=0;i<count;i++){const k=w.updates.take();if(!k)break;if(!active(k)){w.updates.add(k);continue;}const p=pos(k);if((V.isLava(w.get(...p))||N.some(d=>V.isLava(w.get(...add(p,d)))))&&w.simTick%3){w.updates.add(k);continue;}fluidUpdate(w,p);}
 return{machines:entries.length,queued:w.updates.size,tick:w.simTick};
};
V.toggleMachine=function(w,k) {const s=w.logic[k];if(!s)return false;const p=pos(k);if(s.kind==='lever'){s.on=!s.on;w.set(...p,s.on?44:43);return true;}if(s.kind==='button'){s.until=w.simTick+10;s.on=true;w.set(...p,61);return true;}if(s.kind==='repeater'){s.delay=s.delay%4+1;return true;}return false;};
if(typeof module!=='undefined')module.exports=V;
})(typeof module!=='undefined'?require('./core.js'):globalThis.VW);
