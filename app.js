import * as THREE from 'three';
import { GLTFLoader } from './lib/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from './lib/jsm/environments/RoomEnvironment.js';
import * as SkeletonUtils from './lib/jsm/utils/SkeletonUtils.js';

/* =========================================================
   «الميدان» Al-Maydan v2: WebXR journey (grab, throw, pull, stamp)
   Town is modeled + light-baked in Blender (blender/town.py).
   Story text: edit ERAS below.
   ========================================================= */
const C = { navy:0x211D70, deep:0x17134A, teal:0x4FC2B6, pink:0xE1148D, yel:0xFED60E, white:0xffffff };
const hex = n => '#' + n.toString(16).padStart(6,'0');
const $ = s => document.querySelector(s);
const rnd = (()=>{ let s=4242; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; })();
const V3 = (x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------------- STORY ---------------- */
const ERAS = [
 { key:'intro', guide:'k03', tag:'أهلاً بيكم!', title:'الميدان', year:'',
   text:'هذا ميدان مدينتنا. تعالوا نشوفوا مع بعض كيف تغيّر عبر الزمن، وكيف كبر فيه العمل الأهلي.',
   en:'This is our town square. Let\'s see how it changed through time.',
   task:'امسك الكرة وارمِها (تجربة)', need:1, env:'dawn', music:'roots', amb:'market', people:8 },
 { key:'roots', guide:'k29', tag:'الجدّة', title:'الجذور', year:'قبل الاستقلال',
   text:'قبل ما تكون فيه جمعيات ومنظمات، كان الخير شغل الناس كلها: الجار يوقف مع جاره، والوقف والزوايا تعلّم وتطعم.',
   en:'Before organizations, solidarity was everyone\'s job.',
   task:'امسك الشمعة ونوّر الفوانيس الثلاثة', need:3, env:'dawn', music:'roots', amb:'market', people:10 },
 { key:'kingdom', guide:'k29', tag:'الجدّة', title:'أولى الجمعيات', year:'1951 - 1969',
   text:'بعد الاستقلال سنة 1951 بدت تظهر الجمعيات الأهلية والنوادي والصحف: الحركة النسائية، والكشافة (1954)، والهلال الأحمر (1957).',
   en:'After independence in 1951, the first associations, clubs and newspapers appeared.',
   task:'امسك الختم واختم طلبات تأسيس الجمعيات', need:3, env:'day', music:'roots', amb:'market', people:16 },
 { key:'quiet', guide:'k31', tag:'الأب', title:'سنوات الصمت', year:'1969 - 2011',
   text:'لعقود طويلة، كان العمل الأهلي المستقل مقيّدًا بشدة، والجمعيات تشتغل تحت رقابة الدولة. الميدان سكت.. لكن الناس ما نسوش.',
   en:'For decades, independent civic work was heavily restricted. The square went quiet.',
   task:'امسك حلقة الباب واسحب.. حاول تفتحه', need:3, env:'gray', music:'quiet', amb:'wind', people:2 },
 { key:'2011', guide:'k30', tag:'الأب', title:'الميدان يتنفّس', year:'2011',
   text:'بعد 2011 تأسست آلاف المنظمات في كل المدن: شباب، ونساء، وإغاثة، وإعلام، وحقوق. الصوت رجع للميدان.',
   en:'After 2011, thousands of organizations were founded across Libya.',
   task:'ارمِ كرات الأفكار بعيد في الميدان!', need:3, env:'bright', music:'joy', amb:'market', people:22 },
 { key:'p1', guide:'k03', tag:'المرحلة 1', title:'لنتعاون: البداية', year:'2019 - 2023',
   text:'في ديسمبر 2019 انطلق مشروع «لنتعاون» بتمويل من الاتحاد الأوروبي لدعم منظمات المجتمع المدني، وتأسست مراكز الموارد في طرابلس وبنغازي.',
   en:'Linataawan launched in December 2019, funded by the EU. Resource Centers opened in Tripoli and Benghazi.',
   task:'حُطّ حجر الأساس في مكانه على المجسّم', need:1, env:'bright', music:'hope', amb:'market', people:24 },
 { key:'p2', guide:'k03', tag:'المرحلة 2', title:'لنتعاون: نكبروا', year:'2024 - 2026',
   text:'4 مراكز موارد: طرابلس، بنغازي، سبها، والبيضاء. أكثر من 540 منظمة وأكثر من 10,000 شخص استفادوا من التدريب والدعم.',
   en:'4 Resource Centers. 540+ organizations and 10,000+ people supported.',
   task:'حُطّ المفتاح الذهبي في باب المجسّم', need:1, env:'bright', music:'hope', amb:'market', people:28 },
 { key:'p3', guide:'k03', tag:'المرحلة 3', title:'لنتعاون: المرحلة 3', year:'اليوم',
   text:'المرحلة الثالثة من «لنتعاون» تفتح أبوابها: مساحة للجميع. قاعات، وتدريب، ومنصة erc.ngos.ly. المكان مكانكم!',
   en:'Linataawan Phase III opens its doors: a space for everyone.',
   task:'اسحب ذراع الكهرباء لتحت ونوّر المبنى', need:1, env:'bright', music:'hope', amb:'market', people:34 },
 { key:'pledge', guide:'k03', tag:'دورك أنت', title:'دورك أنت', year:'',
   text:'الحكاية ما كملتش.. الفصل الجاي تكتبه أنت. امسك ملصقاتك والصّقها وين ما تحب على الحيط.',
   en:'The story is not finished. The next chapter is yours.',
   task:'الصّق 3 ملصقات على الأقل', need:3, env:'dusk', music:'hope', amb:'market', people:34 },
];
let LANG='ar'; const tr=(a,e)=>LANG==='en'?e:a;
const EN={
 intro:{tag:'Welcome!',title:'Al-Maydan',year:'',text:'This is our town square. Come with us and see how it changed through time, and how civic work grew in it.',task:'Grab the ball and throw it (practice)'},
 roots:{tag:'Grandmother',title:'The Roots',year:'Before independence',text:'Before associations and organizations existed, doing good was everyone\'s job: neighbors stood by each other, and endowments and zawiyas taught and fed people.',task:'Hold the candle and light the 3 lanterns'},
 kingdom:{tag:'Grandmother',title:'The First Associations',year:'1951 - 1969',text:'After independence in 1951, civil associations, clubs and newspapers began to appear: the women\'s movement, the Scouts (1954), and the Red Crescent (1957).',task:'Hold the stamp and stamp the papers'},
 quiet:{tag:'Father',title:'The Silent Years',year:'1969 - 2011',text:'For long decades, independent civic work was heavily restricted, and associations worked under state control. The square went quiet, but people did not forget.',task:'Grab the door ring and pull it'},
 '2011':{tag:'Father',title:'The Square Breathes',year:'2011',text:'After 2011, thousands of organizations were founded in every city: youth, women, relief, media and rights. The voice came back to the square.',task:'Throw the idea balls far into the square!'},
 p1:{tag:'Phase 1',title:'Linataawan: The Start',year:'2019 - 2023',text:'In December 2019, the Linataawan project launched with funding from the European Union to support civil society organizations, and Resource Centers were set up in Tripoli and Benghazi.',task:'Place the foundation stone on the model'},
 p2:{tag:'Phase 2',title:'Linataawan: We Grow',year:'2024 - 2026',text:'4 Resource Centers: Tripoli, Benghazi, Sabha and Al-Bayda. More than 540 organizations and more than 10,000 people benefited from training and support.',task:'Put the golden key in the model door'},
 p3:{tag:'Phase 3',title:'Linataawan: Phase 3',year:'Today',text:'The third phase of Linataawan opens its doors: a space for everyone. Halls, training, and the erc.ngos.ly platform. This place is yours!',task:'Pull the power lever down'},
 pledge:{tag:'Your turn',title:'Your Turn',year:'',text:'The story is not finished. You write the next chapter. Take your stickers and stick them anywhere you like on the wall.',task:'Stick at least 3 stickers'},
};
ERAS.forEach(e=>e.E=EN[e.key]);
const ENV = {
 dawn:  { top:0x2f3f8f, bot:0xf9b877, fog:0xf0c79a, tint:[1.10,.95,.84], sat:1.0, glow:0, bird:1, night:.38, sun:.7 },
 day:   { top:0x2f86dc, bot:0xcfeaf7, fog:0xd6ecf4, tint:[1,1,1], sat:1.05, glow:0, bird:1, night:0, sun:1 },
 gray:  { top:0x4d5057, bot:0x92959b, fog:0x85888e, tint:[.60,.62,.66], sat:.06, glow:0, bird:0, night:0, sun:0 },
 bright:{ top:0x1f78e0, bot:0xbfe9ff, fog:0xcbeafb, tint:[1.06,1.04,1.0], sat:1.2, glow:0, bird:1, night:0, sun:1 },
 dusk:  { top:0x0d0b3a, bot:0xc45a8e, fog:0x4a3a78, tint:[1,1,1.06], sat:1.1, glow:0, bird:1, night:.9, sun:0 },
};

/* ---------------- RENDERER ---------------- */
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true; renderer.xr.setFoveation(1); renderer.xr.setReferenceSpaceType('local-floor');
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xf0c79a, 22, 85);
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity=.55;
const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.08, 230);
const rig = new THREE.Group(); rig.add(camera); scene.add(rig); camera.position.set(0,1.6,0);
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
const hemi=new THREE.HemisphereLight(0xffffff,0xb59a70,1.1); scene.add(hemi); const dl=new THREE.DirectionalLight(0xfff0d8,1.6); dl.position.set(-6,9,5); scene.add(dl);

/* ---------------- TWEENS ---------------- */
const tweens = [];
const ease = { out:t=>1-Math.pow(1-t,3), inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, lin:t=>t,
  back:t=>{const c=1.70158*1.4;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);},
  elastic:t=>t===0||t===1?t:Math.pow(2,-10*t)*Math.sin((t*10-.75)*2.094)+1 };
function tween(dur, fn, o={}){ return new Promise(res=>tweens.push({t:-(o.delay||0),dur,fn,e:ease[o.ease||'out'],res})); }
function pop(obj, s=1, delay=0, dur=.55){ obj.visible=true; obj.scale.setScalar(1e-4); return tween(dur,k=>obj.scale.setScalar(Math.max(1e-4,s*k)),{ease:'back',delay}); }
function hide(obj, dur=.3){ const s=obj.scale.x; return tween(dur,k=>obj.scale.setScalar(Math.max(1e-4,s*(1-k))),{ease:'inOut'}).then(()=>{obj.visible=false;}); }
const wait = s => tween(s,()=>{});

/* ---------------- TEXTURES ---------------- */
function canvasTex(w,h,draw,repeat){ const c=document.createElement('canvas'); c.width=w;c.height=h; draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8;
  if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat[0],repeat[1]);} return t; }
const loader = new THREE.TextureLoader();
function baked(name){ const t=loader.load('bake/'+name+'.jpg'); t.colorSpace=THREE.SRGBColorSpace; t.flipY=false; t.anisotropy=8; return t; }
const imgTex = {}; const img = n => { if(!imgTex[n]){ const t=loader.load('img/'+n+'.png'); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; imgTex[n]=t; } return imgTex[n]; };
const IMG_AR = { k03:.87,k05:.8,k07:1.72,k08:1,k10:1.1,k12:1.9,k13:1.9,k14:1,k15:1,k16:1.83,k22:1,k23:2.4,k28:1.5,k29:1,k30:1,k31:1,k32:1,k33:2.3,k06:1.5, rc_white:2.745, lin_mark:1, lin_text:.99, tape_partners:3.97, tape_eu:1.24 };
function sprite(name, h, opt={}){ const w=h*(IMG_AR[name]||1);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({map:img(name),transparent:true,alphaTest:.05,side:THREE.DoubleSide,fog:opt.fog??true,toneMapped:false})); return m; }
const glowTex = canvasTex(128,128,(g)=>{ const r=g.createRadialGradient(64,64,2,64,64,64); r.addColorStop(0,'rgba(255,225,160,1)'); r.addColorStop(.35,'rgba(255,190,90,.45)'); r.addColorStop(1,'rgba(255,170,60,0)'); g.fillStyle=r; g.fillRect(0,0,128,128); });
function glow(size, color=0xffffff){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false,opacity:0})); s.scale.setScalar(size); return s; }
/* RC pattern */
function rcTile(g,x,y,s,type,fg,bg,rot){ g.save(); g.translate(x+s/2,y+s/2); g.rotate(rot*Math.PI/2); g.translate(-s/2,-s/2);
  g.fillStyle=bg; g.fillRect(-.5,-.5,s+1,s+1); g.fillStyle=fg; g.strokeStyle=fg; g.beginPath();
  if(type==='q'){ g.moveTo(0,0); g.lineTo(s,0); g.arc(0,0,s,0,Math.PI/2); g.fill(); }
  else if(type==='c'){ g.arc(s/2,s/2,s*.48,0,7); g.fill(); }
  else if(type==='h'){ g.arc(0,s/2,s/2,-Math.PI/2,Math.PI/2); g.fill(); g.beginPath(); g.arc(s/2,s/2,s/2,-Math.PI/2,Math.PI/2); g.fill(); }
  else if(type==='l'){ g.moveTo(0,s); g.arc(s,s,s,Math.PI,Math.PI*1.5); g.arc(0,0,s,0,Math.PI/2); g.fill(); }
  else { g.save(); g.beginPath(); g.rect(0,0,s,s); g.clip(); g.lineWidth=s*.075; for(let k=-6;k<8;k++){ g.beginPath(); g.moveTo(k*s*.17,0); g.lineTo(k*s*.17+s,s); g.stroke(); } g.restore(); }
  g.restore(); }
