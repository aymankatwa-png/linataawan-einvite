import * as THREE from 'three';

/* =========================================================
   «الميدان»  Al-Maydan: a WebXR journey (hands + controllers)
   Edit the story text in ERAS below. Everything else is built in code.
   ========================================================= */
const C = { navy:0x211D70, deep:0x17134A, teal:0x4FC2B6, pink:0xE1148D, yel:0xFED60E, cream:0xF5EEE1, white:0xffffff };
const hex = n => '#' + n.toString(16).padStart(6,'0');
const $ = s => document.querySelector(s);
const rnd = (()=>{ let s=12345; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; })();

/* ---------------- STORY ---------------- */
const ERAS = [
 { key:'intro', guide:'k03', tag:'أهلاً بيكم!', title:'الميدان', year:'',
   text:'هذا ميدان مدينتنا. تعالوا نشوفوا مع بعض كيف تغيّر عبر الزمن، وكيف كبر فيه العمل الأهلي.',
   en:'This is our town square. Let\'s see how it changed through time.',
   task:'المس الزر الأصفر بإيدك، أو أشّر عليه واضغط', items:[], env:'dawn' },
 { key:'roots', guide:'k29', tag:'الجدّة', title:'الجذور', year:'قبل الاستقلال',
   text:'قبل ما تكون فيه جمعيات ومنظمات، كان الخير شغل الناس كلها: الجار يوقف مع جاره، والوقف والزوايا تعلّم وتطعم.',
   en:'Before organizations, solidarity was everyone\'s job.',
   task:'وزّع السلال الثلاثة على الجيران', items:['basket','basket','basket'], env:'dawn' },
 { key:'kingdom', guide:'k29', tag:'الجدّة', title:'أولى الجمعيات', year:'1951 - 1969',
   text:'بعد الاستقلال سنة 1951 بدت تظهر الجمعيات الأهلية والنوادي والصحف: الحركة النسائية، والكشافة (1954)، والهلال الأحمر (1957).',
   en:'After independence in 1951, the first associations, clubs and newspapers appeared.',
   task:'علّق الإعلانات على لوحة الجمعية', items:['notice','notice','notice'], env:'day' },
 { key:'quiet', guide:'k31', tag:'الأب', title:'سنوات الصمت', year:'1969 - 2011',
   text:'لعقود طويلة، كان العمل الأهلي المستقل مقيّدًا بشدة، والجمعيات تشتغل تحت رقابة الدولة. الميدان سكت.. لكن الناس ما نسوش.',
   en:'For decades, independent civic work was heavily restricted. The square went quiet.',
   task:'جرّب تفتح باب الجمعية بالمفتاح', items:['key'], repeat:3, env:'gray' },
 { key:'2011', guide:'k30', tag:'الأب', title:'الميدان يتنفّس', year:'2011',
   text:'بعد 2011 تأسست آلاف المنظمات في كل المدن: شباب، ونساء، وإغاثة، وإعلام، وحقوق. الصوت رجع للميدان.',
   en:'After 2011, thousands of organizations were founded across Libya.',
   task:'ارفع صوتك: شغّل المكبّرات الثلاثة', items:['mega','mega','mega'], env:'bright' },
 { key:'p1', guide:'k03', tag:'المرحلة 1', title:'لنتعاون: البداية', year:'2019 - 2023',
   text:'في ديسمبر 2019 انطلق مشروع «لنتعاون» بتمويل من الاتحاد الأوروبي لدعم منظمات المجتمع المدني، وتأسست مراكز الموارد في طرابلس وبنغازي.',
   en:'Linataawan launched in December 2019, funded by the EU. Resource Centers opened in Tripoli and Benghazi.',
   task:'حُطّ حجر الأساس', items:['stone'], env:'bright' },
 { key:'p2', guide:'k03', tag:'المرحلة 2', title:'لنتعاون: نكبروا', year:'2024 - 2026',
   text:'4 مراكز موارد: طرابلس، بنغازي، سبها، والبيضاء. أكثر من 540 منظمة وأكثر من 10,000 شخص استفادوا من التدريب والدعم.',
   en:'4 Resource Centers. 540+ organizations and 10,000+ people supported.',
   task:'افتح أبواب المركز', items:['goldkey'], env:'bright' },
 { key:'p3', guide:'k03', tag:'المرحلة 3', title:'مركز الموارد اليوم', year:'اليوم',
   text:'مركز الموارد طرابلس: مساحة للجميع. قاعات، وتدريب، ومنصة erc.ngos.ly. المكان مكانكم!',
   en:'The Tripoli Resource Center today: a space for everyone.',
   task:'نوّر المركز', items:['bulb'], env:'dusk' },
 { key:'pledge', guide:'k03', tag:'دورك أنت', title:'دورك أنت', year:'',
   text:'الحكاية ما كملتش.. الفصل الجاي تكتبه أنت. اختار ملصقاتك وحطّها على الحيط.',
   en:'The story is not finished. The next chapter is yours.',
   task:'الصّق 3 ملصقات على الأقل', items:['s:k14','s:k16','s:k13','s:k22','s:k32','s:k33'], need:3, env:'dusk' },
];
const ENV = {
 dawn:  { top:0x3b3f8f, bot:0xf7b267, fog:0xf2c08a, sun:0xffc98a, si:1.5, amb:0.75, gray:0 },
 day:   { top:0x3f8fd8, bot:0xcfeaf5, fog:0xd8eef5, sun:0xfff3d6, si:2.0, amb:0.95, gray:0 },
 gray:  { top:0x55585f, bot:0x9a9da3, fog:0x8d9096, sun:0xb8bcc4, si:0.7, amb:0.55, gray:1 },
 bright:{ top:0x2f7fe0, bot:0xbfe9ff, fog:0xcdeeff, sun:0xfff6dd, si:2.2, amb:1.05, gray:0 },
 dusk:  { top:0x211D70, bot:0xE86AA8, fog:0x8e5aa0, sun:0xffb38a, si:1.3, amb:0.8, gray:0 },
};

/* ---------------- RENDERER ---------------- */
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true; renderer.xr.setFoveation(1); renderer.shadowMap.autoUpdate=false; renderer.xr.setReferenceSpaceType('local-floor');
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf2c08a, 18, 70);
const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.05, 200);
const rig = new THREE.Group(); rig.add(camera); scene.add(rig); camera.position.set(0,1.6,0);
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });

/* ---------------- TWEENS ---------------- */
const tweens = [];
const ease = { out:t=>1-Math.pow(1-t,3), inOut:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
  back:t=>{const c=1.70158*1.4;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);}, lin:t=>t };
function tween(dur, fn, o={}){ return new Promise(res=>tweens.push({t:-(o.delay||0),dur,fn,e:ease[o.ease||'out'],res})); }
function pop(obj, s=1, delay=0, dur=.55){ obj.visible=true; obj.scale.setScalar(0.0001); return tween(dur,k=>obj.scale.setScalar(Math.max(0.0001,s*k)),{ease:'back',delay}); }
function hide(obj, dur=.3){ const s=obj.scale.x; return tween(dur,k=>obj.scale.setScalar(Math.max(0.0001,s*(1-k))),{ease:'inOut'}).then(()=>obj.visible=false); }
const wait = s => tween(s,()=>{});

/* ---------------- TEXTURES (canvas) ---------------- */
function canvasTex(w,h,draw,repeat){ const c=document.createElement('canvas'); c.width=w;c.height=h; draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8;
  if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat[0],repeat[1]);} return t; }
