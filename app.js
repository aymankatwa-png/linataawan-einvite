import * as THREE from 'three';
import { GLTFLoader } from './lib/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from './lib/jsm/environments/RoomEnvironment.js';
import { XRHandModelFactory } from './lib/jsm/webxr/XRHandModelFactory.js';
import { Reflector } from './lib/jsm/objects/Reflector.js';
import { mergeGeometries } from './lib/jsm/utils/BufferGeometryUtils.js';

/* =========================================================
   «اكسر الصمت» Break the Silence: a short VR piece for the
   16 Days of Activism against Gender-Based Violence.
   One rule for the visitor: reach out and touch what glows.
   Text and voice lines: edit LINES / WORDS below.
   Rooms are modeled and light-baked in Blender (blender/scene.py).
   ========================================================= */
const ORANGE=0xF0401F, AMBER=0xFF9A3C, CREAM=0xFDEEE6, NAVY=0x211D70;
const $=s=>document.querySelector(s);
const V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(()=>{ let s=1616; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; })();
let LANG='ar'; const tr=(a,e)=>LANG==='en'?e:a;

/* ---------------- STORY (voice file number, Arabic, English) ---------------- */
const LINES={
 home:   ['h_1','هذا حوشي. المفروض.. يكون أأمن مكان في الدنيا.','This is my home. It is supposed to be the safest place in the world.'],
 salma:  ['h_2','سلمى.. صاحبتي. من شهور ما شفتهاش.','Salma. My friend. I have not seen her in months.'],
 here:   ['h_3','جا.','He is here.'],
 told:   ['h_4','قالوا لي: اسكتي. قالوا: عيب. قالوا: اصبري.. كل البيوت هكي.','They told me: stay quiet. They said: shame. They said: be patient. Every home is like this.'],
 mirror: ['h_5','نطالع في المراية.. وما عادش نعرف روحي.','I look in the mirror, and I no longer know who I am.'],
 hide:   ['h_6','ما تتحركيش.. ما تتنفسيش.. خلّيه يعدّي.','Do not move. Do not breathe. Let it pass.'],
 speak:  ['h_7','لو تكلمت.. شن بيصير؟','If I speak, what will happen?'],
 heard:  ['v_8','أول مرة.. حد يسمعني.','For the first time, someone listened.'],
 days:   ['v_9','ستة عشر يومًا كل سنة، العالم يولّع ضوء.. باش حتى وحدة ما تقعد في الظلام.','Sixteen days, every year, the world lights up, so that no woman is left in the dark.'],
 yours:  ['v_10','ضوء واحد ما يكفيش. نبّي ضوّك إنت.','One light is not enough. I need yours.'],
 off:    ['h_8','إنت تقدر تنحّي النظّارة توّا.. أنا ما نقدرش.','You can take the headset off now. I cannot.'],
 hear:   ['h_9','خلّي غيرك يسمع.','Help others hear.'],
};
// what she is told (stone, his voice m_5..m_9) -> the truth it turns into (her voice v_3..v_7)
const WORDS=[
 ['اسكتي','Stay quiet','صوتي حق','My voice is my right',3],
 ['عيب تحكي','Shame on you for speaking','العيب في العنف.. مش في الكلام','The shame is in the violence, not in speaking',4],
 ['هذا شأن عائلي','This is a family matter','الأمان حقّي','Safety is my right',5],
 ['إنتِ السبب','It is your fault','مش ذنبي','It is not my fault',6],
 ['اصبري','Just endure it','مش لازم نتحمّل بروحي','I do not have to carry this alone',7],
];
const HINT={
 lang:['اختر اللغة: المس ضوء','Choose a language: touch a light'],
 phone:['امسك التليفون','Pick up the phone'],
 mirror:['المس المراية','Touch the mirror'],
 door:['ادفع الباب بيديك!','Push the door shut with your hands!'],
 lock:['اقفل الباب','Lock the door'],
 handle:['افتح الباب','Open the door'],
 lantern:['المس الفانوس، ارفعه، وخلّيه يطير','Touch a lantern, lift it up, let it fly'],
 words:['مدّ يدك واكسر الكلمات','Reach out and break the words'],
 light:['خذ الضوء بيدك','Take the light in your hand'],
 lanterns:['نوّر الفوانيس بيدك','Light the lanterns with your hand'],
 hand:['حُط يدك هنا','Place your hand here'],
 again:['المس الضوء للبدء من جديد','Touch the light to start again'],
};

/* ---------------- RENDERER ---------------- */
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.xr.enabled=true; renderer.xr.setFoveation(1); renderer.xr.setReferenceSpaceType('local-floor');
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x05060f);
const pm=new THREE.PMREMGenerator(renderer); scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture; scene.environmentIntensity=.25;
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.06,300);
const rig=new THREE.Group(); rig.add(camera); scene.add(rig); camera.position.set(0,1.6,0);
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
const hemi=new THREE.HemisphereLight(0x8fa8ff,0x10121c,.3); scene.add(hemi);
const moonL=new THREE.DirectionalLight(0x9db8ff,.9); moonL.position.set(-6,5,-1.5); scene.add(moonL);
const warmL=new THREE.PointLight(0xff9a4a,0,9,1.6); warmL.position.set(0,2.2,-1.4); scene.add(warmL);

/* ---------------- TWEENS ---------------- */
const tweens=[];
const ease={ out:t=>1-Math.pow(1-t,3), inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, lin:t=>t, back:t=>{const c=2.38;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);} };
function tween(dur,fn,o={}){ return new Promise(res=>tweens.push({t:-(o.delay||0),dur,fn,e:ease[o.ease||'out'],res})); }
const wait=s=>tween(s,()=>{});
function pop(obj,s=1,delay=0,dur=.6){ obj.visible=true; obj.scale.setScalar(1e-4); return tween(dur,k=>obj.scale.setScalar(Math.max(1e-4,s*k)),{ease:'back',delay}); }
function shrink(obj,dur=.35){ const s=obj.scale.x; return tween(dur,k=>obj.scale.setScalar(Math.max(1e-4,s*(1-k))),{ease:'inOut'}).then(()=>{ obj.visible=false; }); }
function until(cond){ return new Promise(res=>{ const f=()=>cond()?res():setTimeout(f,60); f(); }); }

/* ---------------- TEXTURES ---------------- */
const loader=new THREE.TextureLoader();
const BUILD=window.BUILD||'0';
function tex(url,o={}){ const t=loader.load(url+'?v='+BUILD); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; if(o.flipY===false) t.flipY=false; if(o.repeat){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t; }
function canvasTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; }
const glowTex=canvasTex(128,128,g=>{ const r=g.createRadialGradient(64,64,2,64,64,64); r.addColorStop(0,'rgba(255,235,200,1)'); r.addColorStop(.3,'rgba(255,170,80,.55)'); r.addColorStop(1,'rgba(255,120,40,0)'); g.fillStyle=r; g.fillRect(0,0,128,128); });
function glow(size,color=0xffffff,op=1){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op})); s.scale.setScalar(size); return s; }
function textPlane(text,o={}){ // crisp text on a transparent plane; returns a mesh sized in meters
  const px=o.px||120, font=`${o.weight||900} ${px}px Cairo`; const m=document.createElement('canvas').getContext('2d'); m.font=font;
  const maxW=o.maxW||1800; const words=String(text).split(' '); const lines=[]; let cur='';
  for(const w of words){ const t=cur?cur+' '+w:w; if(m.measureText(t).width>maxW&&cur){ lines.push(cur); cur=w; } else cur=t; } if(cur) lines.push(cur);
  const W=Math.ceil(Math.max(...lines.map(l=>m.measureText(l).width)))+80, lh=px*1.5, H=Math.ceil(lines.length*lh+40);
  const t=canvasTex(W,H,g=>{ g.font=font; g.textAlign='center'; g.textBaseline='middle'; g.direction=o.ltr?'ltr':'rtl'; if(o.shadow!==false){ g.shadowColor='rgba(0,0,0,.85)'; g.shadowBlur=px*.22; } g.fillStyle=o.color||'#fff'; lines.forEach((l,i)=>g.fillText(l,W/2,20+lh*(i+.5))); });
  const h=(o.h||.09)*lines.length*1.5+.02, w=h*W/H; const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,opacity:o.opacity??1,side:THREE.DoubleSide,fog:false})); mesh.userData.w=w; mesh.userData.h=h; return mesh; }

