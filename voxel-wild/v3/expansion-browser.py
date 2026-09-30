"""V3 integration checks in Chromium. Deterministic local-source fixture, not a live-site test."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
R=Path(__file__).parent
fixture='''<script>window.__store=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>__store.get(k)||null,setItem:(k,v)=>__store.set(k,String(v)),removeItem:k=>__store.delete(k)}});window.requestAnimationFrame=cb=>1;HTMLCanvasElement.prototype.requestPointerLock=()=>Promise.resolve();</script>'''
s=(R/'index.html').read_text()
for name in ['core.js','systems.js','render.js','game.js','expansion.js','ui.js']:
 s=s.replace('<script src="'+name+'"></script>',(fixture if name=='core.js' else '')+'<script>'+(R/name).read_text()+'</script>')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1280,'height':720});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(s,wait_until='domcontentloaded');assert page.evaluate('window.__voxelReady===true')
 page.click('#workshopButton');page.click('#launch')
 results=page.evaluate('''()=>{
 const V=VW,g=V.game,ui=V.ui,w=g.world,R=[];function check(name,ok){R.push({name,passed:!!ok});if(!ok)throw Error(name);}function ticks(n){for(let i=0;i<n;i++)g.step(1/60);}
 check('workshop menu creates a separately saved creative playground',w.workshop&&g.mode==='creative'&&w.seed==='workshop-3'&&g.storageKey()==='voxel-wild-v3:creative:workshop-3');
 const key=Object.keys(w.logic).find(k=>w.logic[k].kind==='lever'),p=key.split(',').map(Number);g.target={cell:p,prev:p.map((v,i)=>i===2?v+1:v),type:43};const before=g.inventory.count(41);g.use();check('Use toggles lever without consuming held blocks',w.get(...p)===44&&g.inventory.count(41)===before);ticks(90);
 check('actual game ticks power the workshop lamp',Object.keys(w.logic).some(k=>w.get(...k.split(',').map(Number))===46));
 check('actual game ticks extend the workshop sticky piston',Object.values(w.logic).some(s=>s.kind==='sticky'&&s.extended));
 g.target={cell:p,prev:p,type:44};g.use();ticks(90);check('sticky piston retracts when its circuit is switched off',Object.values(w.logic).filter(s=>s.kind==='sticky').every(s=>!s.extended));
 ticks(900);check('workshop waterfall has propagated into flowing blocks',Object.keys(w.flows).length>10);
 check('vertical automation produces iron ingots without inventory injection',Object.values(w.entities).some(e=>e.kind==='chest'&&e.slots.some(s=>s?.id===105)));
 // Render an overhead view of the working playground without changing the simulation rules.
 const fkey=Object.keys(w.entities).find(k=>w.entities[k].kind==='furnace'),fp=fkey.split(',').map(Number),center=[fp[0]-7,fp[1]-2,fp[2]-4];window.__workshopCenter=center;
 g.player={x:center[0]+22,y:center[1]+17,z:center[2]+25};const d=[center[0]-g.player.x,center[1]+1-g.player.y-1.62,center[2]-g.player.z];g.yaw=Math.atan2(d[0],-d[2]);g.pitch=Math.atan2(d[1],Math.hypot(d[0],d[2]));g.target=null;g.renderer.updateChunks(w,g.player,3,200);g.renderer.render(g);ui.hud(1e9);check('new machine/fluid geometry renders without WebGL error',g.renderer.gl.getError()===0);
 return R;
 }''')
 page.screenshot(path=str(R/'workshop.png'))
 more=page.evaluate('''()=>{const V=VW,g=V.game,ui=V.ui,R=[];function check(n,o){R.push({name:n,passed:!!o});if(!o)throw Error(n);}
 g.inventory=new V.Inventory();g.inventory.add(5,3);ui.openPanel('inventory');ui.refresh();return R;}''')
 page.click('[data-recipe="0"]')
 assert page.evaluate('VW.game.inventory.count(5)===2 && VW.game.craftSlots[0].id===5 && VW.game.inventory.count(7)===0')
 results.append({'name':'DOM recipe button loads ingredients instead of directly granting output','passed':True})
 page.click('#craftOutput')
 assert page.evaluate('VW.game.inventory.count(7)===4 && VW.game.craftSlots.every(s=>!s)')
 results.append({'name':'DOM grid output consumes ingredients exactly once','passed':True})
 page.click('[data-recipe="2"]')
 page.screenshot(path=str(R/'crafting.png'))
 more=page.evaluate('''()=>{
 const V=VW,g=V.game,ui=V.ui,R=[];function check(n,o){R.push({name:n,passed:!!o});if(!o)throw Error(n);}
 const snap=JSON.parse(JSON.stringify(g.snapshot()));check('snapshot contains pending crafting ingredients',snap.craftSlots.filter(Boolean).length===4);g.restore(snap);check('restore returns every grid ingredient to inventory',g.inventory.count(7)===4&&g.craftSlots.length===0);
 ui.closePanel(false);ui.openPanel('inventory');g.craftSlots=[{id:5,count:2},null,null,null];const old=g.inventory.count(5);ui.closePanel(false);check('closing the panel preserves grid items',g.inventory.count(5)===old+2);
 // Hopper UI must never silently expand its five-slot storage to 27 chest slots.
 const hk=Object.keys(g.world.logic).find(k=>g.world.logic[k].kind==='hopper');g.world.entities[hk]={kind:'hopper',slots:Array(5).fill(null)};g.inventory=new V.Inventory();for(const id of [1,2,3,4,5,7])g.inventory.add(id,64);ui.openPanel('hopper',hk);
 for(let i=0;i<6;i++)ui.swap('inventory',i,false,true);
 check('hopper shift-transfer never expands beyond five slots',g.world.entities[hk].slots.length===5);
 check('sixth hopper stack stays in the inventory',g.inventory.count(7)===64);
 ui.swap('chest',0,true,false);check('hopper supports stack splitting',g.cursor.count===32&&g.world.entities[hk].slots[0].count===32);ui.closePanel(false);
 // Direction rotation uses a real keyboard event; an extended piston rejects rotation.
 const pk=Object.keys(g.world.logic).find(k=>g.world.logic[k].kind==='sticky'),state=g.world.logic[pk];g.target={cell:pk.split(',').map(Number),type:57};state.extended=false;window.__oldDir=state.dir;window.__pistonKey=pk;
 return R;
 }''');results+=more
 page.keyboard.press('r')
 assert page.evaluate('VW.game.world.logic[__pistonKey].dir===(__oldDir+1)%4')
 results.append({'name':'R rotates a retracted piston through the keyboard handler','passed':True})
 more=page.evaluate('''()=>{
 const V=VW,g=V.game,ui=V.ui,R=[];function check(n,o){R.push({name:n,passed:!!o});if(!o)throw Error(n);}
 const w=g.world,s=g.world.logic[__pistonKey];s.extended=true;const dir=s.dir;window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR'}));check('extended pistons cannot be rotated into orphan heads',s.dir===dir);s.extended=false;
 // Construct and import a genuine old-format world with no new state IDs.
 g.newWorld('migration-test','survival',false);g.inventory=new V.Inventory();g.inventory.add(104,17);g.inventory.add(135,1,500);const legacy=g.snapshot();legacy.version=2;delete legacy.craftSlots;for(const k of ['logic','flows','updates','simTick','workshop'])delete legacy.world[k];const key='voxel-wild-v2:survival:migration-test',text=JSON.stringify(legacy);localStorage.setItem(key,text);g.restore(legacy);g.save();
 check('2.0 import retains inventory and tool durability',g.inventory.count(104)===17&&g.inventory.slots.some(s=>s?.id===135&&s.dur===500));check('migration writes a 3.0 save without modifying the 2.0 source',localStorage.getItem(key)===text&&JSON.parse(localStorage.getItem(g.storageKey())).version===3);
 const before=JSON.stringify(g.snapshot());try{g.restore({...g.snapshot(),world:{...g.world.export(),updates:['invalid']}});}catch{}check('invalid import leaves the current game untouched',JSON.stringify(g.snapshot())===before);
 // The real collision/survival code treats flowing water as water.
 g.started=true;g.paused=false;g.player={x:0.5,y:53,z:.5};for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++){g.world.set(x,52,z,3);for(let y=53;y<=56;y++)g.world.set(x,y,z,0);}g.world.set(0,53,0,51);g.world.set(0,54,0,51);g.breath=10;g.vy=0;g.systemAcc=0;g.step(.05);check('flowing water drains air when the player is submerged',g.breath<10);check('flowing water uses swimming rather than full gravity',g.vy>=-2);
 // Auto-step traverses half blocks but never a full-height block or low ceiling.
 g.mode='creative';g.flying=false;g.paused=false;g.dead=false;g.panel=null;
 for(let x=9;x<=13;x++)for(let z=9;z<=11;z++){g.world.set(x,49,z,3);for(let y=50;y<=54;y++)g.world.set(x,y,z,0);}
 g.world.set(11,50,10,62);g.player={x:10.55,y:50.01,z:10.5};g.grounded=true;g.move(.4,0,0);
 check('walking auto-steps onto a half-height slab',g.player.x>10.9&&g.player.y>50.45&&g.player.y<50.7);
 g.world.set(11,50,10,3);g.player={x:10.55,y:50.01,z:10.5};g.grounded=true;g.move(.4,0,0);
 check('auto-step cannot climb a full-height block',g.player.x<10.9&&g.player.y<50.1);
 g.world.set(11,50,10,62);g.world.set(10,52,10,3);g.world.set(11,52,10,3);g.player={x:10.55,y:50.01,z:10.5};g.grounded=true;g.move(.4,0,0);
 check('auto-step respects head clearance',g.player.x<10.9&&!g.collides(g.player.x,g.player.y,g.player.z));
 g.mode='survival';
 // Death conserves held and grid resources in real drops.
 g.inventory=new V.Inventory();g.inventory.add(104,3);g.craftSlots=[{id:7,count:4},null,null,null];g.cursor={id:105,count:2};g.armor=null;g.health=1;g.invulnerable=0;g.damage(10,'regression');check('death includes crafting-grid resources in item drops',g.dead&&g.drops.some(d=>d.id===7&&d.count===4)&&g.drops.some(d=>d.id===105&&d.count===2)&&g.drops.some(d=>d.id===104&&d.count===3));
 return R;
 }''');results+=more
 mobile=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1);mobile.on('pageerror',lambda e:errors.append(str(e)));mobile.set_content(s,wait_until='domcontentloaded');mobile.click('#launch');mobile.click('#bagTouch');mobile.evaluate('VW.game.renderer.render(VW.game)');
 assert mobile.evaluate('!!document.getElementById("craftOutput")&&document.querySelectorAll(".craftGrid [data-slot]").length===4')
 assert mobile.evaluate('document.getElementById("craftOutput").getBoundingClientRect().right<=document.querySelector(".inventoryPanel").getBoundingClientRect().right')
 results.append({'name':'mobile hand grid and result button fit a 390-pixel touch viewport','passed':True});mobile.screenshot(path=str(R/'mobile-crafting.png'))
 results.append({'name':'no unhandled JavaScript errors in V3 scenarios','passed':not errors});report={'tests':len(results),'passed':sum(x['passed'] for x in results),'errors':errors,'results':results,'environment':'Local exact-source Chromium / SwiftShader. Deterministic clock and in-memory Storage. Staged inputs; not a live-site or physical-device test.'};(R/'expansion-browser.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2),flush=True);b.close()
