"""Chromium integration tests. No external navigation; source is loaded into a local document.
Requires playwright and Chromium. On Linux without a display: xvfb-run -a python browser-tests.py
The fixture supplies Storage for about:blank and a deterministic animation clock.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).parent
fixture='''<script>
window.__store=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>__store.get(k)||null,setItem:(k,v)=>__store.set(k,String(v)),removeItem:k=>__store.delete(k)}});
window.requestAnimationFrame=cb=>{window.__frame=cb;return 1;};
HTMLCanvasElement.prototype.requestPointerLock=()=>Promise.resolve();
</script>'''
def html():
 s=(ROOT/'index.html').read_text()
 for name in ['core.js','render.js','game.js','ui.js']:
  s=s.replace('<script src="'+name+'"></script>',(fixture if name=='core.js' else '')+'<script>'+(ROOT/name).read_text()+'</script>')
 return s
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1280,'height':720})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html(),wait_until='domcontentloaded')
 assert page.evaluate('window.__voxelReady===true')
 page.evaluate('VW.game.renderer.render(VW.game)')
 page.screenshot(path=str(ROOT/'menu.png'))
 page.click('#launch')
 results=page.evaluate('''()=>{
 const g=VW.game,V=VW,ui=V.ui,results=[];
 function check(name,ok){results.push({name,passed:!!ok});if(!ok)throw Error(name);}
 function ticks(n){for(let i=0;i<n;i++)g.step(1/60);}
 function setHeld(id,n=1){g.selected=0;g.inventory.slots[0]=V.Inventory.clean({id,count:n});}
 const p={...g.player},x=Math.floor(p.x),y=Math.floor(p.y),z=Math.floor(p.z);
 ticks(60);check('player settles safely on terrain',g.health===20&&g.grounded);
 g.keys.Space=true;ticks(10);g.keys.Space=false;check('jump rises above the ground',g.player.y>p.y+.4);ticks(100);check('jump returns to the ground',Math.abs(g.player.y-p.y)<.1);
 // Deterministic above-ground fixture. The real mining, pickup and use paths run unchanged.
 for(let xx=x-3;xx<=x+3;xx++)for(let zz=z-4;zz<=z+3;zz++){g.world.set(xx,y-1,zz,1);for(let yy=y;yy<y+5;yy++)g.world.set(xx,yy,zz,0);}
 g.player={x:x+.5,y:y+.02,z:z+.5};g.yaw=0;g.pitch=0;g.inventory=new V.Inventory();g.world.set(x,y+1,z-2,5);g.target=V.raycast(g.world,g.eye(),g.direction());g.mousedown=true;g.mine(2.1);g.mousedown=false;check('survival mining removes a log',g.world.get(x,y+1,z-2)===0);check('mining creates a real item drop',g.drops.some(d=>d.id===5));
 for(const d of g.drops){d.x=g.player.x;d.z=g.player.z;d.y=g.player.y+.7;d.age=1;}g.updateDrops(.02);check('nearby drops enter inventory',g.inventory.count(5)===1);
 // Craft through DOM in the next phase.
 ui.openPanel('inventory');ui.refresh();window.__integrationResults=results;
 return results;
 }''')
 page.click('[data-recipe="0"]')
 assert page.evaluate('VW.game.inventory.count(7)===4 && VW.game.inventory.count(5)===0')
 results.append({'name':'DOM recipe crafting consumes log and creates planks','passed':True})
 # Make sure hand inventory does not expose the workbench-only craft action.
 assert page.is_disabled('[data-recipe="4"]')
 results.append({'name':'DOM recipe gating requires a workbench','passed':True})
 more=page.evaluate('''()=>{
 const V=VW,g=V.game,ui=V.ui,results=[];function check(name,ok){results.push({name,passed:!!ok});if(!ok)throw Error(name);}function ticks(n){for(let i=0;i<n;i++)g.step(1/60);}
 ui.closePanel(false);g.inventory=new V.Inventory();g.inventory.add(19);g.selected=0;
 const x=Math.floor(g.player.x),y=Math.floor(g.player.y),z=Math.floor(g.player.z);
 g.target={cell:[x,y-1,z-2],prev:[x,y,z-2],type:1};g.use();check('placing a workbench consumes it',g.world.get(x,y,z-2)===19&&g.inventory.count(19)===0);
 g.target={cell:[x,y,z-2],prev:[x,y,z-1],type:19};g.use();check('using a workbench opens its UI',g.panel==='bench');g.inventory.add(7,3);g.inventory.add(100,2);check('wood pickaxe is craftable at workbench',g.inventory.craft(V.recipes.find(r=>r.out===120),'bench'));ui.closePanel(false);
 g.inventory=new V.Inventory();g.inventory.add(20);g.selected=0;g.target={cell:[x+2,y-1,z-2],prev:[x+2,y,z-2],type:1};g.use();g.target={cell:[x+2,y,z-2],prev:[x+2,y,z-1],type:20};g.use();const f=g.world.entities[[x+2,y,z-2].join(',')];f.input={id:102,count:1};f.fuel={id:101,count:1};ticks(370);check('furnace smelts while inventory is open',f.output?.id===105&&f.output.count===1&&f.input===null);
 // Prevent cursor loss through autosave, including durability.
 g.cursor={id:130,count:1,dur:100};const snapshot=JSON.parse(JSON.stringify(g.snapshot()));g.restore(snapshot);check('carried cursor item survives save/load',g.inventory.slots.some(s=>s?.id===130&&s.dur===100));check('furnace output survives save/load',g.world.entities[[x+2,y,z-2].join(',')].output.id===105);ui.closePanel(false);
 // Transactional chest movement and splitting.
 const ck=[x+2,y,z+2].join(',');g.world.set(x+2,y,z+2,21);g.world.entities[ck]={kind:'chest',slots:Array(27).fill(null)};g.inventory=new V.Inventory();g.inventory.add(7,10);ui.openPanel('chest',ck);ui.swap('inventory',0,false,true);check('shift-click moves stack into chest',g.inventory.count(7)===0&&g.world.entities[ck].slots[0].count===10);ui.swap('chest',0,true,false);check('right-click splits stack without duplication',g.cursor.count===5&&g.world.entities[ck].slots[0].count===5);ui.closePanel(false);check('closing bag safely returns cursor stack',g.cursor===null&&g.inventory.count(7)===5);
 // Seeds, irrigation and growth.
 g.inventory=new V.Inventory();g.inventory.add(129);g.selected=0;g.world.set(x+2,y-1,z,2);g.world.set(x+2,y,z,0);g.target={cell:[x+2,y-1,z],prev:[x+2,y,z],type:2};g.use();check('hoe creates farmland',g.world.get(x+2,y-1,z)===27);g.inventory=new V.Inventory();g.inventory.add(109,2);g.selected=0;g.target={cell:[x+2,y-1,z],prev:[x+2,y,z],type:27};g.use();check('seeds plant a crop and are consumed',g.world.get(x+2,y,z)===28&&g.inventory.count(109)===1);g.world.set(x+3,y-1,z,13);for(let i=0;i<102;i++)g.tick();check('irrigated wheat matures',g.world.get(x+2,y,z)===29);
 g.change(x+3,y,z+3,31);g.change(x+2,y,z+3,13);check('water contacting a lava source makes obsidian',g.world.get(x+3,y,z+3)===33);
 // Hunger and equipment.
 g.hunger=10;g.inventory=new V.Inventory();g.inventory.add(112);g.selected=0;g.use();check('eating restores hunger and consumes food',g.hunger===18&&g.inventory.count(112)===0);g.inventory.add(117);g.use();check('armor equips',g.armor?.id===117);g.health=20;g.invulnerable=0;g.damage(4,'test');check('armor reduces incoming damage',Math.abs(g.health-18.2)<.001);
 // Death and dropped items (including cursor item).
 g.armor=null;g.inventory=new V.Inventory();g.inventory.add(104,2);g.cursor={id:7,count:4};g.health=1;g.invulnerable=0;g.damage(5,'test');check('death drops inventory and cursor items',g.dead&&g.inventory.count(104)===0&&g.drops.some(d=>d.id===104&&d.count===2)&&g.drops.some(d=>d.id===7&&d.count===4));g.respawn();check('respawn resets health and hunger',!g.dead&&g.health===20&&g.hunger===20);
 // Streaming and persistence across chunk eviction.
 g.world.set(-1,60,-17,7);g.world.chunks.clear();check('edits survive chunk eviction',g.world.get(-1,60,-17)===7);check('v2 storage is separate from original island',g.storageKey().startsWith('voxel-wild-v2:'));check('JSON import rejects unknown versions',(()=>{try{g.restore({version:1});return false;}catch{return true;}})());
 g.mode='creative';g.health=20;g.invulnerable=0;g.damage(100,'test');check('creative mode ignores damage',g.health===20);g.mode='survival';
 g.renderer.updateChunks(g.world,g.player,g.radius,60);g.renderer.render(g);ui.refresh();ui.hud(1e9);check('renderer has no WebGL error',g.renderer.gl.getError()===0);
 return results;
 }''')
 results+=more
 page.screenshot(path=str(ROOT/'survival-tested.png'))
 # Browser save fixture contains actual app-written save records.
 assert page.evaluate('[...__store.keys()].some(k=>k.startsWith("voxel-wild-v2:"))')
 mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
 mobile.on('pageerror',lambda e:errors.append(str(e)))
 mobile.set_content(html(),wait_until='domcontentloaded')
 mobile.evaluate('VW.game.renderer.render(VW.game)')
 mobile.screenshot(path=str(ROOT/'mobile-menu.png'))
 mobile.click('#launch')
 mobile.evaluate('VW.game.renderer.render(VW.game);VW.ui.hud(1e9)')
 assert mobile.locator('#mineTouch').is_visible()
 assert mobile.evaluate('document.documentElement.scrollWidth===390')
 results.append({'name':'mobile viewport and touch actions fit 390-pixel display','passed':True})
 mobile.click('#bagTouch')
 assert mobile.evaluate('VW.game.panel==="inventory"')
 results.append({'name':'touch bag button opens inventory','passed':True})
 mobile.screenshot(path=str(ROOT/'mobile-inventory.png'))
 results.append({'name':'no unhandled JavaScript errors','passed':not errors})
 report={'tests':len(results),'passed':sum(r['passed'] for r in results),'errors':errors,'results':results,'environment':'Chromium / SwiftShader / local document; deterministic simulation clock and Storage fixture; desktop 1280x720 and mobile 390x844'}
 (ROOT/'browser-tests.json').write_text(json.dumps(report,indent=2))
 print(json.dumps(report,indent=2),flush=True)
 browser.close()