/* ---------------- SKY ---------------- */
{ const N=900, p=new Float32Array(N*3), c=new Float32Array(N*3); for(let i=0;i<N;i++){ const u=rnd()*2-1, a=rnd()*Math.PI*2, r=Math.sqrt(1-u*u); const y=Math.abs(u)*.96+.04; p[i*3]=Math.cos(a)*r*200; p[i*3+1]=y*200; p[i*3+2]=Math.sin(a)*r*200; const b=.5+rnd()*.5; c[i*3]=b; c[i*3+1]=b*(.9+rnd()*.1); c[i*3+2]=b*(.85+rnd()*.3); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(p,3)); g.setAttribute('color',new THREE.BufferAttribute(c,3));
  scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.5,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,fog:false})));
  const sky=new THREE.Mesh(new THREE.SphereGeometry(220,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 p; void main(){ p=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',fragmentShader:'varying vec3 p; void main(){ float h=clamp(normalize(p).y,0.0,1.0); vec3 c=mix(vec3(.05,.07,.18),vec3(.01,.012,.04),pow(h,.55)); gl_FragColor=vec4(c,1.0); }'})); sky.renderOrder=-10; scene.add(sky);
  const moon=glow(26,0xcfe0ff,1); moon.position.set(-150,95,-40); moon.material.fog=false; scene.add(moon); }

/* ---------------- BAKED WORLD ---------------- */
// U.mixR / U.mixY blend the two baked lighting states; U.bR / U.bY drive the build-up wave.
const U={ mixR:{value:0}, mixY:{value:0}, bR:{value:1}, bY:{value:1}, dim:{value:1} };
function bakedMat(o){ // o: {map, lmA, lmB} for shells or {a, b} for props; which: 'R' | 'Y'
  const shell=!!o.lmA; const m=new THREE.MeshBasicMaterial(shell?{map:o.map,lightMap:o.lmA,lightMapIntensity:Math.PI,color:o.color||0xffffff}:{map:o.a,side:THREE.DoubleSide});
  const mix=o.which==='R'?U.mixR:U.mixY, bu=o.which==='R'?U.bR:U.bY;
  m.customProgramCacheKey=()=> 'bk'+(shell?'S':'P');
  m.onBeforeCompile=sh=>{ sh.uniforms.uMix=mix; sh.uniforms.uB=bu; sh.uniforms.uDim=U.dim; sh.uniforms.tB={value:shell?o.lmB:o.b};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uB; varying float vK;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\n vec4 wp0=modelMatrix*vec4(transformed,1.0); float dd=length(wp0.xz); float kk=clamp((uB*17.0-dd)/3.2,0.0,1.0); kk=kk*kk*(3.0-2.0*kk); vK=kk; transformed.y*=kk+sin(kk*3.14159)*0.16;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uMix; uniform float uDim; uniform sampler2D tB; varying float vK;')
      .replace('#include <opaque_fragment>','outgoingLight*=uDim; outgoingLight+=vec3(1.0,.42,.10)*(sin(vK*3.14159)*0.9); if(vK<0.004) discard;\n#include <opaque_fragment>');
    if(shell) sh.fragmentShader=sh.fragmentShader.replace('texture2D( lightMap, vLightMapUv )','mix(texture2D( lightMap, vLightMapUv ),texture2D(tB,vLightMapUv),uMix)');
    else sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,texture2D(tB,vMapUv).rgb,uMix);'); };
  return m; }
const room=new THREE.Group(), yard=new THREE.Group(); scene.add(room,yard); yard.visible=false;
const T={}; let META={};
const bk=n=>{ const t=tex('bake/'+n+'.jpg',{flipY:false}); return t; };
const lm=n=>{ const t=bk(n); t.channel=1; return t; };
const tile=(n,rep)=>{ const t=tex('img/'+n+'.jpg',{repeat:true,flipY:false}); return t; };
const worldReady=Promise.all([ fetch('bake/meta.json?v='+BUILD).then(r=>r.json()).then(j=>META=j), new Promise((res,rej)=>new GLTFLoader().load('bake/scene.glb?v='+BUILD,res,undefined,rej)) ]).then(([_,g])=>{
  const rl=[lm('room_lm_a'),lm('room_lm_b')];
  const M={ room_floor:bakedMat({which:'R',map:(()=>{ const t=tile('ptile'); t.repeat.set(2,2); return t; })(),lmA:rl[0],lmB:rl[1]}), room_walls:bakedMat({which:'R',map:tile('wallp'),lmA:rl[0],lmB:rl[1]}),
    room_rug:bakedMat({which:'R',map:(()=>{ const t=tile('rug2'); t.repeat.set(1,1.4286); t.offset.set(.3,-.2857); return t; })(),lmA:rl[0],lmB:rl[1]}), room_props:bakedMat({which:'R',a:bk('room_props_a'),b:bk('room_props_b')}), room_door:bakedMat({which:'R',a:bk('room_door_a'),b:bk('room_door_b')}) };
  const list=[]; g.scene.traverse(o=>{ if(o.isMesh) list.push(o); });
  for(const o of list){ T[o.name]=o; o.material=M[o.name]||M.room_props; o.frustumCulled=false; room.add(o); }
  const refl=new THREE.Group(); refl.scale.y=-1; room.add(refl); for(const o of list){ if(o.name==='room_floor'||o.name==='room_rug') continue; const c=new THREE.Mesh(o.geometry,o.material); c.position.copy(o.position); c.quaternion.copy(o.quaternion); c.scale.copy(o.scale); c.frustumCulled=false; refl.add(c); if(o.name==='room_door') T.door_refl=c; }
  M.room_floor.transparent=true; M.room_floor.opacity=.87;
  const win=new THREE.Mesh(new THREE.PlaneGeometry(5.6,3.15),new THREE.MeshBasicMaterial({map:tex('img/street.jpg'),color:0x8c93a6})); win.position.set(-4.4,1.35,-1.7); win.rotation.y=Math.PI/2; room.add(win);
  T.tv=new THREE.Object3D(); });

/* ---------------- AUDIO ---------------- */
const AUD={}; ['m_quiet','m_hope','a_wind','drone'].forEach(n=>{ const a=new Audio('aud/'+n+'.mp3'); a.loop=true; a.volume=0; AUD[n]={a,v:0,t:0}; });
let VO=null;
function music(q,h,w,d=0){ AUD.m_quiet.t=q; AUD.m_hope.t=h; AUD.a_wind.t=w; AUD.drone.t=d; }
function updateAudio(dt){ const duck=VO&&!VO.paused&&!VO.ended?.45:1; for(const k in AUD){ const o=AUD[k]; o.v+=(o.t*(k[0]==='m'?duck:1)-o.v)*Math.min(1,dt*1.2); const v=clamp(o.v,0,1); if(Math.abs(o.a.volume-v)>.004) o.a.volume=v; } }
const pool={}; function sfx(n,v=.7,rate=1){ try{ const a=(pool[n]=pool[n]||[]).find(x=>x.paused||x.ended)||(()=>{ const x=new Audio('aud/'+n+'.mp3'); pool[n].push(x); return x; })(); a.volume=v; a.playbackRate=rate; a.currentTime=0; a.play().catch(()=>{}); }catch(e){} }
function say(n){ return new Promise(res=>{ try{ if(VO){ VO.pause(); } const [pre,num]=String(n).split('_'); const a=new Audio(`aud/${pre}_${LANG}_${num}.mp3`); VO=a; a.volume=1; let done=false; const fin=()=>{ if(!done){ done=true; res(); } }; a.onended=fin; a.onerror=fin; a.play().catch(fin); setTimeout(fin,(FAST?400:12000)); }catch(e){ res(); } }); }

let AC=null; const BUF={}; const DOOR3=new THREE.Vector3(1.15,1.3,-4.9);
function initAudio(){ try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); AC.resume(); }catch(e){} }
function loadBuf(n){ if(!BUF[n]) BUF[n]=fetch('aud/'+n+'.mp3').then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b)); return BUF[n]; }
function play3(n,pos,vol=1,rate=1){ if(FAST) return wait(.3); if(!AC) return new Promise(r=>{ sfx(n,Math.min(1,vol),rate); setTimeout(r,1300); });
  return new Promise(async res=>{ try{ const b=await loadBuf(n); const s=AC.createBufferSource(); s.buffer=b; s.playbackRate.value=rate; const g=AC.createGain(); g.gain.value=vol; const p=AC.createPanner(); p.panningModel='HRTF'; p.distanceModel='inverse'; p.refDistance=1.2; p.rolloffFactor=.6; if(p.positionX){ p.positionX.value=pos.x; p.positionY.value=pos.y; p.positionZ.value=pos.z; } else p.setPosition(pos.x,pos.y,pos.z); s.connect(g); g.connect(p); p.connect(AC.destination); let d=false; const fin=()=>{ if(!d){ d=true; res(); } }; s.onended=fin; s.start(); setTimeout(fin,(b.duration/rate+.6)*1000); }catch(e){ res(); } }); }
function updListener(){ if(!AC) return; const L=AC.listener; camera.getWorldPosition(tmp); camera.getWorldDirection(tmp2); if(L.positionX){ L.positionX.value=tmp.x; L.positionY.value=tmp.y; L.positionZ.value=tmp.z; L.forwardX.value=tmp2.x; L.forwardY.value=tmp2.y; L.forwardZ.value=tmp2.z; L.upX.value=0; L.upY.value=1; L.upZ.value=0; } else { L.setPosition(tmp.x,tmp.y,tmp.z); L.setOrientation(tmp2.x,tmp2.y,tmp2.z,0,1,0); } }

/* ---------------- CAPTIONS ---------------- */
const capRoot=new THREE.Group(); capRoot.position.set(0,1.02,-1.75); capRoot.rotation.x=-.18; const capFrame=new THREE.Group(); capFrame.add(capRoot); scene.add(capFrame); const HO=new THREE.Vector3(); let capMesh=null, hintMesh=null, capId=0;
function capAt(x,y,z,rx,ry=0,sc=1){ capRoot.position.set(x,y,z); capRoot.rotation.set(rx,ry,0,'YXZ'); capRoot.scale.setScalar(sc); }
function caption(ar,en,o={}){ const id=++capId; const old=capMesh; if(old) tween(.4,k=>old.material.opacity=1-k).then(()=>capRoot.remove(old)); if(!ar&&!en) { capMesh=null; return; }
  const m=textPlane(tr(ar,en),{px:96,h:o.h||.075,ltr:LANG==='en',maxW:1500,weight:700,color:o.color||'#FDEEE6',opacity:0}); m.renderOrder=60; m.material.depthTest=false; m.layers.set(6); capRoot.add(m); capMesh=m; tween(.6,k=>{ if(capMesh===m) m.material.opacity=k; }); return id; }
function hint(key){ const old=hintMesh; if(old) tween(.3,k=>old.material.opacity=1-k).then(()=>capRoot.remove(old)); hintMesh=null; if(!key) return;
  const m=textPlane('●  '+tr(...HINT[key]),{px:80,h:.05,ltr:LANG==='en',weight:900,color:'#FF9A3C',opacity:0}); m.position.y=-.26; m.renderOrder=61; m.material.depthTest=false; m.layers.set(6); capRoot.add(m); hintMesh=m; tween(.5,k=>{ if(hintMesh===m) m.material.opacity=k; }); }
async function line(key,hold=.6){ const L=LINES[key]; caption(L[1],L[2]); await say(L[0]); await wait(hold); }

/* ---------------- FADE (used only for start and restart) ---------------- */
const fadeM=new THREE.Mesh(new THREE.SphereGeometry(.3,16,12),new THREE.MeshBasicMaterial({color:0x000000,side:THREE.BackSide,transparent:true,opacity:1,depthTest:false,depthWrite:false,fog:false})); fadeM.renderOrder=999; fadeM.layers.set(6); camera.layers.enable(6); camera.add(fadeM);
const fade=(to,dur=1)=>{ const a=fadeM.material.opacity; fadeM.visible=true; return tween(dur,k=>fadeM.material.opacity=a+(to-a)*k,{ease:'inOut'}).then(()=>{ fadeM.visible=to>0.01; }); };

const lidM=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:1,depthTest:false,depthWrite:false,fog:false}); const lidT=new THREE.Mesh(new THREE.PlaneGeometry(3,1.5),lidM), lidB=new THREE.Mesh(new THREE.PlaneGeometry(3,1.5),lidM); lidT.renderOrder=lidB.renderOrder=998; camera.add(lidT,lidB); lidT.layers.set(6); lidB.layers.set(6);
function lids(o){ lidT.position.set(0,.75+o*.8,-.2); lidB.position.set(0,-.75-o*.8,-.2); lidT.visible=lidB.visible=o<.999; } lids(1);
async function blink(fn,hold=.4){ await tween(.22,k=>lids(1-k),{ease:'inOut'}); if(fn) await fn(); await wait(FAST?.05:hold); await tween(.55,k=>lids(k),{ease:'out'}); }
async function walk(pts,speed=1.0){ const o=headOff().clone(); HO.copy(o); const P=[rig.position.clone(),...pts.map(p=>V3(p[0]-o.x,0,p[1]-o.z))]; const L=[0]; for(let i=1;i<P.length;i++) L.push(L[i-1]+P[i].distanceTo(P[i-1])); const tot=L[L.length-1]; if(tot<.02) return; sfx('steps',.3,1.25); tween(.5,k=>lids(1-.72*k));
  await tween(FAST?.3:tot/speed,k=>{ const d=k*tot; let i=1; while(i<L.length-1&&L[i]<d) i++; const f=(d-L[i-1])/Math.max(1e-6,L[i]-L[i-1]); rig.position.lerpVectors(P[i-1],P[i],clamp(f,0,1)); },{ease:'inOut'}); await tween(.5,k=>lids(.28+.72*k)); }
const _hc=new THREE.Vector3(), _he=new THREE.Euler(), _Y=new THREE.Vector3(0,1,0);
function headOff(){ return _hc.copy(camera.position).setY(0).applyAxisAngle(_Y,rig.rotation.y); }   // where the head is inside the play space
function goto(x,z){ const o=headOff(); HO.copy(o); rig.position.set(x-o.x,0,z-o.z); }
function center(x,z){ _he.setFromQuaternion(camera.quaternion,'YXZ'); rig.rotation.y=-_he.y; goto(x,z); }   // put the head at x,z looking at the scene (only while the eyes are closed)

/* ---------------- PARTICLES + STONE FRAGMENTS ---------------- */
const NPT=900; const PT={pos:new Float32Array(NPT*3),col:new Float32Array(NPT*3),vel:new Float32Array(NPT*3),life:new Float32Array(NPT),grav:new Float32Array(NPT),i:0}; PT.pos.fill(-999);
const ptGeo=new THREE.BufferGeometry(); ptGeo.setAttribute('position',new THREE.BufferAttribute(PT.pos,3)); ptGeo.setAttribute('color',new THREE.BufferAttribute(PT.col,3));
const points=new THREE.Points(ptGeo,new THREE.PointsMaterial({size:.035,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,map:glowTex})); points.frustumCulled=false; scene.add(points);
const _c=new THREE.Color();
function burst(p,n,o={}){ const cols=o.colors||[ORANGE,AMBER,0xffd9a0]; for(let k=0;k<n;k++){ const i=PT.i=(PT.i+1)%NPT; const sp=(o.speed||2)*(.3+rnd()); const a=rnd()*Math.PI*2, e=(o.up??.3)+(rnd()-.5)*1.6;
    PT.pos[i*3]=p.x+(rnd()-.5)*(o.spread||0); PT.pos[i*3+1]=p.y+(rnd()-.5)*(o.spread||0); PT.pos[i*3+2]=p.z+(rnd()-.5)*(o.spread||0); PT.vel[i*3]=Math.cos(a)*Math.cos(e)*sp; PT.vel[i*3+1]=Math.sin(e)*sp; PT.vel[i*3+2]=Math.sin(a)*Math.cos(e)*sp; PT.life[i]=(o.life||1.4)*(.5+rnd()*.7); PT.grav[i]=o.grav??1.5;
    _c.setHex(cols[Math.floor(rnd()*cols.length)]); PT.col[i*3]=_c.r; PT.col[i*3+1]=_c.g; PT.col[i*3+2]=_c.b; } }
