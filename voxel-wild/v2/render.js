/* WebGL renderer: chunk meshes, procedural materials, dynamic light and box rigs. */
(function(V){'use strict';
const faces=[{n:[1,0,0],p:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]]},{n:[-1,0,0],p:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]]},{n:[0,1,0],p:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]]},{n:[0,-1,0],p:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]},{n:[0,0,1],p:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]]},{n:[0,0,-1],p:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]}],uv=[[0,0],[1,0],[1,1],[0,1]],tri=[0,1,2,0,2,3];
function face(a,x,y,z,f,t,l=1,s=[1,1,1],angle=0,origin=[x,z]){const co=Math.cos(angle),si=Math.sin(angle);for(const k of tri){const p=f.p[k],px=x+p[0]*s[0]-origin[0],pz=z+p[2]*s[2]-origin[1];a.push(origin[0]+px*co-pz*si,y+p[1]*s[1],origin[1]+px*si+pz*co,f.n[0]*co-f.n[2]*si,f.n[1],f.n[0]*si+f.n[2]*co,...uv[k],t,l);}}
function box(a,x,y,z,s,t,l=1,angle=0,origin=[x,z]){for(const f of faces)face(a,x,y,z,f,t,l,s,angle,origin);}
function rgb(hex){return hex.match(/[a-f\d]{2}/gi).map(n=>parseInt(n,16)/255);}
function mul(a,b){const c=new Float32Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)c[i+j*4]+=a[i+k*4]*b[k+j*4];return c;}
V.cameraMatrix=function(e,yaw,pitch,aspect,fov=75){const d=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)],r=[Math.cos(yaw),0,Math.sin(yaw)],u=[-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),Math.cos(yaw)*Math.sin(pitch)];const dot=a=>a.reduce((s,v,i)=>s+v*e[i],0);const view=[r[0],u[0],-d[0],0,r[1],u[1],-d[1],0,r[2],u[2],-d[2],0,-dot(r),-dot(u),dot(d),1];const f=1/Math.tan(fov*Math.PI/360),p=[f/aspect,0,0,0,0,f,0,0,0,0,-1.000667,-1,0,0,-.12004,0];return mul(p,view);};
class Renderer{
 constructor(canvas){
 this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});if(!gl)throw Error('WebGL unavailable. Try a browser with hardware acceleration.');
 const vs=`attribute vec3 aPos;attribute vec3 aNormal;attribute vec2 aUV;attribute float aType;attribute float aLight;uniform mat4 uMatrix;varying vec3 vPos;varying vec3 vNormal;varying vec2 vUV;varying float vType;varying float vLight;void main(){vPos=aPos;vNormal=aNormal;vUV=aUV;vType=aType;vLight=aLight;gl_Position=uMatrix*vec4(aPos,1.);}`;
 let palette='';for(const b of Object.values(V.blocks))palette+=`if(abs(t-${b.id}.)<.4)c=vec3(${rgb(b.color).map(x=>x.toFixed(4)).join(',')});`;
 const fs=`precision mediump float;varying vec3 vPos;varying vec3 vNormal;varying vec2 vUV;varying float vType;varying float vLight;uniform vec3 uEye;uniform vec3 uSky;uniform vec3 uTorches[8];uniform float uDay;uniform float uTime;uniform float uFog;uniform float uHurt;float rnd(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){float t=floor(vType+.5);vec3 c=vec3(.8);float a=1.;vec2 px=floor(vUV*16.);float n=rnd(px+floor(vPos.xz*.003));${palette}
 if(t==1.&&vNormal.y<.5)c=vUV.y>.79+rnd(vec2(px.x,0.))*.12?vec3(.39,.56,.21):vec3(.52,.36,.23);
 if(t==5.){c*=.78+.4*rnd(vec2(px.x,0.));if(abs(vNormal.y)>.5)c=vec3(.62,.47,.29)*(mod(floor(length(vUV-.5)*16.),3.)<1.?.72:1.);}
 if(t==7.||t==19.||t==21.||t==25.||t==26.){if(mod(px.y,4.)<1.)c*=.72;if(mod(px.x+floor(px.y/4.)*7.,16.)<1.)c*=.8;}
 if(t==19.&&vNormal.y>.5&& (mod(px.x,5.)<1.||mod(px.y,5.)<1.))c*=.48;
 if(t==20.&&abs(vNormal.z)>.5){if(px.x>3.&&px.x<12.&&px.y>2.&&px.y<9.)c=vec3(.18,.2,.2);if(px.y>11.&&px.x>2.&&px.x<13.)c*=.5;}
 if(t==21.){if(px.y<2.||px.y>13.)c*=.55;if(abs(vNormal.z)>.5&&px.x>6.&&px.x<10.&&px.y>5.&&px.y<11.)c=vec3(.85,.82,.62);}
 if(t==8.||t==15.){if(mod(px.y,8.)<1.||mod(px.x+floor(px.y/8.)*8.,16.)<1.)c*=.68;}
 if(t==11.||t==16.||t==17.||t==18.){if(n<.72)c=vec3(.49,.52,.51);else if(t==11.)c*=.32;}
 if(t==6.&&n>.91)discard;
 if(t==9.){float edge=min(min(vUV.x,1.-vUV.x),min(vUV.y,1.-vUV.y));a=edge<.065?.85:.2;if(abs(vUV.x-vUV.y)<.035)a=.5;}
 if(t==13.){a=.66;n=.6+.15*sin((vPos.x+vPos.z)*1.8+uTime);c+=.035*sin(vPos.x*3.+uTime);}
 if(t==27.){if(mod(px.x,4.)<1.)c*=.65;}
 if(t==24.&&vUV.y>.73)c=vec3(.86,.89,.82);
 if(t==32.&&mod(px.x,4.)<1.)c*=.67;
 if(t>=80.&&t<81.)c=vec3(.84,.52,.48);if(t==81.)c=vec3(.93,.88,.75);if(t==82.)c=vec3(.29,.37,.22);if(t==83.)c=vec3(.28,.41,.46);if(t==84.)c=vec3(.15,.2,.21);if(t==85.)c=vec3(.88,.91,.95);if(t==86.)c=vec3(.98,.87,.52);if(t==87.)c=vec3(.88,.17,.15);if(t==88.)c=vec3(.93,.89,.77);
 float shade=.66+max(0.,dot(normalize(vNormal),normalize(vec3(-.5,.86,.3))))*.36;
 float light=mix(.11,uDay,vLight);for(int j=0;j<8;j++){float d=distance(vPos,uTorches[j]);light=max(light,max(0.,1.-d/9.));}
 if(t==22.||t==31.||t==86.||t==85.||t==99.)light=1.;if(t==31.)c*=.9+.2*sin(vPos.x*4.+vPos.z*5.+uTime*2.);if(t==99.)c=vec3(1.,.98,.7);
 c*=shade*(.87+n*.22)*light;float fog=smoothstep(uFog*.62,uFog,length(vPos.xz-uEye.xz));if(t==85.||t==86.||t==88.)fog=0.;c=mix(c,uSky,fog);c=mix(c,vec3(.8,.13,.08),uHurt*.25);gl_FragColor=vec4(c,a);}`;
 const compile=(type,s)=>{const shader=gl.createShader(type);gl.shaderSource(shader,s);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
 this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);
 this.loc={};for(const x of ['aPos','aNormal','aUV','aType','aLight'])this.loc[x]=gl.getAttribLocation(this.program,x);for(const x of ['uMatrix','uEye','uSky','uTorches[0]','uDay','uTime','uFog','uHurt'])this.loc[x]=gl.getUniformLocation(this.program,x);
 gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);this.meshes=new Map();this.dynamic=this.buffer([]);this.lines=this.buffer([]);this.lastTarget='';
 }
 buffer(a){let gl=this.gl,b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(a),gl.STATIC_DRAW);return{b,n:a.length/10};}
 update(b,a){const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,b.b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(a),gl.DYNAMIC_DRAW);b.n=a.length/10;}
 draw(b,mode){if(!b?.n)return;const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,b.b);for(const[n,size,o]of[['aPos',3,0],['aNormal',3,12],['aUV',2,24],['aType',1,32],['aLight',1,36]]){const l=this.loc[n];gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,40,o);}gl.drawArrays(mode||gl.TRIANGLES,0,b.n);}
 mesh(w,c){const a=[],clear=[],x0=c.cx*16,z0=c.cz*16;
 for(let y=0;y<V.H;y++)for(let z=z0;z<z0+16;z++)for(let x=x0;x<x0+16;x++){
 const t=c.data[x-x0+16*(z-z0+16*y)];if(!t)continue;const h=c.top[x-x0+16*(z-z0)],l=y>=h?1:Math.max(.03,1-(h-y)*.2);
 if(t===22){box(a,x+.43,y,z+.43,[.14,.7,.14],5,l);box(a,x+.39,y+.6,z+.39,[.22,.24,.22],22,1);continue;}
 if([28,29,30,35,36].includes(t)){const height=t===29?.85:t===30?.65:t===35?.6:.4;for(let j=0;j<3;j++)box(a,x+.18+j*.24,y,z+.25+(j%2)*.3,[.09,height,.09],t,l);if(t===30)box(a,x+.18,y+.32,z+.18,[.65,.2,.65],6,l);if(t===35)box(a,x+.32,y+.45,z+.3,[.38,.18,.38],35,l);continue;}
 if(t===25||t===26){box(a,x,y,z,t===25?[1,1,.13]:[.13,1,1],t,l);continue;}
 const scale=[1,t===24?.6:t===27?.94:1,1];
 for(const f of faces){const b=w.get(x+f.n[0],y+f.n[1],z+f.n[2],false);if(b===t&&t!==24)continue;if(t===13&&f.n[1]!==1)continue;if(b&&V.blocks[b]?.solid&&!V.blocks[b]?.transparent&&t!==24&&t!==27)continue;face(t===9||t===13?clear:a,x,y,z,f,t,l,scale);}
 }
 const k=V.ckey(c.cx,c.cz),old=this.meshes.get(k);if(old){this.gl.deleteBuffer(old.a.b);this.gl.deleteBuffer(old.clear.b);}this.meshes.set(k,{a:this.buffer(a),clear:this.buffer(clear),x:x0+8,z:z0+8});w.dirty.delete(k);
 }
 clear(){for(const c of this.meshes.values()){this.gl.deleteBuffer(c.a.b);this.gl.deleteBuffer(c.clear.b);}this.meshes.clear();this.lastTarget='';}
 updateChunks(w,p,radius=3,budget=2){const cx=Math.floor(p.x/16),cz=Math.floor(p.z/16);const needed=[];for(let z=cz-radius;z<=cz+radius;z++)for(let x=cx-radius;x<=cx+radius;x++)needed.push([x,z,Math.hypot(x-cx,z-cz)]);needed.sort((a,b)=>a[2]-b[2]);let done=0;
 for(const[x,z]of needed){const k=V.ckey(x,z);if(!w.chunks.has(k)){w.generate(x,z);for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]])w.dirty.add(V.ckey(x+dx,z+dz));}if(!this.meshes.has(k)||w.dirty.has(k)){this.mesh(w,w.chunks.get(k));if(++done>=budget)break;}}
 for(const[k,m]of this.meshes)if(Math.abs(m.x/16-.5-cx)>radius+1||Math.abs(m.z/16-.5-cz)>radius+1){this.gl.deleteBuffer(m.a.b);this.gl.deleteBuffer(m.clear.b);this.meshes.delete(k);}
 for(const[k,c]of w.chunks)if(Math.abs(c.cx-cx)>radius+2||Math.abs(c.cz-cz)>radius+2){w.chunks.delete(k);w.dirty.delete(k);}
 }
 mob(a,m,time){const x=m.x,y=m.y,z=m.z,angle=m.yaw||0,o=[x,z],hurt=m.flash>0,body=m.kind==='sheep'?81:m.kind==='zombie'?83:80,skin=m.kind==='zombie'?82:m.kind==='sheep'?88:80,step=Math.sin(time*8+(m.phase||0))*(m.moving?.13:.02);
 const part=(dx,dy,dz,s,t)=>box(a,x+dx,y+dy,z+dz,s,hurt?87:t,1,angle,o);
 if(m.kind==='zombie'){
 part(-.26,.65,-.16,[.52,.68,.32],body);part(-.23,1.34,-.23,[.46,.46,.46],skin);
 part(-.25,step,-.14,[.2,.68,.26],84);part(.05,-step,-.14,[.2,.68,.26],84);
 part(-.42,.92,-.5,[.16,.2,.6],skin);part(.26,.92,-.5,[.16,.2,.6],skin);
 part(-.15,1.59,-.239,[.09,.055,.016],84);part(.06,1.59,-.239,[.09,.055,.016],84);
 }else{
 part(-.35,.35,-.46,[.7,.5,.95],body);part(-.24,.59,-.76,[.48,.43,.44],skin);part(-.17,.63,-.83,[.34,.16,.15],80);
 for(const[dx,dz]of[[-.29,-.35],[.12,-.35],[-.29,.28],[.12,.28]])part(dx,(dx*dz>0?step:-step),dz,[.17,.37,.18],m.kind==='sheep'?84:80);
 part(-.17,.86,-.771,[.07,.05,.016],84);part(.1,.86,-.771,[.07,.05,.016],84);
 }
 }
 render(g){const gl=this.gl,p=g.player,time=g.time,day=g.daylight(),e=[p.x,p.y+1.62,p.z],ratio=Math.min(devicePixelRatio||1,g.quality||1.4),w=Math.round(this.canvas.clientWidth*ratio),h=Math.round(this.canvas.clientHeight*ratio);
 if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}gl.viewport(0,0,w,h);gl.useProgram(this.program);
 const underwater=g.world.get(Math.floor(p.x),Math.floor(p.y+1.6),Math.floor(p.z))===13;
 const sky=underwater?[.13,.36,.44]:[.39*day+.035,.62*day+.027,.73*day+.045];
 gl.clearColor(...sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(this.loc.uMatrix,false,V.cameraMatrix(e,g.yaw,g.pitch,w/h,g.sprint?80:75));gl.uniform3fv(this.loc.uEye,e);gl.uniform3fv(this.loc.uSky,sky);gl.uniform1f(this.loc.uDay,day);gl.uniform1f(this.loc.uTime,time);gl.uniform1f(this.loc.uFog,underwater?15:g.radius*16+7);gl.uniform1f(this.loc.uHurt,g.hurt||0);
 const lights=[];if(g.inventory.slots[g.selected]?.id===22)lights.push(e);for(const[k,m]of g.world.edits){const[cx,cz]=k.split(',').map(Number);if(Math.abs(cx*16-p.x)>45||Math.abs(cz*16-p.z)>45)continue;for(const[i,t]of m)if(t===22||t===31){const y=Math.floor(i/256),z=Math.floor(i%256/16)+cz*16,x=i%16+cx*16;if(Math.hypot(x-p.x,y-p.y,z-p.z)<28)lights.push([x+.5,y+.8,z+.5]);}}
 lights.sort((a,b)=>Math.hypot(a[0]-p.x,a[2]-p.z)-Math.hypot(b[0]-p.x,b[2]-p.z));while(lights.length<8)lights.push([99999,99999,99999]);gl.uniform3fv(this.loc['uTorches[0]'],lights.slice(0,8).flat());
 gl.disable(gl.BLEND);gl.depthMask(true);
 const meshes=[...this.meshes.values()];for(const m of meshes)this.draw(m.a);
 let a=[];for(const m of g.mobs||[])this.mob(a,m,time);
 for(const d of g.drops||[]){const t=V.items[d.id]?.block?d.id:V.items[d.id]?.food?80:V.items[d.id]?.tool?16:18;box(a,d.x-.13,d.y+.2+Math.sin(time*2+d.x)*.05,d.z-.13,[.26,.26,.26],t,1,time,[d.x,d.z]);}
 // Celestial cubes and clouds are original geometry, not image assets.
 const angle=((g.time%720)/720)*Math.PI*2-Math.PI/2;
 box(a,p.x+Math.cos(angle)*80-2,p.y+Math.sin(angle)*80,p.z-38,[5,5,5],86);box(a,p.x-Math.cos(angle)*80-2,p.y-Math.sin(angle)*80,p.z+38,[4,4,4],85);
 for(let j=0;j<15;j++){const x=Math.floor(p.x/80)*80+((j*41+time*.4)%170)-80,z=Math.floor(p.z/80)*80+(j*67%170)-80;box(a,x,61+j%3*2,z,[9+j%4*2,1.1,4+j%3],88);}
 this.update(this.dynamic,a);this.draw(this.dynamic);
 gl.enable(gl.BLEND);gl.depthMask(false);meshes.sort((a,b)=>Math.hypot(b.x-p.x,b.z-p.z)-Math.hypot(a.x-p.x,a.z-p.z));for(const m of meshes)this.draw(m.clear);gl.depthMask(true);gl.disable(gl.BLEND);
 const hit=g.target,tk=hit?hit.cell.join(','):'';if(tk!==this.lastTarget){this.lastTarget=tk;let lines=[];if(hit){const[x,y,z]=hit.cell,pts=[[0,0,0],[1,0,0],[1,0,1],[0,0,1],[0,1,0],[1,1,0],[1,1,1],[0,1,1]];for(const edge of[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])for(const i of edge){const v=pts[i];lines.push(x+v[0]*1.004-.002,y+v[1]*1.004-.002,z+v[2]*1.004-.002,0,1,0,0,0,99,1);}}this.update(this.lines,lines);}this.draw(this.lines,gl.LINES);
 }
}
V.Renderer=Renderer;
})(globalThis.VW);