function noise(g,w,h,n,a){ for(let i=0;i<n;i++){ const x=rnd()*w,y=rnd()*h,r=1+rnd()*3; g.fillStyle=`rgba(${rnd()<.5?0:255},${rnd()<.5?0:255},${rnd()<.5?0:255},${a*rnd()})`; g.fillRect(x,y,r,r);} }
const texGround = canvasTex(1024,1024,(g,w,h)=>{ g.fillStyle='#d9c7a3'; g.fillRect(0,0,w,h);
  const n=8, s=w/n; for(let i=0;i<n;i++)for(let j=0;j<n;j++){ const v=200+rnd()*40|0; g.fillStyle=`rgb(${v+20},${v+2},${v-34})`; g.fillRect(i*s+3,j*s+3,s-6,s-6);
    g.fillStyle='rgba(120,90,50,.10)'; g.fillRect(i*s+3,j*s+s*.7,s-6,s*.3-3); }
  noise(g,w,h,9000,.06); },[14,14]);
function wallTex(shutter, door){ return canvasTex(512,512,(g,w,h)=>{
  const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#ffffff'); gr.addColorStop(1,'#e9e2d2'); g.fillStyle=gr; g.fillRect(0,0,w,h);
  noise(g,w,h,5000,.05);
  for(let i=0;i<14;i++){ g.fillStyle=`rgba(120,100,70,${.03+rnd()*.05})`; const x=rnd()*w; g.fillRect(x,rnd()*h*.3,6+rnd()*14,h*.25+rnd()*h*.4); }
  g.fillStyle='rgba(90,70,40,.18)'; g.fillRect(0,h-26,w,26); g.fillStyle='rgba(0,0,0,.10)'; g.fillRect(0,0,w,10);
  const arch=(x,y,ww,hh,col,isDoor)=>{ g.fillStyle='rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(x-8,y+hh); g.lineTo(x-8,y+ww/2); g.arc(x+ww/2,y+ww/2,ww/2+8,Math.PI,0); g.lineTo(x+ww+8,y+hh); g.fill();
    g.fillStyle=col; g.beginPath(); g.moveTo(x,y+hh); g.lineTo(x,y+ww/2); g.arc(x+ww/2,y+ww/2,ww/2,Math.PI,0); g.lineTo(x+ww,y+hh); g.fill();
    g.strokeStyle='rgba(0,0,0,.28)'; g.lineWidth=3; g.beginPath(); g.moveTo(x+ww/2,y+4); g.lineTo(x+ww/2,y+hh); g.stroke();
    for(let k=1;k<(isDoor?4:6);k++){ g.beginPath(); g.moveTo(x+4,y+ww/2+k*(hh-ww/2)/(isDoor?4:6)); g.lineTo(x+ww-4,y+ww/2+k*(hh-ww/2)/(isDoor?4:6)); g.stroke(); }
    if(isDoor){ g.fillStyle='#d9b24a'; g.beginPath(); g.arc(x+ww/2-12,y+hh*.6,5,0,7); g.arc(x+ww/2+12,y+hh*.6,5,0,7); g.fill(); } };
  for(let i=0;i<3;i++) arch(60+i*150,70,90,150,shutter,false);
  if(door){ arch(60,300,90,160,shutter,false); arch(196,278,120,234,door,true); arch(362,300,90,160,shutter,false); }
  else for(let i=0;i<3;i++) arch(60+i*150,300,90,160,shutter,false);
}); }
const WALLS=[wallTex('#2f7d6d','#1f5f8a'),wallTex('#2a6fa8','#7a4a2a'),wallTex('#7a4a2a','#2f7d6d'),wallTex('#3d8f5a','#3d8f5a')];
const texStripe = (a,b)=>canvasTex(256,64,(g,w,h)=>{ for(let i=0;i<8;i++){ g.fillStyle=i%2?a:b; g.fillRect(i*w/8,0,w/8,h);} });
/* RC pattern tiles */
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
const loader = new THREE.TextureLoader();
const imgTex = {}; const img = n => { if(!imgTex[n]){ const t=loader.load('img/'+n+'.png'); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; imgTex[n]=t; } return imgTex[n]; };
const IMG_AR = { k03:.87,k05:.8,k07:1.72,k08:1,k10:1.1,k12:1.9,k13:1.9,k14:1,k15:1,k16:1.83,k22:1,k23:2.4,k28:1.5,k29:1,k30:1,k31:1,k32:1,k33:2.3,k06:1.5, rc_white:2.745, footer:6.36, lin_mark:1, lin_text:.99, tape_partners:3.97, tape_eu:1.24 };
function sprite(name, h, opt={}){ const w=h*(IMG_AR[name]||1);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({map:img(name),transparent:true,alphaTest:.05,side:THREE.DoubleSide,fog:opt.fog??true,toneMapped:false}));
  m.userData.w=w; return m; }

/* ---------------- MATERIAL REGISTRY (for the gray era) ---------------- */
const mats = [];
function M(color, o={}){ const m=new THREE.MeshLambertMaterial({color, ...o}); m.userData.base=new THREE.Color(color); mats.push(m); return m; }
const _g=new THREE.Color();
function setGray(k){ for(const m of mats){ const b=m.userData.base; const l=b.r*.3+b.g*.59+b.b*.11; _g.setRGB(l*.75,l*.76,l*.8); m.color.copy(b).lerp(_g,k); } }

/* ---------------- SKY + LIGHTS ---------------- */
const skyMat = new THREE.ShaderMaterial({ side:THREE.BackSide, depthWrite:false, fog:false,
  uniforms:{ top:{value:new THREE.Color(0x3b3f8f)}, bot:{value:new THREE.Color(0xf7b267)} },
  vertexShader:'varying vec3 p; void main(){ p=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader:'uniform vec3 top; uniform vec3 bot; varying vec3 p; void main(){ float h=clamp(normalize(p).y*1.6+0.08,0.0,1.0); gl_FragColor=vec4(mix(bot,top,pow(h,0.65)),1.0); }' });
scene.add(new THREE.Mesh(new THREE.SphereGeometry(120,24,16), skyMat));
const hemi = new THREE.HemisphereLight(0xffffff, 0xb59a70, .75); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffc98a, 1.5); sun.position.set(-14,22,10); sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024); Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:70}); sun.shadow.bias=-0.0006; scene.add(sun);
// clouds
const cloudTex = canvasTex(256,128,(g,w,h)=>{ for(let i=0;i<9;i++){ const x=40+rnd()*176,y=50+rnd()*30,r=22+rnd()*26; const gr=g.createRadialGradient(x,y,2,x,y,r); gr.addColorStop(0,'rgba(255,255,255,.9)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h);} });
const clouds=[]; for(let i=0;i<9;i++){ const m=new THREE.Mesh(new THREE.PlaneGeometry(26,12), new THREE.MeshBasicMaterial({map:cloudTex,transparent:true,depthWrite:false,fog:false,opacity:.85}));
  const a=i/9*Math.PI*2+rnd(); m.position.set(Math.cos(a)*70,22+rnd()*16,Math.sin(a)*70); m.lookAt(0,10,0); scene.add(m); clouds.push(m); }
let envNow = {...ENV.dawn}; const cT=new THREE.Color(), cB=new THREE.Color();
function applyEnv(e){ skyMat.uniforms.top.value.setHex(0).copy(cT.setHex(e.top)); skyMat.uniforms.bot.value.copy(cB.setHex(e.bot)); }
function envTo(name, dur=2.2){ const a={ top:skyMat.uniforms.top.value.clone(), bot:skyMat.uniforms.bot.value.clone(), fog:scene.fog.color.clone(), sun:sun.color.clone(), si:sun.intensity, amb:hemi.intensity, gray:envNow.gray };
  const b=ENV[name]; const bt=new THREE.Color(b.top), bb=new THREE.Color(b.bot), bf=new THREE.Color(b.fog), bs=new THREE.Color(b.sun);
  return tween(dur,k=>{ skyMat.uniforms.top.value.copy(a.top).lerp(bt,k); skyMat.uniforms.bot.value.copy(a.bot).lerp(bb,k); scene.fog.color.copy(a.fog).lerp(bf,k);
    sun.color.copy(a.sun).lerp(bs,k); sun.intensity=a.si+(b.si-a.si)*k; hemi.intensity=a.amb+(b.amb-a.amb)*k; envNow.gray=a.gray+(b.gray-a.gray)*k; setGray(envNow.gray);
    scene.fog.near=18-8*envNow.gray; scene.fog.far=70-30*envNow.gray; for(const c of clouds) c.material.opacity=.85*(1-envNow.gray*.7); },{ease:'inOut'}); }
skyMat.uniforms.top.value.setHex(ENV.dawn.top); skyMat.uniforms.bot.value.setHex(ENV.dawn.bot);

/* ---------------- TOWN ---------------- */
const town = new THREE.Group(); scene.add(town);
const box=(w,h,d,mat,x,y,z,parent=town)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow=m.receiveShadow=true; parent.add(m); return m; };
const cyl=(r1,r2,h,mat,x,y,z,parent=town,seg=16)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat); m.position.set(x,y,z); m.castShadow=m.receiveShadow=true; parent.add(m); return m; };
const ground = new THREE.Mesh(new THREE.CircleGeometry(60,48), M(0xffffff,{map:texGround})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; town.add(ground);
// houses in a ring, with a gap in front (-z) for the hero building
const TINT=[0xfffaf0,0xf7ecd8,0xfdf3e3,0xf3e6cf,0xffffff,0xf6e3c8];
function house(angle, dist, w, h, d, ti){ const g=new THREE.Group(); const hasDoor=true;
  const mat=M(TINT[ti%TINT.length],{map:WALLS[ti%WALLS.length]}); const side=M(TINT[(ti+2)%TINT.length]);
  const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),[side,side,side,side,mat,side]); b.position.y=h/2; b.castShadow=b.receiveShadow=true; g.add(b);
  box(w+.3,.35,d+.3,M(0xe7d9bd),0,h+.17,0,g); box(w*.4,.9,.5,M(0xefe2c6),-w*.2,h+.75,0,g);
  if(rnd()<.6){ const dome=new THREE.Mesh(new THREE.SphereGeometry(w*.2,16,10,0,7,0,Math.PI/2),M(0xf5f0e4)); dome.position.set(w*.2,h+.3,0); dome.castShadow=true; g.add(dome); }
  g.position.set(Math.sin(angle)*dist,0,-Math.cos(angle)*dist); g.rotation.y=-angle; g.userData.front=new THREE.Vector3(Math.sin(angle)*(dist-d/2-.2),0,-Math.cos(angle)*(dist-d/2-.2)); town.add(g); return g; }