function updateParticles(dt){ for(let i=0;i<NPT;i++){ if(PT.life[i]<=0) continue; PT.life[i]-=dt; if(PT.life[i]<=0){ PT.pos[i*3+1]=-999; continue; } PT.vel[i*3+1]-=PT.grav[i]*dt; PT.vel[i*3]*=.99; PT.vel[i*3+2]*=.99; PT.pos[i*3]+=PT.vel[i*3]*dt; PT.pos[i*3+1]+=PT.vel[i*3+1]*dt; PT.pos[i*3+2]+=PT.vel[i*3+2]*dt; } ptGeo.attributes.position.needsUpdate=true; ptGeo.attributes.color.needsUpdate=true; }
const stoneTex=canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#3a3b40'; g.fillRect(0,0,w,h); for(let i=0;i<5000;i++){ const v=30+rnd()*70|0; g.fillStyle=`rgba(${v},${v},${v+6},.35)`; g.fillRect(rnd()*w,rnd()*h,1+rnd()*3,1+rnd()*3); } for(let i=0;i<14;i++){ g.strokeStyle='rgba(10,10,12,.5)'; g.lineWidth=1+rnd(); g.beginPath(); let x=rnd()*w,y=rnd()*h; g.moveTo(x,y); for(let k=0;k<6;k++){ x+=rnd()*40-20; y+=rnd()*40-20; g.lineTo(x,y); } g.stroke(); } });
const stoneMat=new THREE.MeshStandardMaterial({map:stoneTex,roughness:.95,color:0x9a9ca4});
const NF=110; const frag=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),stoneMat,NF); frag.frustumCulled=false; scene.add(frag);
const FR=[...Array(NF)].map(()=>({p:V3(0,-99,0),v:V3(),r:V3(),w:V3(),s:V3(.01,.01,.01),life:0})); let fi=0; const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler();
function shatter(p,dir,n=20){ for(let k=0;k<n;k++){ const f=FR[fi=(fi+1)%NF]; f.p.set(p.x+(rnd()-.5)*.3,p.y+(rnd()-.5)*.16,p.z+(rnd()-.5)*.06); f.v.set((rnd()-.5)*2.2+dir.x*2.2,rnd()*1.8+dir.y*1.5,(rnd()-.5)*2.2+dir.z*2.2); f.w.set(rnd()*8-4,rnd()*8-4,rnd()*8-4); f.r.set(rnd()*6,rnd()*6,rnd()*6); const s=.025+rnd()*.06; f.s.set(s*(1+rnd()),s,s*.6); f.life=2.6+rnd(); } }
function updateFrags(dt){ for(let i=0;i<NF;i++){ const f=FR[i]; if(f.life>0){ f.life-=dt; f.v.y-=9.8*dt; f.p.addScaledVector(f.v,dt); f.r.addScaledVector(f.w,dt); if(f.p.y<.03){ f.p.y=.03; f.v.y*=-.25; f.v.x*=.6; f.v.z*=.6; f.w.multiplyScalar(.6); } if(f.life<=0) f.p.y=-99; const k=Math.min(1,f.life/.5); _q.setFromEuler(_e.set(f.r.x,f.r.y,f.r.z)); _m.compose(f.p,_q,V3(f.s.x*k,f.s.y*k,f.s.z*k)); frag.setMatrixAt(i,_m); } else { _m.makeScale(0,0,0); frag.setMatrixAt(i,_m); } } frag.instanceMatrix.needsUpdate=true; }

/* ---------------- HANDS / CONTROLLERS: one verb, "touch" ---------------- */
const inputs=[]; const touchables=[]; // {obj, r, on(inp), hot:bool, auto:bool}
const tmp=V3(), tmp2=V3(); const ray=new THREE.Raycaster();
function haptic(inp,s=.6,ms=50){ try{ const gp=inp&&inp.src&&inp.src.gamepad; if(gp&&gp.hapticActuators&&gp.hapticActuators[0]) gp.hapticActuators[0].pulse(s,ms); }catch(e){} }
function addTouch(obj,r,on){ const t={obj,r,on,alive:true,cool:0}; obj.userData.touch=t; touchables.push(t); return t; }
function removeTouch(t){ if(!t) return; t.alive=false; const i=touchables.indexOf(t); if(i>=0) touchables.splice(i,1); }
function ownerOf(o){ while(o){ if(o.userData&&o.userData.touch&&o.userData.touch.alive) return o.userData.touch; o=o.parent; } return null; }
function pick(rc){ const hits=rc.intersectObjects(touchables.filter(t=>t.alive).map(t=>t.obj),true); for(const h of hits){ const t=ownerOf(h.object); if(t) return t; } return null; }
const orbGeo=new THREE.SphereGeometry(.022,16,12), jointGeo=new THREE.SphereGeometry(.0085,8,6);
const handMat=new THREE.MeshStandardMaterial({color:0xffe0c0,emissive:AMBER,emissiveIntensity:.5,roughness:.4}), tipMat=new THREE.MeshBasicMaterial({color:AMBER});
const handFactory=new XRHandModelFactory().setPath('./lib/hand/');
for(let i=0;i<2;i++){ const ctrl=renderer.xr.getController(i), grip=renderer.xr.getControllerGrip(i), hand=renderer.xr.getHand(i);
  const inp={i,ctrl,grip,hand,pos:V3(),prev:V3(),vel:V3(),src:null,active:false,handOn:false}; inputs.push(inp);
  ctrl.addEventListener('connected',e=>{ inp.src=e.data; inp.active=true; }); ctrl.addEventListener('disconnected',()=>{ inp.active=false; });
  ctrl.addEventListener('selectstart',()=>{ ctrl.getWorldPosition(tmp); ctrl.getWorldDirection(tmp2).negate(); ray.set(tmp,tmp2); ray.far=8; const t=pick(ray); if(t){ haptic(inp,.7,50); t.on(inp,true); } });
  const orb=new THREE.Group(); orb.add(new THREE.Mesh(orbGeo,tipMat)); const og=glow(.14,AMBER,.9); orb.add(og); grip.add(orb); grip.userData.orb=orb;
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(0,0,0),V3(0,0,-1)]),new THREE.LineBasicMaterial({color:AMBER,transparent:true,opacity:.35})); line.scale.z=1.2; ctrl.add(line); inp.line=line;
  try{ hand.add(handFactory.createHandModel(hand,'mesh')); }catch(e){} rig.add(ctrl,grip,hand); }
function updateInputs(dt){ for(const inp of inputs){ const h=inp.hand; let any=false; if(!inp.sk) h.traverse(o=>{ if(o.isSkinnedMesh){ o.material=new THREE.MeshStandardMaterial({color:0xc79a7a,roughness:.7}); inp.sk=true; } }); for(const name in h.joints){ const j=h.joints[name]; any=any||j.visible; if(!j.userData.m){ const tip=name.endsWith('tip'); const m=new THREE.Mesh(jointGeo,tip?tipMat:handMat); m.scale.setScalar(tip?1.5:1); m.visible=false; j.add(m); j.userData.m=m; } }
    inp.handOn=any; inp.grip.userData.orb.visible=!any&&inp.active; inp.line.visible=inp.active&&!any; inp.prev.copy(inp.pos);
    const mid=h.joints['middle-finger-metacarpal'], tip=h.joints['index-finger-tip']; if(any&&tip){ tip.getWorldPosition(inp.pos); } else inp.grip.getWorldPosition(inp.pos);
    inp.palm=inp.palm||V3(); if(any&&mid) mid.getWorldPosition(inp.palm); else inp.palm.copy(inp.pos);
    if(dt>0){ tmp.subVectors(inp.pos,inp.prev).divideScalar(dt); inp.vel.lerp(tmp,.4); }
    if(!(inp.active||any)) continue;
    for(const t of [...touchables]){ if(!t.alive) continue; t.obj.getWorldPosition(tmp2); const d=Math.min(tmp2.distanceTo(inp.pos),tmp2.distanceTo(inp.palm)); if(d<t.r){ haptic(inp,.9,70); t.on(inp,false); } } } }
let drag=null, yaw=0, pitch=0; const mouse=new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY,moved:false}; });
addEventListener('pointermove',e=>{ if(!drag||renderer.xr.isPresenting) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; if(Math.abs(dx)+Math.abs(dy)>4) drag.moved=true; if(drag.moved){ yaw+=dx*.004; pitch=clamp(pitch+dy*.004,-1,1); drag.x=e.clientX; drag.y=e.clientY; camera.rotation.set(pitch,yaw,0,'YXZ'); } });
addEventListener('pointerup',e=>{ if(drag&&!drag.moved&&!renderer.xr.isPresenting){ mouse.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1); ray.setFromCamera(mouse,camera); ray.far=12; const t=pick(ray); if(t) t.on(null,true); } drag=null; });
const activeHand=()=>inputs.find(i=>i.handOn||i.active)||null;

/* ---------------- MEADOW (360 photo) + SKY LANTERNS ---------------- */
const womanReady=Promise.resolve();
const dome=(()=>{ const R=60,EH=1.6; const g=new THREE.SphereGeometry(1,144,108); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i),y=p.getY(i),z=p.getZ(i); let t=R; if(y<0) t=Math.min(R,EH/-y); p.setXYZ(i,-x*t,EH+y*t,z*t); }   // flat ground from your feet to the horizon, sky dome above
  const t=tex('img/meadow.jpg'); t.wrapS=THREE.RepeatWrapping; const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide,fog:false})); m.rotation.y=-Math.PI/2; m.visible=false; m.frustumCulled=false; m.renderOrder=-5; scene.add(m); return m; })();
const GT={value:0}; const meadowG=new THREE.Group(); meadowG.visible=false; scene.add(meadowG);
(()=>{ const EH=1.6, RG=7; const img=new Image(); img.onload=()=>{ const cw=2048,ch=1024; const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const x=cv.getContext('2d'); x.drawImage(img,0,0,cw,ch); const px=x.getImageData(0,0,cw,ch).data;
    const N=11000; const bg=new THREE.PlaneGeometry(.04,1,1,3); bg.translate(0,.5,0); const p=bg.attributes.position, c3=new Float32Array(p.count*3); for(let i=0;i<p.count;i++){ const y=p.getY(i); p.setX(i,p.getX(i)*(1-y*.9)); const c=.74+.45*y; c3[i*3]=c3[i*3+1]=c3[i*3+2]=c; } bg.setAttribute('color',new THREE.BufferAttribute(c3,3));
    const mat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,vertexColors:true,fog:false}); mat.onBeforeCompile=sh=>{ sh.uniforms.uT=GT; sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;').replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\n transformed.x+=sin(uT*1.7+instanceMatrix[3][0]*1.3+instanceMatrix[3][2]*.9)*.09*position.y*position.y;\n#endif'); };
    const m=new THREE.InstancedMesh(bg,mat,N); const q=new THREE.Quaternion(), e=new THREE.Euler(), mm=new THREE.Matrix4(), c=new THREE.Color();
    for(let i=0;i<N;i++){ const a=rnd()*6.2832, r=.22+Math.pow(rnd(),.7)*(RG-.25); const X=Math.cos(a)*r, Z=Math.sin(a)*r; let uu=((a-Math.PI/2)/6.2832)%1; if(uu<0) uu+=1; const th=Math.acos(-EH/Math.hypot(r,EH)); const ix=Math.min(cw-1,Math.floor(uu*cw)), iy=Math.min(ch-1,Math.floor(th/Math.PI*ch)), o=(iy*cw+ix)*4; const f=.88+rnd()*.24; c.setRGB(px[o]/255*f,px[o+1]/255*f,px[o+2]/255*f,THREE.SRGBColorSpace);
      e.set((rnd()-.5)*.6,rnd()*6.2832,(rnd()-.5)*.6); q.setFromEuler(e); mm.compose(V3(X,-.01,Z),q,V3(1,(.05+rnd()*.15)*(1-.5*r/RG),1)); m.setMatrixAt(i,mm); m.setColorAt(i,c); } m.frustumCulled=false; meadowG.add(m); }; img.src='img/meadow.jpg?v='+BUILD; })();