const RCC=[['q','#E1148D','#211D70'],['s','#211D70','#fff'],['l','#fff','#E1148D'],['c','#4FC2B6','#211D70'],['h','#211D70','#4FC2B6'],['q','#211D70','#E1148D'],['l','#E1148D','#fff'],['c','#fff','#4FC2B6'],['h','#FED60E','#211D70'],['s','#4FC2B6','#211D70'],['l','#211D70','#FED60E'],['c','#E1148D','#FED60E']];
const texPattern = (cols,rows,rep)=>canvasTex(cols*128,rows*128,(g)=>{ for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){ const c=RCC[Math.floor(rnd()*RCC.length)]; rcTile(g,i*128,j*128,128,c[0],c[1],c[2],Math.floor(rnd()*4)); } },rep);
const woodTex = canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#6b4526'; g.fillRect(0,0,w,h); for(let i=0;i<90;i++){ g.strokeStyle=`rgba(${30+rnd()*40|0},${15+rnd()*20|0},5,${.15+rnd()*.25})`; g.lineWidth=1+rnd()*2; const x=rnd()*w; g.beginPath(); g.moveTo(x,0); g.bezierCurveTo(x+rnd()*14-7,h*.3,x+rnd()*14-7,h*.7,x+rnd()*10-5,h); g.stroke(); } for(let i=1;i<4;i++){ g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(i*w/4-1,0,3,h); } });

/* ---------------- COLOR GRADING (shared by all baked materials) ---------------- */
const GR = { uTint:{value:new THREE.Color(1.08,.93,.8)}, uSat:{value:1}, uNight:{value:.38} };
function graded(mat, night, isLM){ mat.customProgramCacheKey=()=> 'gr'+(night?(isLM?'L':'N'):'0'); mat.onBeforeCompile=sh=>{ sh.uniforms.uTint=GR.uTint; sh.uniforms.uSat=GR.uSat; sh.uniforms.uNight=GR.uNight; if(night) sh.uniforms.tNight={value:night};
  if(night&&!isLM) sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,pow(texture2D(tNight,vMapUv).rgb,vec3(1.75))*vec3(1.0,.86,.66),uNight);');
  if(night&&isLM) sh.fragmentShader=sh.fragmentShader.replace('texture2D( lightMap, vLightMapUv )','mix(texture2D( lightMap, vLightMapUv ),vec4(pow(texture2D(tNight,vLightMapUv).rgb,vec3(1.6))*vec3(1.0,.86,.66),1.0),uNight)');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uTint; uniform float uSat; uniform float uNight; uniform sampler2D tNight;')
    .replace('#include <opaque_fragment>','float lumG=dot(outgoingLight,vec3(.3,.59,.11)); outgoingLight=mix(vec3(lumG),outgoingLight,uSat)*uTint;\n#include <opaque_fragment>'); }; return mat; }

/* ---------------- SKY ---------------- */
const skyMat = new THREE.ShaderMaterial({ side:THREE.BackSide, depthWrite:false, fog:false,
  uniforms:{ top:{value:new THREE.Color(ENV.dawn.top)}, bot:{value:new THREE.Color(ENV.dawn.bot)} },
  vertexShader:'varying vec3 p; void main(){ p=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader:'uniform vec3 top; uniform vec3 bot; varying vec3 p; void main(){ vec3 d=normalize(p); float h=clamp(d.y*1.5+0.06,0.0,1.0); vec3 c=mix(bot,top,pow(h,0.6)); float s=pow(max(dot(d,normalize(vec3(-.62,.5,.6))),0.0),60.0); c+=vec3(1.0,.9,.7)*s*.9; gl_FragColor=vec4(c,1.0); }' });
scene.add(new THREE.Mesh(new THREE.SphereGeometry(180,24,16), skyMat));
const cloudTex = canvasTex(256,128,(g,w,h)=>{ for(let i=0;i<10;i++){ const x=40+rnd()*176,y=52+rnd()*26,r=20+rnd()*26; const gr=g.createRadialGradient(x,y,2,x,y,r); gr.addColorStop(0,'rgba(255,255,255,.85)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h);} });
const clouds=[]; for(let i=0;i<10;i++){ const m=new THREE.Mesh(new THREE.PlaneGeometry(34,15), new THREE.MeshBasicMaterial({map:cloudTex,transparent:true,depthWrite:false,fog:false,opacity:.8}));
  const a=i/10*Math.PI*2+rnd(); m.position.set(Math.cos(a)*95,28+rnd()*22,Math.sin(a)*95); m.lookAt(0,12,0); scene.add(m); clouds.push(m); }
let envNow={glow:0,bird:1,sat:1,sun:.7};
function envTo(name, dur=2.5){ const b=ENV[name]; const a={ top:skyMat.uniforms.top.value.clone(), bot:skyMat.uniforms.bot.value.clone(), fog:scene.fog.color.clone(), tint:GR.uTint.value.clone(), sat:GR.uSat.value, glow:envNow.glow, bird:envNow.bird, night:GR.uNight.value, sun:envNow.sun };
  const bt=new THREE.Color(b.top), bb=new THREE.Color(b.bot), bf=new THREE.Color(b.fog), bti=new THREE.Color(...b.tint);
  return tween(dur,k=>{ skyMat.uniforms.top.value.copy(a.top).lerp(bt,k); skyMat.uniforms.bot.value.copy(a.bot).lerp(bb,k); scene.fog.color.copy(a.fog).lerp(bf,k);
    GR.uTint.value.copy(a.tint).lerp(bti,k); GR.uSat.value=a.sat+(b.sat-a.sat)*k; envNow.sat=GR.uSat.value; envNow.glow=a.glow+(b.glow-a.glow)*k; envNow.bird=a.bird+(b.bird-a.bird)*k; GR.uNight.value=a.night+(b.night-a.night)*k; envNow.sun=a.sun+(b.sun-a.sun)*k;
    const gy=1-clamp(envNow.sat,0,1); scene.fog.near=22-12*gy; scene.fog.far=85-40*gy; for(const c of clouds) c.material.opacity=.8*(1-gy*.6); },{ease:'inOut'}); }

/* ---------------- TOWN (Blender bake) ---------------- */
const town=new THREE.Group(); scene.add(town); const T={}; let META={houses:[]};
const paving = canvasTex(1024,1024,(g,w,h)=>{ g.fillStyle='#8f8676'; g.fillRect(0,0,w,h); let y=0; while(y<h){ const rh=70+rnd()*40; let x=-rnd()*60; while(x<w){ const rw=90+rnd()*120; const v=178+rnd()*46|0; g.fillStyle=`rgb(${v+14},${v+2},${v-22})`; const pad=3; g.beginPath(); g.roundRect(x+pad,y+pad,rw-pad*2,rh-pad*2,7); g.fill();
      const gr=g.createLinearGradient(0,y,0,y+rh); gr.addColorStop(0,'rgba(255,255,255,.10)'); gr.addColorStop(1,'rgba(60,40,20,.14)'); g.fillStyle=gr; g.fill(); x+=rw; } y+=rh; }
  for(let i=0;i<16000;i++){ g.fillStyle=`rgba(${rnd()<.5?40:255},${rnd()<.5?30:250},${rnd()<.5?20:235},${rnd()*.07})`; g.fillRect(rnd()*w,rnd()*h,1+rnd()*2.5,1+rnd()*2.5); }
  for(let i=0;i<26;i++){ g.strokeStyle='rgba(50,40,30,.25)'; g.lineWidth=1; g.beginPath(); let x=rnd()*w,yy=rnd()*h; g.moveTo(x,yy); for(let k=0;k<5;k++){ x+=rnd()*30-15; yy+=rnd()*30-15; g.lineTo(x,yy);} g.stroke(); } },[20,20]);
{ const geo=new THREE.PlaneGeometry(90,90,1,1); geo.rotateX(-Math.PI/2); const pos=geo.attributes.position; const uv1=new Float32Array(pos.count*2);
  for(let i=0;i<pos.count;i++){ uv1[i*2]=(pos.getX(i)+45)/90; uv1[i*2+1]=(-pos.getZ(i)+45)/90; } geo.setAttribute('uv1',new THREE.BufferAttribute(uv1,2));
  const lm=loader.load('bake/ground.jpg'); lm.colorSpace=THREE.SRGBColorSpace; lm.channel=1; const lmn=loader.load('bake/ground_n.jpg'); lmn.colorSpace=THREE.SRGBColorSpace;
  const pav=loader.load('img/paving.jpg'); pav.colorSpace=THREE.SRGBColorSpace; pav.wrapS=pav.wrapT=THREE.RepeatWrapping; pav.repeat.set(34,34); pav.anisotropy=8;
  const ground=new THREE.Mesh(geo, graded(new THREE.MeshBasicMaterial({map:pav,lightMap:lm,lightMapIntensity:2.3}),lmn,true)); town.add(ground);
  const far=new THREE.Mesh(new THREE.CircleGeometry(170,40).rotateX(-Math.PI/2), graded(new THREE.MeshBasicMaterial({color:0xc9b48e}))); far.position.y=-.05; town.add(far); }
const houseFront=(i,off=.35,side=0,y=0)=>{ const h=META.houses[i]; const a=h[0]*Math.PI/180, d=h[1]-off; return V3(Math.sin(a)*d+Math.cos(a)*side, y, -Math.cos(a)*d+Math.sin(a)*side); };
const townReady = Promise.all([ fetch('bake/meta.json').then(r=>r.json()).then(j=>META=j), new Promise((res,rej)=>new GLTFLoader().load('bake/town.glb',res,undefined,rej)) ]).then(([_,gltf])=>{
  const mats={ nearA:graded(new THREE.MeshBasicMaterial({map:baked('nearA'),side:THREE.DoubleSide}),baked('nearA_n')), nearB:graded(new THREE.MeshBasicMaterial({map:baked('nearB'),side:THREE.DoubleSide}),baked('nearB_n')),
    far:graded(new THREE.MeshBasicMaterial({map:baked('far')}),baked('far_n')), rc:graded(new THREE.MeshBasicMaterial({map:baked('rc')}),baked('rc_n')) };
  gltf.scene.traverse(o=>{ if(o.isMesh){ T[o.name]=o; o.material=mats[o.name]||mats.rc; } });
  town.add(gltf.scene); for(const n of ['rc_base','rc_walls','rc_doorL','rc_doorR','rc_deco']) T[n].visible=false;
  buildWorldProps(); });

/* ---------------- WORLD PROPS (need META) ---------------- */
const W={ houseGlow:[], rcGlow:[], orgSigns:[], booths:[] };
function buildWorldProps(){
  META.houses.forEach((h,i)=>{ for(let k=0;k<3;k++){ const s=glow(2.2+rnd()*1.4,0xffc070); s.position.copy(houseFront(i,.1,(k-1)*2.1,2+((k+i)%2)*2.3)); town.add(s); W.houseGlow.push(s); } });
  const signTex=canvasTex(512,128,(g,w,h)=>{ g.fillStyle='#211D70'; g.fillRect(0,0,w,h); g.strokeStyle='#FED60E'; g.lineWidth=8; g.strokeRect(6,6,w-12,h-12); g.fillStyle='#fff'; g.font='900 64px Cairo'; g.textAlign='center'; g.textBaseline='middle'; g.direction='rtl'; g.fillText('الجمعية الأهلية',w/2,h/2+4); });
  W.assocSign=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.65),graded(new THREE.MeshBasicMaterial({map:signTex}))); W.assocSign.position.copy(houseFront(4,.45,-2.3,2.7)); W.assocSign.lookAt(0,2.7,0); town.add(W.assocSign); W.assocSign.visible=false;
  W.board=new THREE.Group(); W.board.position.copy(houseFront(4,.5,2.3,0)); W.board.lookAt(0,0,0); const bm=new THREE.MeshStandardMaterial({map:woodTex,roughness:.8});
  const b1=new THREE.Mesh(new THREE.BoxGeometry(1.9,1.3,.08),bm); b1.position.y=1.75; W.board.add(b1); const b2=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.1,.02),new THREE.MeshStandardMaterial({color:0xc9a36a,roughness:1})); b2.position.set(0,1.75,.05); W.board.add(b2);
  for(const x of [-.75,.75]){ const l=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.2,8),bm); l.position.set(x,.6,0); W.board.add(l); } town.add(W.board); W.board.visible=false;
  const ORG=['k06','k14','k16','k13','k22','k28','k32','k07'];
  [1,2,3,4,5,6,7,8].forEach((hi,i)=>{ const s=sprite(ORG[i],1.5); s.position.copy(houseFront(hi,.5,(rnd()-.5)*2,3.6+rnd()*1.4)); s.lookAt(0,s.position.y,0); s.visible=false; town.add(s); W.orgSigns.push(s); });
  const fg=[], fc=[], fph=[]; const cols=[C.pink,C.teal,C.yel,C.white,C.navy].map(c=>new THREE.Color(c));
  const line=(a,b,sag,n)=>{ for(let i=0;i<=n;i++){ const t=i/n; const p=V3().lerpVectors(a,b,t); p.y-=Math.sin(t*Math.PI)*sag; const dir=V3().subVectors(b,a).normalize().multiplyScalar(.24); const c=cols[i%5];
      fg.push(p.x-dir.x,p.y,p.z-dir.z, p.x+dir.x,p.y,p.z+dir.z, p.x,p.y-.55,p.z); for(let k=0;k<3;k++){ fc.push(c.r,c.g,c.b); fph.push(k===2?1:0); } } };
  const tp=i=>houseFront(i,.4,0,6.2); line(tp(2),tp(5),1.3,22); line(tp(4),tp(7),1.3,22); line(tp(3),tp(6),1.8,24); line(tp(1),tp(8),2.4,30); line(tp(4),tp(5),.9,16);
  const fgeo=new THREE.BufferGeometry(); fgeo.setAttribute('position',new THREE.Float32BufferAttribute(fg,3)); fgeo.setAttribute('color',new THREE.Float32BufferAttribute(fc,3)); fgeo.setAttribute('aW',new THREE.Float32BufferAttribute(fph,1));
  W.flagMat=new THREE.ShaderMaterial({ side:THREE.DoubleSide, uniforms:{uT:{value:0},uShow:{value:0}}, vertexShader:'attribute vec3 color; attribute float aW; uniform float uT; uniform float uShow; varying vec3 vc; void main(){ vc=color; vec3 p=position; p.x+=sin(uT*3.0+p.z*1.7+p.x)*.12*aW; p.z+=cos(uT*2.6+p.x*1.3)*.12*aW; p.y=mix(p.y+14.0,p.y,uShow); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }', fragmentShader:'varying vec3 vc; void main(){ gl_FragColor=vec4(vc,1.0); }' });
  W.bunting=new THREE.Mesh(fgeo,W.flagMat); W.bunting.frustumCulled=false; W.bunting.visible=false; town.add(W.bunting);
  for(const x of [-3.6,0,3.6]){ const s=glow(5.5,0xffd27a); s.position.set(x,2.6,-10.3); town.add(s); W.rcGlow.push(s); }
  { const cv=document.createElement('canvas'); cv.width=2048; cv.height=290; const g=cv.getContext('2d'); const tx=new THREE.CanvasTexture(cv); tx.colorSpace=THREE.SRGBColorSpace; tx.anisotropy=8;
    const im1=new Image(), im2=new Image(); let nl=0;
    const draw=()=>{ g.fillStyle='#211D70'; g.fillRect(0,0,2048,290); for(const x0 of [0,2048-435]) for(let i=0;i<3;i++) for(let j=0;j<2;j++){ const c=RCC[(i*5+j*3+(x0?4:0))%RCC.length]; rcTile(g,x0+i*145,j*145,145,c[0],c[1],c[2],(i+j)%4); }
      if(nl>=2){ g.drawImage(im1,560,35,220,220); const h2=236, w2=h2*im2.naturalWidth/im2.naturalHeight; g.drawImage(im2,800,27,w2,h2); }
      g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(1080,50,4,190); g.fillStyle='#FED60E'; g.font='900 104px Cairo'; g.textAlign='left'; g.textBaseline='alphabetic'; g.direction='rtl'; g.textAlign='center'; g.fillText('المرحلة 3',1300,150);
      g.direction='ltr'; g.fillStyle='#fff'; g.font='700 50px Cairo'; g.fillText('PHASE III',1300,222); tx.needsUpdate=true; };
    im1.onload=im2.onload=()=>{ nl++; draw(); }; im1.src='img/lin_mark.png'; im2.src='img/lin_text.png'; draw();
    W.rcLogo=new THREE.Mesh(new THREE.PlaneGeometry(10.6,1.5),graded(new THREE.MeshBasicMaterial({map:tx,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8}))); W.rcLogo.position.set(0,6.9,-10.53); W.rcLogo.visible=false; town.add(W.rcLogo); W.rcBand=new THREE.Group(); town.add(W.rcBand); }
  W.lampGlow=(META.lamps||[]).map(l=>{ const sp=glow(2.6,0xffc880); sp.position.set(l[0],l[2],-l[1]); town.add(sp); return sp; });
  W.ring=new THREE.Mesh(new THREE.RingGeometry(3.7,4.25,72,1),graded(new THREE.MeshBasicMaterial({map:texPattern(48,1),transparent:true,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8}))); W.ring.rotation.x=-Math.PI/2; W.ring.position.y=.05; W.ring.visible=false; town.add(W.ring);
  { const uv=W.ring.geometry.attributes.uv, pos=W.ring.geometry.attributes.position; for(let i=0;i<uv.count;i++){ const x=pos.getX(i),y=pos.getY(i); uv.setXY(i,Math.atan2(y,x)/(Math.PI*2)+.5,(Math.hypot(x,y)-3.7)/.55); } uv.needsUpdate=true; }
}
/* people: generated, rigged, animated characters */
const NP=12; const people=[]; const mixers=[];
const OBST=[[0,-5.2,2.7],[3.4,-3.4,1.4],[-3.4,-3.4,1.4],[-4.8,-6.6,2.1],[4.8,-6.8,2.1],[-7.2,-2.3,2.1],[-6,-8,.8],[6.5,-7.5,.8],[-9.2,2,.8],[9.6,1,.8],[-4.5,9,.8],[5,9.5,.8],[0,-.5,2.6],[0,-13.5,6.4],[-4.2,-12.2,3],[4.2,-12.2,3]];
const isFree=(x,z,pad=.45)=>{ if(Math.hypot(x,z)>11.6) return false; for(const o of OBST) if(Math.hypot(x-o[0],z-o[1])<o[2]+pad) return false; return true; };
const segFree=(ax,az,bx,bz)=>{ const n=Math.ceil(Math.hypot(bx-ax,bz-az)/.5); for(let i=1;i<=n;i++){ const t=i/n; if(!isFree(ax+(bx-ax)*t,az+(bz-az)*t)) return false; } return true; };
function freeSpot(){ for(let k=0;k<60;k++){ const a=rnd()*Math.PI*2, r=3.4+rnd()*8; const x=Math.sin(a)*r, z=-Math.cos(a)*r; if(isFree(x,z,.7)) return [x,z]; } return [8,6]; }
function newTarget(p){ for(let k=0;k<30;k++){ const t=freeSpot(); const d=Math.hypot(t[0]-p.x,t[1]-p.z); if(d>3&&segFree(p.x,p.z,t[0],t[1])){ p.tx=t[0]; p.tz=t[1]; return; } } p.tx=p.x; p.tz=p.z; p.rest=2; }
const peopleReady=(async()=>{ await townReady; const L=new GLTFLoader(); const files=['elder','woman1','man1','woman2']; const G=await Promise.all(files.map(f=>L.loadAsync('ppl/'+f+'.glb')));
  const find=(re)=>{ for(const g of G) for(const c of g.animations) if(re.test(c.name)) return c; return null; };
  const strip=c=>{ if(!c) return null; const k=c.clone(); k.tracks=k.tracks.filter(t=>!/Hips\.position$/.test(t.name)); return k; };
  const idle=strip(find(/idle/i)), walkA=strip(find(/casual/i)||find(/walk/i)), walkB=strip(find(/woman/i)||find(/walk/i));
  const mats=G.map(g=>{ let map=null; g.scene.traverse(o=>{ if(o.isMesh&&o.material.map) map=o.material.map; }); return graded(new THREE.MeshLambertMaterial({map})); });
  (META.lamps||[]).forEach(l=>OBST.push([l[0],-l[1]-.0,.6]));
  for(let i=0;i<NP;i++){ const ci=i%4; const o=SkeletonUtils.clone(G[ci].scene); o.traverse(m=>{ if(m.isMesh){ m.material=mats[ci]; m.frustumCulled=false; } });
    const walker=i%3!==2; const mixer=new THREE.AnimationMixer(o); const clip=walker?((ci===1||ci===3)?walkB:walkA):idle; const v=.75+rnd()*.35;
    if(clip){ const act=mixer.clipAction(clip); act.play(); act.time=rnd()*clip.duration; mixer.timeScale=walker?v/1.05:1; }
    const sp=freeSpot(); const p={o,mixer,walker,x:sp[0],z:sp[1],tx:sp[0],tz:sp[1],yaw:rnd()*6,v,h:.96+rnd()*.1,s:0,target:0,rest:0,state:'out'};
    if(!walker) p.yaw=Math.atan2(-p.x,-p.z)+(rnd()-.5)*1.2; o.visible=false; scene.add(o); people.push(p); }
  showPeople(wantPeople); })().catch(e=>console.error('people',e));
