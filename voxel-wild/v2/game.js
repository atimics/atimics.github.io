/* Fixed-step simulation, survival progression and versioned local world saves. */
(function(V){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),copy=s=>s&&{...s};
class Game{
 constructor(canvas){this.renderer=new V.Renderer(canvas);this.canvas=canvas;this.keys={};this.selected=0;this.radius=matchMedia('(pointer:coarse)').matches?2:3;this.quality=1.25;this.paused=true;this.started=false;this.mousedown=false;this.acc=0;this.last=performance.now();this.ui=null;this.audio=null;this.panel=null;this.cursor=null;this.loadInitial();}
 loadInitial(){const q=new URLSearchParams(location.search);let last={};try{last=JSON.parse(localStorage.getItem('voxel-wild-v2:last')||'{}');}catch{}this.newWorld(q.get('seed')||last.seed||'wild-2',q.get('mode')||last.mode||'survival',true);}
 newWorld(seed,mode='survival',restore=true){
 this.world=new V.World(seed);this.mode=mode==='creative'?'creative':'survival';this.inventory=new V.Inventory();this.player=this.world.spawn();this.spawnPoint=null;this.yaw=.6;this.pitch=-.12;this.time=240;this.health=20;this.hunger=20;this.breath=10;this.xp=0;this.armor=null;this.vy=0;this.grounded=false;this.flying=false;this.hurt=0;this.invulnerable=0;this.dead=false;this.mobs=[];this.drops=[];this.achievements={};this.target=null;this.mineProgress=0;this.mineKey='';this.attack=0;this.selected=0;this.tickTimer=0;this.spawnTimer=0;this.saveTimer=0;this.fallQueue=new Set();this.fallTimer=0;this.panel=null;this.cursor=null;this.renderer.clear();
 let restored=false;
 if(restore)try{const s=localStorage.getItem(this.storageKey());if(s){this.restore(JSON.parse(s));restored=true;}}catch(e){this.notice('Could not restore this save: '+e.message);}
 if(!restored&&this.mode==='creative'){[1,5,7,3,9,22,19,20,21].forEach(id=>this.inventory.add(id,64));}
 if(!this.mobs.length)for(let i=0;i<9;i++)this.spawnMob(i%3===0?'sheep':'pig',10+i*2);
 this.renderer.updateChunks(this.world,this.player,this.radius,60);this.paused=true;this.started=false;this.ui?.refresh();
 }
 storageKey(){return'voxel-wild-v2:'+this.mode+':'+this.world.seed;}
 snapshot(){return{version:2,world:this.world.export(),mode:this.mode,player:{...this.player},spawnPoint:this.spawnPoint,yaw:this.yaw,pitch:this.pitch,time:this.time,health:this.health,hunger:this.hunger,breath:this.breath,xp:this.xp,armor:this.armor,slots:this.inventory.slots,cursor:this.cursor,selected:this.selected,achievements:this.achievements,mobs:this.mobs,drops:this.drops};}
 restore(s){
 if(!s||s.version!==2||!s.world||typeof s.world.seed!=='string'||!s.player)throw Error('Expected a Voxel Wild 2 world file.');
 const p=s.player;if(![p.x,p.y,p.z].every(Number.isFinite)||Math.abs(p.x)>1e6||Math.abs(p.z)>1e6||p.y<0||p.y>200)throw Error('Invalid player position.');
 const w=new V.World(s.world.seed);w.import(s.world);this.world=w;this.mode=s.mode==='creative'?'creative':'survival';this.inventory=new V.Inventory(36,s.slots);this.player={x:p.x,y:p.y,z:p.z};this.yaw=Number.isFinite(s.yaw)?s.yaw:0;this.pitch=clamp(Number(s.pitch)||0,-1.5,1.5);this.time=clamp(Number(s.time)||240,0,1e10);this.health=clamp(Number(s.health)||0,0,20);this.hunger=clamp(Number(s.hunger)||0,0,20);this.breath=clamp(Number(s.breath)||10,0,10);this.xp=clamp(Number(s.xp)||0,0,1e6);this.armor=s.armor?.id===117?V.Inventory.clean(s.armor):null;this.selected=clamp(Math.floor(Number(s.selected)||0),0,8);this.achievements={};for(const k of ['wood','bench','stone','iron','diamond','food','farm','bed','night'])if(s.achievements?.[k])this.achievements[k]=true;
 this.spawnPoint=null;if(s.spawnPoint&&[s.spawnPoint.x,s.spawnPoint.y,s.spawnPoint.z].every(Number.isFinite)&&Math.abs(s.spawnPoint.x)<1e6&&Math.abs(s.spawnPoint.z)<1e6&&s.spawnPoint.y>0&&s.spawnPoint.y<V.H)this.spawnPoint={x:s.spawnPoint.x,y:s.spawnPoint.y,z:s.spawnPoint.z};
 this.mobs=[];for(const m of (Array.isArray(s.mobs)?s.mobs:[]).slice(0,30))if(['pig','sheep','zombie'].includes(m.kind)&&[m.x,m.y,m.z,m.hp].every(Number.isFinite)&&m.hp>0&&m.y>0&&m.y<V.H&&Math.abs(m.x-p.x)<100&&Math.abs(m.z-p.z)<100)this.mobs.push({kind:m.kind,x:m.x,y:m.y,z:m.z,hp:Math.min(20,m.hp),yaw:Number(m.yaw)||0,phase:0,vy:0,cool:0,turn:0,flash:0});
 this.drops=[];for(const d of (Array.isArray(s.drops)?s.drops:[]).slice(0,256)){const item=V.Inventory.clean(d);if(item&&[d.x,d.y,d.z].every(Number.isFinite)&&Math.abs(d.x-p.x)<100&&Math.abs(d.z-p.z)<100&&d.y>0&&d.y<V.H)this.drops.push({...item,x:d.x,y:d.y,z:d.z,vy:0,age:0});}
 const carried=V.Inventory.clean(s.cursor);if(carried){const left=this.inventory.add(carried.id,carried.count,carried.dur);if(left)this.drop(carried.id,left,this.player.x,this.player.y+.3,this.player.z,carried.dur);}this.cursor=null;
 if(this.collides(this.player.x,this.player.y,this.player.z))this.player=this.world.spawn();this.dead=this.health<=0;this.renderer.clear();
 }
 save(){try{localStorage.setItem(this.storageKey(),JSON.stringify(this.snapshot()));localStorage.setItem('voxel-wild-v2:last',JSON.stringify({seed:this.world.seed,mode:this.mode}));this.savedAt=Date.now();return true;}catch(e){this.notice('Browser storage is full or blocked. Export your world to keep it.');return false;}}
 notice(text){if(this.ui)this.ui.toast(text);else this.pendingNotice=text;}
 daylight(){return .16+.84*clamp((Math.sin((this.time%720)/720*Math.PI*2-Math.PI/2)+.1)*1.5,0,1);}
 held(){return this.inventory.slots[this.selected];}
 direction(){return[Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch)];}
 eye(){return[this.player.x,this.player.y+1.62,this.player.z];}
 collides(x,y,z,r=.28,height=1.75){for(let xx=Math.floor(x-r);xx<=Math.floor(x+r);xx++)for(let zz=Math.floor(z-r);zz<=Math.floor(z+r);zz++)for(let yy=Math.floor(y+.002);yy<=Math.floor(y+height);yy++){const t=this.world.get(xx,yy,zz),b=V.blocks[t];if(!b?.solid)continue;if(yy+(b.height||1)<=y+.002)continue;if(t===25&&z-r>=zz+.14)continue;return true;}return false;}
 move(dx,dy,dz){const p=this.player;
 if(!this.collides(p.x+dx,p.y,p.z))p.x+=dx;if(!this.collides(p.x,p.y,p.z+dz))p.z+=dz;
 if(!this.collides(p.x,p.y+dy,p.z)){p.y+=dy;this.grounded=false;}else{if(dy<0){this.grounded=true;if(this.vy<-11&&this.world.get(Math.floor(p.x),Math.floor(p.y),Math.floor(p.z))!==13)this.damage(Math.floor((-this.vy-10)*.7),'a fall');}this.vy=0;}
 p.x=clamp(p.x,-999990,999990);p.z=clamp(p.z,-999990,999990);if(p.y<1){this.damage(20,'the void');this.player=this.world.spawn();}p.y=Math.min(p.y,120);
 }
 achievement(k,label){if(!this.achievements[k]){this.achievements[k]=true;this.notice('Discovery: '+label);this.sound('craft');this.ui?.refresh();}}
 damage(amount,cause){if(this.mode==='creative'||this.invulnerable>0||this.dead)return;if(this.armor){amount*=1-V.items[this.armor.id].armor;if(--this.armor.dur<=0){this.armor=null;this.notice('Your armor broke.');}}this.health=Math.max(0,this.health-amount);this.hurt=1;this.invulnerable=.7;this.sound('hurt');if(this.health<=0){this.dead=true;this.mousedown=false;if(this.cursor){const s=this.cursor;this.drop(s.id,s.count,this.player.x,this.player.y+.3,this.player.z,s.dur);this.cursor=null;}for(const s of this.inventory.slots)if(s)this.drop(s.id,s.count,this.player.x,this.player.y+.3,this.player.z,s.dur);this.inventory=new V.Inventory();this.xp=Math.floor(this.xp/2);this.save();this.ui?.showDeath(cause);}}
 respawn(){this.player=this.spawnPoint?{...this.spawnPoint}:this.world.spawn();if(this.collides(this.player.x,this.player.y,this.player.z))this.player=this.world.spawn();this.health=20;this.hunger=20;this.breath=10;this.vy=0;this.dead=false;this.invulnerable=3;this.ui?.closeMenu();this.started=true;this.paused=false;this.save();}
 drop(id,count,x,y,z,dur){if(!V.items[id]||count<=0)return;while(count>0&&this.drops.length<256){let n=Math.min(count,V.items[id].stack);this.drops.push({id:+id,count:n,x,y,z,vy:1,age:0,...(dur?{dur}:{})});count-=n;}}
 change(x,y,z,t){if(!this.world.set(x,y,z,t))return false;if(t===13||t===31)for(const[dx,dy,dz]of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const other=this.world.get(x+dx,y+dy,z+dz);if(t===13&&other===31)this.world.set(x+dx,y+dy,z+dz,33);else if(t===31&&other===13)this.world.set(x,y,z,33);}for(let yy=y;yy<=Math.min(y+2,V.H-1);yy++)this.fallQueue.add(V.key(x,yy,z));return true;}
 consume(n=1){const s=this.held();if(this.mode==='creative')return true;if(!s||s.count<n)return false;s.count-=n;if(!s.count)this.inventory.slots[this.selected]=null;return true;}
 breakBlock(hit){const[x,y,z]=hit.cell,t=hit.type,mining=V.mining(t,this.held(),this.mode==='creative');if(!Number.isFinite(mining.seconds))return;
 const entity=this.world.entities[V.key(x,y,z)];if(entity){for(const s of entity.kind==='chest'?entity.slots:[entity.input,entity.fuel,entity.output])if(s)this.drop(s.id,s.count,x+.5,y+.2,z+.5,s.dur);delete this.world.entities[V.key(x,y,z)];}
 if(t===25||t===26)for(const dy of [-1,1])if([25,26].includes(this.world.get(x,y+dy,z)))this.change(x,y+dy,z,0);
 this.change(x,y,z,0);delete this.world.crops[V.key(x,y,z)];if(t===24)this.spawnPoint=null;
 if(this.mode!=='creative'&&mining.drop){let drop=V.blocks[t].drop??t,n=1;if(t===6){let r=Math.random();drop=r<.13?107:r<.30?30:0;}if(t===36&&Math.random()>.7)drop=0;if(drop)this.drop(drop,n,x+.5,y+.15,z+.5);if(t===29)this.drop(109,2,x+.5,y+.2,z+.5);if([11,16,17,18].includes(t))this.xp++;
 if(this.inventory.wear(this.selected))this.notice('Your tool broke.');
 }else if(this.mode!=='creative'&&!mining.drop)this.notice('This block needs a better pickaxe to drop resources.');
 this.sound('mine');this.ui?.refresh();
 }
 entityTarget(){const e=this.eye(),d=this.direction();let best=null,dist=4.4;for(const m of this.mobs){let lo=0,hi=dist;const h=m.kind==='zombie'?1.8:1.1;for(let i=0;i<3;i++){const min=[m.x-.38,m.y,m.z-.55][i],max=[m.x+.38,m.y+h,m.z+.55][i];if(Math.abs(d[i])<1e-8){if(e[i]<min||e[i]>max){hi=-1;break;}}else{let a=(min-e[i])/d[i],b=(max-e[i])/d[i];if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);}}if(hi>=lo&&lo<dist&&(!this.target||lo<this.target.distance)){best=m;dist=lo;}}return best;}
 strike(m){if(this.attack>0)return;this.attack=.45;let t=V.items[this.held()?.id];m.hp-=this.mode==='creative'?20:t?.damage||1;m.flash=.22;m.turn=0;const dx=m.x-this.player.x,dz=m.z-this.player.z,len=Math.hypot(dx,dz)||1;const nx=m.x+dx/len*.4,nz=m.z+dz/len*.4;if(!this.collides(nx,m.y,nz,.3,m.kind==='zombie'?1.8:1.05)){m.x=nx;m.z=nz;}this.inventory.wear(this.selected);this.sound('hit');if(m.hp<=0){if(m.kind==='sheep')this.drop(23,1+Math.floor(Math.random()*2),m.x,m.y+.3,m.z);if(m.kind!=='zombie')this.drop(108,2,m.x,m.y+.3,m.z);this.xp+=2;this.mobs.splice(this.mobs.indexOf(m),1);}this.ui?.refresh();}
 mine(dt){if(this.panel||!this.mousedown){this.mineProgress=0;this.mineKey='';return;}const m=this.entityTarget();if(m){this.strike(m);this.mineProgress=0;return;}const h=this.target;if(!h){this.mineProgress=0;return;}const k=h.cell.join(',');if(k!==this.mineKey){this.mineKey=k;this.mineProgress=0;}const {seconds}=V.mining(h.type,this.held(),this.mode==='creative');this.mineProgress+=dt/seconds;if(this.mineProgress>=1){this.breakBlock(h);this.mineProgress=0;this.mineKey='';}}
 use(){if(this.paused||this.dead||this.panel)return;const hit=this.target,s=this.held(),item=V.items[s?.id];
 if(item?.food){if(this.hunger>=20){this.notice('You are full.');return;}this.hunger=clamp(this.hunger+item.food,0,20);this.consume();this.sound('eat');this.achievement('food','A proper meal');this.ui?.refresh();return;}
 if(item?.armor){const old=this.armor;this.armor=copy(s);this.armor.count=1;this.inventory.slots[this.selected]=old;this.sound('craft');this.ui?.refresh();return;}
 if(s?.id===114){const e=this.eye(),d=this.direction();for(let v=.2;v<5;v+=.1){const c=e.map((n,i)=>Math.floor(n+d[i]*v)),t=this.world.get(...c);if(t===13||t===31){this.change(...c,0);this.inventory.slots[this.selected]={id:t===13?115:116,count:1};this.ui?.refresh();return;}if(V.blocks[t]?.solid)break;}this.notice('Aim the empty bucket at water or lava.');return;}
 if(!hit)return;const[x,y,z]=hit.cell,k=V.key(x,y,z);
 if(!this.keys.ShiftLeft){
 if([19,20,21].includes(hit.type)){this.openStation(hit);return;}
 if(hit.type===25||hit.type===26){const t=hit.type===25?26:25;this.change(x,y,z,t);for(const dy of[-1,1])if([25,26].includes(this.world.get(x,y+dy,z)))this.change(x,y+dy,z,t);this.sound('place');return;}
 if(hit.type===24){const spots=[[x+1.5,y+.7,z+.5],[x-.5,y+.7,z+.5],[x+.5,y+.7,z+1.5],[x+.5,y+.7,z-.5]];const spot=spots.find(p=>!this.collides(...p));if(spot)this.spawnPoint={x:spot[0],y:spot[1],z:spot[2]};this.achievement('bed','Somewhere to call home');if(this.daylight()<.4){if(this.mobs.some(m=>m.kind==='zombie'&&Math.hypot(m.x-x,m.z-z)<12)){this.notice('Hostiles are too close to sleep.');return;}this.time=Math.floor(this.time/720)*720+960;this.health=20;this.notice('Rested until morning. Spawn point saved.');}else this.notice('Spawn point saved. Return at night to sleep.');this.save();return;}
 }
 if(item?.tool==='hoe'&&[1,2].includes(hit.type)){if(!this.world.get(x,y+1,z)){this.change(x,y,z,27);this.inventory.wear(this.selected);this.sound('place');}return;}
 if(s?.id===109){if(hit.type!==27||this.world.get(x,y+1,z)){this.notice('Till earth with a hoe, then plant seeds.');return;}this.change(x,y+1,z,28);this.world.crops[V.key(x,y+1,z)]=0;this.consume();this.achievement('farm','Living off the land');this.ui?.refresh();return;}
 const type=s?.id===115?13:s?.id===116?31:item?.block?s.id:0;if(!type||[12,26,28,29].includes(type))return;
 const[a,b,c]=hit.prev;if(b<1||b>=V.H-1)return;
 if(a+1>this.player.x-.3&&a<this.player.x+.3&&c+1>this.player.z-.3&&c<this.player.z+.3&&b+(V.blocks[type].height||1)>this.player.y&&b<this.player.y+1.8)return;
 if(type===25&&(this.world.get(a,b+1,c)||b+2>=V.H))return;
 if(type===25)this.change(a,b+1,c,25);if(!this.change(a,b,c,type))return;
 if(s.id===115||s.id===116)this.inventory.slots[this.selected]={id:114,count:1};else this.consume();
 if(type===30)this.world.crops[V.key(a,b,c)]=0;if(type===19)this.achievement('bench','A place to craft');if(type===21)this.world.entities[V.key(a,b,c)]={kind:'chest',slots:Array(27).fill(null)};if(type===20)this.world.entities[V.key(a,b,c)]={kind:'furnace',input:null,fuel:null,output:null,burn:0,progress:0};
 this.sound('place');this.ui?.refresh();
 }
 openStation(hit){const k=hit.cell.join(','),type=hit.type;if(type===19)this.ui?.openPanel('bench',k);else{if(!this.world.entities[k])this.world.entities[k]=type===21?{kind:'chest',slots:Array(27).fill(null)}:{kind:'furnace',input:null,fuel:null,output:null,burn:0,progress:0};this.ui?.openPanel(type===21?'chest':'furnace',k);}}
 spawnMob(kind,range=25){if(this.mobs.length>=22)return;const a=Math.random()*Math.PI*2,x=Math.floor(this.player.x+Math.cos(a)*range)+.5,z=Math.floor(this.player.z+Math.sin(a)*range)+.5,y=this.world.surface(Math.floor(x),Math.floor(z));if(y<=V.SEA+1||y>V.H-4||this.collides(x,y,z,.35,1.85)||Math.hypot(x-this.player.x,z-this.player.z)<8)return;
 if(kind==='zombie')for(const[k,edits]of this.world.edits){const[cx,cz]=k.split(',').map(Number);for(const[i,t]of edits)if(t===22&&Math.hypot(cx*16+i%16-x,cz*16+Math.floor(i%256/16)-z)<8)return;}
 this.mobs.push({kind,x,y,z,hp:kind==='zombie'?20:kind==='sheep'?12:10,yaw:Math.random()*6.28,phase:Math.random()*9,vy:0,cool:0,turn:0,flash:0});}
 updateMobs(dt){const p=this.player;for(const m of this.mobs){m.flash=Math.max(0,m.flash-dt);m.cool=Math.max(0,m.cool-dt);m.turn-=dt;const dx=p.x-m.x,dz=p.z-m.z,dist=Math.hypot(dx,dz),hostile=m.kind==='zombie';
 if(hostile&&dist<22&&this.mode!=='creative'){m.yaw=Math.atan2(-dx,-dz);m.moving=dist>1.2;if(dist<1.5&&Math.abs(p.y-m.y)<1.6&&m.cool<=0){const line=V.raycast(this.world,[m.x,m.y+1.3,m.z],[dx/(dist||1),0,dz/(dist||1)],dist);if(!line)this.damage(3,'a night wanderer');m.cool=1.1;}}
 else if(m.turn<=0){m.turn=2+Math.random()*4;m.yaw+=(Math.random()-.5)*2;m.moving=Math.random()>.3;}
 const speed=hostile?1.7:.65;const mx=-Math.sin(m.yaw)*speed*dt*(m.moving?1:0),mz=-Math.cos(m.yaw)*speed*dt*(m.moving?1:0),height=hostile?1.8:1.04;
 if(!this.collides(m.x+mx,m.y,m.z+mz,.32,height)){m.x+=mx;m.z+=mz;}else if(!this.collides(m.x+mx,m.y+1.02,m.z+mz,.32,height)&&this.world.solid(Math.floor(m.x+mx),Math.floor(m.y),Math.floor(m.z+mz))){m.y+=1.02;m.x+=mx;m.z+=mz;}else{m.yaw+=1.1;m.turn=1;}
 m.vy=Math.max(-12,(m.vy||0)-20*dt);if(!this.collides(m.x,m.y+m.vy*dt,m.z,.3,height))m.y+=m.vy*dt;else m.vy=0;
 if(hostile&&this.daylight()>.7){let sky=true;for(let y=Math.ceil(m.y+1.8);y<V.H;y++)if(this.world.solid(Math.floor(m.x),y,Math.floor(m.z))){sky=false;break;}if(sky){m.hp-=dt*2;m.flash=.06;}}
 }
 this.mobs=this.mobs.filter(m=>m.hp>0&&m.y>0&&Math.hypot(m.x-p.x,m.z-p.z)<85);
 }
 updateDrops(dt){const p=this.player;for(const d of this.drops){d.age+=dt;d.vy=Math.max(-8,(d.vy||0)-12*dt);const ny=d.y+d.vy*dt;if(!this.world.solid(Math.floor(d.x),Math.floor(ny),Math.floor(d.z)))d.y=ny;else{d.y=Math.floor(ny)+1.02;d.vy=0;}
 const dist=Math.hypot(d.x-p.x,d.y-p.y-.7,d.z-p.z);if(dist<2.4&&d.age>.3){if(dist<1.3){const left=this.inventory.add(d.id,d.count,d.dur);if(left<d.count){d.count=left;this.sound('pickup');this.ui?.refresh();}}else{d.x+=(p.x-d.x)*dt*5;d.z+=(p.z-d.z)*dt*5;}}
 }this.drops=this.drops.filter(d=>d.count>0&&d.age<300&&d.y>0);
 }
 tick(){
 for(const[k,age]of Object.entries(this.world.crops)){const[x,y,z]=k.split(',').map(Number);if(Math.abs(x-this.player.x)>this.radius*16||Math.abs(z-this.player.z)>this.radius*16)continue;const t=this.world.get(x,y,z);if(![28,30].includes(t)){delete this.world.crops[k];continue;}
 if(t===28){if(this.world.get(x,y-1,z)!==27){this.change(x,y,z,0);delete this.world.crops[k];continue;}let wet=false;for(let dx=-4;dx<=4&&!wet;dx++)for(let dz=-4;dz<=4;dz++)if(this.world.get(x+dx,y-1,z+dz)===13){wet=true;break;}this.world.crops[k]=age+(wet?1:.15);if(this.world.crops[k]>100){this.change(x,y,z,29);delete this.world.crops[k];}}
 else if(t===30&&age>150&&y+6<V.H){let clear=true;for(let j=1;j<=4;j++)if(this.world.get(x,y+j,z))clear=false;if(clear){for(let j=0;j<5;j++)this.change(x,y+j,z,5);for(let dy=3;dy<6;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)if(Math.abs(dx)+Math.abs(dz)<4&&!this.world.get(x+dx,y+dy,z+dz))this.change(x+dx,y+dy,z+dz,6);delete this.world.crops[k];}}else this.world.crops[k]=age+1;
 }
 if(this.inventory.count(5))this.achievement('wood','Your first timber');if(this.inventory.count(15))this.achievement('stone','The stone age');if(this.inventory.count(105))this.achievement('iron','Forged in fire');if(this.inventory.count(104))this.achievement('diamond','Something precious');if(this.time>960&&this.mode!=='creative')this.achievement('night','Through the first night');
 }
 step(dt){if(!this.started||this.paused||this.dead)return;this.time+=dt;this.attack=Math.max(0,this.attack-dt);this.hurt=Math.max(0,this.hurt-dt*3);this.invulnerable=Math.max(0,this.invulnerable-dt);
 const p=this.player,k=this.panel?{}:this.keys,dx=(k.KeyD?1:0)-(k.KeyA?1:0),dz=(k.KeyW?1:0)-(k.KeyS?1:0),len=Math.hypot(dx,dz)||1;this.sprint=(k.ShiftLeft||k.ShiftRight)&&this.hunger>6;const wet=this.world.get(Math.floor(p.x),Math.floor(p.y+.9),Math.floor(p.z))===13,eye=this.world.get(Math.floor(p.x),Math.floor(p.y+1.62),Math.floor(p.z));
 const speed=this.flying?10:wet?2.6:this.sprint?6.2:4.1,mx=(Math.cos(this.yaw)*dx+Math.sin(this.yaw)*dz)/len*speed*dt,mz=(Math.sin(this.yaw)*dx-Math.cos(this.yaw)*dz)/len*speed*dt;
 if(this.flying){this.vy=((k.Space?1:0)-(k.KeyQ?1:0))*7;}else if(wet){this.vy=Math.max(-2,this.vy-5*dt);if(k.Space)this.vy=4;}else{if(k.Space&&this.grounded){this.vy=8.2;this.grounded=false;this.sound('step');}this.vy=Math.max(-35,this.vy-22*dt);}
 this.move(mx,this.vy*dt,mz);
 if(this.mode!=='creative'){
 this.hunger=Math.max(0,this.hunger-dt*(.004+((dx||dz) ? .008 : 0)+(this.sprint ? .025 : 0)));
 if(eye===13){this.breath=Math.max(0,this.breath-dt);if(this.breath<=0)this.damage(2,'deep water');}else this.breath=Math.min(10,this.breath+dt*4);
 if(this.world.get(Math.floor(p.x),Math.floor(p.y),Math.floor(p.z))===31)this.damage(5,'lava');
 if(this.hunger>=18&&this.health<20){this.health=Math.min(20,this.health+dt*.17);this.hunger-=dt*.025;}if(this.hunger===0)this.damage(1,'starvation');
 }
 this.target=V.raycast(this.world,this.eye(),this.direction(),this.mode==='creative'?7:5);this.mine(dt);this.updateMobs(dt);this.updateDrops(dt);
 for(const[k,e]of Object.entries(this.world.entities)){if(e.kind==='furnace'){const[x,,z]=k.split(',').map(Number);if(Math.abs(x-p.x)<this.radius*16&&Math.abs(z-p.z)<this.radius*16)V.smelt(e,dt);}}
 this.tickTimer+=dt;if(this.tickTimer>=1){this.tickTimer-=1;this.tick();}
 this.fallTimer+=dt;if(this.fallTimer>.12){this.fallTimer=0;let n=0;for(const k of this.fallQueue){this.fallQueue.delete(k);const[x,y,z]=k.split(',').map(Number);if(this.world.get(x,y,z)===4&&[0,13].includes(this.world.get(x,y-1,z))&&y>1){const below=this.world.get(x,y-1,z);this.world.set(x,y,z,below);this.world.set(x,y-1,z,4);this.fallQueue.add(V.key(x,y-1,z));this.fallQueue.add(V.key(x,y+1,z));}if(++n>24)break;}}
 this.spawnTimer+=dt;if(this.spawnTimer>12){this.spawnTimer=0;if(this.daylight()<.4&&this.mobs.filter(m=>m.kind==='zombie').length<7)this.spawnMob('zombie',18+Math.random()*15);else if(this.mobs.filter(m=>m.kind!=='zombie').length<9)this.spawnMob(Math.random()<.4?'sheep':'pig',24);}
 this.saveTimer+=dt;if(this.saveTimer>20){this.saveTimer=0;this.save();}
 }
 sound(kind){try{const a=this.audio=this.audio||new(window.AudioContext||window.webkitAudioContext)();if(a.state==='suspended')a.resume();const o=a.createOscillator(),g=a.createGain();o.type=kind==='hurt'?'sawtooth':'triangle';const f={mine:110,place:220,craft:660,eat:180,hurt:90,pickup:850,hit:140,step:70}[kind]||200;o.frequency.setValueAtTime(f,a.currentTime);o.frequency.exponentialRampToValueAtTime(kind==='craft'?990:45,a.currentTime+.1);g.gain.setValueAtTime(kind==='pickup' ? .015 : .035,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.14);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.15);}catch{}}
 loop(now){const dt=Math.min(.25,(now-this.last)/1000);this.last=now;this.acc+=dt;while(this.acc>=1/60){this.step(1/60);this.acc-=1/60;}this.renderer.updateChunks(this.world,this.player,this.radius,1);this.renderer.render(this);this.ui?.hud(now);requestAnimationFrame(t=>this.loop(t));}
}
V.Game=Game;
})(globalThis.VW);