const houses=[]; const HA=[-150,-118,-88,-60,-36, 36,60,88,118,150,180];
HA.forEach((a,i)=>houses.push(house(a*Math.PI/180, 13+rnd()*2, 6.5+rnd()*2, 4.5+rnd()*3.5, 5, i)));
// second, further ring for depth
for(let i=0;i<12;i++){ const a=i/12*Math.PI*2+.2; const g=house(a,24+rnd()*5,8+rnd()*4,6+rnd()*6,6,i+3); g.traverse(o=>{ o.castShadow=false; }); }
// mosque (left-front) with dome + minaret
const mosque=new THREE.Group(); town.add(mosque); mosque.position.set(-9.5,0,-15.5); mosque.rotation.y=.45;
box(8,5,7,M(0xfffaf0,{map:WALLS[3]}),0,2.5,0,mosque); const dm=new THREE.Mesh(new THREE.SphereGeometry(2.6,24,14,0,7,0,Math.PI/2),M(0x4FC2B6)); dm.position.y=5; dm.castShadow=true; mosque.add(dm);
cyl(.75,.9,11,M(0xfffaf0),4.6,5.5,2.6,mosque); cyl(1.05,1.05,.3,M(0xe7d9bd),4.6,9,2.6,mosque); const cone=new THREE.Mesh(new THREE.ConeGeometry(.85,2.2,16),M(0x4FC2B6)); cone.position.set(4.6,12.1,2.6); cone.castShadow=true; mosque.add(cone);
// clock tower (right-front)
const tower=new THREE.Group(); town.add(tower); tower.position.set(10,0,-15);
box(3,9,3,M(0xf7ecd8),0,4.5,0,tower); box(3.5,.4,3.5,M(0xe7d9bd),0,9.2,0,tower); box(2.2,2.4,2.2,M(0xfffaf0),0,10.6,0,tower);
const clockTex=canvasTex(256,256,(g,w)=>{ g.fillStyle='#fffaf0'; g.beginPath(); g.arc(128,128,120,0,7); g.fill(); g.strokeStyle='#211D70'; g.lineWidth=10; g.stroke(); g.lineWidth=8; g.lineCap='round';
  for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; g.beginPath(); g.moveTo(128+Math.cos(a)*96,128+Math.sin(a)*96); g.lineTo(128+Math.cos(a)*108,128+Math.sin(a)*108); g.stroke(); } });
const clock=new THREE.Mesh(new THREE.CircleGeometry(.9,24),new THREE.MeshBasicMaterial({map:clockTex})); clock.position.set(-.5,10.6,1.12); clock.rotation.y=-.0; tower.add(clock); tower.rotation.y=-.5;
const hand1=box(.07,.6,.03,new THREE.MeshBasicMaterial({color:C.navy}),0,.25,.02,clock); const handPivot=new THREE.Group(); clock.add(handPivot); handPivot.position.z=.02; handPivot.add(hand1); hand1.castShadow=false;
const pyr=new THREE.Mesh(new THREE.ConeGeometry(1.8,1.8,4),M(0xb5533c)); pyr.position.y=12.7; pyr.rotation.y=Math.PI/4; tower.add(pyr);
// palms
function palm(x,z,h=5){ const g=new THREE.Group(); g.position.set(x,0,z); const tm=M(0x8a6a45);
  for(let i=0;i<6;i++){ const s=cyl(.2-.012*i,.24-.012*i,h/6+.05,tm,Math.sin(i*.5)*.12,h/6*(i+.5),0,g,8); }
  const lm=M(0x2f8f5f,{side:THREE.DoubleSide}); for(let i=0;i<9;i++){ const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),lm); leaf.scale.set(.28,.06,1.5); const p=new THREE.Group(); p.position.set(.3,h,0); p.rotation.y=i/9*Math.PI*2; leaf.position.z=1.3; leaf.rotation.x=.45+rnd()*.2; p.add(leaf); leaf.castShadow=true; g.add(p); }
  g.rotation.y=rnd()*6; town.add(g); return g; }
[[-6,-8],[6.5,-7.5],[-9,2],[9.5,1],[-4.5,9],[5,9.5],[-12,-6],[12.5,-5]].forEach(p=>palm(p[0],p[1],4.5+rnd()*2));
// fountain
const fountain=new THREE.Group(); fountain.position.set(0,0,-5.2); town.add(fountain);
cyl(1.7,1.8,.5,M(0xe7d9bd),0,.25,0,fountain,24); const water=cyl(1.5,1.5,.06,new THREE.MeshLambertMaterial({color:0x66c7d9,transparent:true,opacity:.85}),0,.5,0,fountain,24); water.castShadow=false;
cyl(.22,.3,1.2,M(0xe7d9bd),0,1,0,fountain); cyl(.7,.2,.2,M(0xe7d9bd),0,1.6,0,fountain,20);
// benches + pots
[[-3.2,-3.6,.5],[3.2,-3.6,-.5]].forEach(([x,z,r])=>{ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=r; box(1.6,.08,.45,M(0x8a6a45),0,.45,0,g); box(.08,.45,.4,M(0x4a3a2a),-.7,.22,0,g); box(.08,.45,.4,M(0x4a3a2a),.7,.22,0,g); town.add(g); });