let wantPeople=8;
const ALLEY=[-134,-103,-74,-48,48,74,103,134,165,-165].map(d=>d*Math.PI/180); const alleyPt=(a,r)=>[Math.sin(a)*r,-Math.cos(a)*r];
function enter(p){ const a=ALLEY[Math.floor(rnd()*ALLEY.length)]; const q=alleyPt(a,13.4), m=alleyPt(a,11.2); p.x=q[0]; p.z=q[1]; p.tx=m[0]; p.tz=m[1]; p.rest=0; p.state='in'; p.s=1; p.yaw=Math.atan2(-p.x,-p.z); }
function leave(p){ let best=ALLEY[0], bd=1e9; for(const a of ALLEY){ const m=alleyPt(a,11.2); const d=Math.hypot(m[0]-p.x,m[1]-p.z)+(segFree(p.x,p.z,m[0],m[1])?0:30); if(d<bd){ bd=d; best=a; } } const q=alleyPt(best,13.6); p.tx=q[0]; p.tz=q[1]; p.rest=0; p.state='leaving'; }
function updatePeople(dt,T_){ const calm=1-clamp(envNow.sat,0,1); for(const p of people){
    if(!p.walker){ p.s+=(p.target-p.s)*Math.min(1,dt*3); if(p.s<.02){ p.o.visible=false; continue; } }
    else { if(p.state==='out'){ p.o.visible=false; continue; }
      if(p.rest>0){ p.rest-=dt; if(p.rest<=0) newTarget(p); }
      else { const dx=p.tx-p.x, dz=p.tz-p.z, d=Math.hypot(dx,dz); if(d<.25){ if(p.state==='leaving'){ p.state='out'; p.o.visible=false; continue; } p.rest=.01+rnd()*1.5; }
        else { const st=p.v*(p.state==='leaving'?1.5:1-calm*.6)*dt; p.x+=dx/d*st; p.z+=dz/d*st; const ty=Math.atan2(dx,dz); let dy=ty-p.yaw; dy=Math.atan2(Math.sin(dy),Math.cos(dy)); p.yaw+=dy*Math.min(1,dt*5); } }
      p.s=1; }
    p.o.visible=true; p.mixer.update(dt*(p.walker&&p.rest>0?.0:1)*(p.state==='leaving'?1.4:1)); p.o.position.set(p.x,0,p.z); p.o.rotation.y=p.yaw; p.o.scale.setScalar(Math.max(1e-3,p.s*p.h)); } }
function showPeople(n){ wantPeople=n; const k=Math.round(n/34*NP); people.forEach((p,i)=>{ const on=i<k; p.target=on?1:0; if(!p.walker) return; if(on){ if(p.state==='out') enter(p); else if(p.state==='leaving'){ p.state='in'; newTarget(p); } } else if(p.state==='in') leave(p); }); }
/* birds */
const birds=[]; { const wg=new THREE.BufferGeometry(); wg.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.12, .55,0,-.05, 0,0,.12],3)); const bmat=new THREE.MeshBasicMaterial({color:0x2a2a33,side:THREE.DoubleSide,transparent:true});
  for(let i=0;i<12;i++){ const g=new THREE.Group(); const l=new THREE.Mesh(wg,bmat), r=new THREE.Mesh(wg,bmat); r.scale.x=-1; g.add(l,r); g.userData={l,r,rad:9+rnd()*10,h:9+rnd()*7,sp:.12+rnd()*.1,ph:rnd()*6,cx:rnd()*8-4,cz:-6+rnd()*6}; scene.add(g); birds.push(g); } W.birdMat=bmat; }
/* particles */
const NPT=900; const PT={ pos:new Float32Array(NPT*3), col:new Float32Array(NPT*3), vel:new Float32Array(NPT*3), life:new Float32Array(NPT), grav:new Float32Array(NPT), i:0 };
const ptGeo=new THREE.BufferGeometry(); ptGeo.setAttribute('position',new THREE.BufferAttribute(PT.pos,3)); ptGeo.setAttribute('color',new THREE.BufferAttribute(PT.col,3));
const points=new THREE.Points(ptGeo,new THREE.PointsMaterial({size:.07,vertexColors:true,transparent:true,depthWrite:false,sizeAttenuation:true,fog:false})); points.frustumCulled=false; scene.add(points); PT.pos.fill(-999);
const _c=new THREE.Color();
function burst(p, n, o={}){ const cols=o.colors||[C.pink,C.teal,C.yel,C.white]; for(let k=0;k<n;k++){ const i=PT.i=(PT.i+1)%NPT; const sp=(o.speed||3)*(.4+rnd()); const a=rnd()*Math.PI*2, e=(o.up??.6)+rnd()*.8;
    PT.pos[i*3]=p.x; PT.pos[i*3+1]=p.y; PT.pos[i*3+2]=p.z; PT.vel[i*3]=Math.cos(a)*Math.cos(e)*sp; PT.vel[i*3+1]=Math.sin(e)*sp; PT.vel[i*3+2]=Math.sin(a)*Math.cos(e)*sp; PT.life[i]=(o.life||1.6)*(.6+rnd()*.6); PT.grav[i]=o.grav??4;
    _c.setHex(cols[Math.floor(rnd()*cols.length)]); PT.col[i*3]=_c.r; PT.col[i*3+1]=_c.g; PT.col[i*3+2]=_c.b; } }
