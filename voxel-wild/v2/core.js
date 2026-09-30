/* Voxel Wild 2.0 — original, dependency-free survival sandbox. MIT-0. */
(function(root){
'use strict';
const V=root.VW={}, C=16,H=64,SEA=20;
Object.assign(V,{C,H,SEA,VERSION:2});
const B=V.blocks={};
function block(id,name,color,hard=1,tool=null,tier=0,extra={}){B[id]={id,name,color,hard,tool,tier,stack:64,block:true,solid:true,...extra};}
block(1,'Grass','#729d42',.6,'shovel',0,{drop:2});block(2,'Earth','#8c6242',.55,'shovel');
block(3,'Stone','#8e9290',2,'pick',1,{drop:15});block(4,'Sand','#dfca91',.5,'shovel');
block(5,'Oak log','#856039',2,'axe');block(6,'Leaves','#4e873d',.3,null,0,{transparent:true});
block(7,'Oak planks','#c39964',1.5,'axe');block(8,'Bricks','#ae6352',2,'pick',1);
block(9,'Glass','#b0e0dc',.35,null,0,{transparent:true,drop:0});block(10,'Snow','#e4eeeb',.4,'shovel');
block(11,'Coal ore','#696e69',2.6,'pick',1,{drop:101});block(12,'Bedrock','#333e43',Infinity);
block(13,'Water','#4d99b7',Infinity,null,0,{solid:false,transparent:true,liquid:true});
block(15,'Cobblestone','#787f7e',2,'pick',1);block(16,'Iron ore','#b7977f',3,'pick',2,{drop:102});
block(17,'Gold ore','#daba51',3.5,'pick',3,{drop:103});block(18,'Diamond ore','#5ed3d0',4,'pick',3,{drop:104});
block(19,'Workbench','#a87845',1.5,'axe');block(20,'Furnace','#646a6c',3,'pick',1);
block(21,'Chest','#b18345',1.8,'axe');block(22,'Torch','#ffc869',.05,null,0,{solid:false,transparent:true,light:12});
block(23,'Wool','#e8e0d1',.7);block(24,'Bed','#a95642',.5,'axe',0,{height:.6});
block(25,'Oak door','#ad8451',1,'axe',0,{transparent:true});block(26,'Open door','#ad8451',1,'axe',0,{solid:false,transparent:true,drop:25});
block(27,'Farmland','#775333',.5,'shovel',0,{drop:2});block(28,'Young wheat','#6d9d37',.05,null,0,{solid:false,transparent:true,drop:109});
block(29,'Ripe wheat','#ddbc58',.05,null,0,{solid:false,transparent:true,drop:110});
block(30,'Oak sapling','#608745',.1,null,0,{solid:false,transparent:true});
block(31,'Lava','#ff813d',Infinity,null,0,{solid:false,transparent:true,liquid:true,light:10});
block(32,'Cactus','#749852',.6);block(33,'Obsidian','#403649',12,'pick',4);
block(34,'Clay','#9fa7ad',.6,'shovel');block(35,'Wildflower','#d68375',.05,null,0,{solid:false,transparent:true});
block(36,'Tall grass','#7f9946',.05,null,0,{solid:false,transparent:true,drop:109});
const I=V.items={...B};
function item(id,name,color,extra={}){I[id]={id,name,color,stack:64,...extra};}
item(100,'Stick','#bd9760');item(101,'Coal','#3b454e',{fuel:32});item(102,'Raw iron','#bb9986');item(103,'Raw gold','#dab650');item(104,'Diamond','#7ce3d4');
item(105,'Iron ingot','#d4dcdf');item(106,'Gold ingot','#f4cd66');item(107,'Apple','#d65c46',{food:4});item(108,'Raw meat','#bd7369',{food:3});
item(109,'Seeds','#96ad57');item(110,'Wheat','#dfbe66');item(111,'Bread','#d79d4c',{food:6});item(112,'Cooked meat','#b67540',{food:8});
item(113,'Brick','#b9694f');item(114,'Empty bucket','#aabcc5',{stack:1});item(115,'Water bucket','#67bbd8',{stack:1});item(116,'Lava bucket','#f6a053',{stack:1,fuel:90});
item(117,'Iron armor','#c4d4d6',{stack:1,armor:.55,durability:180});
for(const [i,label,color,tier,dur,mat] of [[0,'Wood','#af8459',1,60,7],[1,'Stone','#959f9a',2,132,15],[2,'Iron','#d0dadd',3,251,105],[3,'Diamond','#76d8cc',4,800,104]]){
 for(const [j,kind,label2] of [[0,'pick','pickaxe'],[1,'axe','axe'],[2,'shovel','shovel'],[3,'sword','sword'],[4,'hoe','hoe']]){
 item(120+i*5+j,label+' '+label2,color,{stack:1,tool:kind,tier,speed:2+tier*2,durability:dur,damage:kind==='sword'?3+tier*2:1+tier,material:mat});
 }}
for(const b of [5,7,19,21,25,26])I[b].fuel=6;
V.recipes=[];
function recipe(name,out,n,cost,station='hand'){V.recipes.push({name,out,n,cost,station});}
recipe('Planks',7,4,{5:1});recipe('Sticks',100,4,{7:2});recipe('Workbench',19,1,{7:4});recipe('Torches',22,4,{101:1,100:1});
recipe('Furnace',20,1,{15:8},'bench');recipe('Chest',21,1,{7:8},'bench');recipe('Door',25,2,{7:6},'bench');
recipe('Bed',24,1,{23:3,7:3},'bench');recipe('Bread',111,1,{110:3},'bench');recipe('Bricks',8,1,{113:4},'hand');
recipe('Bucket',114,1,{105:3},'bench');recipe('Iron armor',117,1,{105:8},'bench');
for(const t of Object.values(I).filter(x=>x.tool&&x.durability)){
 const counts={pick:3,axe:3,shovel:1,sword:2,hoe:2};recipe(t.name,t.id,1,{[t.material]:counts[t.tool],100:t.tool==='sword'?1:2},'bench');
}
V.smelts={102:105,103:106,108:112,4:9,34:113,5:101,15:3};
class Inventory{
 constructor(n=36,slots){this.slots=Array.from({length:n},(_,i)=>Inventory.clean(slots?.[i]));}
 static clean(s){if(!s||!I[s.id]||!Number.isInteger(s.count)||s.count<1)return null;const t=I[s.id];return{id:t.id,count:Math.min(t.stack,s.count),...(t.durability?{dur:Math.max(1,Math.min(t.durability,Number(s.dur)||t.durability))}:{})};}
 count(id){return this.slots.reduce((s,v)=>s+(v?.id===+id?v.count:0),0);}
 add(id,count=1,dur){id=+id;if(!I[id]||!Number.isInteger(count)||count<1)return count;const m=I[id].stack;
 if(m>1)for(const s of this.slots){if(s?.id===id&&s.count<m){const n=Math.min(m-s.count,count);s.count+=n;count-=n;if(!count)return 0;}}
 for(let i=0;i<this.slots.length&&count;i++)if(!this.slots[i]){let n=Math.min(m,count);this.slots[i]=Inventory.clean({id,count:n,dur});count-=n;}return count;
 }
 take(id,n=1){if(this.count(id)<n||n<0)return false;for(let i=0;i<this.slots.length&&n;i++){let s=this.slots[i];if(s?.id===+id){let q=Math.min(n,s.count);n-=q;s.count-=q;if(!s.count)this.slots[i]=null;}}return true;}
 craft(r,station='hand'){
 if(!V.recipes.includes(r)||r.station!=='hand'&&station!==r.station)return false;
 if(Object.entries(r.cost).some(([id,n])=>this.count(id)<n))return false;
 const saved=this.slots.map(s=>s&&{...s});for(const [id,n]of Object.entries(r.cost))this.take(id,n);
 if(this.add(r.out,r.n)){this.slots=saved;return false;}return true;
 }
 wear(slot,amount=1){let s=this.slots[slot];if(s&&I[s.id].durability){s.dur-=amount;if(s.dur<=0){this.slots[slot]=null;return true;}}return false;}
}
V.Inventory=Inventory;
function smelt(f,dt){
 if(!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,1);
 const output=V.smelts[f.input?.id],ready=output&&(!f.output||f.output.id===output&&f.output.count<64);
 if(f.recipe!==output){f.progress=0;f.recipe=output||0;}
 if(ready&&!(f.burn>0)&&I[f.fuel?.id]?.fuel){const id=f.fuel.id;f.burn=I[id].fuel;f.maxBurn=f.burn;if(--f.fuel.count<=0)f.fuel=id===116?{id:114,count:1}:null;}
 const burn=Math.min(dt,Math.max(0,f.burn||0));f.burn=Math.max(0,(f.burn||0)-dt);
 if(ready&&burn>0){f.progress=(f.progress||0)+burn;if(f.progress>=6){f.progress-=6;if(--f.input.count<=0)f.input=null;if(f.output)f.output.count++;else f.output={id:output,count:1};}}
 else f.progress=0;
}
V.smelt=smelt;
function seeded(seed){let s=2166136261;for(const c of String(seed))s=Math.imul(s^c.charCodeAt(0),16777619);return s;}
function hash(s,x,z,k=0){let a=Math.imul(x^s,374761393)^Math.imul(z+k,668265263);a=Math.imul(a^(a>>>13),1274126177);return((a^(a>>>16))>>>0)/4294967295;}
function noise(s,x,z){let a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return(hash(s,a,b)*(1-u)+hash(s,a+1,b)*u)*(1-v)+(hash(s,a,b+1)*(1-u)+hash(s,a+1,b+1)*u)*v;}
Object.assign(V,{hash,noise,seeded});
const key=(x,y,z)=>x+','+y+','+z,ckey=(x,z)=>x+','+z;
class World{
 constructor(seed='wild-2'){this.seed=String(seed).slice(0,40);this.s=seeded(this.seed);this.chunks=new Map();this.edits=new Map();this.entities={};this.crops={};this.dirty=new Set();}
 terrain(x,z){const n=(a,b)=>noise(this.s,a,b),ridge=n(x/90,z/90);const h=Math.floor(14+ridge*24+n(x/27,z/27)*9+n(x/8,z/8)*3);const temp=n(x/150+32,z/150-40);return{h,biome:h<SEA?'Coast':h>42||temp<.25?'Alpine':temp>.68?'Desert':n(x/50+21,z/50)>.44?'Forest':'Meadow'};}
 generate(cx,cz){
 const k=ckey(cx,cz);if(this.chunks.has(k))return this.chunks.get(k);
 const data=new Uint8Array(C*C*H),top=new Uint8Array(C*C),s=this.s,x0=cx*C,z0=cz*C;
 const set=(x,y,z,t)=>{if(x>=x0&&x<x0+C&&z>=z0&&z<z0+C&&y>=0&&y<H)data[x-x0+C*(z-z0+C*y)]=t;};
 const get=(x,y,z)=>data[x-x0+C*(z-z0+C*y)]||0;
 for(let z=z0;z<z0+C;z++)for(let x=x0;x<x0+C;x++){
 const {h,biome}=this.terrain(x,z);top[x-x0+C*(z-z0)]=h;
 for(let y=0;y<=Math.max(h,SEA);y++){
 let t=y===0?12:y>h?13:y===h?(h<=SEA+1||biome==='Desert'?4:biome==='Alpine'?10:1):y>h-4?(h<=SEA+1||biome==='Desert'?4:2):3;
 if(t===4&&h<=SEA&&y>=h-2&&hash(s,Math.floor(x/3),Math.floor(z/3),91)<.24)t=34;
 if(t===3){const r=hash(s,x+y*137,z,31);if(r>.982)t=11;else if(r<.013&&y<33)t=16;else if(r>.5&&r<.505&&y<21)t=17;else if(r>.7&&r<.703&&y<14)t=18;
 const a=Math.sin(x*.125+Math.sin(z*.09)*2+y*.17),b=Math.cos(z*.115+Math.sin(x*.08)*2-y*.135);
 if(y>3&&y<h-4&&Math.abs(a+b)<.11&&noise(s,x/19+y*.18,z/19)>.38)t=y<6?31:0;
 }set(x,y,z,t);
 }
 // Narrow surface ravines provide visible, walkable cave entrances.
 if(h>SEA+5&&biome!=='Desert'&&noise(s,x/21+43,z/21-61)>.65&&Math.abs(Math.sin(x*.055)+Math.cos(z*.07))<.055){for(let y=h;y>Math.max(7,h-16);y--)set(x,y,z,0);}
 }
 // Tree origins are evaluated in a halo: chunk generation order never affects leaves.
 for(let z=z0-3;z<z0+C+3;z++)for(let x=x0-3;x<x0+C+3;x++){
 const {h,biome}=this.terrain(x,z),r=hash(s,x,z,424);
 if(h<=SEA+2)continue;
 if(biome==='Desert'){if(r<.009)for(let y=1;y<4;y++)set(x,h+y,z,32);continue;}
 if(biome==='Alpine')continue;
 if(r<(biome==='Forest'?.022:.009)){
 const tall=4+Math.floor(hash(s,x,z,63)*3);
 for(let y=h+tall-2;y<=h+tall+1;y++)for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
 if(Math.abs(dx)+Math.abs(dz)>3||y===h+tall+1&&(Math.abs(dx)>1||Math.abs(dz)>1))continue;
 if(!get(x+dx,y,z+dz))set(x+dx,y,z+dz,6);
 }for(let y=1;y<=tall;y++)set(x,h+y,z,5);
 }else if(r>.975)set(x,h+1,z,36);else if(r>.966)set(x,h+1,z,35);
 }
 const edits=this.edits.get(k);if(edits)for(const[i,t]of edits)data[i]=t;
 const chunk={cx,cz,data,top};this.chunks.set(k,chunk);this.dirty.add(k);return chunk;
 }
 get(x,y,z,load=true){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(y<0)return 12;if(y>=H)return 0;let cx=Math.floor(x/C),cz=Math.floor(z/C),c=this.chunks.get(ckey(cx,cz));if(!c&&load)c=this.generate(cx,cz);return c?c.data[x-cx*C+C*(z-cz*C+C*y)]:0;}
 set(x,y,z,t){if(![x,y,z,t].every(Number.isInteger)||y<=0||y>=H||t!==0&&!B[t]||Math.abs(x)>1000000||Math.abs(z)>1000000)return false;
 const cx=Math.floor(x/C),cz=Math.floor(z/C),k=ckey(cx,cz),c=this.generate(cx,cz),i=x-cx*C+C*(z-cz*C+C*y);if(c.data[i]===t)return false;c.data[i]=t;
 if(!this.edits.has(k))this.edits.set(k,new Map());this.edits.get(k).set(i,t);this.dirty.add(k);
 if(x-cx*C===0)this.dirty.add(ckey(cx-1,cz));if(x-cx*C===15)this.dirty.add(ckey(cx+1,cz));if(z-cz*C===0)this.dirty.add(ckey(cx,cz-1));if(z-cz*C===15)this.dirty.add(ckey(cx,cz+1));return true;}
 solid(x,y,z){return B[this.get(x,y,z)]?.solid||false;}
 surface(x,z){for(let y=H-2;y>=0;y--){const t=this.get(x,y,z);if(B[t]?.solid&&t!==6&&t!==5)return y+1;}return SEA+1;}
 spawn(){for(let r=0;r<220;r+=3)for(let j=0;j<12;j++){const x=Math.floor(Math.cos(j*Math.PI/6)*r),z=Math.floor(Math.sin(j*Math.PI/6)*r);const {h,biome}=this.terrain(x,z);if(h>SEA+2&&biome!=='Desert'&&biome!=='Alpine'&&noise(this.s,x/150+32,z/150-40)>.32&&noise(this.s,x/150+32,z/150-40)<.64&&this.get(x,h,z)===1&&!this.solid(x,h+1,z)&&!this.solid(x,h+2,z)&&!this.solid(x,h+3,z)&&!this.solid(x,h+4,z))return{x:x+.5,y:h+1.02,z:z+.5};}return{x:.5,y:this.surface(0,0)+1,z:.5};}
 export(){return{seed:this.seed,edits:[...this.edits].map(([k,m])=>[k,[...m]]),entities:this.entities,crops:this.crops};}
 import(data){
 if(!data||!Array.isArray(data.edits)||data.edits.length>20000)throw Error('Invalid world edits');
 const edits=new Map();let count=0;
 for(const entry of data.edits){if(!Array.isArray(entry)||entry.length!==2)throw Error('Invalid chunk');const[k,list]=entry;if(!/^-?\d+,-?\d+$/.test(k)||!Array.isArray(list)||list.length>C*C*H)throw Error('Invalid chunk');const[cx,cz]=k.split(',').map(Number);if(Math.abs(cx)>62500||Math.abs(cz)>62500)throw Error('World coordinate limit');const m=new Map();for(const e of list){if(!Array.isArray(e)||e.length!==2)throw Error('Invalid edit');const[i,t]=e;if(!Number.isInteger(i)||i<C*C||i>=C*C*H||!Number.isInteger(t)||(t!==0&&!B[t]))throw Error('Invalid block');m.set(i,t);if(++count>2000000)throw Error('World too large');}edits.set(k,m);}
 this.edits=edits;this.chunks.clear();this.dirty.clear();this.entities={};this.crops={};
 const validKey=k=>/^-?\d+,\d+,-?\d+$/.test(k)&&k.split(',').every(n=>Math.abs(+n)<1000001)&&+k.split(',')[1]>0&&+k.split(',')[1]<H;
 for(const[k,e]of Object.entries(data.entities||{}).slice(0,20000)){if(!validKey(k)||!e)continue;if(e.kind==='chest')this.entities[k]={kind:'chest',slots:new Inventory(27,e.slots).slots};else if(e.kind==='furnace')this.entities[k]={kind:'furnace',input:Inventory.clean(e.input),fuel:Inventory.clean(e.fuel),output:Inventory.clean(e.output),burn:Math.max(0,Math.min(90,+e.burn||0)),progress:Math.max(0,Math.min(6,+e.progress||0)),recipe:+e.recipe||0};}
 for(const[k,t]of Object.entries(data.crops||{}).slice(0,20000))if(validKey(k)&&Number.isFinite(t))this.crops[k]=Math.max(0,t);
 }
}
V.World=World;V.key=key;V.ckey=ckey;
V.raycast=function(w,origin,direction,max=6){let cell=origin.map(Math.floor),step=direction.map(v=>v>=0?1:-1),delta=direction.map(v=>Math.abs(v)<1e-9?Infinity:Math.abs(1/v)),dist=cell.map((v,i)=>Math.abs(direction[i])<1e-9?Infinity:(v+(direction[i]>0?1:0)-origin[i])/direction[i]),prev=cell.slice(),d=0;
 for(let n=0;n<128&&d<=max;n++){const t=w.get(...cell);if(t&&!B[t]?.liquid)return{cell:cell.slice(),prev:prev.slice(),type:t,distance:d};prev=cell.slice();let a=dist[0]<dist[1]?(dist[0]<dist[2]?0:2):(dist[1]<dist[2]?1:2);d=dist[a];cell[a]+=step[a];dist[a]+=delta[a];}return null;};
V.mining=function(type,held,creative=false){const b=B[type],t=I[held?.id];if(!b||!Number.isFinite(b.hard))return{seconds:Infinity,drop:false};const match=t?.tool===b.tool;return{seconds:creative ? .06 : Math.max(.12,b.hard*(match?1/Math.max(1,t.speed):1)),drop:creative||b.tier===0||(match&&t.tier>=b.tier)};};
if(typeof module!=='undefined')module.exports=V;
})(globalThis);