/* ----- era props (hidden until their era) ----- */
const props = {};
// market stalls (roots + kingdom)
props.stalls=new THREE.Group(); town.add(props.stalls);
[[-4.6,-6.4,.5,'#E1148D','#fff'],[4.6,-6.6,-.5,'#4FC2B6','#fff'],[-7,-2.5,1.1,'#FED60E','#fff']].forEach(([x,z,r,a,b])=>{ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=r;
  [[-1,-.6],[1,-.6],[-1,.6],[1,.6]].forEach(p=>cyl(.04,.04,2.2,M(0x6b4a2a),p[0],1.1,p[1],g,6));
  const can=new THREE.Mesh(new THREE.BoxGeometry(2.4,.06,1.6),M(0xffffff,{map:texStripe(a,b)})); can.position.y=2.25; can.rotation.x=.12; can.castShadow=true; g.add(can);
  box(2,.8,1,M(0x9a7a4f),0,.4,0,g); for(let i=0;i<5;i++){ const f=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),M([0xe8853a,0xd94a3a,0xe8c23a,0x7fb04a][i%4])); f.position.set(-.7+i*.35,.92,rnd()*.4-.2); g.add(f); }
  props.stalls.add(g); });
// neighbor doorsteps with lanterns (roots)
props.lanterns=[]; [houses[3],houses[4],houses[5]].forEach(h=>{ const p=h.userData.front.clone(); const g=new THREE.Group(); g.position.copy(p);
  cyl(.03,.03,2.4,M(0x4a3a2a),0,1.2,0,g,6); const l=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),new THREE.MeshBasicMaterial({color:0x554433})); l.position.y=2.5; g.add(l);
  const glow=new THREE.PointLight(0xffc266,0,9); glow.position.y=2.5; g.add(glow); g.userData={bulb:l,glow}; town.add(g); props.lanterns.push(g); });
// association house: the left-front house (houses[4]) gets a sign, a notice board and a big door
const assoc=houses[4]; const assocFront=assoc.userData.front.clone();
const signTex=canvasTex(512,128,(g,w,h)=>{ g.fillStyle='#211D70'; g.fillRect(0,0,w,h); g.strokeStyle='#FED60E'; g.lineWidth=8; g.strokeRect(6,6,w-12,h-12); g.fillStyle='#fff'; g.font='900 64px Cairo'; g.textAlign='center'; g.textBaseline='middle'; g.direction='rtl'; g.fillText('الجمعية الأهلية',w/2,h/2+4); });
props.assocSign=new THREE.Mesh(new THREE.PlaneGeometry(3,.75),new THREE.MeshBasicMaterial({map:signTex})); props.assocSign.position.copy(assocFront).add(new THREE.Vector3(0,3.6,0)); props.assocSign.lookAt(0,3.6,0); town.add(props.assocSign);
props.board=new THREE.Group(); props.board.position.copy(assocFront).add(new THREE.Vector3(2.1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),assoc.rotation.y)); props.board.lookAt(0,0,0);
box(1.8,1.3,.08,M(0x8a6a45),0,1.7,0,props.board); box(1.6,1.1,.02,M(0xc9a36a),0,1.7,.05,props.board); cyl(.05,.05,1.1,M(0x4a3a2a),-.7,.55,0,props.board,6); cyl(.05,.05,1.1,M(0x4a3a2a),.7,.55,0,props.board,6); town.add(props.board);
// big closed door + chain (quiet years)
props.door=new THREE.Group(); props.door.position.copy(assocFront); props.door.lookAt(0,0,0);
const doorL=box(1,2.6,.12,M(0x5a4632),-.5,1.3,.1,props.door), doorR=box(1,2.6,.12,M(0x5a4632),.5,1.3,.1,props.door);
box(2.3,.14,.06,M(0x333333),0,1.3,.2,props.door); const lock=box(.3,.36,.1,M(0xd9b24a),0,1.25,.26,props.door); town.add(props.door);
// 2011: bunting + org signs + megaphone posts
props.bunting=new THREE.Group(); town.add(props.bunting);
const flagCols=[C.pink,C.teal,C.yel,C.white,C.navy];
function buntingLine(a,b,sag=1.2,n=16){ const g=new THREE.Group(); for(let i=0;i<=n;i++){ const t=i/n; const p=new THREE.Vector3().lerpVectors(a,b,t); p.y-=Math.sin(t*Math.PI)*sag;
    const f=new THREE.Mesh(new THREE.ConeGeometry(.22,.45,3),new THREE.MeshBasicMaterial({color:flagCols[i%5],side:THREE.DoubleSide})); f.position.copy(p); f.rotation.x=Math.PI; f.scale.z=.1; f.lookAt(0,p.y,0); f.rotateX(Math.PI); g.add(f); }
  props.bunting.add(g); return g; }
const BL=[]; const tops=[houses[2],houses[4],houses[5],houses[7],houses[3],houses[6]].map(h=>h.userData.front.clone().setY(5.2));
BL.push(buntingLine(tops[0],tops[2]),buntingLine(tops[1],tops[3]),buntingLine(tops[4],tops[5],1.6),buntingLine(tops[0],tops[3],2.2,22));
props.orgSigns=[]; const ORG=['k06','k14','k16','k13','k22','k28','k32','k07'];
[houses[1],houses[2],houses[3],houses[4],houses[5],houses[6],houses[7],houses[8]].forEach((h,i)=>{ const s=sprite(ORG[i],1.5); s.position.copy(h.userData.front).setY(3.4+rnd()*1.2); s.lookAt(0,s.position.y,0); town.add(s); props.orgSigns.push(s); });
// RC building (front center)
const rc=new THREE.Group(); rc.position.set(0,0,-13.5); town.add(rc); props.rc=rc;
props.rcBase=box(11,.4,6,M(0xcfc7b8),0,.2,0,rc);
props.rcWalls=new THREE.Group(); rc.add(props.rcWalls);
box(10.4,5.2,5.4,M(C.navy),0,3,0,props.rcWalls); box(10.8,.3,5.8,M(0x17134A),0,5.75,0,props.rcWalls);
const glassM=new THREE.MeshLambertMaterial({color:0x9fd8e8,emissive:0xffd27a,emissiveIntensity:0}); props.rcGlass=glassM;
[-3.6,3.6].forEach(x=>{ const w=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.4),glassM); w.position.set(x,2.6,2.71); props.rcWalls.add(w); });
const upper=new THREE.Mesh(new THREE.PlaneGeometry(9.4,.9),glassM); upper.position.set(0,4.75,2.71); props.rcWalls.add(upper);
const dframe=new THREE.Mesh(new THREE.PlaneGeometry(2.7,3.1),new THREE.MeshBasicMaterial({color:0x0d0b33})); dframe.position.set(0,1.95,2.705); props.rcWalls.add(dframe);
props.rcDoorL=new THREE.Group(); props.rcDoorL.position.set(-1.3,.4,2.72); props.rcWalls.add(props.rcDoorL); const dl=new THREE.Mesh(new THREE.PlaneGeometry(1.3,3),M(C.teal,{side:THREE.DoubleSide})); dl.position.set(.65,1.5,0); props.rcDoorL.add(dl);
props.rcDoorR=new THREE.Group(); props.rcDoorR.position.set(1.3,.4,2.72); props.rcWalls.add(props.rcDoorR); const dr=new THREE.Mesh(new THREE.PlaneGeometry(1.3,3),M(C.teal,{side:THREE.DoubleSide})); dr.position.set(-.65,1.5,0); props.rcDoorR.add(dr);
props.rcDeco=new THREE.Group(); rc.add(props.rcDeco);
const band=new THREE.Mesh(new THREE.PlaneGeometry(10.4,1.3),new THREE.MeshBasicMaterial({map:texPattern(16,2)})); band.position.set(0,6.55,2.72); props.rcDeco.add(band); box(10.4,1.3,.3,M(C.navy),0,6.55,2.55,props.rcDeco);
const rclogo=sprite('rc_white',1.25); rclogo.position.set(0,4.05,2.75); props.rcDeco.add(rclogo);
props.rcLight=new THREE.PointLight(0xffd27a,0,22); props.rcLight.position.set(0,3,5); rc.add(props.rcLight);
// plaza pattern ring (appears with the RC)
props.ring=new THREE.Mesh(new THREE.RingGeometry(3.6,4.1,64,1),new THREE.MeshBasicMaterial({map:texPattern(48,1),transparent:true})); props.ring.rotation.x=-Math.PI/2; props.ring.position.y=.02; town.add(props.ring);
{ const uv=props.ring.geometry.attributes.uv, pos=props.ring.geometry.attributes.position; for(let i=0;i<uv.count;i++){ const x=pos.getX(i),y=pos.getY(i); const a=(Math.atan2(y,x)/(Math.PI*2)+.5), r=(Math.hypot(x,y)-3.6)/.5; uv.setXY(i,a,r); } uv.needsUpdate=true; }
// people (simple friendly figures) that fill the square as civil society grows
props.people=[]; const SK=[0xf0b48c,0xd99a6c,0xc98458,0xe8a878]; const CL=[C.pink,C.teal,C.yel,C.navy,0xffffff,0xe8853a];
function person(x,z){ const g=new THREE.Group(); g.position.set(x,0,z); const col=M(CL[Math.floor(rnd()*CL.length)]); const h=1.45+rnd()*.3;
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.2,h-.95,6,12),col); body.position.y=(h-.25)/2+.1; g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.15,14,12),M(SK[Math.floor(rnd()*4)])); head.position.y=h; g.add(head);
  if(rnd()<.5){ const sc=new THREE.Mesh(new THREE.SphereGeometry(.17,14,12,0,7,0,Math.PI*.62),M(CL[Math.floor(rnd()*CL.length)])); sc.position.y=h+.01; sc.rotation.x=-.35; g.add(sc); }
  g.lookAt(rnd()*4-2,0,rnd()*4-2); g.userData.ph=rnd()*6; g.visible=false; town.add(g); props.people.push(g); return g; }