const lanGeo=new THREE.LatheGeometry([[.085,0],[.105,.06],[.125,.16],[.12,.24],[.085,.29],[.03,.31],[0,.312]].map(a=>new THREE.Vector2(a[0],a[1])),20);
const lanTex=canvasTex(64,128,c=>{ const g=c.createLinearGradient(0,0,0,128); g.addColorStop(0,'#ff8a2a'); g.addColorStop(.55,'#ffc060'); g.addColorStop(1,'#fff2c4'); c.fillStyle=g; c.fillRect(0,0,64,128); for(let i=0;i<8;i++){ c.fillStyle='rgba(170,70,15,.2)'; c.fillRect(i*8,0,1,128); } });
function skyLantern(lit){ const g=new THREE.Group(); const body=new THREE.Mesh(lanGeo,new THREE.MeshBasicMaterial({map:lanTex,side:THREE.DoubleSide,color:lit?0xffffff:0xb9aea0})); const gl=glow(.9,AMBER,lit?.8:0); gl.position.y=.12; const fl=glow(.13,0xfff2c0,lit?1:0); fl.position.y=.02; g.add(body,gl,fl); g.userData={body,gl,fl}; return g; }
const NB=150; const bl=new THREE.InstancedMesh(lanGeo,new THREE.MeshBasicMaterial({map:lanTex,side:THREE.DoubleSide}),NB); bl.frustumCulled=false; bl.visible=false; scene.add(bl);
const BL=[...Array(NB)].map(()=>({p:V3(0,-99,0),vy:0,ph:rnd()*6,on:false,delay:0}));
const blPos=new Float32Array(NB*3).fill(-999); const blGeoP=new THREE.BufferGeometry(); blGeoP.setAttribute('position',new THREE.BufferAttribute(blPos,3));
const blPts=new THREE.Points(blGeoP,new THREE.PointsMaterial({size:2.6,map:glowTex,color:AMBER,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})); blPts.frustumCulled=false; blPts.visible=false; scene.add(blPts);
let blN=0, SKYF=null;
function launch(n,spread=1){ for(let k=0;k<n&&blN<NB;k++){ const b=BL[blN++]; const a=rnd()*Math.PI*2, r=6+rnd()*rnd()*26; b.p.set(Math.cos(a)*r,-.5,Math.sin(a)*r); b.vy=.35+rnd()*.4; b.delay=rnd()*4*spread; b.on=true; } }
function resetSky(){ blN=0; BL.forEach(b=>{ b.on=false; b.p.set(0,-99,0); }); bl.visible=true; blPts.visible=true; }
const _one=V3(1.8,1.8,1.8), _zero=V3(0,0,0);
function updateSky(dt){ _q.set(0,0,0,1); for(let i=0;i<NB;i++){ const b=BL[i]; if(b.on){ if(b.delay>0) b.delay-=dt; else { b.p.y+=b.vy*dt; b.p.x+=Math.sin(TT*.4+b.ph)*.12*dt; b.p.z+=Math.cos(TT*.33+b.ph)*.12*dt; } _m.compose(b.p,_q,_one); blPos[i*3]=b.p.x; blPos[i*3+1]=b.p.y+.3; blPos[i*3+2]=b.p.z; } else { _m.compose(b.p,_q,_zero); blPos[i*3+1]=-999; } bl.setMatrixAt(i,_m); } bl.instanceMatrix.needsUpdate=true; blGeoP.attributes.position.needsUpdate=true; }

/* ---------------- PIECES ---------------- */
function orbLight(label,col=AMBER,size=.07){ const g=new THREE.Group(); const core=new THREE.Mesh(new THREE.SphereGeometry(size,24,16),new THREE.MeshBasicMaterial({color:0xfff2d8})); const gl=glow(size*7,col,.9); g.add(core,gl);
  if(label){ const t=textPlane(label,{px:110,h:.05,ltr:/[a-z]/i.test(label)}); t.position.y=-size-.09; t.renderOrder=62; t.material.depthTest=false; g.add(t); } g.userData.gl=gl; return g; }
const rockMat=new THREE.MeshStandardMaterial({map:stoneTex,roughness:1,color:0x74767e});
function tablet(wd){ const g=new THREE.Group(); const w=.46,h=.27; const sh=new THREE.Shape(); const N=12; for(let i=0;i<N;i++){ const a=i/N*6.283, r=1+(rnd()-.5)*.36; const x=Math.cos(a)*w/2*r*1.15, y=Math.sin(a)*h/2*r*1.3; i?sh.lineTo(x,y):sh.moveTo(x,y); } sh.closePath();
  const geo=new THREE.ExtrudeGeometry(sh,{depth:.05,bevelEnabled:true,bevelThickness:.014,bevelSize:.014,bevelSegments:1}); geo.translate(0,0,-.035); const uv=geo.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*2.2+.5,uv.getY(i)*2.2+.5); g.add(new THREE.Mesh(geo,rockMat));
  const t=canvasTex(760,440,(c,W_,H_)=>{ c.clearRect(0,0,W_,H_); c.textAlign='center'; c.textBaseline='middle'; c.direction=LANG==='en'?'ltr':'rtl'; const txt=LANG==='en'?wd[1]:wd[0]; let lines=[txt]; let px=LANG==='en'?108:156; c.font=`900 ${px}px Cairo`;
    if(c.measureText(txt).width>W_-90&&txt.includes(' ')){ const ws=txt.split(' '); let best=1,bd=1e9; for(let k=1;k<ws.length;k++){ const d=Math.abs(ws.slice(0,k).join(' ').length-ws.slice(k).join(' ').length); if(d<bd){ bd=d; best=k; } } lines=[ws.slice(0,best).join(' '),ws.slice(best).join(' ')]; }
    while(Math.max(...lines.map(l=>c.measureText(l).width))>W_-90){ px-=6; c.font=`900 ${px}px Cairo`; }
    const gr=c.createLinearGradient(0,H_*.15,0,H_*.85); gr.addColorStop(0,'#fff3d2'); gr.addColorStop(.5,'#ff9140'); gr.addColorStop(1,'#e22c10');
    for(let pass=0;pass<2;pass++) lines.forEach((l,n)=>{ const y=H_/2+(n-(lines.length-1)/2)*px*1.25; c.shadowColor='#ff2000'; c.shadowBlur=pass?10:34; c.fillStyle=gr; c.fillText(l,W_/2,y); }); });
  const face=new THREE.Mesh(new THREE.PlaneGeometry(w*.96,w*.96*440/760),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false})); face.position.z=.033; g.add(face);
  const crack=glow(1.0,0xff2a0a,.25); crack.position.z=-.07; g.add(crack); g.userData={crack,wd}; return g; }
function shadowTex(){ return canvasTex(256,640,c=>{ c.clearRect(0,0,256,640); c.fillStyle='rgba(0,0,0,.94)'; c.filter='blur(5px)'; c.beginPath(); c.ellipse(128,90,46,56,0,0,7); c.fill(); c.beginPath(); c.moveTo(20,640); c.lineTo(20,230); c.quadraticCurveTo(24,160,128,150); c.quadraticCurveTo(232,160,236,230); c.lineTo(236,640); c.closePath(); c.fill(); }); }

/* ---------------- RUN ---------------- */
let FAST=false, started=false, running=false, runId=0;
const cleanup=[];
function clearAll(){ for(const f of cleanup.splice(0)) try{ f(); }catch(e){} touchables.length=0; caption(); hint(); }
async function chooseLang(){ hint(); const A=orbLight('عربي',AMBER,.06), B=orbLight('English',0xffc890,.06); A.position.set(-.26,1.22,-.55); B.position.set(.26,1.22,-.55); scene.add(A,B); pop(A,1,.1); pop(B,1,.25);
  const cap=textPlane('اختر اللغة  ·  Choose a language',{px:84,h:.045,weight:700,color:'#FDEEE6'}); cap.position.set(0,1.52,-.9); scene.add(cap);
  let got=null; const ta=addTouch(A,.1,()=>got=got||'ar'), tb=addTouch(B,.1,()=>got=got||'en'); DEBUG._pick=c=>got=got||c;
  await until(()=>got); LANG=got; removeTouch(ta); removeTouch(tb); sfx('chime',.6); const me=got==='ar'?A:B; burst(me.position.clone(),40,{speed:1.5,grav:0,life:1.2}); shrink(A); shrink(B); await tween(.4,k=>cap.material.opacity=1-k); scene.remove(cap); setTimeout(()=>scene.remove(A,B),600); }

const HEART={rate:0,t:0,vol:.8};
const STAT=['واحدة من كل 3 نساء في العالم تتعرض للعنف الجسدي أو الجنسي في حياتها.','About 1 in 3 women worldwide experience physical or sexual violence in their lifetime.','منظمة الصحة العالمية','World Health Organization (WHO)'];
const MALE=[['مع من تحكي؟','Who are you talking to?'],['هاتي التليفون.','Give me the phone.'],['افتحي الباب!','Open the door!'],['قلت لك افتحي!','I said open it!']];
async function mline(i){ caption(MALE[i-1][0],MALE[i-1][1],{color:'#ff7a66'}); await play3('m_'+LANG+'_'+i,DOOR3,i<=2?3.4:1.7); }
function makePhone(){ const g=new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(.078,.16,.009),new THREE.MeshStandardMaterial({color:0x14161c,roughness:.35,metalness:.6})));
  const cv=document.createElement('canvas'); cv.width=360; cv.height=740; const c=cv.getContext('2d'); const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace;
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(.07,.15),new THREE.MeshBasicMaterial({map:t})); scr.position.z=.0051; g.add(scr); const gl=glow(.55,AMBER,0); g.add(gl);
  g.userData.set=(on,name,text)=>{ c.fillStyle=on?'#1b2440':'#040405'; c.fillRect(0,0,360,740); if(on){ const gr=c.createLinearGradient(0,0,0,740); gr.addColorStop(0,'#2a3a6a'); gr.addColorStop(1,'#12182c'); c.fillStyle=gr; c.fillRect(0,0,360,740); c.fillStyle='#fff'; c.textAlign='center'; c.font='700 86px Cairo'; c.fillText('21:47',180,170);
      c.fillStyle='rgba(255,255,255,.95)'; c.beginPath(); c.roundRect(20,250,320,170,26); c.fill(); c.fillStyle='#F0401F'; c.font='900 40px Cairo'; c.direction=LANG==='en'?'ltr':'rtl'; c.textAlign=LANG==='en'?'left':'right'; const x=LANG==='en'?44:316; c.fillText(name,x,308); c.fillStyle='#222'; c.font='700 30px Cairo'; c.fillText(text,x,366,270); }
    t.needsUpdate=true; gl.material.opacity=on?.5:0; }; g.userData.set(false); return g; }