function updateParticles(dt){ for(let i=0;i<NPT;i++){ if(PT.life[i]<=0) continue; PT.life[i]-=dt; if(PT.life[i]<=0){ PT.pos[i*3+1]=-999; continue; } PT.vel[i*3+1]-=PT.grav[i]*dt; PT.vel[i*3]*=.985; PT.vel[i*3+2]*=.985;
    PT.pos[i*3]+=PT.vel[i*3]*dt; PT.pos[i*3+1]+=PT.vel[i*3+1]*dt; PT.pos[i*3+2]+=PT.vel[i*3+2]*dt; if(PT.pos[i*3+1]<.03){ PT.pos[i*3+1]=.03; PT.vel[i*3+1]=0; PT.vel[i*3]*=.8; PT.vel[i*3+2]*=.8; } } ptGeo.attributes.position.needsUpdate=true; ptGeo.attributes.color.needsUpdate=true; }

/* ---------------- LIGHT FX: sun glare, god rays, dust, fountain ---------------- */
const SUN=V3(-.62,.5,.6).normalize(); const FX={};
{ FX.glare=glow(70,0xfff2d0); FX.glare.position.copy(SUN).multiplyScalar(160); scene.add(FX.glare);
  const rt=canvasTex(64,256,(g)=>{ const a=g.createLinearGradient(0,0,64,0); a.addColorStop(0,'rgba(255,240,200,0)'); a.addColorStop(.5,'rgba(255,240,200,1)'); a.addColorStop(1,'rgba(255,240,200,0)'); g.fillStyle=a; g.fillRect(0,0,64,256);
    g.globalCompositeOperation='destination-in'; const b=g.createLinearGradient(0,0,0,256); b.addColorStop(0,'rgba(0,0,0,0)'); b.addColorStop(.25,'rgba(0,0,0,1)'); b.addColorStop(.8,'rgba(0,0,0,.6)'); b.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=b; g.fillRect(0,0,64,256); });
  FX.rays=[]; const up=V3(0,1,0); for(let i=0;i<7;i++){ const m=new THREE.Mesh(new THREE.PlaneGeometry(1.4+rnd()*2.2,30),new THREE.MeshBasicMaterial({map:rt,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,side:THREE.DoubleSide,opacity:0}));
    const gx=-7+i*2.3+rnd(), gz=-9+rnd()*7; m.position.set(gx,0,gz).addScaledVector(SUN,13); m.quaternion.setFromUnitVectors(up,SUN); m.rotateY(rnd()*3); m.userData.ph=rnd()*6; m.renderOrder=5; scene.add(m); FX.rays.push(m); }
  const N=140, dp=new Float32Array(N*3); for(let i=0;i<N;i++){ dp[i*3]=rnd()*9-4.5; dp[i*3+1]=.3+rnd()*2.8; dp[i*3+2]=rnd()*9-6; } const dg=new THREE.BufferGeometry(); dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
  FX.dust=new THREE.Points(dg,new THREE.PointsMaterial({size:.014,color:0xfff0c8,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})); FX.dust.frustumCulled=false; scene.add(FX.dust); FX.acc=0; }
function updateFX(dt,T_){ const sn=envNow.sun; const nk=1-GR.uNight.value*.62; hemi.intensity=1.1*nk; dl.intensity=1.6*nk*(.35+.65*sn); scene.environmentIntensity=.55*nk; FX.glare.material.opacity=sn*.85; for(const r of FX.rays) r.material.opacity=sn*(.05+.035*Math.sin(T_*.5+r.userData.ph));
  FX.dust.material.opacity=sn*.55; const p=FX.dust.geometry.attributes.position; for(let i=0;i<p.count;i++){ let y=p.getY(i)+dt*.03*(1+(i%5)*.3); if(y>3.2) y=.3; p.setY(i,y); p.setX(i,p.getX(i)+Math.sin(T_*.4+i)*dt*.02); } p.needsUpdate=true;
  if(envNow.sat>.4){ FX.acc+=dt; if(FX.acc>.09){ FX.acc=0; burst(V3(0,2.62,-5.2),5,{colors:[0xbfe8f2,0xffffff,0x9fd8e8],speed:1.5,up:.9,grav:6,life:.8}); } }
  if(W.lampGlow) for(const l of W.lampGlow) l.material.opacity=clamp(GR.uNight.value*1.1,0,.95); }
/* ---------------- AUDIO ---------------- */
const AUD={}; ['m_roots','m_quiet','m_joy','m_hope','a_market','a_wind'].forEach(n=>{ const a=new Audio('aud/'+n+'.mp3'); a.loop=true; a.volume=0; AUD[n]={a,v:0,t:0}; });
function setMusic(m, amb){ for(const k in AUD) AUD[k].t=0; if(AUD['m_'+m]) AUD['m_'+m].t=.5; if(AUD['a_'+amb]) AUD['a_'+amb].t=amb==='wind'?.55:.28; }
function updateAudio(dt){ for(const k in AUD){ const o=AUD[k]; o.v+=(o.t-o.v)*Math.min(1,dt*.8); const v=clamp(o.v,0,1); if(Math.abs(o.a.volume-v)>.004) o.a.volume=v; } }
const sfxPool={}; function sfx(n,v=.7){ try{ const a=(sfxPool[n]=sfxPool[n]||[]).find(x=>x.paused||x.ended)||(()=>{ const x=new Audio('aud/'+n+'.mp3'); sfxPool[n].push(x); return x; })(); a.volume=v; a.currentTime=0; a.play().catch(()=>{}); }catch(e){} }

/* ---------------- STAGE ---------------- */
const stage=new THREE.Group(); scene.add(stage);
const std=(color,o={})=>new THREE.MeshStandardMaterial({color,roughness:.6,metalness:0,...o});
const brass=std(0xd9a441,{metalness:1,roughness:.28}), darkM=std(0x17134A,{roughness:.5}), navyM=std(C.navy,{roughness:.45});
const table=new THREE.Group(); table.position.set(0,0,-.72); stage.add(table); const TY=.95;
{ const top=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.045,48),std(0xffffff,{map:woodTex,roughness:.55})); top.position.y=TY-.0225; table.add(top);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(.505,.505,.075,48,1,true),new THREE.MeshBasicMaterial({map:texPattern(24,1)})); rim.position.y=TY-.045; table.add(rim);
  const leg=new THREE.Mesh(new THREE.CylinderGeometry(.05,.08,TY-.08,12),darkM); leg.position.y=(TY-.08)/2; table.add(leg); const foot=new THREE.Mesh(new THREE.CylinderGeometry(.3,.34,.04,24),darkM); foot.position.y=.02; table.add(foot);
  const sh=new THREE.Mesh(new THREE.CircleGeometry(.62,24),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.28,depthWrite:false})); sh.rotation.x=-Math.PI/2; sh.position.y=.012; table.add(sh); }
const SL=[[-.3,-.52],[0,-.44],[.3,-.52],[-.2,-.8],[.2,-.8],[0,-.92]].map(p=>V3(p[0],TY,p[1]));
const post=new THREE.Group(); post.position.set(.52,0,-.34); stage.add(post);
{ const p=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,1.0,12),darkM); p.position.y=.5; post.add(p); const cap=new THREE.Mesh(new THREE.CylinderGeometry(.13,.11,.05,28),navyM); cap.position.y=1.0; post.add(cap); }
const nextBtn=new THREE.Group(); nextBtn.position.set(0,1.05,0); post.add(nextBtn);
const nb=new THREE.Mesh(new THREE.CylinderGeometry(.085,.095,.05,28),std(C.yel,{emissive:C.yel,emissiveIntensity:.35,roughness:.35})); nextBtn.add(nb);
{ const arrowTex=canvasTex(128,128,(g)=>{ g.strokeStyle='#211D70'; g.lineWidth=16; g.lineCap='round'; g.lineJoin='round'; g.beginPath(); g.moveTo(44,30); g.lineTo(84,64); g.lineTo(44,98); g.stroke(); });
  const arr=new THREE.Mesh(new THREE.PlaneGeometry(.1,.1),new THREE.MeshBasicMaterial({map:arrowTex,transparent:true})); arr.rotation.x=-Math.PI/2; arr.position.y=.027; nextBtn.add(arr); } nextBtn.visible=false;
const PW=1024, PH=600; const pcan=document.createElement('canvas'); pcan.width=PW; pcan.height=PH; const pg=pcan.getContext('2d');
const ptex=new THREE.CanvasTexture(pcan); ptex.colorSpace=THREE.SRGBColorSpace; ptex.anisotropy=8;
const panel=new THREE.Mesh(new THREE.PlaneGeometry(2.1,2.1*PH/PW),new THREE.MeshBasicMaterial({map:ptex,transparent:true,fog:false,toneMapped:false})); panel.position.set(1.65,1.85,-2.0); panel.rotation.y=-.68; stage.add(panel);
function rr(g,x,y,w,h,r){ g.beginPath(); g.roundRect(x,y,w,h,r); }
function wrap(g,text,maxW){ const words=text.split(' '); const lines=[]; let cur=''; for(const w of words){ const t=cur?cur+' '+w:w; if(g.measureText(t).width>maxW&&cur){ lines.push(cur); cur=w; } else cur=t; } if(cur) lines.push(cur); return lines; }
function drawPanel(e0, idx, taskText, done){ const g=pg; const en=LANG==='en'; const e=en?e0.E:e0; g.clearRect(0,0,PW,PH); g.direction=en?'ltr':'rtl';
  g.fillStyle='rgba(33,29,112,.95)'; rr(g,10,34,PW-20,PH-44,44); g.fill(); g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=5; g.stroke();
  g.font='900 34px Cairo'; const tw=g.measureText(e.tag).width+56; const tx0=en?60:PW-60-tw; g.fillStyle=hex(C.pink); rr(g,tx0,6,tw,62,31); g.fill(); g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e.tag,tx0+tw/2,40);
  if(e.year){ g.direction=(en||/\d/.test(e.year))?'ltr':'rtl'; g.font='900 30px Cairo'; const yw=g.measureText(e.year).width+48; const yx=en?PW-60-yw:60; g.fillStyle=hex(C.yel); rr(g,yx,6,yw,62,31); g.fill(); g.fillStyle=hex(C.navy); g.fillText(e.year,yx+yw/2,40); g.direction=en?'ltr':'rtl'; }
  const ax=en?58:PW-58; g.textAlign=en?'left':'right'; g.textBaseline='alphabetic'; g.fillStyle=hex(C.yel); g.font=en?'900 68px Cairo':'900 78px Cairo'; g.fillText(e.title,ax,160);
  g.fillStyle='#fff'; g.font=en?'700 34px Cairo':'700 37px Cairo'; const lh=en?50:58; const lines=wrap(g,e.text,PW-116); lines.forEach((l,i)=>g.fillText(l,ax,228+i*lh));
  if(!en){ let y=228+lines.length*58+4; g.direction='ltr'; g.textAlign='left'; g.font='700 23px Cairo'; g.fillStyle='rgba(255,255,255,.62)'; wrap(g,e0.en,PW-116).forEach((l,i)=>g.fillText(l,58,y+i*30)); g.direction='rtl'; }
  g.fillStyle=done?hex(C.teal):'rgba(255,255,255,.12)'; rr(g,40,PH-104,PW-80,74,37); g.fill();
  g.fillStyle=done?'#fff':hex(C.yel); g.font=en?'900 30px Cairo':'900 33px Cairo'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(taskText,PW/2,PH-65);
  const n=ERAS.length; for(let i=0;i<n;i++){ const k=en?i:n-1-i; g.beginPath(); g.arc(PW/2+(k-n/2+.5)*30,PH-14,i===idx?9:6,0,7); g.fillStyle=i<idx?hex(C.teal):i===idx?hex(C.pink):'rgba(255,255,255,.35)'; g.fill(); }
  ptex.needsUpdate=true; }
function drawLangPanel(){ const g=pg; g.clearRect(0,0,PW,PH); g.fillStyle='rgba(33,29,112,.95)'; rr(g,10,34,PW-20,PH-44,44); g.fill(); g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=5; g.stroke();
  g.textAlign='center'; g.textBaseline='middle'; g.fillStyle=hex(C.yel); g.direction='rtl'; g.font='900 96px Cairo'; g.fillText('الميدان',PW/2,150); g.fillStyle='#fff'; g.font='700 44px Cairo'; g.fillText('اختر اللغة من الطاولة قدّامك',PW/2,290);
  g.direction='ltr'; g.font='700 38px Cairo'; g.fillStyle='rgba(255,255,255,.85)'; g.fillText('Choose your language on the table',PW/2,370);
  g.fillStyle=hex(C.pink); rr(g,PW/2-290,440,260,84,42); g.fill(); g.fillStyle=hex(C.teal); rr(g,PW/2+30,440,260,84,42); g.fill(); g.fillStyle='#fff'; g.font='900 42px Cairo'; g.fillText('English',PW/2+160,484); g.direction='rtl'; g.fillText('العربية',PW/2-160,484); ptex.needsUpdate=true; }