for(let i=0;i<34;i++){ const a=rnd()*Math.PI*2, r=4.5+rnd()*6.5; const x=Math.sin(a)*r, z=-Math.cos(a)*r; if(Math.abs(x)<1.6&&z<0&&z>-4.2) continue; person(x,z); }
function showPeople(n){ props.people.forEach((p,i)=>{ if(i<n&&!p.visible) pop(p,1,rnd()*1.2); else if(i>=n&&p.visible) hide(p); }); }
// initial visibility
for(const k of ['assocSign','board','door','bunting','rcBase','rcWalls','rcDeco','ring']) props[k].visible=false;
props.orgSigns.forEach(s=>s.visible=false); BL.forEach(b=>b.visible=false);

/* ---------------- STAGE (things near the visitor) ---------------- */
const stage=new THREE.Group(); scene.add(stage);
// counter (within arm's reach)
const counter=new THREE.Group(); counter.position.set(0,0,-.62); stage.add(counter);
const ctop=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.05,40,1,false,Math.PI*.5,Math.PI),M(C.navy)); ctop.position.y=.93; ctop.rotation.y=Math.PI; counter.add(ctop);
const cedge=new THREE.Mesh(new THREE.CylinderGeometry(.625,.625,.09,40,1,true,Math.PI*.5,Math.PI),new THREE.MeshBasicMaterial({map:texPattern(16,1),side:THREE.DoubleSide})); cedge.position.y=.88; cedge.rotation.y=Math.PI; counter.add(cedge);
cyl(.05,.05,.9,M(0x17134A),0,.45,-.25,counter,10); cyl(.3,.34,.04,M(0x17134A),0,.02,-.25,counter,20);
const SLOTS=[[-.36,-.12],[0,-.3],[.36,-.12],[-.2,-.42],[.2,-.42],[0,-.05]];
// story panel
const PW=1024, PH=600; const pcan=document.createElement('canvas'); pcan.width=PW; pcan.height=PH; const pg=pcan.getContext('2d');
const ptex=new THREE.CanvasTexture(pcan); ptex.colorSpace=THREE.SRGBColorSpace; ptex.anisotropy=8;
const panel=new THREE.Mesh(new THREE.PlaneGeometry(2.1,2.1*PH/PW),new THREE.MeshBasicMaterial({map:ptex,transparent:true,fog:false,toneMapped:false})); panel.position.set(1.6,1.9,-2.15); panel.rotation.y=-.62; stage.add(panel);
function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function wrap(g,text,maxW){ const words=text.split(' '); const lines=[]; let cur=''; for(const w of words){ const t=cur?cur+' '+w:w; if(g.measureText(t).width>maxW&&cur){ lines.push(cur); cur=w; } else cur=t; } if(cur) lines.push(cur); return lines; }
function drawPanel(e, idx, taskText, done){ const g=pg; g.clearRect(0,0,PW,PH); g.direction='rtl';
  g.fillStyle='rgba(33,29,112,.94)'; rr(g,10,34,PW-20,PH-44,44); g.fill(); g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=5; g.stroke();
  // tag pill
  g.font='900 34px Cairo'; const tw=g.measureText(e.tag).width+56; g.fillStyle=hex(C.pink); rr(g,PW-60-tw,6,tw,62,31); g.fill(); g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e.tag,PW-60-tw/2,40);
  if(e.year){ g.direction=/\d/.test(e.year)?'ltr':'rtl'; g.font='900 30px Cairo'; const yw=g.measureText(e.year).width+48; g.fillStyle=hex(C.yel); rr(g,60,6,yw,62,31); g.fill(); g.fillStyle=hex(C.navy); g.fillText(e.year,60+yw/2,40); g.direction='rtl'; }
  g.textAlign='right'; g.textBaseline='alphabetic'; g.fillStyle=hex(C.yel); g.font='900 78px Cairo'; g.fillText(e.title,PW-58,160);
  g.fillStyle='#fff'; g.font='700 37px Cairo'; const lines=wrap(g,e.text,PW-116); lines.forEach((l,i)=>g.fillText(l,PW-58,228+i*58));
  let y=228+lines.length*58+4; g.direction='ltr'; g.textAlign='left'; g.font='700 23px Cairo'; g.fillStyle='rgba(255,255,255,.62)'; wrap(g,e.en,PW-116).forEach((l,i)=>g.fillText(l,58,y+i*30)); g.direction='rtl';
  // task strip
  g.fillStyle=done?hex(C.teal):'rgba(255,255,255,.12)'; rr(g,40,PH-104,PW-80,74,37); g.fill();
  g.fillStyle=done?'#fff':hex(C.yel); g.font='900 34px Cairo'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(taskText,PW/2,PH-65);
  // progress dots
  const n=ERAS.length; for(let i=0;i<n;i++){ g.beginPath(); g.arc(PW/2+(n/2-i-.5)*30,PH-14,i===idx?9:6,0,7); g.fillStyle=i<idx?hex(C.teal):i===idx?hex(C.pink):'rgba(255,255,255,.35)'; g.fill(); }
  ptex.needsUpdate=true; }
// guide (character sticker, always faces the visitor)
const guide=new THREE.Group(); guide.position.set(.62,1.32,-2.2); stage.add(guide); let guideSprite=null, guideName='';
function setGuide(name){ if(name===guideName) return; guideName=name; const old=guideSprite; if(old) hide(old).then(()=>guide.remove(old));
  const s=sprite(name,.8,{fog:false}); guide.add(s); guideSprite=s; pop(s,1,.25); }