function msgCard(name,text){ const W_=1000,H_=380; const t=canvasTex(W_,H_,c=>{ c.fillStyle='rgba(255,255,255,.97)'; c.beginPath(); c.roundRect(10,10,W_-20,H_-20,60); c.fill(); const en=LANG==='en'; c.direction=en?'ltr':'rtl'; c.textAlign=en?'left':'right'; const x=en?70:W_-70; c.fillStyle='#F0401F'; c.font='900 76px Cairo'; c.fillText(name,x,130); c.fillStyle='#1c1c22'; c.font='700 62px Cairo'; const ws=text.split(' '); let l='',y=230; for(const w of ws){ const tt=l?l+' '+w:w; if(c.measureText(tt).width>W_-140&&l){ c.fillText(l,x,y); y+=88; l=w; } else l=tt; } c.fillText(l,x,y); });
  const m=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5*H_/W_),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false})); m.renderOrder=40; return m; }
let MIR=null;
function makeMirror(){ const g=new THREE.Group(); const MW_=.66,MH=1.5,CYM=1.2,PW=528,PH=1200;
  const fr=new THREE.Mesh(new THREE.BoxGeometry(MW_+.07,MH+.07,.035),new THREE.MeshStandardMaterial({color:0x0c0c0e,roughness:.35,metalness:.6})); fr.position.y=CYM; g.add(fr);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(MW_,MH),new THREE.MeshBasicMaterial({color:0x15171b})); back.position.set(0,CYM,.0185); g.add(back);
  const cv=document.createElement('canvas'); cv.width=PW; cv.height=PH; const c=cv.getContext('2d'); const ct=new THREE.CanvasTexture(cv); ct.colorSpace=THREE.SRGBColorSpace; ct.anisotropy=8;
  const im=n=>{ const i=new Image(); i.src='img/'+n+'?v='+BUILD; return i; }; const rA=im('refl_a.jpg'), rB=im('refl_b.jpg'), her=im('her.png'); const ok=i=>i.complete&&i.naturalWidth>0;
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(MW_,MH),new THREE.MeshBasicMaterial({map:ct})); glass.position.set(0,CYM,.021); g.add(glass);
  const refl=new Reflector(new THREE.PlaneGeometry(MW_,MH),{textureWidth:512,textureHeight:1164,color:0xb9c1cc,multisample:4,clipBias:.003}); refl.position.set(0,CYM,.0212); refl.camera.layers.enable(5); refl.visible=false; g.add(refl);
  const HH=1.19, HW=HH*420/874; const herM=new THREE.Mesh(new THREE.PlaneGeometry(HW,HH),new THREE.MeshBasicMaterial({map:tex('img/her.png'),transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide})); herM.layers.set(5); herM.rotation.y=Math.PI; herM.visible=false; scene.add(herM);
  const shineT=canvasTex(256,256,x=>{ x.clearRect(0,0,256,256); const gr=x.createLinearGradient(0,0,256,256); gr.addColorStop(.25,'rgba(255,255,255,0)'); gr.addColorStop(.42,'rgba(255,255,255,.15)'); gr.addColorStop(.5,'rgba(255,255,255,.03)'); gr.addColorStop(.58,'rgba(255,255,255,.09)'); gr.addColorStop(.75,'rgba(255,255,255,0)'); x.fillStyle=gr; x.fillRect(0,0,256,256); }); shineT.wrapS=shineT.wrapT=THREE.RepeatWrapping;
  const shine=new THREE.Mesh(new THREE.PlaneGeometry(MW_,MH),new THREE.MeshBasicMaterial({map:shineT,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); shine.position.set(0,CYM,.0225); g.add(shine);
  const hitG=new THREE.PlaneGeometry(MW_,MH); hitG.translate(0,CYM-1.42,0); const hit=new THREE.Mesh(hitG,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})); hit.position.set(0,1.42,.03); g.add(hit);
  const u=g.userData={hit,her:herM,live:false,wo:0,blur:0,shards:null,fr:0}; const cam=V3(), mp=V3();
  const draw=()=>{ c.filter='none'; c.globalAlpha=1; c.fillStyle='#10151f'; c.fillRect(0,0,PW,PH); const r=U.mixR.value>.5?rB:rA; if(ok(r)){ const s=1.14, w=PW*s, h=PH*s; c.drawImage(r,(PW-w)/2,(PH-h)/2,w,h); }
    const gr=c.createLinearGradient(0,0,0,PH); gr.addColorStop(0,'rgba(150,180,220,.10)'); gr.addColorStop(1,'rgba(10,20,40,.18)'); c.fillStyle=gr; c.fillRect(0,0,PW,PH); ct.needsUpdate=true; };
  u.tick=(dt)=>{ camera.getWorldPosition(cam); g.getWorldPosition(mp); const dx=clamp(cam.x-mp.x,-.3,.3); shineT.offset.set(-dx*.9,(cam.y-1.5)*.4);
    if(u.shards){ for(const s of u.shards){ if(s.stay||s.rest) continue; s.t+=dt; if(s.t<0) continue; s.v.y-=9.8*dt; s.m.position.addScaledVector(s.v,dt); s.m.rotation.x+=s.w.x*dt; s.m.rotation.y+=s.w.y*dt; s.m.rotation.z+=s.w.z*dt; if(s.m.position.y<.012){ s.m.position.y=.012; s.rest=true; s.m.rotation.set(-Math.PI/2,0,s.m.rotation.z); if(Math.random()<.5) sfx('pop',.1,2.2+Math.random()); } } return; }
    const near=g.visible&&Math.hypot(cam.x-mp.x,cam.z-mp.z)<3.2; refl.visible=near; glass.visible=!near; if(!near&&(u.fr++)%45===0) draw();
    herM.visible=u.live&&u.wo>.01; if(herM.visible){ herM.position.set(cam.x,clamp(cam.y,1.0,1.95)+.116-HH/2,cam.z+.03); herM.material.opacity=u.wo; } };
  u.shatter=(wp)=>{ u.live=false; draw(); refl.visible=false; herM.visible=false; glass.visible=false; shine.visible=false; const L=V3(0,1.45-CYM,0); if(wp){ const l=g.worldToLocal(wp.clone()); L.set(clamp(l.x,-.25,.25),clamp(l.y-CYM,-.6,.6),0); }
    const NR=13, RS=[0,.06,.15,.29,.5,.85,1.7]; const ang=[...Array(NR)].map((_,i)=>i/NR*6.283+(rnd()-.5)*.28); const P=ang.map(a=>RS.map((r,j)=>{ const rr=j?r*(1+(rnd()-.5)*.3):0, aa=a+(j?(rnd()-.5)*.12:0); return [clamp(L.x+Math.cos(aa)*rr,-MW_/2,MW_/2),clamp(L.y+Math.sin(aa)*rr,-MH/2,MH/2)]; }));
    const sh=[]; for(let i=0;i<NR;i++){ const i2=(i+1)%NR; for(let j=0;j<RS.length-1;j++){ const q=j?[P[i][j],P[i2][j],P[i2][j+1],P[i][j+1]]:[P[i][0],P[i2][1],P[i][1]]; let cx=0,cy=0; q.forEach(p=>{ cx+=p[0]; cy+=p[1]; }); cx/=q.length; cy/=q.length; let area=0; for(let k=0;k<q.length;k++){ const a=q[k],b=q[(k+1)%q.length]; area+=a[0]*b[1]-b[0]*a[1]; } if(Math.abs(area)<4e-4) continue;
        const pos=[],uv=[]; const add=p=>{ pos.push((p[0]-cx)*.965,(p[1]-cy)*.965,0); uv.push(p[0]/MW_+.5,p[1]/MH+.5); }; const tri=(a,b,d)=>{ add(a); add(b); add(d); }; tri(q[0],q[1],q[2]); if(q.length===4) tri(q[0],q[2],q[3]);
        const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
        const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:ct,side:THREE.DoubleSide,color:new THREE.Color().setScalar(.72+rnd()*.45)})); m.position.set(cx,CYM+cy,.021+rnd()*.004); m.rotation.set((rnd()-.5)*.07,(rnd()-.5)*.07,0); g.add(m);
        sh.push({m,stay:(j>=4&&rnd()<.8)||(j===3&&rnd()<.5)||(j===2&&rnd()<.15),rest:false,t:-(.75+j*.11+rnd()*.3),v:V3((cx-L.x)*1.2+(rnd()-.5)*.5,rnd()*.6,.5+rnd()*1.1),w:V3(rnd()*10-5,rnd()*10-5,rnd()*6-3)}); } }
    u.shards=sh; }; return g; }
let redGlow=null, DA=0, DV=0, JOLT=0, HOLDING=false, HOLD=null, LOCKED=false, SHAD=null;
function bang(v=1){ play3('bang',DOOR3,v*2.4); JOLT=1; for(const i of inputs) haptic(i,1,HOLDING?240:130); if(!LOCKED){ DV+=HOLDING?1.1:2.6; burst(V3(.72,1.2,-4.5),10,{colors:[0x9a8f84,0xd8cfc4],speed:.9,grav:1.5,life:.8}); } }
function holdDoor(dt){ HOLDING=false; for(const inp of inputs){ if(!(inp.active||inp.handOn)) continue; for(const p of [inp.pos,inp.palm]){ if(p.z<-4.15&&p.z>-4.85&&p.x>.55&&p.x<1.75&&p.y>.3&&p.y<2.1){ HOLDING=true; if(DA>.02||JOLT>.3) haptic(inp,Math.min(1,.35+DA*1.5),30); } } }
  const k=LOCKED?200:HOLDING?70:5, c=LOCKED?20:HOLDING?10:1.6; DV+=(-k*DA-c*DV)*dt; DA+=DV*dt; if(DA<0){ if(DV<-.6){ sfx('doorslam',.35,1.5); for(const i of inputs) haptic(i,.8,60); } DA=0; DV=0; } if(DA>.6){ DA=.6; DV=-DV*.3; }
  JOLT=Math.max(0,JOLT-dt*2.2); T.room_door.rotation.y=DA+Math.sin(TT*70)*.01*JOLT; if(redGlow) redGlow.material.opacity=Math.min(1,DA*3+JOLT*.25); if(SHAD){ SHAD.position.x=1.0+Math.sin(TT*1.7)*.08; SHAD.scale.x=1+Math.sin(TT*2.3)*.06; } }

