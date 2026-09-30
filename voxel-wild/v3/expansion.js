/* Voxel Wild 3 — game and accessible-UI adapters for the pure simulation module. */
(function(V){
'use strict';
const K=V.key,$=id=>document.getElementById(id),P=V.Game.prototype;
const base={use:P.use,step:P.step,newWorld:P.newWorld,restore:P.restore,snapshot:P.snapshot,breakBlock:P.breakBlock,damage:P.damage};
function returnGrid(g){if(!g.craftSlots)return;for(const s of g.craftSlots)if(s){const left=g.inventory.add(s.id,s.count,s.dur);if(left)g.drop(s.id,left,g.player.x,g.player.y+.3,g.player.z,s.dur);}g.craftSlots=[];}
P.newWorld=function(...args){this.craftSlots=[];this.systemAcc=0;base.newWorld.apply(this,args);};
P.snapshot=function(){return{...base.snapshot.call(this),craftSlots:this.craftSlots||[]};};
P.restore=function(s){const migrated=s?.version===2?{...s,version:3}:s;const grid=(Array.isArray(migrated?.craftSlots)?migrated.craftSlots:[]).slice(0,9).map(V.Inventory.clean);base.restore.call(this,migrated);this.craftSlots=grid;returnGrid(this);this.systemAcc=0;if(s.version===2)this.notice('Copied a 2.0 world into 3.0. The original save is unchanged.');};
P.damage=function(...args){if(this.mode!=='creative'&&this.invulnerable<=0&&!this.dead&&this.health<=args[0])returnGrid(this);return base.damage.apply(this,args);};
const moveBase=P.move;
P.move=function(dx,dy,dz){const p=this.player;if(this.grounded&&!this.flying&&(dx||dz)&&this.collides(p.x+dx,p.y,p.z+dz)){for(let i=1;i<=6;i++){const h=i*.1+.001;if(!this.collides(p.x,p.y+h,p.z)&&!this.collides(p.x+dx,p.y+h,p.z+dz)){p.y+=h;break;}}}return moveBase.call(this,dx,dy,dz);};
P.step=function(dt){base.step.call(this,dt);if(!this.started||this.paused||this.dead)return;this.systemAcc=(this.systemAcc||0)+dt;let n=0;while(this.systemAcc>=.1&&n++<4){this.systemAcc-=.1;this.systemStats=V.tickSystems(this.world,this.player,this.radius,this.mobs);}this.systemAcc=Math.min(.4,this.systemAcc);};
P.use=function(){if(this.paused||this.dead||this.panel)return;const h=this.target,s=h&&this.world.logic[h.cell.join(',')];
 if(s&&!this.keys.ShiftLeft){if(V.toggleMachine(this.world,h.cell.join(','))){this.sound('place');if(s.kind==='repeater')this.notice('Repeater delay: '+s.delay+' ticks ('+s.delay*100+' ms). R rotates.');this.ui?.refresh();return;}
  if(s.kind==='hopper'){const k=h.cell.join(',');if(!this.world.entities[k])this.world.entities[k]={kind:'hopper',slots:Array(5).fill(null)};this.ui?.openPanel('hopper',k);return;}}
 const p=h?.prev.slice(),before=p?this.world.get(...p):null;base.use.call(this);
 if(p&&before!==this.world.get(...p)){const k=K(...p),state=this.world.logic[k];if(state){state.dir=((Math.round(this.yaw/(Math.PI/2))%4)+4)%4;if(state.kind==='hopper')this.world.entities[k]={kind:'hopper',slots:Array(5).fill(null)};this.world.dirty.add(V.ckey(Math.floor(p[0]/16),Math.floor(p[2]/16)));}}
};
P.breakBlock=function(hit){let h=hit;
 if(h.type===49){for(const[k,s]of Object.entries(this.world.logic)){if(!s.extended)continue;const p=k.split(',').map(Number),d=V.directions[s.dir];if(K(...p.map((v,i)=>v+d[i]))===K(...h.cell)){h={...h,cell:p,type:this.world.get(...p)};break;}}if(h.type===49)return;}
 const k=K(...h.cell),state=this.world.logic[k];if(state?.extended){const d=V.directions[state.dir],q=h.cell.map((v,i)=>v+d[i]);if(this.world.get(...q)===49)this.world.set(...q,0);}
 const e=this.world.entities[k];if(e?.kind==='hopper'){for(const s of e.slots||[])if(s)this.drop(s.id,s.count,h.cell[0]+.5,h.cell[1]+.3,h.cell[2]+.5,s.dur);delete this.world.entities[k];}
 return base.breakBlock.call(this,h);
};
V.buildWorkshop=function(g){const w=g.world;if(w.workshop)return;const spawn=w.spawn(),x=Math.floor(spawn.x),z=Math.floor(spawn.z),y=Math.min(46,Math.floor(spawn.y)+1);w.workshop=true;
 for(let a=-13;a<=13;a++)for(let b=-11;b<=12;b++){for(let h=y;h<y+12;h++)w.set(x+a,h,z+b,0);w.set(x+a,y-1,z+b,(Math.abs(a)===13||Math.abs(b)===11)?15:(a%6===0||b%6===0)?3:7);}
 const place=(a,b,c,t)=>w.set(x+a,y+b,z+c,t);
 // A lever drives visible, attenuating wire, a lamp and an east-facing sticky piston.
 place(-10,0,-5,43);for(let a=-9;a<=-3;a++)place(a,0,-5,41);place(-2,0,-5,45);
 place(-5,0,-4,41);place(-5,0,-3,53);w.logic[K(x-5,y,z-3)].dir=2;place(-5,0,-2,41);place(-5,0,-1,57);w.logic[K(x-5,y,z-1)].dir=2;place(-5,0,0,8);
 place(3,0,-5,55);for(let a=4;a<=7;a++)place(a,0,-5,41);place(8,0,-5,45);
 place(4,0,-2,60);place(5,0,-2,41);place(6,0,-2,45);
 // Chest -> hopper -> furnace -> hopper -> chest; real input, fuel, output and stack accounting.
 for(const[b,t]of[[0,21],[1,50],[2,20],[3,50],[4,21]])place(7,b,4,t);
 w.entities[K(x+7,y,z+4)]={kind:'chest',slots:Array(27).fill(null)};
 w.entities[K(x+7,y+1,z+4)]={kind:'hopper',slots:Array(5).fill(null)};
 w.entities[K(x+7,y+2,z+4)]={kind:'furnace',input:null,fuel:null,output:null,burn:0,progress:0};
 w.entities[K(x+7,y+3,z+4)]={kind:'hopper',slots:Array(5).fill(null)};
 const input=new V.Inventory(27);input.add(102,8);input.add(101,3);w.entities[K(x+7,y+4,z+4)]={kind:'chest',slots:input.slots};
 // A finite basin demonstrates both falling and lateral flowing water.
 for(let a=-11;a<=-4;a++)for(let c=4;c<=10;c++){place(a,-1,c,15);if(a===-11||a===-4||c===4||c===10)place(a,0,c,15);else place(a,0,c,0);}
 for(let b=0;b<6;b++)place(-10,b,5,15);place(-9,5,5,15);place(-9,4,5,13);
 place(0,0,4,19);place(1,0,4,21);w.entities[K(x+1,y,z+4)]={kind:'chest',slots:Array(27).fill(null)};
 for(const[a,c]of[[-12,-10],[12,-10],[-12,11],[12,11]]){place(a,0,c,5);place(a,1,c,22);}
 g.inventory=new V.Inventory();for(const id of[41,43,45,57,50,53,115,7,19])g.inventory.add(id,V.items[id].stack);g.player={x:x+.5,y:y+.03,z:z+9};g.yaw=0;g.pitch=-.06;g.time=350;g.mobs=[];g.renderer.clear();g.renderer.updateChunks(w,g.player,g.radius,200);g.save();
};
V.extendUI=function(UI,icon){const Q=UI.prototype,old={closePanel:Q.closePanel,openPanel:Q.openPanel,renderCraftContent:Q.renderCraftContent,renderRecipes:Q.renderRecipes,refreshPanel:Q.refreshPanel,swap:Q.swap,hud:Q.hud};
 Q.closePanel=function(...args){returnGrid(this.g);return old.closePanel.apply(this,args);};
 Q.openPanel=function(kind='inventory',key=null){if(this.g.craftSlots?.some(Boolean))returnGrid(this.g);this.g.craftSlots=Array(kind==='bench'?9:4).fill(null);return old.openPanel.call(this,kind,key);};
 Q.renderCraftContent=function(){old.renderCraftContent.call(this);if(this.tab==='guide'){const c=$('craftContent');c.insertAdjacentHTML('afterbegin','<div class="guide"><h3>The living world</h3><p><b>Craft:</b> load a recipe pattern, then take the output. Or arrange items directly in the 2×2 / 3×3 grid. Right-click places one item.</p><p><b>Flow:</b> place a water source above a basin. It falls, spreads up to seven blocks, and drains when its source is removed. Lava spreads more slowly, up to three blocks.</p><p><b>Wire:</b> mine signal ore with a stone pick. Dust makes wire. Connect a lever to a lamp or piston. Wire carries strength 15, losing one per wire.</p><p><b>R</b> rotates pistons/repeaters. Use a repeater to choose 1–4 ticks of delay. A piston pushes up to 12 ordinary blocks; sticky pistons pull one back.</p><p><b>Hoppers:</b> move one item at a time down a vertical chain. They can feed furnace input/fuel and extract output. Power pauses a hopper.</p><p>Try the <b>Workshop playground</b> from the menu for working examples. Source rules and limits are in PARITY.md.</p></div>');return;}
  if(this.tab!=='craft')return;const g=this.g,size=g.panel==='bench'?3:2;if(g.craftSlots?.length!==size*size)g.craftSlots=Array(size*size).fill(null);const match=V.matchGrid(g.craftSlots,size);
  const area=document.createElement('section');area.className='craftStation';area.innerHTML=`<div class="sectionTitle">${size} × ${size} crafting grid</div><div class="craftRow"><div class="craftGrid" style="grid-template-columns:repeat(${size},48px)">${g.craftSlots.map((s,i)=>this.slot(s,i,'craft')).join('')}</div><span class="craftArrow">→</span><button id="craftOutput" class="craftOutput" ${match?'':'disabled'} title="Take crafted output">${match?icon(match.out)+`<span>${V.items[match.out].name} × ${match.n}</span>`:'<span>Arrange a recipe</span>'}</button></div><button id="clearGrid" class="clearGrid">Return ingredients</button><div class="panelHelp">Choose a recipe below to load its pattern, then take the output.</div>`;
  $('craftContent').prepend(area);for(const b of area.querySelectorAll('[data-slot]')){b.onclick=e=>this.swap('craft',+b.dataset.slot,false,e.shiftKey);b.oncontextmenu=e=>{e.preventDefault();this.swap('craft',+b.dataset.slot,true,false);};}
  $('craftOutput').onclick=()=>{if(V.craftGrid(g.craftSlots,size,g.inventory)){g.sound('craft');this.refresh();}else this.toast('No matching recipe or no inventory space.');};$('clearGrid').onclick=()=>{returnGrid(g);g.craftSlots=Array(size*size).fill(null);this.refresh();};
 };
 Q.renderRecipes=function(){old.renderRecipes.call(this);if(this.tab!=='craft')return;const g=this.g,size=g.panel==='bench'?3:2;for(const b of $('recipeList')?.querySelectorAll('[data-recipe]')||[]){const r=V.recipes[+b.dataset.recipe];b.title='Load pattern for '+r.name;b.onclick=()=>{if(V.fillGrid(g.craftSlots,size,g.inventory,r)){this.refresh();}else this.toast('Needs materials, free space, or a placed workbench.');};}};
 Q.swap=function(collection,index,right=false,shift=false){const g=this.g;
  if(collection==='craft'){let s=g.craftSlots[index],c=g.cursor;if(shift&&s&&!c){const left=g.inventory.add(s.id,s.count,s.dur);g.craftSlots[index]=left?{...s,count:left}:null;this.refresh();return;}
   if(right){if(!c&&s){const n=Math.ceil(s.count/2);g.cursor={...s,count:n};s.count-=n;if(!s.count)s=null;}else if(c&&(!s||s.id===c.id&&s.count<V.items[c.id].stack)){if(s)s.count++;else s={...c,count:1};if(--c.count<=0)g.cursor=null;}}
   else if(c&&s&&c.id===s.id&&V.items[c.id].stack>1){const n=Math.min(c.count,V.items[s.id].stack-s.count);s.count+=n;c.count-=n;if(!c.count)g.cursor=null;}else{g.cursor=s;s=c;}g.craftSlots[index]=s;this.refresh();return;
  }
  if(g.panel==='hopper'){const e=g.world.entities[this.stationKey];if(!e||collection==='chest'&&index>=5)return;if(shift&&!right&&!g.cursor){const arr=collection==='inventory'?g.inventory.slots:e.slots,s=arr[index];if(s){const target=collection==='inventory'?new V.Inventory(5,e.slots):g.inventory,left=target.add(s.id,s.count,s.dur);if(collection==='inventory')e.slots=target.slots;arr[index]=left?{...s,count:left}:null;}this.refresh();return;}const kind=e.kind,panel=g.panel;e.kind='chest';g.panel='chest';try{return old.swap.call(this,collection,index,right,shift);}finally{e.kind=kind;g.panel=panel;this.refresh();}}
  return old.swap.call(this,collection,index,right,shift);
 };
 Q.refreshPanel=function(){const g=this.g;if(g.panel==='hopper'){g.panel='chest';try{old.refreshPanel.call(this);}finally{g.panel='hopper';}$('panelTitle').textContent='Hopper · downward transfer';const right=$('panelMain').children[1];right.querySelector('.sectionTitle').textContent='5 slots · power pauses transfer';right.querySelector('.panelHelp').textContent='Pulls from above and sends items below every four ticks. Connect chests and furnaces vertically. Shift-click transfers items.';return;}old.refreshPanel.call(this);};
 Q.hud=function(now){old.hud.call(this,now);const g=this.g,s=g.target&&g.world.logic[g.target.cell.join(',')];if(s){$('target').textContent=`${V.blocks[g.target.type].name} · signal ${s.power||0}${s.kind==='repeater'?' · '+s.delay+' ticks · R rotate':['piston','sticky'].includes(s.kind)?' · R rotate':s.kind==='hopper'?' · Use to open':' · Use'}`;}if(g.world.workshop){$('goalLabel').textContent='WORKSHOP PLAYGROUND';$('goal').textContent='Flip the lever. Follow the wire. Watch the piston. Try the basin and furnace tower.';}};
};
V.afterUI=function(g){
 const style=document.createElement('style');style.textContent=`.craftStation{border:1px solid var(--line);background:#0c1c1550;padding:13px;border-radius:8px;margin-bottom:12px}.craftGrid{display:grid;gap:4px}.craftGrid .slot{width:48px;height:48px}.craftRow{display:flex;gap:13px;align-items:center;margin-top:8px}.craftArrow{font-size:25px;color:var(--gold)}.craftOutput{min-width:108px;max-width:145px;min-height:78px;display:flex;flex-direction:column;align-items:center;gap:6px;background:#d3eea915}.craftOutput .icon{width:34px;height:37px}.craftOutput span{font-size:11px}.clearGrid{font-size:11px;padding:6px 9px;margin-top:9px}.craftStation .panelHelp{font-size:11px}.recipes{max-height:260px}#workshopButton{width:100%;border-color:#c9e39865;color:var(--lime);margin-top:14px;font-size:13px}@media(max-width:700px){.craftGrid .slot{width:42px;height:42px}.craftRow{gap:8px}.craftOutput{min-width:90px}}`;
 document.head.append(style);const b=document.createElement('button');b.id='workshopButton';b.textContent='Open the Workshop playground →';$('launch').after(b);
 const open=()=>{g.save();g.newWorld('workshop-3','creative',true);V.buildWorkshop(g);$('seedInput').value=g.world.seed;$('modeSelect').value='creative';V.ui.menu();$('launch').textContent='Enter the Workshop →';};b.onclick=open;
 window.addEventListener('keydown',e=>{if(e.code!=='KeyR'||e.repeat||g.paused||g.panel||g.dead||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;const k=g.target?.cell.join(','),s=g.world.logic[k];if(!s||!['piston','sticky','repeater'].includes(s.kind))return;if(s.extended){g.notice('Switch off the piston before rotating it.');return;}s.dir=(s.dir+1)%4;g.world.dirty.add(V.ckey(Math.floor(g.target.cell[0]/16),Math.floor(g.target.cell[2]/16)));g.notice('Facing '+['north','east','south','west'][s.dir]+'.');});
 if(new URLSearchParams(location.search).get('workshop')==='1')open();
};
})(globalThis.VW);