const guide=new THREE.Group(); guide.position.set(-1.5,-.28,.04); panel.add(guide); let guideSprite=null, guideName='';
function setGuide(name){ if(name===guideName) return; guideName=name; const old=guideSprite; if(old) hide(old).then(()=>guide.remove(old)); const s=sprite(name,.82,{fog:false}); guide.add(s); guideSprite=s; pop(s,1,.25); }
const hcan=document.createElement('canvas'); hcan.width=768; hcan.height=128; const hctx=hcan.getContext('2d'); const htex=new THREE.CanvasTexture(hcan); htex.colorSpace=THREE.SRGBColorSpace;
const hintM=new THREE.Mesh(new THREE.PlaneGeometry(.9,.15),new THREE.MeshBasicMaterial({map:htex,transparent:true,fog:false,depthTest:false,opacity:0})); hintM.position.set(0,1.42,-1.25); hintM.renderOrder=50; stage.add(hintM);
function hint(t){ hctx.clearRect(0,0,768,128); hctx.fillStyle='rgba(225,20,141,.95)'; hctx.beginPath(); hctx.roundRect(4,14,760,100,50); hctx.fill(); hctx.fillStyle='#fff'; hctx.font='900 54px Cairo'; hctx.textAlign='center'; hctx.textBaseline='middle'; hctx.direction='rtl'; hctx.fillText(t,384,66); htex.needsUpdate=true;
  hintM.userData.id=(hintM.userData.id||0)+1; const id=hintM.userData.id; tween(.25,k=>hintM.material.opacity=k).then(()=>wait(1.8)).then(()=>{ if(hintM.userData.id===id) tween(.4,k=>hintM.material.opacity=1-k); }); }

/* ---------------- GRAB SYSTEM ---------------- */
const grabs=[]; const bodies=[]; const eraObjs=[];
function spawn(obj, parent=scene){ parent.add(obj); eraObjs.push(obj); return obj; }
function addGrab(obj, o={}){ const g={ obj, r:o.r||.09, alive:true, held:null, home:obj.position.clone(), ...o }; obj.userData.grab=g; grabs.push(g); return g; }
function respawn(g){ if(!g.alive) return; g.obj.position.copy(g.home); g.obj.rotation.set(0,0,0); pop(g.obj,1,0,.35); }
function consume(g){ g.alive=false; if(g.held){ g.held.held=null; g.held=null; } }
const inputs=[]; const tmpV=V3(), tmpV2=V3();
function haptic(inp, s=.6, ms=50){ try{ const gp=inp&&inp.src&&inp.src.gamepad; if(gp&&gp.hapticActuators&&gp.hapticActuators[0]) gp.hapticActuators[0].pulse(s,ms); }catch(e){} }
function nearestGrab(p, extra=.07){ let best=null, bd=1e9; for(const g of grabs){ if(!g.alive||g.held) continue; g.obj.getWorldPosition(tmpV2); const d=tmpV2.distanceTo(p)-g.r; if(d<extra&&d<bd){ bd=d; best=g; } } return best; }
const _q2=new THREE.Quaternion();
function setQOff(inp,g){ g.obj.getWorldQuaternion(_q2); g.qOff=inp.quat.clone().invert().multiply(_q2); }
function startGrab(inp, g){ if(!g||!g.alive||g.held||inp.held) return; g.held=inp; inp.held=g; setQOff(inp,g); haptic(inp,.5,40); sfx('pop',.35); g.onGrab&&g.onGrab(inp); }
function endGrab(inp){ const g=inp.held; if(!g) return; inp.held=null; g.held=null; if(!g.alive) return; if(g.onRelease&&g.onRelease(inp)) return; if(g.fixed) return;
  const v=inp.vel.clone().multiplyScalar(g.throwBoost||1.25); if(v.length()>9) v.setLength(9); bodies.push({g, vel:v, t:0}); }
const ray=new THREE.Raycaster();
function rayTargets(){ const t=[]; for(const g of grabs) if(g.alive&&!g.held) t.push(g.obj); if(nextBtn.visible) t.push(nextBtn); for(const p of pokes) t.push(p.obj); return t; }
function ownerOf(o){ while(o){ if(o===nextBtn) return {next:true}; if(o.userData&&o.userData.poke) return {poke:o.userData.poke}; if(o.userData&&o.userData.grab) return {g:o.userData.grab}; o=o.parent; } return null; }
function pressNext(){ if(busy||!nextBtn.visible) return; nb.position.y=-.02; tween(.25,t=>nb.position.y=-.02*(1-t)); sfx('pop',.7); if(done) return restart(); gotoEra(eraIdx+1); }
function onPress(inp){ inp.down=true; if(busy) return; const g=nearestGrab(inp.pos); if(g){ startGrab(inp,g); return; }
  inp.ctrl.getWorldPosition(tmpV); inp.ctrl.getWorldDirection(tmpV2).negate(); ray.set(tmpV,tmpV2); ray.far=7; const hits=ray.intersectObjects(rayTargets(),true); if(!hits.length) return; const o=ownerOf(hits[0].object); if(!o) return;
  if(o.poke) return o.poke.fn();
  if(o.next) return pressNext(); const gg=o.g; if(gg.fixed){ gg.auto&&gg.auto(); return; }
  gg.held=inp; inp.held=gg; const a=gg.obj.position.clone(); sfx('whoosh',.3); gg.pulling=true; tween(.22,k=>{ if(gg.held===inp) gg.obj.position.lerpVectors(a,inp.pos,k); }).then(()=>{ gg.pulling=false; if(gg.held===inp){ setQOff(inp,gg); haptic(inp,.5,40); gg.onGrab&&gg.onGrab(inp); if(!inp.down) endGrab(inp); } }); }
function onRelease(inp){ inp.down=false; if(inp.held&&!inp.held.pulling) endGrab(inp); }
const lineGeo=new THREE.BufferGeometry().setFromPoints([V3(0,0,0),V3(0,0,-1)]);
for(let i=0;i<2;i++){ const ctrl=renderer.xr.getController(i), grip=renderer.xr.getControllerGrip(i), hand=renderer.xr.getHand(i);
  const inp={ i, ctrl, grip, hand, held:null, down:false, pos:V3(), prev:V3(), vel:V3(), quat:new THREE.Quaternion(), src:null, active:false }; inputs.push(inp);
  const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:C.yel,transparent:true,opacity:.55})); line.scale.z=1.6; ctrl.add(line); inp.line=line;
  ctrl.addEventListener('connected',e=>{ inp.src=e.data; inp.active=true; }); ctrl.addEventListener('disconnected',()=>{ inp.active=false; if(inp.held) endGrab(inp); });
  for(const ev of ['selectstart','squeezestart']) ctrl.addEventListener(ev,()=>onPress(inp)); for(const ev of ['selectend','squeezeend']) ctrl.addEventListener(ev,()=>onRelease(inp));
  const gm=new THREE.Group(); const ball=new THREE.Mesh(new THREE.SphereGeometry(.03,16,12),std(i?C.pink:C.teal,{roughness:.3})); const rg=new THREE.Mesh(new THREE.TorusGeometry(.045,.008,8,24),brass); gm.add(ball,rg); grip.add(gm); grip.userData.mesh=gm;
  hand.userData.col=i?C.pink:C.teal; rig.add(ctrl,grip,hand); }
const jointGeo=new THREE.SphereGeometry(.0085,8,6);
function updateInputs(dt){ for(const inp of inputs){ const h=inp.hand; let any=false; for(const name in h.joints){ const j=h.joints[name]; any=any||j.visible; if(!j.userData.m){ const tip=name.endsWith('tip'); const m=new THREE.Mesh(jointGeo,std(tip?C.yel:h.userData.col,{roughness:.35})); m.scale.setScalar(tip?1.5:1); j.add(m); j.userData.m=m; } }
    h.userData.active=any; inp.grip.userData.mesh.visible=!any; inp.prev.copy(inp.pos);
    const tip=h.joints['index-finger-tip'], th=h.joints['thumb-tip']; if(any&&tip){ tip.getWorldPosition(inp.pos); if(th){ th.getWorldPosition(tmpV); inp.pos.lerp(tmpV,.5); } } else inp.grip.getWorldPosition(inp.pos);
    const wr=h.joints['wrist']; if(any&&wr) wr.getWorldQuaternion(inp.quat); else inp.grip.getWorldQuaternion(inp.quat);
    if(dt>0){ tmpV.subVectors(inp.pos,inp.prev).divideScalar(dt); inp.vel.lerp(tmpV,.45); }
    const g=inp.held; if(g&&g.alive&&!g.pulling){ if(!g.fixed){ g.obj.position.lerp(inp.pos,.65); if(g.rot!==false&&g.qOff) g.obj.quaternion.copy(inp.quat).multiply(g.qOff); if(g.minY!==undefined) g.obj.position.y=Math.max(g.minY,g.obj.position.y); } g.onHold&&g.onHold(inp,dt); }
    inp.line.visible=inp.active&&!inp.held; } }
const lastTouch={t:0}; const pokes=[];
function checkTouchNext(T_){ if(T_-lastTouch.t<1.2) return; for(const inp of inputs){ if(!inp.active&&!inp.hand.userData.active) continue;
    if(nextBtn.visible&&!busy){ nextBtn.getWorldPosition(tmpV2); if(inp.pos.distanceTo(tmpV2)<.09){ lastTouch.t=T_; haptic(inp,.8,60); pressNext(); return; } }
    for(const p of pokes){ p.obj.getWorldPosition(tmpV2); if(inp.pos.distanceTo(tmpV2)<p.r){ lastTouch.t=T_; haptic(inp,.8,60); p.fn(); return; } } } }
const hoverFx=[0,1].map(()=>{ const sp=glow(.3,0xfff0b0); sp.renderOrder=40; sp.material.depthTest=false; scene.add(sp); return sp; });
function updateHover(dt){ inputs.forEach((inp,i)=>{ const sp=hoverFx[i]; let g=null; if(renderer.xr.isPresenting&&!inp.held&&!busy&&(inp.active||inp.hand.userData.active)) g=nearestGrab(inp.pos,.09);
    if(g!==inp.hover){ inp.hover=g; if(g) haptic(inp,.2,12); } const t=g?.75:0; sp.material.opacity+=(t-sp.material.opacity)*Math.min(1,dt*12); if(g){ g.obj.getWorldPosition(sp.position); sp.scale.setScalar(g.r*4.2); } }); }
function updateBodies(dt){ for(let i=bodies.length-1;i>=0;i--){ const b=bodies[i], g=b.g; if(!g.alive||g.held){ bodies.splice(i,1); continue; } b.t+=dt; b.vel.y-=9.8*dt; g.obj.position.addScaledVector(b.vel,dt); g.obj.rotation.x+=dt*4; g.obj.rotation.z+=dt*3;
    const p=g.obj.position; const onTable=Math.hypot(p.x,p.z+.72)<.5&&p.y<TY+.03&&p.y>TY-.1&&b.vel.y<0;
    if(onTable||p.y<.05||b.t>5){ bodies.splice(i,1); if(!onTable&&g.onLand&&g.onLand(p.clone())) continue; respawn(g); } } }
let drag=null, yaw=0, pitch=0; const mouse=new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY,moved:false}; });
addEventListener('pointermove',e=>{ if(!drag||renderer.xr.isPresenting) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; if(Math.abs(dx)+Math.abs(dy)>4) drag.moved=true; if(drag.moved){ yaw+=dx*.004; pitch=clamp(pitch+dy*.004,-1,1); drag.x=e.clientX; drag.y=e.clientY; camera.rotation.set(pitch,yaw,0,'YXZ'); } });
addEventListener('pointerup',e=>{ if(drag&&!drag.moved&&!renderer.xr.isPresenting&&!busy){ mouse.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1); ray.setFromCamera(mouse,camera); ray.far=9; const h=ray.intersectObjects(rayTargets(),true); if(h.length){ const o=ownerOf(h[0].object); if(o&&o.poke) o.poke.fn(); else if(o&&o.next) pressNext(); else if(o&&o.g&&o.g.auto) o.g.auto(); } } drag=null; });
function flyTo(obj, target, o={}){ const a=obj.position.clone(), b=target.clone(), s0=obj.scale.x, s1=o.scale??s0, lift=o.lift??.4; return tween(o.dur||.8,k=>{ obj.position.lerpVectors(a,b,k); obj.position.y+=Math.sin(k*Math.PI)*lift; obj.scale.setScalar(s0+(s1-s0)*k); },{ease:'inOut'}); }