async function actRoom(){ // you are her
  const W8=s=>wait(FAST?.15:s); const D=T.room_door; const S=V3(META.side[0],META.side[2]+.008,-META.side[1]);
  center(0,0); capAt(0,1.7,-2.0,.05); dome.visible=false; room.visible=true; room.scale.set(1,1,1); U.mixR.value=1; U.dim.value=1; D.rotation.y=0; HEART.rate=0; DA=0; DV=0; HOLD=null;
  music(0,.3,.08,0); hemi.intensity=.8; hemi.color.setHex(0xffe2c4); warmL.position.set(0,2.4,-1.3); warmL.intensity=3.2; moonL.intensity=.5;
  if(!redGlow){ redGlow=glow(1,0xff2a10,0); redGlow.scale.set(1.8,1.0,1); redGlow.position.set(1.15,.28,-4.5); room.add(redGlow); } redGlow.material.opacity=0;
  const mir=makeMirror(); mir.position.set(2.3,0,-4.585); scene.add(mir); MIR=mir; cleanup.push(()=>{ scene.remove(mir); scene.remove(mir.userData.her); MIR=null; }); T.tv.visible=true;
  lids(0); await W8(.8); await tween(.5,k=>lids(k*.45)); await tween(.25,k=>lids(.45*(1-k))); await W8(.2); await tween(1.3,k=>lids(k),{ease:'out'}); await W8(1.0); await line('home',.8);
  // 1. the phone on the table
  const ph=makePhone(); ph.position.copy(S); ph.rotation.set(-Math.PI/2,0,.3); scene.add(ph); cleanup.push(()=>scene.remove(ph)); ph.userData.set(true,tr('سلمى','Salma'),tr('وينك؟ توحشناك..','Where are you? We miss..'));
  let got=false; (async()=>{ while(!got){ sfx('buzz',.7); await tween(1.2,k=>{ if(got) return; ph.rotation.z=.3+Math.sin(k*130)*.035*(k<.92?1:0); ph.position.x=S.x+Math.sin(k*97)*.003; },{ease:'lin'}); await wait(1.5); } })();
  hint('phone'); let tp=addTouch(ph,.15,(inp)=>{ got=true; haptic(inp,.7,60); }); await until(()=>got); removeTouch(tp); hint(); sfx('pop',.5);
  { const a=ph.position.clone(), b=V3(.05,1.2,-.42); await tween(.8,k=>{ ph.position.lerpVectors(a,b,k); ph.position.y+=Math.sin(k*Math.PI)*.08; ph.rotation.set(-Math.PI/2+(Math.PI/2-.55)*k,0,.3*(1-k)); },{ease:'inOut'}); }
  const card=msgCard(tr('سلمى','Salma'),tr('وينك؟ توحشناك. نشوفوك غدوة؟','Where are you? We miss you. Can we see you tomorrow?')); card.position.set(0,1.5,-.62); scene.add(card); cleanup.push(()=>scene.remove(card)); pop(card,1,0,.4);
  await line('salma',1.0);
  // 2. he comes
  music(0,0,.04,.45); play3('steps',DOOR3,2.8); HEART.rate=1.15; HEART.vol=.5; await W8(3.4); await line('here',.4);
  const flick=tween(2.4,k=>{ U.mixR.value=k<1?(.35+.65*(Math.sin(k*70)>0?1:.3))*(1-k*.5):.5; warmL.intensity=3.2*U.mixR.value; },{ease:'lin'}); await mline(1); await flick; await W8(.5);
  mline(2); await W8(.7); shrink(card,.25); tween(.6,k=>lids(1-.6*k)); { const a=ph.position.clone();
    await tween(FAST?.2:1.0,k=>{ ph.position.set(a.x+Math.sin(k*40)*.012,a.y+Math.sin(k*33)*.008,a.z-.04*k); if(Math.random()<.3) for(const i of inputs) haptic(i,.6,30); },{ease:'lin'});
    const a2=ph.position.clone(), b=a2.clone().add(V3(.12,.05,-.28)); await tween(FAST?.2:.8,k=>{ ph.position.lerpVectors(a2,b,clamp(k*.75+Math.sin(k*22)*.05,0,1)); if(Math.random()<.4) for(const i of inputs) haptic(i,.8,30); },{ease:'inOut'});
    sfx('whoosh',.9); for(const i of inputs) haptic(i,1,220); const c1=ph.position.clone(), c2=V3(.85,1.55,-2.3); await tween(.42,k=>{ ph.position.lerpVectors(c1,c2,k); ph.rotation.y=k*4; ph.rotation.x=-.55+k*2; },{ease:'out'});
    const c3=V3(1.0,.02,-3.2); await tween(.55,k=>{ ph.position.x=c2.x+(c3.x-c2.x)*k; ph.position.z=c2.z+(c3.z-c2.z)*k; ph.position.y=c2.y+(c3.y-c2.y)*k*k; ph.rotation.x+=.3; },{ease:'lin'}); sfx('glass',.7,1.2); ph.userData.set(false); ph.rotation.set(-Math.PI/2,0,1); burst(c3.clone(),24,{colors:[0xdfe9ff,0xffffff],speed:1.2,grav:3,life:.8}); tween(.8,k=>lids(.4+.6*k)); }
  await W8(1.2); play3('doorslam',DOOR3,2.8); for(const i of inputs) haptic(i,1,220); U.mixR.value=0; warmL.intensity=0; hemi.intensity=.3; hemi.color.setHex(0x8fa8ff); caption(); HEART.rate=1.3; await W8(2.4);
  // 3. the mirror
  mir.userData.live=true; mir.userData.wo=1; await walk([[-.35,-.6],[-.2,-2.7],[2.3,-3.86]]); capAt(0,2.04,-.66,.2,0,.55); await W8(2.4);
  tween(FAST?.5:7,k=>{ mir.userData.wo=1-k; mir.userData.blur=10*k; },{ease:'inOut'}); await line('mirror',FAST?.2:2.8);
  hint('mirror'); got=false; let hitInp=null; tp=addTouch(mir.userData.hit,.32,(inp)=>{ got=true; hitInp=inp; haptic(inp,1,200); }); await until(()=>got); removeTouch(tp); hint(); caption();
  play3('glass',V3(2.3,1.4,-4.5),2.2); mir.userData.shatter(hitInp?hitInp.pos:null); for(const i of inputs) haptic(i,1,160); await W8(4.4);
  // 4. the night, at the door
  music(0,0,.02,.8); tween(3,k=>{ U.dim.value=1-.12*k; U.mixR.value=.16*k; hemi.intensity=.3; moonL.intensity=.5-.1*k; }); play3('bang',DOOR3,1.9); for(const i of inputs) haptic(i,.5,100); await W8(1.0); caption(); await walk([[1.15,-3.9]]); capAt(0,1.8,-.56,.12,0,.6);
  const corr=new THREE.Mesh(new THREE.PlaneGeometry(1.3,2.3),new THREE.MeshBasicMaterial({color:0xff5a2a})); corr.position.set(1.15,1.1,-5.0); const shad=new THREE.Mesh(new THREE.PlaneGeometry(.75,2.0),new THREE.MeshBasicMaterial({map:shadowTex(),transparent:true})); shad.position.set(1.0,1.0,-4.92); scene.add(corr,shad); cleanup.push(()=>scene.remove(corr,shad));
  DA=0; DV=0; LOCKED=false; HOLD=holdDoor; SHAD=shad; HEART.rate=1.7; HEART.vol=.8; await W8(.8); bang(); await W8(.9); hint('door'); bang(); { let t0=TT; await until(()=>HOLDING||TT-t0>(FAST?.3:5)); } await W8(.6);
  HEART.rate=1.9; bang(); await W8(.6); bang(); await W8(.6); bang(); await W8(.9); await mline(3); bang(); await W8(.5); bang(); await W8(.5); bang(); await W8(.6);
  await line('hide',.2); HEART.rate=2.4; HEART.vol=1; bang(); await W8(.45); bang(); await W8(.7); await mline(4); for(let k=0;k<5;k++){ bang(1); await W8(.36); }
  caption(); hint('lock'); const lk=glow(.3,AMBER,.9); lk.position.set(.8,1.22,-4.48); scene.add(lk); cleanup.push(()=>scene.remove(lk)); const lockT=addTouch(lk,.17,(inp)=>{ LOCKED=true; haptic(inp,1,140); });
  while(!LOCKED){ bang(); await wait(FAST?.3:.62); }
  removeTouch(lockT); scene.remove(lk); hint(); sfx('pop',.9,.6); sfx('doorslam',.5,1.5); await W8(1.0); play3('bang',DOOR3,1.3,.9); JOLT=1; await W8(1.5); play3('bang',DOOR3,.8,.85); JOLT=.6; await W8(2.2); play3('steps',V3(1.15,1,-7),1.8,.9); HEART.rate=1.6; HEART.vol=.6; await W8(4.0); HOLD=null; lids(1); SHAD=null; D.rotation.y=0; redGlow.material.opacity=0; scene.remove(corr,shad); scene.remove(ph);
  // 5. the day after: the words, and the walls
  music(.1,0,.03,.5); tween(3,k=>{ U.dim.value=.88-.3*k; U.mixR.value=.16*(1-k); hemi.intensity=.3; moonL.intensity=.4+.1*k; }); await walk([[-.2,-2.7],[-.3,-.8],[0,0]],.8); capAt(0,1.7,-2.0,.05); HEART.rate=1.3;
  tween(FAST?3:26,k=>{ const s=1-.42*k; room.scale.set(s,1,s); mir.visible=false; },{ease:'inOut'});
  const slabs=[]; const angs=[-62,-31,0,31,62]; let RAD=1.15; const place=()=>slabs.forEach(g=>{ const a=g.userData.a; g.userData.home.set(Math.sin(a)*RAD,g.userData.hy,-Math.cos(a)*RAD); g.position.x=g.userData.home.x; g.position.z=g.userData.home.z; });
  cleanup.push(()=>slabs.forEach(s=>scene.remove(s)));
  const order=[2,0,4,1,3];
  for(let n=0;n<5;n++){ const i=order[n], wd=WORDS[i]; const a=angs[i]*Math.PI/180; const g=tablet(wd); g.userData.a=a; g.userData.hy=1.2+(i%2)*.24+(i===2?.1:0); g.userData.home=V3(Math.sin(a)*RAD,g.userData.hy,-Math.cos(a)*RAD); g.userData.ph=rnd()*6; g.rotation.y=-a; g.position.copy(g.userData.home).multiplyScalar(5.5); g.position.y=g.userData.hy+.5; scene.add(g); g.userData.dead=true; slabs.push(g); sfx('whoosh',.5,1.7);
    const p0=g.position.clone(), p1=g.userData.home.clone(); await tween(.34,k=>{ g.position.lerpVectors(p0,p1,k); g.scale.setScalar(.35+.65*k); },{ease:'lin'}); g.userData.dead=false; g.userData.hit=1; sfx('slam',.8,.75); sfx('bang',.45,.7); for(const ip of inputs) haptic(ip,.8,90); burst(p1,10,{colors:[0x777a80,0x9a9da3],speed:.7,grav:1,life:.7}); caption(wd[0],wd[1],{color:'#ff7a66'}); await play3('m_'+LANG+'_'+(5+i),p1.clone().multiplyScalar(1.4),1.7); await W8(.25); }
  tween(FAST?1:9,k=>{ RAD=1.15-.49*k; place(); },{ease:'inOut'}); HEART.rate=1.5; HEART.vol=.65; await line('told',.8);
  caption(); await tween(FAST?.5:3,k=>{ U.dim.value=.58-.44*k; hemi.intensity=.3-.22*k; moonL.intensity=.5-.38*k; },{ease:'inOut'}); await W8(1.5);
  // 6. the choice
  const sc=room.scale.x, S2=V3(S.x*sc,S.y,S.z*sc); const ph2=makePhone(); ph2.position.copy(S2); ph2.rotation.set(-Math.PI/2,0,-.2); scene.add(ph2); cleanup.push(()=>scene.remove(ph2)); ph2.userData.set(true,tr('سلمى','Salma'),tr('أنا هنا. نصدّقك.','I am here. I believe you.'));
  got=false; (async()=>{ while(!got){ sfx('buzz',.6); await tween(1.2,k=>{ if(got) return; ph2.rotation.z=-.2+Math.sin(k*130)*.035*(k<.92?1:0); },{ease:'lin'}); await wait(1.5); } })();
  await line('speak',.3); hint('phone'); tp=addTouch(ph2,.15,(inp)=>{ got=true; haptic(inp,.7,60); }); await until(()=>got); removeTouch(tp); hint(); caption(); sfx('chime',.7);
  { const a=ph2.position.clone(), b=V3(.05,1.02,-.4); tween(.8,k=>{ ph2.position.lerpVectors(a,b,k); ph2.rotation.set(-Math.PI/2+(Math.PI/2-.6)*k,0,-.2*(1-k)); },{ease:'inOut'}); }
  const card2=msgCard(tr('سلمى','Salma'),tr('أنا هنا. نصدّقك. إنتِ مش بروحك.','I am here. I believe you. You are not alone.')); card2.position.set(0,1.72,-.95); scene.add(card2); cleanup.push(()=>scene.remove(card2)); pop(card2,1,.3,.5);
  music(.25,0,.05,.4); tween(1.5,k=>{ U.dim.value=.12+.3*k; hemi.intensity=.08+.3*k; }); HEART.rate=1.4; await W8(2.5); hint('words');
  let broken=0; const truths=[]; cleanup.push(()=>truths.forEach(t=>scene.remove(t)));
  const breakIt=(g,inp)=>{ if(g.userData.dead) return; g.userData.dead=true; removeTouch(g.userData.t); const wd=g.userData.wd; const p=g.position.clone(); const dir=inp?inp.vel.clone().clampLength(0,1.5):V3(p.x,0,p.z).normalize();
    sfx('slam',.95); haptic(inp,1,160); shatter(p,dir,36); burst(p,55,{speed:2.6,up:.4,grav:1,life:1.4}); { const fl=glow(1.6,0xffb060,1); fl.position.copy(p); scene.add(fl); tween(.35,k=>{ fl.material.opacity=1-k; fl.scale.setScalar(1.6+2*k); }).then(()=>scene.remove(fl)); } scene.remove(g); broken++; if(broken===1){ shrink(ph2); shrink(card2); }
    const t=textPlane(tr(wd[2],wd[3]),{px:110,h:.062,ltr:LANG==='en',maxW:1100,color:'#FFB36B'}); t.position.copy(p); t.lookAt(0,p.y,0); t.scale.setScalar(.2); scene.add(t); truths.push(t); const out=V3(p.x,0,p.z).normalize().multiplyScalar(1.5); const end=V3(out.x,2.0+(truths.length%2)*.26,out.z);
    tween(1.6,k=>{ t.position.lerpVectors(p,end,k); t.scale.setScalar(.2+.8*k); t.lookAt(0,t.position.y,0); },{ease:'out'});
    const f0=(broken-1)/5, f1=broken/5; tween(1.8,k=>{ const f=f0+(f1-f0)*k; const s=.58+.42*f; room.scale.set(s,1,s); U.dim.value=.42+.58*f; U.mixR.value=f; warmL.intensity=3.2*f; hemi.intensity=.38+.42*f; moonL.intensity=.12+.38*f; });
    HEART.rate=broken>=5?0:1.4-broken*.12; HEART.vol=.6-broken*.1; say('v_'+wd[4]); if(broken===2) music(.15,.3,.05,.15); };
  slabs.forEach(g=>{ g.userData.t=addTouch(g,.16,(inp)=>breakIt(g,inp)); });
  await until(()=>broken>=WORDS.length); hint(); caption(); music(0,.5,.1,0); hemi.color.setHex(0xffe2c4); await W8(2.2); await line('heard',.8);
  // 7. you open the door
  truths.forEach(t=>tween(1,k=>t.material.opacity=1-k).then(()=>scene.remove(t))); mir.visible=true; await walk([[-.3,-.8],[-.2,-2.7],[.98,-3.86]]); capAt(.1,1.8,-.6,.12,0,.6);
  const hg=glow(.34,AMBER,.9); hg.position.set(.82,1.02,-4.5); scene.add(hg); cleanup.push(()=>scene.remove(hg)); const pulse=tween(600,k=>{ hg.material.opacity=.6+.35*Math.sin(TT*5); },{ease:'lin'});
  hint('handle'); got=false; tp=addTouch(hg,.17,(inp)=>{ got=true; haptic(inp,.8,100); }); await until(()=>got); removeTouch(tp); hint(); scene.remove(hg);
  const lightP=new THREE.Mesh(new THREE.PlaneGeometry(1.2,2.3),new THREE.MeshBasicMaterial({color:0xfff4dc})); lightP.position.set(1.15,1.1,-4.95); scene.add(lightP); cleanup.push(()=>scene.remove(lightP)); const lg=glow(6,0xffe9c0,0); lg.position.set(1.15,1.2,-4.9); scene.add(lg); cleanup.push(()=>scene.remove(lg));
  sfx('whoosh',.7); sfx('chime',.6); music(0,.7,.2,0); tween(2.0,k=>{ D.rotation.y=-1.75*k; lg.material.opacity=k; },{ease:'inOut'}); await W8(.9); fadeM.material.color.set(0xffffff); await fade(1,1.5); scene.remove(lightP,lg,mir); }