// big "next" button on the counter
const nextBtn=new THREE.Group(); nextBtn.position.set(0,1.02,-.22); counter.add(nextBtn);
const nb=new THREE.Mesh(new THREE.CylinderGeometry(.085,.095,.05,28),new THREE.MeshLambertMaterial({color:C.yel,emissive:C.yel,emissiveIntensity:.35})); nextBtn.add(nb);
const nbBase=new THREE.Mesh(new THREE.CylinderGeometry(.115,.125,.03,28),M(0x17134A)); nbBase.position.y=-.035; nextBtn.add(nbBase);
const arrowTex=canvasTex(128,128,(g)=>{ g.strokeStyle='#211D70'; g.lineWidth=16; g.lineCap='round'; g.lineJoin='round'; g.beginPath(); g.moveTo(44,30); g.lineTo(84,64); g.lineTo(44,98); g.stroke(); });
const arr=new THREE.Mesh(new THREE.PlaneGeometry(.1,.1),new THREE.MeshBasicMaterial({map:arrowTex,transparent:true})); arr.rotation.x=-Math.PI/2; arr.position.y=.027; nextBtn.add(arr);
nextBtn.visible=false; nextBtn.userData.hit=.1;

/* ---------------- ITEMS ---------------- */
const items=[]; // active interactive objects: {obj, hit, onUse, home}
function makeItem(kind){ const g=new THREE.Group();
  if(kind==='basket'){ const b=new THREE.Mesh(new THREE.CylinderGeometry(.075,.055,.07,16),M(0xb88a4a)); g.add(b); const rim=new THREE.Mesh(new THREE.TorusGeometry(.075,.01,8,20),M(0x8a6a35)); rim.rotation.x=Math.PI/2; rim.position.y=.035; g.add(rim);
    for(let i=0;i<3;i++){ const br=new THREE.Mesh(new THREE.SphereGeometry(.032,10,8),M(0xd9a05a)); br.scale.set(1.3,.7,1); br.position.set(Math.cos(i*2.1)*.03,.05,Math.sin(i*2.1)*.03); g.add(br); } }
  else if(kind==='notice'){ const t=canvasTex(128,160,(c,w,h)=>{ c.fillStyle='#fffdf5'; c.fillRect(0,0,w,h); c.fillStyle=['#E1148D','#4FC2B6','#211D70'][Math.floor(rnd()*3)]; c.fillRect(12,12,w-24,34); c.fillStyle='#b9b4a6'; for(let i=0;i<5;i++) c.fillRect(14,62+i*18,w-28-(i%2)*30,7); });
    const p=new THREE.Mesh(new THREE.PlaneGeometry(.11,.14),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide})); p.rotation.x=-.5; g.add(p); }
  else if(kind==='key'||kind==='goldkey'){ const m=M(kind==='key'?0x8f949c:0xf2c230); const ring=new THREE.Mesh(new THREE.TorusGeometry(.03,.009,8,18),m); g.add(ring); const st=new THREE.Mesh(new THREE.BoxGeometry(.012,.09,.012),m); st.position.y=-.075; g.add(st);
    const t1=new THREE.Mesh(new THREE.BoxGeometry(.03,.012,.012),m); t1.position.set(.015,-.105,0); g.add(t1); const t2=t1.clone(); t2.position.y=-.085; g.add(t2); g.rotation.z=.4; }
  else if(kind==='stone'){ const s=new THREE.Mesh(new THREE.BoxGeometry(.13,.08,.09),M(0xcfc7b8)); g.add(s); const top=new THREE.Mesh(new THREE.PlaneGeometry(.1,.035),new THREE.MeshBasicMaterial({color:C.pink})); top.position.set(0,0,.046); g.add(top); }
  else if(kind==='mega'){ const s=sprite('k07',.11,{fog:false}); g.add(s); }
  else if(kind==='bulb'){ const s=sprite('k05',.17,{fog:false}); g.add(s); }
  else if(kind.startsWith('s:')){ const s=sprite(kind.slice(2),.12,{fog:false}); g.add(s); g.userData.sticker=kind.slice(2); }
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); g.userData.kind=kind; return g; }
function clearItems(){ for(const it of items){ if(it.obj.parent) hide(it.obj,.2).then(()=>it.obj.parent&&it.obj.parent.remove(it.obj)); } items.length=0; }
const tmpV=new THREE.Vector3(), tmpV2=new THREE.Vector3(), tmpQ=new THREE.Quaternion();
function flyTo(obj, target, o={}){ // world-space arc flight
  obj.getWorldPosition(tmpV); scene.attach(obj); const a=obj.position.clone(), b=target.clone(), s0=obj.scale.x, s1=o.scale??s0; const lift=o.lift??1.2;
  return tween(o.dur||1.1,k=>{ obj.position.lerpVectors(a,b,k); obj.position.y+=Math.sin(k*Math.PI)*lift; obj.scale.setScalar(s0+(s1-s0)*k); if(o.spin) obj.rotation.y+=.2; },{ease:'inOut'}); }

/* ---------------- AUDIO ---------------- */
const music=new Audio('aud/music.mp3'); music.loop=true; music.volume=.5;
const sfxPool={}; function sfx(n,v=.7){ try{ const a=(sfxPool[n]=sfxPool[n]||[]).find(x=>x.paused)||(()=>{ const x=new Audio('aud/'+n+'.mp3'); sfxPool[n].push(x); return x; })(); a.volume=v; a.currentTime=0; a.play().catch(()=>{}); }catch(e){} }

/* ---------------- ERA LOGIC ---------------- */
let eraIdx=-1, used=0, need=0, busy=false, stickerN=0;
const lanternsLit=()=>props.lanterns.forEach(l=>{});
function taskLabel(e){ if(!need) return e.task; return used>=need ? 'تمام! اضغط الزر الأصفر للمتابعة' : `${e.task}  (${used}/${need})`; }
function refreshPanel(){ const e=ERAS[eraIdx]; drawPanel(e,eraIdx,taskLabel(e),need>0&&used>=need); }
function spawnItems(e){ e.items.forEach((k,i)=>{ const obj=makeItem(k); const s=SLOTS[i%SLOTS.length]; obj.position.set(s[0],1.03+(k==='key'||k==='goldkey'?.1:k.startsWith('s:')||k==='mega'||k==='bulb'?.06:0),s[1]); counter.add(obj);
    if(k.startsWith('s:')||k==='mega'||k==='bulb') obj.rotation.x=-.5;
    obj.userData.home=obj.position.clone(); obj.userData.float=rnd()*6; pop(obj,1,.5+i*.12); items.push({obj,hit:.085,kind:k,used:false}); }); }
function showNext(){ if(!nextBtn.visible){ pop(nextBtn,1,.2); sfx('pop',.5); } }
async function gotoEra(i){ if(i>=ERAS.length){ return finale(); } busy=true; eraIdx=i; const e=ERAS[i]; used=0; need=e.need??(e.repeat??e.items.length);
  if(nextBtn.visible) hide(nextBtn); clearItems(); setGuide(e.guide); refreshPanel(); sfx('whoosh',.45); envTo(e.env);
  // world changes per era
  if(e.key==='intro'){ showPeople(6); pop(props.stalls,1); }
  if(e.key==='roots'){ showPeople(9); }
  if(e.key==='kingdom'){ props.lanterns.forEach(l=>{ l.userData.glow.intensity=0; l.userData.bulb.material.color.setHex(0x554433); }); pop(props.assocSign,1,.4); pop(props.board,1,.7); showPeople(14); }
  if(e.key==='quiet'){ pop(props.door,1,.6); hide(props.stalls); showPeople(2); tween(1.5,k=>{ props.assocSign.material.color.setScalar(1-.6*k); }); }
  if(e.key==='2011'){ hide(props.door); props.assocSign.material.color.setScalar(1); pop(props.stalls,1,.3); showPeople(20); }
  if(e.key==='p1'){ showPeople(24); }
  if(e.key==='pledge'){ pop(wall,1,.3); }
  await wait(.4); spawnItems(e); if(!need) showNext(); busy=false; }