/* ---------------- ERA FLOW ---------------- */
let eraIdx=-1, used=0, need=0, busy=false, done=false, autoBusy=false;
const era=()=>ERAS[eraIdx];
function taskLabel(e){ const t=LANG==='en'?e.E.task:e.task; if(!need) return t; return used>=need ? tr('تمام! اضغط الزر الأصفر على يمينك','Done! Press the yellow button on your right') : `${t}  (${used}/${need})`; }
function refreshPanel(){ drawPanel(era(),eraIdx,taskLabel(era()),need>0&&used>=need); }
function showNext(){ if(!nextBtn.visible){ pop(nextBtn,1,.3); sfx('chime',.5); } }
function progress(n=1){ used+=n; refreshPanel(); if(used>=need) showNext(); }
function clearEra(){ for(const g of grabs){ g.alive=false; if(g.held){ g.held.held=null; g.held=null; } } grabs.length=0; bodies.length=0; autoBusy=false; for(const o of eraObjs.splice(0)){ if(o.parent){ const p=o.parent; hide(o,.25).then(()=>p.remove(o)); } } }
const cleanupHooks=[]; const SETUP={};
async function gotoEra(i){ if(i>=ERAS.length) return finale(); busy=true; await townReady; eraIdx=i; const e=ERAS[i]; used=0; need=e.need; cleanupHooks.splice(0).forEach(f=>f());
  if(nextBtn.visible) hide(nextBtn); clearEra(); setGuide(e.guide); refreshPanel(); sfx('whoosh',.45); envTo(e.env); setMusic(e.music,e.amb); showPeople(e.people);
  await wait(.5); await SETUP[e.key](); if(!need) showNext(); busy=false; }

SETUP.intro=async()=>{ const b=new THREE.Mesh(new THREE.SphereGeometry(.055,24,18),std(C.teal,{emissive:C.teal,emissiveIntensity:.5,roughness:.3})); b.position.copy(SL[1]).add(V3(0,.06,0)); spawn(b); pop(b,1,.2);
  const ok=(p)=>{ if(used<need){ burst(p||b.position.clone(),40,{speed:3,up:.6,grav:5,life:1.4}); sfx('chime',.6); progress(); hint(tr('ممتاز! هكذا تمسك وترمي','Great! That is how you grab and throw')); } };
  const g=addGrab(b,{ r:.09, throwBoost:1.7, onLand:(p)=>{ ok(p); return false; }, auto:()=>{ if(bodies.some(x=>x.g===g)||g.held) return; bodies.push({g, vel:V3(-1.2,3.6,-3.2), t:0}); sfx('whoosh',.4); } }); };
function langButton(label, col, x, code){ const g=new THREE.Group(); g.position.set(x,TY+.03,-.56); const base=new THREE.Mesh(new THREE.CylinderGeometry(.115,.125,.05,36),std(col,{emissive:col,emissiveIntensity:.3,roughness:.35})); g.add(base);
  const t=canvasTex(512,512,(c)=>{ c.fillStyle='#fff'; c.font='900 '+(code==='ar'?170:128)+'px Cairo'; c.textAlign='center'; c.textBaseline='middle'; c.direction=code==='ar'?'rtl':'ltr'; c.fillText(label,256,262); });
  const top=new THREE.Mesh(new THREE.PlaneGeometry(.215,.215),new THREE.MeshBasicMaterial({map:t,transparent:true})); top.rotation.x=-Math.PI/2; top.position.y=.027; g.add(top);
  const gl=glow(.5,col); gl.material.opacity=.45; gl.position.y=.05; g.add(gl); g.userData.code=code; return g; }
let langResolve=null;
function chooseLang(){ busy=false; drawLangPanel(); if(!panel.visible||panel.scale.x<.9) pop(panel,1); guideName=''; setGuide('k03');
  const A=langButton('عربي',C.pink,-.2,'ar'), B=langButton('English',C.teal,.2,'en'); const btns=[A,B];
  return new Promise(res=>{ let picked=false; const pick=(code)=>{ if(picked) return; picked=true; LANG=code; sfx('chime',.7); pokes.length=0; const me=code==='ar'?A:B; burst(me.getWorldPosition(V3()),30,{speed:2,up:.8,grav:4,life:1.2}); btns.forEach(b=>hide(b,.3).then(()=>stage.remove(b))); langResolve=null; res(code); };
    btns.forEach((b,i)=>{ stage.add(b); pop(b,1,.15*i); const p={obj:b,r:.11,fn:()=>pick(b.userData.code)}; b.userData.poke=p; pokes.push(p); }); langResolve=pick; }); }
function restart(){ done=false; busy=true; hide(nextBtn); hide(endCard,.3).then(()=>{ endCard.clear(); endCard.scale.setScalar(1); });
  for(const n of ['rc_base','rc_walls','rc_doorL','rc_doorR','rc_deco']){ T[n].visible=false; T[n].scale.set(1,1,1); T[n].rotation.y=0; }
  W.rcLogo.visible=false; W.ring.visible=false; W.assocSign.visible=false; W.board.visible=false; W.orgSigns.forEach(o=>o.visible=false); W.bunting.visible=false; W.flagMat.uniforms.uShow.value=0;
  W.rcGlow.forEach(o=>o.userData.boost=0); W.houseGlow.forEach(o=>o.userData.boost=0); for(const b of W.booths.splice(0)){ town.remove(b); OBST.pop(); }
  if(mini){ stage.remove(mini); if(mini.userData.plate) stage.remove(mini.userData.plate); mini=null; }
  envTo('dawn',2); setMusic('roots','market'); showPeople(8); eraIdx=-1; wait(.6).then(()=>chooseLang()).then(()=>gotoEra(0)); }
/* 1 roots: candle + lanterns */
function makeLantern(){ const g=new THREE.Group(); const cage=new THREE.Mesh(new THREE.CylinderGeometry(.055,.045,.13,8,1,true),std(0xd9a441,{metalness:1,roughness:.3,side:THREE.DoubleSide,transparent:true,opacity:.55})); g.add(cage);
  const top=new THREE.Mesh(new THREE.ConeGeometry(.075,.06,8),brass); top.position.y=.095; g.add(top); const bot=new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,.02,8),brass); bot.position.y=-.075; g.add(bot);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.02,.005,6,14),brass); ring.position.y=.14; g.add(ring); const core=new THREE.Mesh(new THREE.SphereGeometry(.03,12,10),new THREE.MeshBasicMaterial({color:0x4a3a2a})); g.add(core);
  const gl=glow(.5); g.add(gl); const cord=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,.6,4),darkM); cord.position.y=.45; g.add(cord); g.userData={core,gl,lit:false}; return g; }
SETUP.roots=async()=>{ const Lp=[V3(-.48,1.5,-.62),V3(0,1.72,-.86),V3(.48,1.5,-.62)]; const lan=Lp.map((p,i)=>{ const l=makeLantern(); l.position.copy(p); spawn(l); pop(l,1,i*.12); return l; });
  const candle=new THREE.Group(); const dish=new THREE.Mesh(new THREE.CylinderGeometry(.045,.03,.012,16),brass); const wax=new THREE.Mesh(new THREE.CylinderGeometry(.014,.016,.11,10),std(0xf7efdc,{roughness:.5})); wax.position.y=.06;
  const flame=new THREE.Mesh(new THREE.SphereGeometry(.014,10,8),new THREE.MeshBasicMaterial({color:0xffd27a})); flame.scale.y=1.8; flame.position.y=.135; const fg=glow(.22); fg.material.opacity=.9; fg.position.y=.135; candle.add(dish,wax,flame,fg);
  candle.position.copy(SL[1]).add(V3(0,.01,0)); const cl=new THREE.PointLight(0xffb060,1.4,3,1.6); cl.position.y=.16; candle.add(cl); spawn(candle); pop(candle,1,.4);
  const targets=[3,4,5]; let n=0;
  const light=(l)=>{ if(l.userData.lit) return; l.userData.lit=true; l.userData.core.material.color.setHex(0xffe2a0); tween(.5,k=>l.userData.gl.material.opacity=k); sfx('chime',.6); const lp=l.position.clone(); burst(lp,18,{colors:[0xffd27a,0xfff0c0,0xffa040],speed:1.2,grav:.6,life:1.2});
    const hi=targets[n++]; const orb=glow(.5); orb.material.opacity=1; orb.position.copy(lp); spawn(orb); const tgt=houseFront(hi,.2,0,3); flyTo(orb,tgt,{dur:1.6,lift:2.5,scale:3}).then(()=>{ W.houseGlow.slice(hi*3,hi*3+3).forEach(s=>s.userData.boost=1); tween(.6,k=>orb.material.opacity=1-k); });
    progress(); };
  const g=addGrab(candle,{ r:.09, minY:TY+.01, onHold:(inp)=>{ tmpV.set(0,.135,0).applyQuaternion(candle.quaternion).add(candle.position); for(const l of lan){ if(!l.userData.lit&&l.position.distanceTo(tmpV)<.13){ haptic(inp,.7,60); light(l); } } },
    auto:async()=>{ if(autoBusy) return; const l=lan.find(x=>!x.userData.lit); if(!l) return; autoBusy=true; await flyTo(candle,l.position.clone().add(V3(0,-.16,.06)),{dur:.7,lift:.1}); light(l); await wait(.3); await flyTo(candle,g.home,{dur:.6,lift:.1}); autoBusy=false; } });
  cleanupHooks.push(()=>{ lan.forEach((l,i)=>{ tween(1.2,()=>{ l.position.y+=.02; },{delay:i*.1}); }); }); };
/* 2 kingdom: stamp */
const paperTex=canvasTex(256,320,(g,w,h)=>{ g.fillStyle='#fbf7ea'; g.fillRect(0,0,w,h); g.fillStyle='#211D70'; g.font='900 26px Cairo'; g.textAlign='center'; g.direction='rtl'; g.fillText('طلب تأسيس جمعية',w/2,44); g.fillStyle='#b9b4a6'; for(let i=0;i<8;i++) g.fillRect(24,72+i*24,w-48-(i%3)*40,6); g.strokeStyle='#b9b4a6'; g.lineWidth=2; g.setLineDash([6,6]); g.beginPath(); g.arc(w-70,h-62,40,0,7); g.stroke(); });
const sealTex=canvasTex(160,160,(g)=>{ g.strokeStyle='#c01840'; g.fillStyle='#c01840'; g.lineWidth=8; g.beginPath(); g.arc(80,80,68,0,7); g.stroke(); g.lineWidth=3; g.beginPath(); g.arc(80,80,54,0,7); g.stroke(); g.font='900 34px Cairo'; g.textAlign='center'; g.textBaseline='middle'; g.direction='rtl'; g.fillText('مُسجّلة',80,84); });
SETUP.kingdom=async()=>{ pop(W.assocSign,1,.3); pop(W.board,1,.5);
  const papers=[0,1,2].map(i=>{ const p=new THREE.Group(); const m=new THREE.Mesh(new THREE.PlaneGeometry(.17,.2125),new THREE.MeshStandardMaterial({map:paperTex,roughness:.9,side:THREE.DoubleSide})); m.rotation.x=-Math.PI/2; p.add(m); p.position.copy(SL[i]).add(V3(0,.004+i*.001,-.02)); p.userData={m,stamped:false}; spawn(p); pop(p,1,.15*i); return p; });
  const stamp=new THREE.Group(); const base=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.03,20),std(0x7a1f2a,{roughness:.6})); base.position.y=.015; const neck=new THREE.Mesh(new THREE.CylinderGeometry(.014,.024,.05,12),std(0x5a3a22,{map:woodTex})); neck.position.y=.055; const knob=new THREE.Mesh(new THREE.SphereGeometry(.03,16,12),std(0x5a3a22,{map:woodTex,roughness:.4})); knob.position.y=.095; stamp.add(base,neck,knob);
  const pad=new THREE.Mesh(new THREE.BoxGeometry(.11,.016,.08),std(0x8a1030,{roughness:.9})); pad.position.copy(SL[4]).add(V3(0,.008,0)); spawn(pad); stamp.position.copy(SL[4]).add(V3(0,.018,0)); spawn(stamp); pop(stamp,1,.5);
  let n=0, cool=0; const doStamp=(p,inp)=>{ p.userData.stamped=true; sfx('stamp',.9); haptic(inp,1,90); const s=new THREE.Mesh(new THREE.PlaneGeometry(.085,.085),new THREE.MeshBasicMaterial({map:sealTex,transparent:true,depthWrite:false})); s.rotation.x=-Math.PI/2; s.rotation.z=(rnd()-.5)*.6; s.position.set(.04,.002,.055); p.add(s);
    const k=n++; wait(.45).then(()=>{ W.board.updateMatrixWorld(); const tgt=W.board.localToWorld(V3(-.52+k*.52,1.75,.1)); return flyTo(p,tgt,{dur:1.3,lift:1.8,scale:2.6}); }).then(()=>{ p.quaternion.copy(W.board.quaternion); p.userData.m.rotation.x=0; p.rotateZ((rnd()-.5)*.25); sfx('slam',.25); }); progress(); };
  const g=addGrab(stamp,{ r:.08, rot:false, minY:TY+.004, onHold:(inp,dt)=>{ stamp.rotation.set(0,0,0); cool-=dt; if(cool>0||stamp.position.y>TY+.035) return; for(const p of papers){ if(!p.userData.stamped&&Math.hypot(p.position.x+.04-stamp.position.x,p.position.z+.055-stamp.position.z)<.09){ cool=.5; doStamp(p,inp); break; } } },
    auto:async()=>{ if(autoBusy) return; const p=papers.find(x=>!x.userData.stamped); if(!p) return; autoBusy=true; await flyTo(stamp,p.position.clone().add(V3(.04,.004,.055)),{dur:.5,lift:.14}); doStamp(p,null); await wait(.25); await flyTo(stamp,g.home,{dur:.5,lift:.12}); autoBusy=false; } }); };