async function actMeadow(){ // sixteen days of light
  const W8=s=>wait(FAST?.15:s); room.visible=false; dome.visible=true; dome.material.color.setScalar(.8); center(0,0); capAt(0,1.0,-1.6,-.22); U.dim.value=1; HEART.rate=0; hemi.color.setHex(0xffd2aa); hemi.intensity=1.0; moonL.intensity=.4; warmL.intensity=0; music(0,.55,.3,0);
  resetSky(); cleanup.push(()=>{ dome.visible=false; bl.visible=false; blPts.visible=false; SKYF=null; }); await W8(.4); await fade(0,2.4); fadeM.material.color.set(0x000000);
  launch(7,2); await W8(2.5); await line('days',.6);
  const mine=[]; let released=0; const spots=[[-.42,1.02,-.5],[0,.96,-.62],[.42,1.02,-.5]];
  spots.forEach((p,i)=>{ const g=skyLantern(false); g.position.set(p[0],p[1],p[2]); g.userData.st=0; g.userData.t=0; g.userData.y0=p[1]; g.userData.ph=i*2; scene.add(g); pop(g,.8,i*.25,.6); mine.push(g); cleanup.push(()=>scene.remove(g));
    g.userData.touch0=addTouch(g,.17,(inp)=>{ const u=g.userData; if(u.st!==0) return; u.st=1; u.t=0; u.holder=inp; u.body.material.color.setHex(0xffffff); { const wd=[WORDS[0],WORDS[3],WORDS[2]][i]; const tx=textPlane(tr(wd[2],wd[3]),{px:90,h:.017,ltr:LANG==='en',maxW:520,color:'#6a2206',shadow:false}); tx.position.set(0,.16,.14); g.add(tx); } u.gl.material.opacity=.8; u.fl.material.opacity=1; sfx('chime',.6,.9+released*.1); haptic(inp,.7,80); burst(g.position.clone(),18,{speed:.6,grav:-.3,life:1.2}); removeTouch(u.touch0); }); });
  hint('lantern');
  SKYF=(dt)=>{ for(const g of mine){ const u=g.userData; if(u.st===0){ g.position.y=u.y0+Math.sin(TT*1.2+u.ph)*.012; } else if(u.st===1){ u.t+=dt; const h=u.holder&&(u.holder.active||u.holder.handOn)?u.holder:null; if(h){ tmp.copy(h.pos); tmp.y+=.06; g.position.lerp(tmp,.25); if(u.t>.5&&(h.vel.y>.55||h.pos.y>u.y0+.32)||u.t>4) u.st=2; } else { g.position.y+=dt*.12; if(u.t>1.1) u.st=2; }
        if(u.st===2){ released++; u.v=V3((rnd()-.5)*.1,.3,(rnd()-.5)*.1-.05); sfx('whoosh',.35,1.3); launch(released>=3?NB:16,released>=3?3:1.5); const c0=dome.material.color.r, c1=.8+.2*released/3; tween(2,k=>dome.material.color.setScalar(c0+(c1-c0)*k)); } }
      else { u.v.y=Math.min(.75,u.v.y+dt*.12); g.position.addScaledVector(u.v,dt); g.position.x+=Math.sin(TT*.7+u.ph)*.05*dt; g.rotation.z=Math.sin(TT*.8+u.ph)*.06; if(g.position.y>40) g.visible=false; } } };
  await until(()=>released>=3); hint(); caption(); music(0,.75,.25,0); await W8(3.5); capAt(0,1.75,-2.2,.05); caption(STAT[0],STAT[1],{h:.07}); const src=textPlane(tr(STAT[2],STAT[3]),{px:70,h:.036,ltr:LANG==='en',weight:700,color:'#FF9A3C'}); src.position.y=-.26; capRoot.add(src); await W8(7.5); capRoot.remove(src); caption(); await W8(.8); }

let FOLLOW=null;
async function actHand(){ // 3. your hand
  capAt(0,2.0,-1.3,.15); await line('yours',.3);
  const panel=new THREE.Group(); panel.position.set(0,-1.6,-.6); scene.add(panel); cleanup.push(()=>scene.remove(panel));
  const PW=.86, PH=1.24; const body=new THREE.Mesh(new THREE.BoxGeometry(PW,PH,.05),new THREE.MeshStandardMaterial({map:tex('img/plaster.jpg'),color:0xf3e6d6,roughness:.95})); body.position.y=1.13; panel.add(body);
  const rim=new THREE.Mesh(new THREE.BoxGeometry(PW+.05,PH+.05,.035),new THREE.MeshStandardMaterial({color:ORANGE,roughness:.6})); rim.position.set(0,1.13,-.012); panel.add(rim);
  const handTex=tex('img/hand.png'); const prints=[]; const spots=[[-.27,1.58,.5],[.02,1.62,.42],[.28,1.56,.5],[-.3,1.2,.45],[.3,1.22,.48],[-.28,.82,.5],[.0,.74,.44],[.28,.8,.5],[-.12,.98,.3],[.16,1.0,.28],[-.14,1.44,.3],[.15,1.42,.3]];
  for(const [x,y,s] of spots){ const m=new THREE.Mesh(new THREE.PlaneGeometry(.3*s*.92,.3*s),new THREE.MeshBasicMaterial({map:handTex,transparent:true,color:ORANGE,opacity:.16,depthWrite:false})); m.position.set(x,y,.027); m.rotation.z=(rnd()-.5)*.7; panel.add(m); prints.push(m); }
  const target=new THREE.Mesh(new THREE.PlaneGeometry(.3*.92,.3),new THREE.MeshBasicMaterial({map:handTex,transparent:true,color:0xffffff,opacity:.5,depthWrite:false})); target.position.set(0,1.22,.03); panel.add(target);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.19,.2,48,1,0,.001),new THREE.MeshBasicMaterial({color:AMBER,side:THREE.DoubleSide})); ring.position.set(0,1.22,.032); panel.add(ring);
  sfx('whoosh',.5); await tween(1.4,k=>panel.position.y=-1.6*(1-k),{ease:'out'}); hint('hand'); caption();
  let hold=0, done=false, forced=false; const center=V3(0,1.22,-.57); PRESS=(dt)=>{ if(done) return; let on=forced; for(const inp of inputs){ if(!(inp.active||inp.handOn)) continue; for(const p of [inp.pos,inp.palm]){ if(Math.abs(p.z-(-.575))<.09&&Math.hypot(p.x-center.x,p.y-center.y)<.17){ on=true; if(Math.random()<.3) haptic(inp,.3+hold*.5,30); } } }
    hold=clamp(hold+(on?dt:-dt*1.5)/1.1,0,1); target.material.opacity=.5+.3*Math.sin(performance.now()/220)+hold*.3; ring.geometry.dispose(); ring.geometry=new THREE.RingGeometry(.19,.2,48,1,Math.PI/2,-Math.max(.001,hold*Math.PI*2)); if(hold>=1) done=true; };
  const tt=addTouch(target,0,()=>{ forced=true; }); cleanup.push(()=>{ PRESS=null; });
  await until(()=>done); PRESS=null; removeTouch(tt); hint(); panel.remove(ring);
  // your print, then everyone's
  target.material.color.setHex(ORANGE); target.material.opacity=1; sfx('slam',.7); sfx('chime',.8,1.2); const wp=target.getWorldPosition(V3()); burst(wp,60,{speed:2.4,grav:.2,life:1.6});
  prints.forEach((m,i)=>tween(.5,k=>m.material.opacity=.16+.84*k,{delay:.25+i*.12}).then(()=>{ if(i%2===0) sfx('pop',.25,1+i*.03); }));
  music(0,.85,.1); await wait(FAST?.2:2.2);
  // hundreds of lights rise
  RISE=true; cleanup.push(()=>{ RISE=false; });
  await line('off',1.4); await line('hear',.6);
  await tween(1.6,k=>panel.position.y=-1.7*k,{ease:'inOut'});
  caption(); endCard(); await wait(FAST?.3:7);
  const again=orbLight(tr('من جديد','Again'),AMBER,.055); again.position.set(0,1.15,-.55); scene.add(again); pop(again); cleanup.push(()=>scene.remove(again)); hint('again'); let go=false; const ta=addTouch(again,.11,()=>go=true); DEBUG._again=()=>go=true; await until(()=>go); removeTouch(ta); }