async function useItem(it){ if(it.used||busy) return; const e=ERAS[eraIdx]; const k=it.kind; it.used=true; sfx('pop',.6);
  if(k==='basket'){ const L=props.lanterns[used]; used++; refreshPanel(); await flyTo(it.obj,L.position.clone().setY(.12),{lift:2.2,scale:4,dur:1.3}); L.userData.bulb.material.color.setHex(0xffd27a); tween(.8,t=>L.userData.glow.intensity=30*t); sfx('slam',.3); }
  else if(k==='notice'){ const n=used; used++; refreshPanel(); props.board.updateMatrixWorld(); const tgt=props.board.localToWorld(new THREE.Vector3(-.5+n*.5,1.7,.09)); await flyTo(it.obj,tgt,{lift:1.6,scale:3.4,dur:1.2}); it.obj.quaternion.copy(props.board.quaternion); it.obj.children[0].rotation.x=0; it.obj.rotateZ((rnd()-.5)*.3); sfx('slam',.3); }
  else if(k==='key'){ const home=it.obj.userData.home.clone(); props.door.updateMatrixWorld(); const tgt=props.door.localToWorld(new THREE.Vector3(0,1.25,.5)); await flyTo(it.obj,tgt,{lift:1.5,scale:5,dur:1}); sfx('slam',.55);
    const x0=props.door.position.x; await tween(.5,t=>{ props.door.rotation.z=Math.sin(t*26)*.012*(1-t); }); used++; refreshPanel();
    if(used<need){ const w=counter.localToWorld(home.clone()); await flyTo(it.obj,w,{lift:1.2,scale:1,dur:.9}); counter.attach(it.obj); it.obj.position.copy(home); it.used=false; } else { await hide(it.obj); } }
  else if(k==='mega'){ const n=used; used++; refreshPanel(); await flyTo(it.obj,new THREE.Vector3((n-1)*3.2,4.2,-7.5),{lift:1,scale:9,dur:1.1}); it.obj.lookAt(0,1.6,0); sfx('slam',.4);
    if(n===0){ BL.forEach((b,i)=>pop(b,1,i*.15)); props.bunting.visible=true; } if(n===1){ props.orgSigns.forEach((s,i)=>pop(s,1,i*.12)); } if(n===2){ showPeople(34); } }
  else if(k==='stone'){ used++; refreshPanel(); await flyTo(it.obj,new THREE.Vector3(0,.5,-10.6),{lift:2.5,scale:8,dur:1.4}); sfx('slam',.6); pop(props.rcBase,1); props.rcBase.visible=true; await hide(it.obj); }
  else if(k==='goldkey'){ used++; refreshPanel(); props.rcWalls.visible=true; props.rcWalls.scale.set(1,.001,1); await tween(1.6,t=>props.rcWalls.scale.set(1,Math.max(.001,t),1),{ease:'back'}); sfx('slam',.5);
    await flyTo(it.obj,new THREE.Vector3(0,1.8,-10.4),{lift:2,scale:7,dur:1.2}); await tween(1.2,t=>{ props.rcDoorL.rotation.y=-1.9*t; props.rcDoorR.rotation.y=1.9*t; },{ease:'inOut'}); sfx('whoosh',.5); await hide(it.obj); }
  else if(k==='bulb'){ used++; refreshPanel(); await flyTo(it.obj,new THREE.Vector3(0,7.6,-10.6),{lift:1.5,scale:9,dur:1.3}); it.obj.lookAt(0,1.6,0); it.obj.rotation.x=0; sfx('slam',.5);
    pop(props.rcDeco,1); props.rcDeco.visible=true; pop(props.ring,1,.3); tween(1.5,t=>{ props.rcGlass.emissiveIntensity=1.1*t; props.rcLight.intensity=60*t; }); props.lanterns.forEach(l=>{ l.userData.bulb.material.color.setHex(0xffd27a); l.userData.glow.intensity=30; }); showPeople(34); }
  else if(k.startsWith('s:')){ const n=stickerN++; used++; refreshPanel(); wall.updateMatrixWorld(); const col=n%3, row=Math.floor(n/3); const tgt=wall.localToWorld(new THREE.Vector3(-.5+col*.5+(rnd()-.5)*.08,.22-row*.42,.02+n*.002));
    await flyTo(it.obj,tgt,{lift:.5,scale:2.5,dur:.8}); it.obj.quaternion.copy(wall.quaternion); it.obj.rotateZ((rnd()-.5)*.5); sfx('slam',.5); const s=it.obj.scale.x; tween(.35,t=>it.obj.scale.setScalar(s*(1+.25*Math.sin(t*Math.PI)))); }
  if(need>0&&used>=need) showNext(); }
// pledge wall
const wall=new THREE.Group(); wall.position.set(-1.3,1.5,-1.35); wall.rotation.y=.8; stage.add(wall); wall.visible=false;
{ const wb=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.25,.04),M(0xfffdf7)); wb.position.z=-.02; wall.add(wb); const fr=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.35,.03),M(C.navy)); fr.position.z=-.04; wall.add(fr);
  const tt=canvasTex(512,96,(g,w,h)=>{ g.fillStyle='#211D70'; g.font='900 56px Cairo'; g.textAlign='center'; g.textBaseline='middle'; g.direction='rtl'; g.fillText('حيط الوعد',w/2,h/2+4); }); const tm=new THREE.Mesh(new THREE.PlaneGeometry(.9,.17),new THREE.MeshBasicMaterial({map:tt,transparent:true})); tm.position.set(0,.5,.005); wall.add(tm); }
// finale end card
const endCard=new THREE.Group(); endCard.position.set(0,2.0,-2.6); stage.add(endCard); endCard.visible=false;
async function finale(){ busy=true; hide(nextBtn); hide(panel); if(guideSprite) hide(guideSprite); sfx('whoosh',.6); envTo('dusk');
  const bg=new THREE.Mesh(new THREE.PlaneGeometry(2.3,2.25),new THREE.MeshBasicMaterial({color:C.navy,transparent:true,opacity:.96,fog:false})); bg.position.y=-.12; endCard.add(bg);
  const mark=sprite('lin_mark',.5,{fog:false}); mark.position.set(0,.62,.01); endCard.add(mark); const txt=sprite('lin_text',.62,{fog:false}); txt.position.set(0,.02,.01); endCard.add(txt);
  const tp=sprite('tape_partners',.2,{fog:false}); tp.position.set(-.5,-.98,.02); tp.rotation.z=.04; endCard.add(tp); const te=sprite('tape_eu',.26,{fog:false}); te.position.set(.72,-.98,.02); te.rotation.z=-.05; endCard.add(te);
  const th=canvasTex(1024,128,(g,w,h)=>{ g.fillStyle='#FED60E'; g.font='900 70px Cairo'; g.textAlign='center'; g.textBaseline='middle'; g.direction='rtl'; g.fillText('شكرًا.. المكان مكانكم!',w/2,h/2+4); });
  const thm=new THREE.Mesh(new THREE.PlaneGeometry(1.7,.21),new THREE.MeshBasicMaterial({map:th,transparent:true,fog:false})); thm.position.set(0,-.62,.02); endCard.add(thm);
  bg.material.depthWrite=false; bg.renderOrder=10; [mark,txt,thm,tp,te].forEach((m,i)=>{ m.renderOrder=11+i; m.material.depthTest=false; });
  pop(endCard,1,.4); [mark,txt,thm,tp,te].forEach((m,i)=>pop(m,1,.7+i*.18)); await wait(2); sfx('slam',.4); busy=false; done=true; }
let done=false;