/* 3 quiet: locked door */
SETUP.quiet=async()=>{ tween(.8,k=>table.position.y=-1.2*k,{ease:'inOut'}); cleanupHooks.push(()=>tween(.8,k=>table.position.y=-1.2*(1-k),{ease:'inOut'}));
  const D=new THREE.Group(); D.position.set(0,-2.6,-.82); scene.add(D); const wm=std(0x6a6f78,{map:woodTex,roughness:.75}), iron=std(0x2a2c30,{metalness:.9,roughness:.45}), stone=std(0x8d9096,{roughness:.95});
  const postL=new THREE.Mesh(new THREE.BoxGeometry(.16,2.25,.2),stone), postR=postL.clone(); postL.position.set(-.6,1.125,0); postR.position.set(.6,1.125,0); const lintel=new THREE.Mesh(new THREE.BoxGeometry(1.45,.2,.24),stone); lintel.position.y=2.3; D.add(postL,postR,lintel);
  const mkLeaf=(s)=>{ const h=new THREE.Group(); h.position.set(s*.52,0,0); const m=new THREE.Mesh(new THREE.BoxGeometry(.51,2.15,.06),wm); m.position.set(-s*.255,1.1,0); h.add(m); for(const y of [.5,1.1,1.7]){ const b=new THREE.Mesh(new THREE.BoxGeometry(.5,.05,.07),iron); b.position.set(-s*.255,y,0); h.add(b); } D.add(h); return h; };
  const leafL=mkLeaf(-1), leafR=mkLeaf(1);
  const chain=new THREE.Group(); for(let i=0;i<13;i++){ const l=new THREE.Mesh(new THREE.TorusGeometry(.028,.008,6,12),iron); l.position.set(-.42+i*.07,1.1-Math.sin(i/12*Math.PI)*.07,.06); l.rotation.y=i%2?Math.PI/2:0; chain.add(l); } D.add(chain);
  const lock=new THREE.Group(); const lb=new THREE.Mesh(new THREE.BoxGeometry(.11,.1,.04),brass); const ls=new THREE.Mesh(new THREE.TorusGeometry(.035,.01,8,16,Math.PI),iron); ls.position.y=.05; lock.add(lb,ls); lock.position.set(0,.96,.08); D.add(lock);
  const handle=new THREE.Group(); const hr=new THREE.Mesh(new THREE.TorusGeometry(.06,.012,10,24),brass); const hp=new THREE.Mesh(new THREE.SphereGeometry(.022,10,8),brass); hp.position.y=.06; handle.add(hr,hp); handle.position.set(.2,1.12,.07); D.add(handle);
  const hg=glow(.35,0xffe0a0); hg.material.opacity=.5; handle.add(hg);
  await tween(1.1,k=>D.position.y=-2.6*(1-k),{ease:'out'}); sfx('slam',.5); burst(V3(0,.05,-.82),30,{colors:[0x9a9da3,0x777a80],speed:1.5,up:.2,grav:2,life:1});
  let rattled=false, d=0; const hz=.07; const apply=()=>{ leafL.rotation.y=-d*.55; leafR.rotation.y=d*.55; handle.position.z=hz+d; chain.position.z=d*.6; lock.position.z=.08+d*.7; };
  const rattle=(inp)=>{ rattled=true; sfx('chain',.9); haptic(inp,1,180); tween(.45,k=>{ D.rotation.z=Math.sin(k*30)*.01*(1-k); lock.rotation.z=Math.sin(k*22)*.5*(1-k); }); progress(); if(used===1) hint(tr('مسكّر.. جرّب مرة ثانية','Locked. Try again')); if(used===need) hint(tr('الباب ما يتفتحش..','The door will not open..')); };
  addGrab(handle,{ r:.1, fixed:true, onGrab:()=>{ rattled=false; }, onHold:(inp)=>{ d=clamp(inp.pos.z-(D.position.z+hz),0,.13); apply(); if(d>.1&&!rattled&&used<need) rattle(inp); },
    onRelease:()=>{ const d0=d; tween(.5,k=>{ d=d0*(1-k); apply(); },{ease:'elastic'}); return true; },
    auto:async()=>{ if(autoBusy||used>=need) return; autoBusy=true; await tween(.35,k=>{ d=.12*k; apply(); }); rattle(null); await wait(.3); await tween(.5,k=>{ d=.12*(1-k); apply(); },{ease:'elastic'}); autoBusy=false; } });
  cleanupHooks.push(()=>{ tween(.9,k=>D.position.y=-2.7*k,{ease:'inOut'}).then(()=>scene.remove(D)); }); };
/* 4 2011: throw ideas */
function makeBooth(p, col, sign){ const g=new THREE.Group(); g.position.set(p.x,0,p.z); const pole=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,2.6,8),std(0xf2efe6)); pole.position.y=1.3; const can=new THREE.Mesh(new THREE.ConeGeometry(1.5,.8,8),std(col,{roughness:.8,side:THREE.DoubleSide})); can.position.y=2.75;
  const tb=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.06,16),std(0xf2efe6)); tb.position.y=.85; const s=sprite(sign,1.0); s.position.y=3.9; g.add(pole,can,tb,s); g.userData.sign=s; g.lookAt(0,0,0); return g; }
SETUP['2011']=async()=>{ const cols=[C.pink,C.teal,C.yel,0xffffff]; const signs=['k06','k14','k16','k28','k22','k13']; let n=0;
  const presets=[V3(-3.2,0,-6.5),V3(3.4,0,-6.8),V3(-5.5,0,-3.5),V3(5.2,0,-3.2)];
  const land=(g,p)=>{ const r=Math.hypot(p.x,p.z); if(r<2.3){ hint(tr('ارمِ أبعد!','Throw farther!')); return false; } const a=Math.atan2(p.x,-p.z); const rr2=clamp(r,3.4,9.5); const q=V3(Math.sin(a)*rr2,0,-Math.cos(a)*rr2); if(Math.hypot(q.x,q.z+5.2)<2.8) q.z-=3.2;
    consume(g); g.obj.visible=false; const b=makeBooth(q,g.col,signs[n%signs.length]); town.add(b); W.booths.push(b); OBST.push([q.x,q.z,1.7]); pop(b,1,0,.7); burst(V3(q.x,1.4,q.z),70,{speed:5,up:.7,grav:5,life:2.2}); sfx('slam',.5);
    if(n===0){ W.bunting.visible=true; tween(1.4,k=>W.flagMat.uniforms.uShow.value=k,{ease:'out'}); sfx('cheer',.7); }
    if(n===1){ W.orgSigns.forEach((s,i)=>pop(s,1,i*.12)); showPeople(28); }
    if(n===2){ showPeople(34); sfx('cheer',.9); for(let k=0;k<5;k++) tween(.01,()=>{},{delay:k*.26}).then(()=>burst(V3(rnd()*10-5,5+rnd()*3,-4-rnd()*6),50,{speed:4,up:.2,grav:3,life:2.5})); }
    n++; progress(); return true; };
  cols.forEach((c,i)=>{ const b=new THREE.Mesh(new THREE.SphereGeometry(.05,20,16),std(c,{emissive:c,emissiveIntensity:.45,roughness:.3})); b.position.copy([SL[0],SL[1],SL[2],SL[5]][i]).add(V3(0,.05,0)); spawn(b); pop(b,1,.12*i);
    const g=addGrab(b,{ r:.08, col:c, throwBoost:1.9, onLand:(p)=>land(g,p), auto:()=>{ if(!g.alive||g.held||bodies.some(x=>x.g===g)) return; const t=presets[i]; bodies.push({g, vel:V3(t.x*.72,4.6,t.z*.72+.4), t:0}); sfx('whoosh',.4); } }); }); };
/* 5-7: build the Resource Center on a tabletop miniature */
const MS=.034; let mini=null; const miniPart={};
function ensureMini(){ if(mini) return mini; mini=new THREE.Group(); mini.scale.setScalar(MS); mini.position.set(0,TY+.006,-.86+13.5*MS); stage.add(mini);
  for(const n of ['rc_base','rc_walls','rc_doorL','rc_doorR','rc_deco']){ const c=T[n].clone(); c.visible=false; mini.add(c); miniPart[n]=c; }
  const plate=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.008,40),std(0x17134A,{roughness:.4})); plate.position.set(0,TY+.004,-.86); stage.add(plate); mini.userData.plate=plate; pop(plate,1); return mini; }
const miniDoorPos=()=>V3(0,TY+.07,-.86+3.0*MS);
SETUP.p1=async()=>{ ensureMini(); const ghost=miniPart.rc_base.clone(); ghost.material=new THREE.MeshBasicMaterial({color:C.yel,transparent:true,opacity:.4,depthWrite:false}); ghost.visible=true; mini.add(ghost);
  const stone=new THREE.Mesh(new THREE.BoxGeometry(.1,.045,.07),std(0xcfc7b8,{roughness:.9})); const st=new THREE.Mesh(new THREE.PlaneGeometry(.08,.03),new THREE.MeshBasicMaterial({color:C.pink})); st.position.z=.036; stone.add(st); stone.position.copy(SL[0]).add(V3(-.02,.025,.06)); spawn(stone); pop(stone,1,.3);
  cleanupHooks.push(()=>{ mini.remove(ghost); });
  const place=async(inp)=>{ consume(g); haptic(inp,1,120); await flyTo(stone,V3(0,TY+.02,-.86),{dur:.25,lift:.03}); sfx('slam',.8); hide(stone,.2); ghost.visible=false; miniPart.rc_base.visible=true; burst(V3(0,TY+.03,-.86),20,{colors:[0xcfc7b8,0xffffff],speed:.8,grav:2,life:.8});
    T.rc_base.visible=true; T.rc_base.scale.set(1,.01,1); tween(.8,k=>T.rc_base.scale.y=Math.max(.01,k),{ease:'back'}); burst(V3(0,.3,-10.5),90,{colors:[0xd9c7a3,0xcfc7b8,0xffffff],speed:4,up:.1,grav:2.5,life:2}); progress(); };
  const g=addGrab(stone,{ r:.08, rot:false, minY:TY+.022, onHold:(inp)=>{ stone.rotation.set(0,0,0); ghost.material.opacity=.3+.2*Math.sin(performance.now()/160); if(Math.hypot(stone.position.x,stone.position.z+.86)<.11&&stone.position.y<TY+.12) place(inp); }, auto:()=>{ if(g.alive) place(null); } }); };
SETUP.p2=async()=>{ ensureMini(); miniPart.rc_base.visible=true; T.rc_base.visible=true; T.rc_base.scale.set(1,1,1);
  const rise=(o,d)=>{ o.visible=true; o.scale.set(1,.001,1); return tween(d,k=>o.scale.y=Math.max(.001,k),{ease:'out'}); };
  for(const n of ['rc_walls','rc_doorL','rc_doorR']){ rise(T[n],2.2); rise(miniPart[n],2.2); } sfx('slam',.4); for(let k=0;k<6;k++) tween(.01,()=>{},{delay:k*.33}).then(()=>burst(V3(rnd()*10-5,.4+k*.8,-10.4),26,{colors:[0xd9c7a3,0xffffff],speed:2.5,up:0,grav:1.5,life:1.4}));
  const key=new THREE.Group(); const gold=std(0xf2c230,{metalness:1,roughness:.25}); const ring=new THREE.Mesh(new THREE.TorusGeometry(.024,.007,8,18),gold); const stem=new THREE.Mesh(new THREE.BoxGeometry(.01,.075,.01),gold); stem.position.y=-.06; const t1=new THREE.Mesh(new THREE.BoxGeometry(.026,.01,.01),gold); t1.position.set(.012,-.09,0); const t2=t1.clone(); t2.position.y=-.072; key.add(ring,stem,t1,t2); const kg=glow(.2,0xffe0a0); kg.material.opacity=.6; key.add(kg);
  key.position.copy(SL[2]).add(V3(.02,.12,.06)); spawn(key); pop(key,1,.6);
  const open=async(inp)=>{ consume(g); haptic(inp,1,120); await flyTo(key,miniDoorPos().add(V3(0,.02,.05)),{dur:.3,lift:.02}); key.rotation.set(Math.PI/2,0,0); await tween(.5,k=>key.rotation.y=k*Math.PI,{ease:'inOut'}); sfx('lever',.5); hide(key,.3);
    tween(1.6,k=>{ const a=1.9*k; T.rc_doorL.rotation.y=a; T.rc_doorR.rotation.y=-a; miniPart.rc_doorL.rotation.y=a; miniPart.rc_doorR.rotation.y=-a; },{ease:'inOut'}); sfx('whoosh',.6); burst(V3(0,2,-10.2),50,{speed:3,up:.3,grav:3,life:1.8}); progress(); };
  const g=addGrab(key,{ r:.08, minY:TY+.03, onHold:(inp)=>{ if(key.position.distanceTo(miniDoorPos())<.1) open(inp); }, auto:()=>{ if(g.alive) open(null); } }); };