let PRESS=null, RISE=false, riseAcc=0;
function endCard(){ const W_=2048,H_=1180; const logos=['mark16','lin','partners','eu'].map(n=>{ const i=new Image(); i.src='img/'+n+'.png'; return i; }); const cv=document.createElement('canvas'); cv.width=W_; cv.height=H_; const g=cv.getContext('2d'); const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8;
  const draw=()=>{ g.clearRect(0,0,W_,H_); g.fillStyle='#F0401F'; g.beginPath(); g.roundRect(0,0,W_,H_,70); g.fill(); const en=LANG==='en';
    const mk=logos[0]; if(mk.complete&&mk.naturalWidth){ const h=520, w=h*mk.naturalWidth/mk.naturalHeight; g.drawImage(mk,en?110:W_-110-w,110,w,h); }
    g.fillStyle='#fff'; g.textBaseline='alphabetic'; g.direction=en?'ltr':'rtl'; g.textAlign=en?'left':'right'; const tx=en?640:W_-640;
    if(en){ g.font='900 150px Cairo'; g.fillText('DAYS OF',tx,270); g.fillText('ACTIVISM',tx,420); g.font='700 62px Cairo'; g.fillText('against gender-based violence',tx,520); g.font='700 50px Cairo'; g.fillText('25 November - 10 December',tx,610); }
    else { g.font='900 150px Cairo'; g.fillText('يومًا من النشاط',tx,290); g.font='700 74px Cairo'; g.fillText('لمناهضة العنف القائم على النوع الاجتماعي',tx,420); g.font='700 56px Cairo'; g.fillText('25 نوفمبر - 10 ديسمبر',tx,530); }
    g.textAlign='center'; g.font='900 84px Cairo'; g.fillStyle='#FDEEE6'; g.fillText(en?'You can take the headset off. She cannot.':'إنت تقدر تنحّي النظّارة. هي ما تقدرش.',W_/2,790);
    g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(110,860,W_-220,3);
    const row=[[logos[1],150],[logos[2],120],[logos[3],190]]; let x=110; const y=1010; const ws=row.map(([im,h])=>im.complete&&im.naturalWidth?h*im.naturalWidth/im.naturalHeight:0);
    if(ws[0]) g.drawImage(row[0][0],110,y-75,ws[0],150); if(ws[1]) g.drawImage(row[1][0],W_/2-ws[1]/2+40,y-60,ws[1],120); if(ws[2]) g.drawImage(row[2][0],W_-110-ws[2],y-95,ws[2],190); t.needsUpdate=true; };
  logos.forEach(i=>i.onload=draw); draw();
  const m=new THREE.Mesh(new THREE.PlaneGeometry(3.3,3.3*H_/W_),new THREE.MeshBasicMaterial({map:t,transparent:true,fog:false})); m.position.set(0,2.3,-3.2); m.rotation.x=.12; scene.add(m); pop(m,1,0,.9); cleanup.push(()=>scene.remove(m)); }

async function run(){ if(running) return; running=true; const id=++runId; await Promise.all([worldReady,womanReady]);
  for(;;){ clearAll(); rig.position.set(0,0,0); rig.rotation.y=0; capAt(0,1.02,-1.75,-.18); room.visible=false; dome.visible=false; bl.visible=false; blPts.visible=false; room.scale.set(1,1,1); U.dim.value=1; HEART.rate=0; HOLD=null; RISE=false; fadeM.material.color.set(0x000000); lids(1); music(.2,0,.25,0);
    await wait(.4); center(0,0); await fade(0,1.2); await chooseLang(); lids(0); if(AC) ['bang','steps','doorslam','glass',...[1,2,3,4,5,6,7,8,9].map(i=>'m_'+LANG+'_'+i)].forEach(n=>loadBuf(n).catch(()=>{}));
    await actRoom(); await actMeadow(); await actHand();
    await fade(1,1.2); clearAll(); } }

/* ---------------- START ---------------- */
async function start(vr){ if(started) return; $('#msg').textContent='';
  if(vr){ if(!navigator.xr){ $('#msg').textContent='افتح الرابط من متصفح Meta Quest · Open this link in the Meta Quest browser.'; return; }
    try{ const s=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor','hand-tracking']}); await renderer.xr.setSession(s); camera.position.set(0,0,0); camera.rotation.set(0,0,0); s.addEventListener('end',()=>{ camera.position.set(0,1.6,0); }); }
    catch(err){ $('#msg').textContent='تعذّر بدء الواقع الافتراضي · Could not start VR: '+err.message; return; } }
  else { camera.position.set(0,1.6,.25); pitch=-.12; camera.rotation.set(pitch,0,0,'YXZ'); $('#hint').textContent='اسحب للنظر، واضغط على ما يضيء · Drag to look, click what glows'; }
  started=true; initAudio(); $('#ui').style.display='none'; for(const k in AUD) AUD[k].a.play().catch(()=>{}); run(); }
$('#bvr').onclick=()=>start(true); $('#b2d').onclick=()=>start(false);
if(navigator.xr) navigator.xr.isSessionSupported('immersive-vr').then(ok=>{ if(!ok){ $('#bvr').style.opacity=.5; $('#msg').textContent='الواقع الافتراضي غير متاح على هذا الجهاز · VR is not available on this device. Try it on screen.'; } }).catch(()=>{}); else $('#bvr').style.opacity=.5;

/* ---------------- LOOP ---------------- */
const clock=new THREE.Clock(); let TT=0;
renderer.setAnimationLoop(()=>{ const dt=Math.min(clock.getDelta(),FAST?.25:.05); TT+=dt;
  for(let i=tweens.length-1;i>=0;i--){ const w=tweens[i]; w.t+=dt; if(w.t<0) continue; const k=Math.min(1,w.t/w.dur); w.fn(w.e(k)); if(k>=1){ tweens.splice(i,1); w.res(); } }
  if(renderer.xr.isPresenting) updateInputs(dt);
  if(HEART.rate>0){ HEART.t+=dt*HEART.rate; if(HEART.t>=1){ HEART.t=0; sfx('heart',HEART.vol); for(const i of inputs) haptic(i,.55,70); } }
  if(FOLLOW) FOLLOW(); if(PRESS) PRESS(dt);
  updateParticles(dt); updateFrags(dt); updateAudio(dt);
  for(const o of scene.children){ const u=o.userData; if(u&&u.home&&!u.dead&&o.visible){ o.position.y=u.home.y+Math.sin(TT*1.1+u.ph)*.012; let near=9; for(const inp of inputs){ if(inp.active||inp.handOn) near=Math.min(near,inp.pos.distanceTo(o.position)); } const k=clamp(1-(near-.15)/.3,0,1); const bt=HEART.rate>0?Math.max(0,1-HEART.t*5):0; u.hit=Math.max(0,(u.hit||0)-dt*3); if(!u.dead||u.hit>0) o.scale.setScalar(1+.06*bt+.3*u.hit); u.crack.material.opacity=.22+.3*bt+k*.6; o.rotation.z=Math.sin(TT*38)*.03*k+Math.sin(TT*50)*.05*u.hit; } }
  GT.value=TT; updListener(); if(MIR) MIR.userData.tick(dt); if(T.door_refl) T.door_refl.rotation.y=T.room_door.rotation.y; if(HOLD&&HEART.rate>0) lids(.93-.1*Math.max(0,1-HEART.t*4));
  if(HOLD) HOLD(dt); if(SKYF) SKYF(dt); if(dome.visible) updateSky(dt);
  if(RISE){ riseAcc+=dt; while(riseAcc>.03){ riseAcc-=.03; const i=PT.i=(PT.i+1)%NPT; const a=rnd()*Math.PI*2, r=1.2+rnd()*5; PT.pos[i*3]=Math.cos(a)*r; PT.pos[i*3+1]=.05; PT.pos[i*3+2]=-1.5+Math.sin(a)*r; PT.vel[i*3]=(rnd()-.5)*.15; PT.vel[i*3+1]=.5+rnd()*.7; PT.vel[i*3+2]=(rnd()-.5)*.15; PT.life[i]=7+rnd()*4; PT.grav[i]=-.04; _c.setHex(rnd()<.7?AMBER:0xffe2b8); PT.col[i*3]=_c.r; PT.col[i*3+1]=_c.g; PT.col[i*3+2]=_c.b; } }
  capFrame.position.set(rig.position.x+HO.x,0,rig.position.z+HO.z); meadowG.visible=dome.visible;
  if(STEREO){ camera.updateMatrixWorld(true); STEREO.cameras.forEach((c,i)=>{ c.matrixWorld.copy(camera.matrixWorld).multiply(_sm.makeTranslation(i?.032:-.032,0,0)); c.matrixWorldInverse.copy(c.matrixWorld).invert(); }); STEREO.matrixWorld.copy(camera.matrixWorld); STEREO.matrixWorldInverse.copy(camera.matrixWorld).invert(); renderer.render(scene,STEREO); } else renderer.render(scene,camera); });
let STEREO=null; const _sm=new THREE.Matrix4();

window.DEBUG={ probe:(elevs,yaws)=>{ const rc=new THREE.Raycaster(); const o=new THREE.Vector3(0,1.6,0); const out=[]; for(const yw of yaws){ const row=[]; for(const el of elevs){ const e=el*Math.PI/180, y=yw*Math.PI/180; rc.set(o,new THREE.Vector3(-Math.sin(y)*Math.cos(e),Math.sin(e),-Math.cos(y)*Math.cos(e))); rc.far=200; const h=rc.intersectObject(dome,false)[0]; row.push(h?[+h.distance.toFixed(1),+h.point.y.toFixed(2)]:null); } out.push(row); } return out; }, stereo:()=>{ const pr=renderer.getPixelRatio(), w=innerWidth/2*pr, h=innerHeight*pr; const mk=x=>{ const c=new THREE.PerspectiveCamera(70,(innerWidth/2)/innerHeight,.06,300); c.viewport=new THREE.Vector4(x,0,w,h); c.layers.mask=camera.layers.mask; c.matrixWorldAutoUpdate=false; c.matrixAutoUpdate=false; return c; }; STEREO=new THREE.ArrayCamera([mk(0),mk(w)]); STEREO.layers.mask=camera.layers.mask; STEREO.matrixWorldAutoUpdate=false; STEREO.matrixAutoUpdate=false; STEREO.projectionMatrix.copy(STEREO.cameras[0].projectionMatrix); }, head:(x,y,z)=>{ camera.position.set(x,y,z); }, start, fast:(v=true)=>{ FAST=v; }, mir:()=>MIR, state:()=>({build:BUILD,mirror:!!(MIR&&MIR.userData.live),lang:LANG,dim:U.dim.value,scale:room.scale.x,mixR:U.mixR.value,meadow:dome.visible,rig:[rig.position.x,rig.position.z],lit:blN,touch:touchables.length}), info:()=>renderer.info.render,
  cam:(x,y,z,p,yw)=>{ camera.position.set(x,y,z); pitch=p; yaw=yw; camera.rotation.set(p,yw,0,'YXZ'); }, touchAll:()=>{ for(const t of [...touchables]) if(t.alive) t.on(null,true); }, touchOne:()=>{ const a=touchables.filter(t=>t.alive); const t=a[Math.floor(Math.random()*a.length)]; if(t) t.on(null,true); }, U };
document.fonts.load('900 40px Cairo').then(()=>document.fonts.load('700 40px Cairo')).then(()=>worldReady).then(()=>womanReady).then(()=>{ window.READY=true; }).catch(e=>{ console.error(e); window.READY='err'; });