/* ---------------- INPUT: controllers, hands, mouse ---------------- */
const ray=new THREE.Raycaster(); ray.far=6;
function targets(){ const t=items.filter(i=>!i.used).map(i=>i.obj); if(nextBtn.visible) t.push(nextBtn); return t; }
function owner(o){ while(o){ if(o===nextBtn) return {next:true}; const it=items.find(i=>i.obj===o); if(it) return {it}; o=o.parent; } return null; }
function activate(o){ if(!o||busy) return; if(o.next){ nb.position.y=-.02; tween(.25,t=>nb.position.y=-.02*(1-t)); sfx('pop',.7); gotoEra(eraIdx+1); } else if(o.it) useItem(o.it); }
function castFrom(origin,dir){ ray.set(origin,dir); const hits=ray.intersectObjects(targets(),true); return hits.length?owner(hits[0].object):null; }
const ctrls=[], hands=[], touchPts=[];
const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-1)]);
for(let i=0;i<2;i++){ const c=renderer.xr.getController(i); const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:C.yel,transparent:true,opacity:.7})); line.scale.z=2.5; c.add(line);
  const dot=new THREE.Mesh(new THREE.SphereGeometry(.012,10,8),new THREE.MeshBasicMaterial({color:C.yel})); c.add(dot);
  c.addEventListener('selectstart',()=>{ c.getWorldPosition(tmpV); c.getWorldDirection(tmpV2).negate(); activate(castFrom(tmpV,tmpV2)); });
  c.addEventListener('connected',e=>{ c.userData.hand=!!(e.data&&e.data.hand); line.visible=true; }); c.addEventListener('disconnected',()=>{ line.visible=false; }); rig.add(c); ctrls.push(c);
  const grip=renderer.xr.getControllerGrip(i); const gm=new THREE.Mesh(new THREE.SphereGeometry(.035,14,12),new THREE.MeshLambertMaterial({color:i?C.pink:C.teal})); grip.add(gm); grip.userData.mesh=gm; rig.add(grip); touchPts.push(grip);
  const hand=renderer.xr.getHand(i); hand.userData.col=i?C.pink:C.teal; rig.add(hand); hands.push(hand); }
const jointGeo=new THREE.SphereGeometry(.009,8,6);
function updateHands(){ for(const h of hands){ const js=h.joints; let any=false; for(const name in js){ const j=js[name]; any=any||j.visible; if(!j.userData.m){ const tip=name.endsWith('tip'); const m=new THREE.Mesh(jointGeo,new THREE.MeshLambertMaterial({color:tip?C.yel:h.userData.col})); m.scale.setScalar(tip?1.5:1); j.add(m); j.userData.m=m; } }
    h.userData.active=any; } // hide the controller ball while that hand is tracked
  touchPts.forEach((g,i)=>g.userData.mesh.visible=!hands[i].userData.active); }
const lastTouch=new Map();
function checkTouch(t){ const pts=[]; hands.forEach(h=>{ const tip=h.joints['index-finger-tip']; if(tip&&h.userData.active) pts.push(tip); }); touchPts.forEach((g,i)=>{ if(!hands[i].userData.active&&g.visible) pts.push(g); });
  if(!pts.length) return; const tg=targets(); for(const p of pts){ p.getWorldPosition(tmpV); if(tmpV.lengthSq()<1e-6) continue; for(const o of tg){ o.getWorldPosition(tmpV2); const r=(o===nextBtn?.085:.1); if(tmpV.distanceTo(tmpV2)<r){ const last=lastTouch.get(o)||0; if(t-last>1.2){ lastTouch.set(o,t); activate(owner(o)); } } } } }
// mouse / touch (screen mode)
let drag=null, yaw=0, pitch=0; const mouse=new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY,moved:false}; });
addEventListener('pointermove',e=>{ if(!drag||renderer.xr.isPresenting) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; if(Math.abs(dx)+Math.abs(dy)>4) drag.moved=true; if(drag.moved){ yaw+=dx*.004; pitch=Math.max(-1,Math.min(1,pitch+dy*.004)); drag.x=e.clientX; drag.y=e.clientY; camera.rotation.set(pitch,yaw,0,'YXZ'); } });
addEventListener('pointerup',e=>{ if(drag&&!drag.moved&&!renderer.xr.isPresenting){ mouse.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1); ray.setFromCamera(mouse,camera); ray.far=8; const h=ray.intersectObjects(targets(),true); if(h.length) activate(owner(h[0].object)); } drag=null; });

/* ---------------- START ---------------- */
let started=false;
async function start(vr){ if(started) return; $('#msg').textContent='';
  if(vr){ if(!navigator.xr){ $('#msg').textContent='المتصفح لا يدعم الواقع الافتراضي. افتح الرابط من متصفح Meta Quest.'; return; }
    try{ const s=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor','hand-tracking']}); await renderer.xr.setSession(s); camera.position.set(0,0,0); camera.rotation.set(0,0,0);
      s.addEventListener('end',()=>{ camera.position.set(0,1.6,0); $('#hint').textContent='اسحب للنظر حولك، واضغط على الأشياء'; }); }
    catch(err){ $('#msg').textContent='تعذّر بدء الواقع الافتراضي: '+err.message; return; } }
  else { yaw=-.3; camera.rotation.set(-.12,yaw,0,'YXZ'); pitch=-.12; $('#hint').textContent='اسحب للنظر حولك، واضغط على الأشياء'; }
  started=true; $('#ui').style.display='none'; music.play().catch(()=>{}); gotoEra(0); }
$('#bvr').onclick=()=>start(true); $('#b2d').onclick=()=>start(false);
if(navigator.xr) navigator.xr.isSessionSupported('immersive-vr').then(ok=>{ if(!ok){ $('#bvr').style.opacity=.5; $('#msg').textContent='الواقع الافتراضي غير متاح على هذا الجهاز. جرّب على الشاشة، أو افتح الرابط من نظارة Quest.'; } }).catch(()=>{});
else $('#bvr').style.opacity=.5;

/* ---------------- LOOP ---------------- */
const clock3=new THREE.Clock(); let T=0, lastShadow=-1;
renderer.setAnimationLoop(()=>{ const dt=Math.min(clock3.getDelta(),window.DEBUG&&DEBUG.fast?.5:.05); T+=dt;
  for(let i=tweens.length-1;i>=0;i--){ const w=tweens[i]; w.t+=dt; if(w.t<0) continue; const k=Math.min(1,w.t/w.dur); w.fn(w.e(k)); if(k>=1){ tweens.splice(i,1); w.res(); } }
  // idle motion
  for(const it of items){ if(!it.used&&it.obj.parent===counter){ it.obj.position.y=it.obj.userData.home.y+Math.sin(T*2+it.obj.userData.float)*.012; if(!it.kind.startsWith('s:')&&it.kind!=='mega'&&it.kind!=='bulb') it.obj.rotation.y+=dt*.6; } }
  if(nextBtn.visible){ nb.material.emissiveIntensity=.35+.3*Math.sin(T*4); }
  if(guideSprite){ guide.position.y=1.32+Math.sin(T*1.3)*.03; guide.lookAt(0,1.5,0); }
  for(const p of props.people){ if(p.visible) p.position.y=Math.abs(Math.sin(T*1.6+p.userData.ph))*.03*(1-envNow.gray); }
  handPivot.rotation.z=-T*.2; clouds.forEach((c,i)=>{ c.position.x+=dt*.15; });
  water.position.y=.5+Math.sin(T*2)*.01;
  if(T-lastShadow>.4){ renderer.shadowMap.needsUpdate=true; lastShadow=T; }
  if(renderer.xr.isPresenting){ updateHands(); checkTouch(T); }
  renderer.render(scene,camera); });

// for testing
window.DEBUG={ info:()=>renderer.info.render, gotoEra, useAll:async()=>{ for(const it of [...items]){ while(!it.used||(it.kind==='key'&&used<need)){ if(!it.used) await useItem(it); else await wait(.1); if(it.kind!=='key') break; } } }, state:()=>({eraIdx,used,need,busy,done}), start };
document.fonts.load('900 40px Cairo').then(()=>document.fonts.load('700 40px Cairo')).then(()=>{ window.READY=true; });