SETUP.p3=async()=>{ ensureMini(); for(const n of ['rc_base','rc_walls','rc_doorL','rc_doorR']){ miniPart[n].visible=true; miniPart[n].scale.set(1,1,1); T[n].visible=true; T[n].scale.set(1,1,1); }
  const box=new THREE.Group(); box.position.copy(SL[0]).add(V3(-.04,0,.08)); const body=new THREE.Mesh(new THREE.BoxGeometry(.12,.16,.08),std(0x2a2c30,{metalness:.6,roughness:.5})); body.position.y=.08; const face=new THREE.Mesh(new THREE.PlaneGeometry(.09,.03),new THREE.MeshBasicMaterial({color:C.yel})); face.position.set(0,.145,.041); box.add(body,face);
  const arm=new THREE.Group(); arm.position.set(0,.08,.045); const rod=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.11,8),brass); rod.rotation.x=Math.PI/2; rod.position.z=.055; const knob=new THREE.Mesh(new THREE.SphereGeometry(.024,16,12),std(C.pink,{roughness:.3})); knob.position.z=.115; arm.add(rod,knob); arm.rotation.x=-.75; box.add(arm); const kg=glow(.2,0xffe0a0); kg.material.opacity=.6; knob.add(kg); spawn(box); pop(box,1,.3);
  let fired=false; const fire=(inp)=>{ if(fired) return; fired=true; consume(g); arm.rotation.x=.75; sfx('lever',1); haptic(inp,1,250); face.material.color.setHex(C.teal);
    T.rc_deco.visible=true; miniPart.rc_deco.visible=true; pop(W.rcLogo,1,.3); pop(W.rcBand,1,.5); pop(W.ring,1,.8); W.rcGlow.forEach(s=>s.userData.boost=.5); envTo('dusk',4); sfx('cheer',.9);
    for(let k=0;k<8;k++) tween(.01,()=>{},{delay:k*.3}).then(()=>burst(V3(rnd()*12-6,6+rnd()*3,-6-rnd()*5),60,{speed:4.5,up:.2,grav:3,life:2.6})); progress(); };
  const g=addGrab(knob,{ r:.09, fixed:true, onHold:(inp)=>{ box.getWorldPosition(tmpV); const a=clamp((tmpV.y+.14-inp.pos.y)/.1,0,1); arm.rotation.x=-.75+a*1.5; if(a>.92) fire(inp); }, onRelease:()=>{ if(!fired){ const a0=arm.rotation.x; tween(.3,k=>arm.rotation.x=a0+(-.75-a0)*k); } return true; },
    auto:async()=>{ if(fired||autoBusy) return; autoBusy=true; await tween(.5,k=>arm.rotation.x=-.75+k*1.5,{ease:'inOut'}); autoBusy=false; fire(null); } }); };
/* 8 pledge wall */
SETUP.pledge=async()=>{ if(mini){ hide(mini.userData.plate); const m=mini; tween(.4,k=>m.scale.setScalar(MS*(1-k)+1e-5)).then(()=>m.visible=false); } T.rc_deco.visible=true; W.rcLogo.visible=true; W.rcGlow.forEach(s=>s.userData.boost=.5);
  const wall=new THREE.Group(); wall.position.set(-.62,1.38,-.62); wall.rotation.y=.62; spawn(wall); const WW=1.0, WH=.8;
  const wb=new THREE.Mesh(new THREE.BoxGeometry(WW,WH,.03),std(0xfffdf7,{roughness:.9})); const fr=new THREE.Mesh(new THREE.BoxGeometry(WW+.08,WH+.08,.025),navyM); fr.position.z=-.01; wall.add(fr,wb);
  const tt=canvasTex(512,96,(g,w,h)=>{ g.fillStyle='rgba(33,29,112,.35)'; g.font='900 60px Cairo'; g.textAlign='center'; g.textBaseline='middle'; g.direction=LANG==='en'?'ltr':'rtl'; g.fillText(tr('حيط الوعد','Pledge Wall'),w/2,h/2+4); }); const tm=new THREE.Mesh(new THREE.PlaneGeometry(.6,.11),new THREE.MeshBasicMaterial({map:tt,transparent:true})); tm.position.set(0,0,.017); wall.add(tm);
  const leg=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,1.0,8),darkM); leg.position.y=-.9; wall.add(leg); pop(wall,1,.2);
  const names=['k14','k16','k13','k22','k32','k33']; let n=0; const loc=V3();
  names.forEach((nm,i)=>{ const s=sprite(nm,.1,{fog:false}); const g0=new THREE.Group(); g0.add(s); s.rotation.x=-.6; g0.position.copy(SL[i]).add(V3(0,.05,0)); spawn(g0); pop(g0,1,.1*i);
    const stick=(inp,auto)=>{ consume(g); haptic(inp,1,90); sfx('slam',.6); wall.attach(g0); if(auto){ g0.position.set(-.3+(n%3)*.3+(rnd()-.5)*.05,.17-Math.floor(n/3)*.3,.02+n*.002); } else { g0.position.z=.018+n*.002; } g0.rotation.set(0,0,(rnd()-.5)*.5); s.rotation.x=0; const sc=1.5; tween(.35,k=>g0.scale.setScalar(sc*(1.3-.3*k)),{ease:'back'}); g0.getWorldPosition(tmpV); burst(tmpV.clone(),14,{speed:1.2,grav:3,life:.8}); n++; progress(); };
    const g=addGrab(g0,{ r:.08, onHold:(inp)=>{ loc.copy(g0.position); wall.worldToLocal(loc); if(Math.abs(loc.z)<.06&&Math.abs(loc.x)<WW/2-.05&&Math.abs(loc.y)<WH/2-.05) stick(inp,false); },
      auto:async()=>{ if(!g.alive||g.busy) return; g.busy=true; wall.updateMatrixWorld(); const tgt=wall.localToWorld(V3(-.3+(n%3)*.3,.17-Math.floor(n/3)*.3,.05)); await flyTo(g0,tgt,{dur:.6,lift:.2}); stick(null,true); } }); }); };
/* finale */
const endCard=new THREE.Group(); endCard.position.set(.3,1.9,-2.3); stage.add(endCard); endCard.visible=false;
async function finale(){ busy=true; hide(nextBtn); hide(panel); cleanupHooks.splice(0).forEach(f=>f()); clearEra(); endCard.scale.setScalar(1); sfx('whoosh',.6); sfx('cheer',.8);
  const bg=new THREE.Mesh(new THREE.PlaneGeometry(2.3,2.25),new THREE.MeshBasicMaterial({color:C.navy,transparent:true,opacity:.96,fog:false,depthWrite:false})); bg.position.y=-.12; bg.renderOrder=10; endCard.add(bg);
  const mark=sprite('lin_mark',.5,{fog:false}); mark.position.set(0,.62,.01); const txt=sprite('lin_text',.62,{fog:false}); txt.position.set(0,.02,.01);
  const tp=sprite('tape_partners',.2,{fog:false}); tp.position.set(-.5,-.98,.02); tp.rotation.z=.04; const te=sprite('tape_eu',.26,{fog:false}); te.position.set(.72,-.98,.02); te.rotation.z=-.05;
  const th=canvasTex(1024,128,(g,w,h)=>{ g.fillStyle='#FED60E'; g.font='900 70px Cairo'; g.textAlign='center'; g.textBaseline='middle'; g.direction=LANG==='en'?'ltr':'rtl'; g.fillText(tr('شكرًا.. المكان مكانكم!','Thank you. This place is yours!'),w/2,h/2+4); });
  const thm=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.21),new THREE.MeshBasicMaterial({map:th,transparent:true,fog:false})); thm.position.set(0,-.62,.02);
  [mark,txt,thm,tp,te].forEach((m,i)=>{ endCard.add(m); m.renderOrder=11+i; m.material.depthTest=false; }); pop(endCard,1,.4); [mark,txt,thm,tp,te].forEach((m,i)=>pop(m,1,.7+i*.18));
  for(let k=0;k<12;k++) tween(.01,()=>{},{delay:k*.35}).then(()=>burst(V3(rnd()*10-5,5+rnd()*3,-3-rnd()*7),60,{speed:4.5,up:.2,grav:3,life:2.6})); await wait(2.5); busy=false; done=true; pop(nextBtn,1); hint(tr('اضغط الزر الأصفر للبدء من جديد','Press the yellow button to start again')); }

/* ---------------- START ---------------- */
let started=false;
async function start(vr){ if(started) return; $('#msg').textContent='';
  if(vr){ if(!navigator.xr){ $('#msg').textContent='المتصفح لا يدعم الواقع الافتراضي. افتح الرابط من متصفح Meta Quest. · This browser has no VR. Open the link in the Meta Quest browser.'; return; }
    try{ const s=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor','hand-tracking']}); await renderer.xr.setSession(s); camera.position.set(0,0,0); camera.rotation.set(0,0,0);
      s.addEventListener('end',()=>{ camera.position.set(0,1.6,0); $('#hint').textContent='اسحب للنظر حولك، واضغط على الأشياء · Drag to look around, click on things'; }); }
    catch(err){ $('#msg').textContent='تعذّر بدء الواقع الافتراضي · Could not start VR: '+err.message; return; } }
  else { yaw=-.18; pitch=-.3; camera.position.set(0,1.62,.55); camera.rotation.set(pitch,yaw,0,'YXZ'); $('#hint').textContent='اسحب للنظر حولك، واضغط على الأشياء · Drag to look around, click on things'; }
  started=true; $('#ui').style.display='none'; for(const k in AUD) AUD[k].a.play().catch(()=>{}); await townReady; envTo('dawn',.1); setMusic('roots','market'); showPeople(8); await chooseLang(); gotoEra(0); }
$('#bvr').onclick=()=>start(true); $('#b2d').onclick=()=>start(false);
if(navigator.xr) navigator.xr.isSessionSupported('immersive-vr').then(ok=>{ if(!ok){ $('#bvr').style.opacity=.5; $('#msg').textContent='الواقع الافتراضي غير متاح على هذا الجهاز. جرّب على الشاشة، أو افتح الرابط من نظارة Quest. · VR is not available on this device. Try it on screen, or open the link on a Quest.'; } }).catch(()=>{});
else $('#bvr').style.opacity=.5;

/* ---------------- LOOP ---------------- */
const clock=new THREE.Clock(); let TT=0;
renderer.setAnimationLoop(()=>{ const dt=Math.min(clock.getDelta(),window.DEBUG&&DEBUG.fast?.25:.05); TT+=dt;
  for(let i=tweens.length-1;i>=0;i--){ const w=tweens[i]; w.t+=dt; if(w.t<0) continue; const k=Math.min(1,w.t/w.dur); w.fn(w.e(k)); if(k>=1){ tweens.splice(i,1); w.res(); } }
  if(renderer.xr.isPresenting){ updateInputs(dt); checkTouchNext(TT); } updateHover(dt);
  updateBodies(dt); updateFX(dt,TT); updateParticles(dt); updatePeople(dt,TT); updateAudio(dt);
  if(nextBtn.visible) nb.material.emissiveIntensity=.35+.35*Math.sin(TT*4);
  guide.position.y=-.28+Math.sin(TT*1.3)*.02; guide.rotation.y=.35;
  for(const s of W.houseGlow){ const t=Math.max(envNow.glow,(s.userData.boost||0)*(envNow.sat>.3?1:0)); s.material.opacity+=(t*.75-s.material.opacity)*Math.min(1,dt*2); }
  for(const s of W.rcGlow){ s.material.opacity+=(((s.userData.boost||0)*.9)-s.material.opacity)*Math.min(1,dt*1.5); }
  if(W.flagMat) W.flagMat.uniforms.uT.value=TT;
  for(const b of birds){ const u=b.userData; const a=TT*u.sp+u.ph; b.position.set(u.cx+Math.cos(a)*u.rad,u.h+Math.sin(TT*.5+u.ph)*1.2,u.cz+Math.sin(a)*u.rad); b.rotation.y=-a; const f=Math.sin(TT*9+u.ph)*.7; u.l.rotation.z=f; u.r.rotation.z=-f; }
  if(W.birdMat) W.birdMat.opacity=envNow.bird;
  for(const b of W.booths){ b.userData.sign.position.y=3.9+Math.sin(TT*2+b.position.x)*.08; }
  for(const c of clouds) c.position.x+=dt*.2;
  renderer.render(scene,camera); });

window.DEBUG={ restart:()=>pressNext(), pick:(c)=>langResolve&&langResolve(c), lang:()=>LANG, cam:(x,y,z,p,yw)=>{ camera.position.set(x,y,z); pitch=p; yaw=yw; camera.rotation.set(p,yw,0,'YXZ'); }, gotoEra, start, state:()=>({eraIdx,used,need,busy,done,grabs:grabs.filter(g=>g.alive).length}), info:()=>renderer.info.render,
  autoAll:async()=>{ let guard=0; while(used<need&&guard++<40){ for(const g of [...grabs]){ if(g.alive&&g.auto&&used<need){ await g.auto(); await wait(.25); } } await wait(.6); } } };
document.fonts.load('900 40px Cairo').then(()=>document.fonts.load('700 40px Cairo')).then(()=>townReady).then(()=>peopleReady).then(()=>{ window.READY=true; }).catch(e=>{ console.error(e); window.READY='err'; });
