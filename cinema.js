/* cinema.js — staged cutscenes for the Scripture Game books.

   A cutscene slide may carry a `stage` describing the scene its verse tells:

     {art:'palace', text:'…', ref:'…', stage:{
        set:'palace', time:'day', wx:'rain',               // the place, the hour, the weather
        cast:[ {id:'dawid', x:.3, z:0, face:'r', pose:'lie'},             // the book's own CHARS
               {id:'natan', x:1.1, to:.55, face:'l', pose:'bow', at:1, say:2} ],
        crowd:[ {kind:'soldiers', n:6, x:.75, w:.3, z:.6, face:'l', at:2} ],
        props:[ {k:'throne', x:.5, z:.5} ],
        fx:['glory'], cam:'push' }}

   The painted set, the figures (dressed from the book's CHARS), the props and effects
   are drawn here. The verse is shown beneath as a caption that comes up part by part
   (a part ends at . ; ! ? … or —), and each figure's `at` names the part at which it
   enters, moves (`to`) or takes its `pose`; `say` names the part it speaks. Without this
   file, or on a slide without a stage, each game draws its own slide art as before. */
(function(){
'use strict';
if(typeof Game==='undefined'||typeof drawSlideArt!=='function'||typeof CHARS==='undefined') return;

/* ============================== utilities ============================== */
const PI=Math.PI, TAU=PI*2;
const cl=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>{ t=cl(t,0,1); return t*t*(3-2*t); };
function rng(seed){ let a=(seed>>>0)||1; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; }; }
function strHash(s){ let h=2166136261; s=String(s||''); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
const _hx={};
function rgb(c){
  if(Array.isArray(c)) return c;
  if(_hx[c]) return _hx[c];
  let s=String(c||'#888').trim(), r=136,g=136,b=136;
  if(s[0]==='#'){ if(s.length===4){ r=parseInt(s[1]+s[1],16); g=parseInt(s[2]+s[2],16); b=parseInt(s[3]+s[3],16); }
    else { r=parseInt(s.slice(1,3),16); g=parseInt(s.slice(3,5),16); b=parseInt(s.slice(5,7),16); } }
  else { const m=s.match(/rgba?\(([^)]+)\)/); if(m){ const p=m[1].split(',').map(Number); r=p[0]; g=p[1]; b=p[2]; } }
  return (_hx[c]=[r,g,b]);
}
const css=(a,al)=>al===undefined||al>=1?`rgb(${a[0]|0},${a[1]|0},${a[2]|0})`:`rgba(${a[0]|0},${a[1]|0},${a[2]|0},${(+al).toFixed(3)})`;
function mix(c1,c2,t){ const a=rgb(c1), b=rgb(c2); return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
function mixc(c1,c2,t,al){ return css(mix(c1,c2,t),al); }
function shd(c,amt){ return amt<0?mixc(c,'#0a0706',-amt):mixc(c,'#fff8ec',amt); }
function lin(g,x0,y0,x1,y1,stops){ const gr=g.createLinearGradient(x0,y0,x1,y1); for(const[p,c]of stops) gr.addColorStop(p,c); return gr; }
function rad(g,x,y,r0,r1,stops){ const gr=g.createRadialGradient(x,y,r0,x,y,r1); for(const[p,c]of stops) gr.addColorStop(p,c); return gr; }
function glow(g,x,y,r,c,a){ g.fillStyle=rad(g,x,y,0,r,[[0,css(rgb(c),a)],[1,css(rgb(c),0)]]); g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
function poly(g,pts){ g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) g.lineTo(pts[i][0],pts[i][1]); g.closePath(); }
function ell(g,x,y,rx,ry,rot){ g.beginPath(); g.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,TAU); }
function rr(g,x,y,w,h,r){ r=Math.min(r,w/2,h/2); g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function cap(g,x0,y0,x1,y1,w0,w1){      /* a tapered limb */
  const dx=x1-x0, dy=y1-y0, L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L;
  g.beginPath();
  g.moveTo(x0+nx*w0/2,y0+ny*w0/2); g.lineTo(x1+nx*w1/2,y1+ny*w1/2);
  g.arc(x1,y1,w1/2,Math.atan2(ny,nx),Math.atan2(ny,nx)+PI);
  g.lineTo(x0-nx*w0/2,y0-ny*w0/2);
  g.arc(x0,y0,w0/2,Math.atan2(-ny,-nx),Math.atan2(-ny,-nx)+PI);
  g.closePath();
}
function el(tag,cls,parent){ const e=document.createElement(tag); if(cls) e.className=cls; if(parent) parent.appendChild(e); return e; }

/* ============================== the hour ============================== */
const HOURS={
  dawn:  {sky:['#27325e','#8a6a8a','#f0b98a'], sun:'#ffd9a0', land:'#6d6a58', haze:'#e9b894', lamp:.25, light:'#ffd6a8', amb:'#4a4058', lx:-1, dim:.12},
  day:   {sky:['#4f8fcc','#8dbfe2','#d8e9ee'], sun:'#fff4d6', land:'#8a8a5e', haze:'#cfe0e6', lamp:0,   light:'#fff4dc', amb:'#6c7a8a', lx:1,  dim:0},
  noon:  {sky:['#3f86d0','#86bde6','#e6f0f0'], sun:'#ffffff', land:'#a39468', haze:'#e8eee8', lamp:0,   light:'#ffffff', amb:'#7c8898', lx:1,  dim:0},
  dusk:  {sky:['#231a3a','#8d3f55','#f09a55'], sun:'#ffb070', land:'#5a4a40', haze:'#d98a5e', lamp:.35, light:'#ffb883', amb:'#40304a', lx:-1, dim:.18},
  night: {sky:['#05080f','#0d1428','#1b2544'], sun:'#e8ecf8', land:'#1c2230', haze:'#2a3450', lamp:1,   light:'#b8c4e8', amb:'#1a2238', lx:1,  dim:.45},
  storm: {sky:['#1d2228','#3a434b','#5d6468'], sun:null,      land:'#3e4238', haze:'#5a6266', lamp:.5,  light:'#c8d0d8', amb:'#2c3238', lx:1,  dim:.3},
  glory: {sky:['#3a2c14','#b08a3a','#fff0c0'], sun:'#fffbe8', land:'#8a7448', haze:'#ffe6a8', lamp:0,   light:'#fff2cc', amb:'#6a5a3a', lx:1,  dim:0}
};

/* ============================== layout ============================== */
/* depth z: 0 = the front of the stage (lowest on screen, largest) … 1 = far back */
function S(){ return Stage._lay; }
function layout(set){
  const hz=(set&&set.horizon!=null)?set.horizon:.5;
  const front=.705, back=Math.min(front-.06,hz+.035);
  const H0=Math.min(VH*.33,VW*.2);
  return {hz, front, back, H0,
    gy:z=>VH*lerp(front,back,cl(z||0,0,1.2)),
    sc:z=>lerp(1,.5,cl(z||0,0,1.2)),
    X:x=>VW*x};
}

/* ============================== the figures ============================== */
/* Poses as joint angles (degrees; 0 = straight down, + = toward the way the figure faces):
   lean (torso), head, aF/aB = [shoulder, elbow] for the near and far arm, lF/lB = [hip, knee]. */
const POSES={
  stand: {lean:0,  head:0,  aF:[8,6],    aB:[-6,4],   lF:[3,0],    lB:[-3,0]},
  walk:  {lean:3,  head:0,  aF:[0,10],   aB:[0,10],   lF:[0,0],    lB:[0,0], walk:1},
  run:   {lean:14, head:-4, aF:[0,70],   aB:[0,70],   lF:[0,0],    lB:[0,0], walk:1.9},
  kneel: {lean:2,  head:4,  aF:[38,95],  aB:[30,100], lF:[88,88],  lB:[-4,92], low:1},
  pray:  {lean:0,  head:-8, aF:[150,20], aB:[140,20], lF:[88,88],  lB:[-4,92], low:1},
  bow:   {lean:104,head:12, aF:[32,4],   aB:[26,4],   lF:[12,102], lB:[4,96],   low:1},
  sit:   {lean:-2, head:0,  aF:[25,70],  aB:[18,65],  lF:[90,88],  lB:[86,84]},
  sitground:{lean:6,head:10,aF:[40,70],  aB:[30,80],  lF:[80,150], lB:[70,160], low:1},
  mourn: {lean:22, head:30, aF:[60,150], aB:[55,150], lF:[80,150], lB:[70,160], low:1},
  raise: {lean:-4, head:-18,aF:[165,10], aB:[160,10], lF:[3,0],    lB:[-3,0]},
  bless: {lean:2,  head:-4, aF:[95,-5],  aB:[85,-5],  lF:[3,0],    lB:[-3,0]},
  point: {lean:2,  head:0,  aF:[92,0],   aB:[-6,6],   lF:[5,0],    lB:[-5,0]},
  speak: {lean:3,  head:2,  aF:[40,55],  aB:[-4,8],   lF:[4,0],    lB:[-4,0], talk:1},
  weep:  {lean:14, head:24, aF:[48,135], aB:[44,138], lF:[3,0],    lB:[-3,0]},
  fight: {lean:10, head:-4, aF:[150,30], aB:[40,60],  lF:[22,12],  lB:[-24,6], fight:1},
  strike:{lean:18, head:0,  aF:[70,0],   aB:[20,40],  lF:[26,14],  lB:[-26,8]},
  carry: {lean:-3, head:6,  aF:[45,80],  aB:[40,85],  lF:[3,0],    lB:[-3,0]},
  hold:  {lean:0,  head:0,  aF:[30,70],  aB:[-6,6],   lF:[3,0],    lB:[-3,0]},
  flee:  {lean:18, head:-10,aF:[-30,40], aB:[40,70],  lF:[0,0],    lB:[0,0], walk:2.2},
  lie:   {lean:0,  head:0,  aF:[6,4],    aB:[-4,4],   lF:[2,0],    lB:[-2,0], lie:1},
  dead:  {lean:0,  head:10, aF:[14,8],   aB:[-8,6],   lF:[6,10],   lB:[-4,6], lie:1, still:1},
  fall:  {lean:40, head:30, aF:[120,20], aB:[100,20], lF:[40,60],  lB:[10,40], low:1},
  bound: {lean:12, head:18, aF:[-25,-45],aB:[-30,-40],lF:[3,0],    lB:[-3,0]},
  enthroned:{lean:-3,head:0,aF:[30,75],  aB:[22,70],  lF:[90,88],  lB:[86,84], throne:1},
  dance: {lean:4,  head:-10,aF:[150,40], aB:[120,60], lF:[20,30],  lB:[-10,10], dance:1},
  climb: {lean:10, head:-20,aF:[150,30], aB:[120,40], lF:[40,60],  lB:[-5,10]},
  look:  {lean:-6, head:-22,aF:[10,20],  aB:[-6,6],   lF:[3,0],    lB:[-3,0]}
};
const POSE_NAMES=Object.keys(POSES);

function lookOf(id,extra){
  const c=(CHARS&&CHARS[id])||null;
  const L=Object.assign({skin:'#7a5230',hair:'#2c1a0c',hairStyle:'short',robe:'#8a6a45'},c||{},extra||{});
  if(c&&c.robe===null&&!L.robeGlow){ L.robe='#f4ecd8'; L.robeGlow=true; }
  return L;
}

/* forward kinematics: returns the joints in a frame where the feet are at y=0, x forward */
function fk(P,h){
  const rd=a=>a*PI/180;
  const thigh=.24*h, shin=.24*h, torso=.305*h, upA=.16*h, loA=.145*h, neck=.03*h, hr=.07*h;
  const hip=[0,-.48*h];
  function leg(a,k){ const A=rd(a), K=rd(a-k); const kn=[hip[0]+Math.sin(A)*thigh, hip[1]+Math.cos(A)*thigh];
    const an=[kn[0]+Math.sin(K)*shin, kn[1]+Math.cos(K)*shin]; return [kn,an]; }
  const [kF,anF]=leg(P.lF[0],P.lF[1]), [kB,anB]=leg(P.lB[0],P.lB[1]);
  const L=rd(P.lean);
  const sh=[hip[0]+Math.sin(L)*torso, hip[1]-Math.cos(L)*torso];
  const H=rd(P.lean+P.head);
  const hd=[sh[0]+Math.sin(H)*(neck+hr), sh[1]-Math.cos(H)*(neck+hr)];
  function arm(a,e){ const A=rd(a+P.lean*.5), E=rd(a+P.lean*.5+e); const el=[sh[0]+Math.sin(A)*upA, sh[1]+Math.cos(A)*upA];
    const hn=[el[0]+Math.sin(E)*loA, el[1]+Math.cos(E)*loA]; return [el,hn]; }
  const [eF,hF]=arm(P.aF[0],P.aF[1]), [eB,hB]=arm(P.aB[0],P.aB[1]);
  const J={hip,kF,anF,kB,anB,sh,hd,eF,hF,eB,hB,hr,H,L};
  /* ground the figure: the lowest foot, knee or (bowing) hand rests on y=0 */
  let low=Math.max(anF[1],anB[1]);
  if(P.low){ low=Math.max(low,kF[1]+.01*h,kB[1]+.01*h); if(P.lean>50) low=Math.max(low,hF[1]+.02*h,hB[1]+.02*h,hd[1]+hr*.9); }
  const dy=-low;
  for(const k of ['hip','kF','anF','kB','anB','sh','hd','eF','hF','eB','hB']) J[k]=[J[k][0],J[k][1]+dy];
  return J;
}
function blendPose(A,B,t){
  if(t>=1) return B; if(t<=0) return A;
  const o={};
  for(const k of ['lean','head']) o[k]=lerp(A[k],B[k],t);
  for(const k of ['aF','aB','lF','lB']) o[k]=[lerp(A[k][0],B[k][0],t),lerp(A[k][1],B[k][1],t)];
  o.low=(t>.5?B:A).low; o.lie=B.lie&&t>.5; o.walk=(t>.5?B:A).walk; o.throne=B.throne; o.talk=B.talk; o.fight=B.fight; o.dance=B.dance; o.still=B.still;
  return o;
}
function animPose(P,t,phase){
  if(P.still) return P;
  const o={lean:P.lean,head:P.head,aF:P.aF.slice(),aB:P.aB.slice(),lF:P.lF.slice(),lB:P.lB.slice(),low:P.low,lie:P.lie,throne:P.throne};
  const br=Math.sin(t/700+phase)*1.2;
  o.head+=br*.6; o.aF[0]+=br*.5; o.aB[0]-=br*.4;
  if(P.walk){
    const w=Math.sin(t/(170/P.walk)+phase), amp=P.walk>1.5?38:24;
    o.lF=[w*amp, Math.max(0,-w)*amp*1.3+4]; o.lB=[-w*amp, Math.max(0,w)*amp*1.3+4];
    if(P.aF[1]<30){ o.aF=[-w*amp*.8+P.aF[0], P.aF[1]+8]; o.aB=[w*amp*.8+P.aB[0], P.aB[1]+8]; }
  }
  if(P.talk){ const s=Math.sin(t/260+phase); o.aF=[P.aF[0]+s*14, P.aF[1]+s*10]; o.head+=Math.sin(t/330+phase)*3; }
  if(P.fight){ const s=Math.sin(t/220+phase); o.aF=[P.aF[0]+s*35, P.aF[1]+Math.max(0,s)*30]; o.lean+=s*4; }
  if(P.dance){ const s=Math.sin(t/240+phase); o.aF[0]+=s*25; o.aB[0]-=s*25; o.lF[0]+=s*18; o.lB[0]-=s*12; o.lean+=s*6; }
  return o;
}

/* held things, drawn in the near hand (hx,hy) at scale h */
function drawHeld(g,k,hx,hy,h,face,t,J){
  const u=h/100;
  g.save(); g.translate(hx,hy);
  switch(k){
    case 'staff': case 'rod':
      g.strokeStyle='#6a4a28'; g.lineWidth=u*2.2; g.lineCap='round';
      g.beginPath(); g.moveTo(u*1,u*14); g.lineTo(-u*2,-u*42); g.stroke();
      g.beginPath(); g.arc(-u*5,-u*42,u*3.5,0,PI); g.stroke(); break;
    case 'spear':
      g.strokeStyle='#5a4028'; g.lineWidth=u*1.8; g.lineCap='round';
      g.beginPath(); g.moveTo(u*2,u*18); g.lineTo(-u*3,-u*52); g.stroke();
      g.fillStyle='#b8b8b0'; poly(g,[[-u*3,-u*52],[-u*5.5,-u*60],[-u*1,-u*62],[-u*.8,-u*52]]); g.fill(); break;
    case 'sword':
      g.rotate(-.5);
      g.fillStyle='#d8dde0'; poly(g,[[-u*1.2,-u*2],[u*1.2,-u*2],[u*.6,-u*30],[0,-u*33],[-u*.6,-u*30]]); g.fill();
      g.fillStyle='#8a6a2a'; g.fillRect(-u*4,-u*2.5,u*8,u*2); g.fillRect(-u*1,-u*.5,u*2,u*6); break;
    case 'scroll': case 'book':
      g.fillStyle='#e8dcb8'; rr(g,-u*6,-u*3,u*12,u*6,u*1); g.fill();
      g.fillStyle='#8a6a3a'; g.fillRect(-u*7,-u*4,u*2,u*8); g.fillRect(u*5,-u*4,u*2,u*8); break;
    case 'tablets':
      for(const dx of [-u*5,u*1]){ g.fillStyle='#b8b0a0'; rr(g,dx,-u*14,u*7,u*14,u*3); g.fill();
        g.fillStyle='rgba(80,70,60,.45)'; for(let i=0;i<4;i++) g.fillRect(dx+u*1.2,-u*11+i*u*2.6,u*4.5,u*.7); } break;
    case 'torch': case 'lamp':
      if(k==='torch'){ g.fillStyle='#5a3a1c'; g.fillRect(-u*1,-u*14,u*2,u*16); }
      else { g.fillStyle='#b07a3a'; ell(g,0,-u*1,u*4,u*2.2); g.fill(); }
      { const fy=k==='torch'?-u*16:-u*4, f=1+Math.sin(t/90)*.12;
        glow(g,0,fy,u*16,'#ffb050',.35);
        g.fillStyle='#ffcf6a'; ell(g,0,fy,u*2.6*f,u*4.4*f); g.fill(); g.fillStyle='#fff3c0'; ell(g,0,fy+u*1,u*1.2,u*2); g.fill(); } break;
    case 'jar': case 'jug': case 'pitcher':
      g.fillStyle='#a8683a'; ell(g,0,-u*6,u*5,u*6.5); g.fill(); g.fillRect(-u*2.2,-u*14,u*4.4,u*3); break;
    case 'basket':
      g.fillStyle='#9a7a40'; poly(g,[[-u*7,-u*7],[u*7,-u*7],[u*5,u*3],[-u*5,u*3]]); g.fill();
      g.fillStyle='#6a3a5a'; for(let i=0;i<4;i++){ ell(g,-u*4.5+i*u*3,-u*8,u*1.8,u*1.8); g.fill(); } break;
    case 'bread': g.fillStyle='#c89a58'; ell(g,0,-u*2,u*6,u*3); g.fill(); break;
    case 'cup':
      g.fillStyle='#d4b050'; poly(g,[[-u*3,-u*8],[u*3,-u*8],[u*1,-u*2],[-u*1,-u*2]]); g.fill(); g.fillRect(-u*.6,-u*2,u*1.2,u*3); g.fillRect(-u*2,u*1,u*4,u*1); break;
    case 'harp': case 'lyre':
      g.strokeStyle='#8a5a28'; g.lineWidth=u*1.6; g.beginPath(); g.moveTo(-u*4,u*4); g.lineTo(-u*6,-u*16); g.moveTo(u*4,u*4); g.lineTo(u*6,-u*16);
      g.moveTo(-u*7,-u*15); g.lineTo(u*7,-u*15); g.moveTo(-u*4,u*4); g.lineTo(u*4,u*4); g.stroke();
      g.strokeStyle='rgba(240,230,200,.8)'; g.lineWidth=u*.4; for(let i=-2;i<=2;i++){ g.beginPath(); g.moveTo(i*u*1.4,u*4); g.lineTo(i*u*2,-u*15); g.stroke(); } break;
    case 'shofar': case 'trumpet':
      g.strokeStyle='#d8c090'; g.lineWidth=u*2.4; g.lineCap='round'; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(u*10,-u*4,u*14,-u*14); g.stroke();
      g.lineWidth=u*4; g.beginPath(); g.moveTo(u*13,-u*12); g.lineTo(u*15,-u*16); g.stroke(); break;
    case 'bow':
      g.strokeStyle='#6a4520'; g.lineWidth=u*1.6; g.beginPath(); g.arc(u*2,0,u*14,-1.2,1.2); g.stroke();
      g.strokeStyle='rgba(230,220,200,.7)'; g.lineWidth=u*.4; g.beginPath(); g.moveTo(u*2+Math.cos(-1.2)*u*14,Math.sin(-1.2)*u*14); g.lineTo(u*2+Math.cos(1.2)*u*14,Math.sin(1.2)*u*14); g.stroke(); break;
    case 'sling': g.strokeStyle='#7a5a30'; g.lineWidth=u*.8; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(-u*6,u*10,-u*2,u*14); g.stroke();
      g.fillStyle='#8a8a80'; ell(g,-u*2,u*14,u*2,u*2); g.fill(); break;
    case 'stone': g.fillStyle='#8a8578'; ell(g,0,-u*1,u*3.2,u*2.8); g.fill(); break;
    case 'crown':
      g.fillStyle='#e0b840'; poly(g,[[-u*5,0],[u*5,0],[u*5,-u*5],[u*2.5,-u*2.5],[0,-u*6],[-u*2.5,-u*2.5],[-u*5,-u*5]]); g.fill(); break;
    case 'child': case 'baby':
      g.fillStyle='#efe4cc'; ell(g,0,-u*3,u*7,u*4.5,-.3); g.fill(); g.fillStyle='#a87a50'; ell(g,u*4.5,-u*6,u*3,u*3); g.fill(); break;
    case 'lamb':
      g.fillStyle='#efeae0'; ell(g,0,-u*3,u*7,u*4.5); g.fill(); g.fillStyle='#3a3028'; ell(g,u*6,-u*5,u*2.2,u*2); g.fill(); break;
    case 'bowl': case 'censer':
      g.fillStyle='#c8a048'; ell(g,0,-u*2,u*6,u*3); g.fill();
      if(k==='censer'){ for(let i=0;i<3;i++){ g.fillStyle='rgba(220,220,230,'+(.25-i*.07)+')'; ell(g,Math.sin(t/500+i)*u*3,-u*(8+i*7),u*(3+i*2),u*(3+i*2)); g.fill(); } } break;
    case 'branch': case 'almond':
      g.strokeStyle='#6a4a30'; g.lineWidth=u*1.4; g.beginPath(); g.moveTo(0,0); g.lineTo(-u*4,-u*22); g.moveTo(-u*2,-u*10); g.lineTo(u*4,-u*16); g.stroke();
      g.fillStyle='#f4e8f0'; for(const[px,py]of[[-u*4,-u*22],[u*4,-u*16],[-u*3,-u*16],[-u*1,-u*6]]){ ell(g,px,py,u*2,u*2); g.fill(); } break;
    case 'yoke':
      g.fillStyle='#6a4a28'; g.fillRect(-u*14,-u*3,u*28,u*3); g.fillRect(-u*11,-u*3,u*1.5,u*8); g.fillRect(u*9.5,-u*3,u*1.5,u*8); break;
    case 'girdle': case 'belt':
      g.strokeStyle='#b8a878'; g.lineWidth=u*2; g.beginPath(); g.moveTo(-u*6,0); g.quadraticCurveTo(0,u*6,u*6,0); g.stroke(); break;
    case 'shield':
      g.fillStyle='#8a6a30'; ell(g,0,-u*6,u*8,u*11); g.fill(); g.strokeStyle='#caa050'; g.lineWidth=u*1; g.stroke(); break;
    case 'oil': case 'horn':
      g.fillStyle='#d8c090'; poly(g,[[-u*2,0],[u*2,0],[u*6,-u*12],[u*3,-u*13]]); g.fill(); break;
  }
  g.restore();
}

/* a smooth closed path through points (quadratic curves between midpoints) */
function smooth(g,pts){
  const n=pts.length; g.beginPath();
  const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
  let s0=m(pts[n-1],pts[0]); g.moveTo(s0[0],s0[1]);
  for(let i=0;i<n;i++){ const p=pts[i], q=m(pts[i],pts[(i+1)%n]); g.quadraticCurveTo(p[0],p[1],q[0],q[1]); }
  g.closePath();
}
function limb(g,pts,w,col,out,ow){          /* a limb as one round-jointed stroke, outlined */
  g.lineCap='round'; g.lineJoin='round';
  g.beginPath(); g.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) g.lineTo(pts[i][0],pts[i][1]);
  if(out){ g.strokeStyle=out; g.lineWidth=w+ow*2; g.stroke(); }
  g.strokeStyle=col; g.lineWidth=w; g.stroke();
}
/* one figure, feet at (x,y), height h */
function drawFigure(g,x,y,h,L,P,face,t,o){
  o=o||{};
  const hour=Stage._hour||HOURS.day, lx=hour.lx||1;
  const dir=face==='l'?-1:1, u=h/100;
  const J=fk(P,h);
  const lean=J.L, cs=Math.cos(lean), sn=Math.sin(lean);
  const along=(p,a,b)=>[p[0]+a*cs-b*sn,p[1]+a*sn+b*cs];            /* offset in the torso's frame */
  const lit=(lx*dir)>0;
  const robe=L.robe||'#8a6a45', skin=L.skin||'#7a5230';
  const robeLit=shd(robe,.16), robeDark=shd(robe,-.34), robeMid=css(rgb(robe));
  const skinN=shd(skin,lit?.1:-.02), skinF=shd(skin,-.28);
  const out='rgba(14,9,6,.72)', ow=Math.max(.8,u*.55);
  g.save();
  g.translate(x,y);
  if(P.lie){ g.translate(dir*h*.48,-h*.085); g.rotate(dir>0?-PI/2:PI/2); }
  g.scale(dir,1);
  if(o.alpha!=null) g.globalAlpha*=o.alpha;
  /* wings, behind everything */
  if(L.angel||L.malak||o.wings){
    const flap=Math.sin(t/520)*.08;
    g.save(); g.translate(J.sh[0]-u*4,J.sh[1]+u*5);
    for(const k of [1,.78]){
      g.fillStyle=k===1?'rgba(250,247,236,.96)':'rgba(222,216,198,.92)';
      g.beginPath(); g.moveTo(0,0);
      g.bezierCurveTo(-u*28*k,-u*(40+flap*60)*k,-u*60*k,-u*(12+flap*40)*k,-u*52*k,u*36*k);
      g.bezierCurveTo(-u*36*k,u*26*k,-u*22*k,u*32*k,-u*6,u*28);
      g.closePath(); g.fill(); g.strokeStyle='rgba(120,110,80,.45)'; g.lineWidth=ow; g.stroke();
      g.strokeStyle='rgba(170,160,130,.45)'; g.lineWidth=u*.6;
      for(let i=1;i<6;i++){ g.beginPath(); g.moveTo(-u*7*i*k,u*(3+i)*k); g.lineTo(-u*(14+i*8)*k,u*(22+i*2.4)*k); g.stroke(); }
    }
    g.restore();
  }
  if(L.robeGlow||L.glow||L.angel) glow(g,J.sh[0],J.sh[1]+u*12,h*.62,L.angel?'#fff6d8':'#fff0c0',.32);
  const armW=u*8.6, legW=u*9.5;
  /* far arm and leg */
  limb(g,[along(J.sh,-u*2,u*3),J.eB,J.hB],armW,robeDark,out,ow);
  g.fillStyle=skinF; ell(g,J.hB[0],J.hB[1],u*3.1,u*3.3); g.fill();
  if(o.hold2) drawHeld(g,o.hold2,J.hB[0],J.hB[1],h,face,t,J);
  if(L.short){ limb(g,[J.hip,J.kB,J.anB],legW*.8,skinF,out,ow); }
  g.fillStyle='#2e1e12'; ell(g,J.anB[0]+u*2.6,J.anB[1]+u*.3,u*4.6,u*1.9); g.fill();
  /* the robe, one silhouette from the shoulders to the hem, following the legs */
  const hemK=L.short?.45:.9;
  const hemF=[lerp(J.kF[0],J.anF[0],hemK),lerp(J.kF[1],J.anF[1],hemK)], hemB=[lerp(J.kB[0],J.anB[0],hemK),lerp(J.kB[1],J.anB[1],hemK)];
  const flare=L.short?u*2.5:u*9;
  const shF=along(J.sh,u*10.5,u*1.5), shB=along(J.sh,-u*11.5,u*1.5), neckF=along(J.sh,u*4.5,-u*1), neckB=along(J.sh,-u*5,-u*1);
  const chest=along(J.sh,u*13,u*10), waistF=along(J.hip,u*11,-u*4), waistB=along(J.hip,-u*11.5,-u*4), back=along(J.sh,-u*13,u*11);
  const kneeF=[J.kF[0]+u*8,J.kF[1]], kneeB=[J.kB[0]-u*8,J.kB[1]];
  const pts=[neckB,neckF,shF,chest,waistF,kneeF,[hemF[0]+flare,hemF[1]+u*.5],[hemF[0]+flare*.3,hemF[1]+u*1.8],[hemB[0]-flare*.3,hemB[1]+u*1.8],[hemB[0]-flare,hemB[1]+u*.5],kneeB,waistB,back,shB];
  g.fillStyle=lin(g,-u*14,0,u*14,0,[[0,robeDark],[.5,robeMid],[.85,robeLit],[1,robeMid]]);
  smooth(g,pts); g.fill(); g.strokeStyle=out; g.lineWidth=ow; g.stroke();
  /* folds */
  g.save(); smooth(g,pts); g.clip();
  g.strokeStyle='rgba(0,0,0,.16)'; g.lineWidth=u*1.1;
  for(const k of [-.35,.05,.4]){ const a=[lerp(waistB[0],waistF[0],.5+k*.8),lerp(waistB[1],waistF[1],.5+k*.8)], b=[lerp(hemB[0],hemF[0],.5+k),lerp(hemB[1],hemF[1],.5+k)+u*2];
    g.beginPath(); g.moveTo(a[0],a[1]); g.quadraticCurveTo(lerp(a[0],b[0],.5)+u*k*4,lerp(a[1],b[1],.5),b[0],b[1]); g.stroke(); }
  g.strokeStyle='rgba(255,250,235,.12)'; g.lineWidth=u*.9; g.beginPath(); g.moveTo(chest[0]-u*1.5,chest[1]); g.quadraticCurveTo(waistF[0]-u*1,waistF[1],kneeF[0]-u*2,kneeF[1]); g.stroke();
  if(L.mantle||L.collar||L.old){ const mc=L.mantle||shd(robe,-.18); g.fillStyle=mc; g.globalAlpha*=.9;
    smooth(g,[neckB,along(J.sh,-u*1,u*2),along(J.hip,-u*3,-u*6),[lerp(J.hip[0],hemB[0],.8)-u*2,lerp(J.hip[1],hemB[1],.8)],[hemB[0]-flare,hemB[1]+u*1],kneeB,waistB,back,shB]); g.fill(); g.globalAlpha/= .9; }
  if(L.armor){ g.fillStyle=lin(g,-u*10,0,u*10,0,[[0,shd(L.armor,-.35)],[.6,css(rgb(L.armor))],[1,shd(L.armor,.2)]]);
    smooth(g,[shB,shF,chest,along(J.hip,u*9,-u*1),along(J.hip,-u*9,-u*1),back]); g.fill();
    g.strokeStyle='rgba(40,28,10,.45)'; g.lineWidth=u*.7; for(let i=1;i<5;i++){ const a=along(J.sh,-u*10,u*(3+i*5.5)), b=along(J.sh,u*11,u*(3+i*5.5)); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); } }
  const sash=L.robeLine||L.sash||(L.collar&&!L.armor?L.collar:null)||shd(robe,-.4);
  { const a=along(J.hip,-u*12,-u*5.5), b=along(J.hip,u*11.5,-u*5.5), c=along(J.hip,u*11.5,-u*2), d=along(J.hip,-u*12,-u*2);
    g.fillStyle=sash; poly(g,[a,b,c,d]); g.fill(); if(L.robeLine||L.sash){ g.fillStyle=sash; poly(g,[b,c,[c[0]+u*1.5,c[1]+u*9],[b[0]+u*3,b[1]+u*8]]); g.fill(); } }
  if(L.collar&&!L.armor){ g.strokeStyle=L.collar; g.lineWidth=u*2; g.beginPath(); g.moveTo(neckB[0],neckB[1]+u*1); g.quadraticCurveTo(J.sh[0],J.sh[1]+u*5,neckF[0]+u*1,neckF[1]+u*1.5); g.stroke(); }
  if(L.sack){ g.strokeStyle='rgba(20,14,8,.4)'; g.lineWidth=u*.6; for(let i=0;i<7;i++){ g.beginPath(); g.moveTo(waistB[0]+i*u*3,waistB[1]); g.lineTo(hemB[0]+i*u*4,hemB[1]); g.stroke(); } }
  g.restore();
  /* near leg's foot */
  if(L.short){ limb(g,[J.hip,J.kF,J.anF],legW*.8,skinN,out,ow); }
  g.fillStyle='#2e1e12'; ell(g,J.anF[0]+u*2.6,J.anF[1]+u*.3,u*4.8,u*2); g.fill();
  g.fillStyle=skinN; ell(g,J.anF[0]+u*3.4,J.anF[1]-u*1.1,u*2.8,u*1.3); g.fill();
  /* the head */
  const hx=J.hd[0], hy=J.hd[1], hr=J.hr*1.18, H=J.H;
  const hair=L.hair||'#2c1a0c';
  g.save(); g.translate(hx,hy); g.rotate(H*.6);
  g.fillStyle=skinN; g.fillRect(-hr*.35,hr*.55,hr*.62,hr*.7);          /* neck */
  const covered=L.headcover||L.veil;
  if(L.hairStyle==='long'&&!covered){ g.fillStyle=hair; smooth(g,[[-hr*.9,-hr*.5],[hr*.3,-hr*1.05],[-hr*.1,hr*.9],[-hr*.25,hr*2.3],[-hr*1.2,hr*2.4],[-hr*1.2,hr*.6]]); g.fill(); }
  if(covered){ g.fillStyle=shd(covered,-.25); smooth(g,[[-hr*1.05,-hr*.2],[-hr*.4,hr*.8],[-hr*.5,hr*2.3],[-hr*1.45,hr*2.45],[-hr*1.3,hr*.9]]); g.fill(); }
  g.fillStyle=skinN; ell(g,0,0,hr*.92,hr); g.fill(); g.strokeStyle=out; g.lineWidth=ow; g.stroke();
  g.fillStyle=skinN; smooth(g,[[hr*.72,-hr*.35],[hr*1.12,hr*.12],[hr*.95,hr*.3],[hr*.7,hr*.28]]); g.fill();                /* nose */
  g.fillStyle='rgba(255,255,255,.08)'; ell(g,hr*.35,-hr*.4,hr*.35,hr*.25); g.fill();
  g.fillStyle=skinF; ell(g,-hr*.12,hr*.02,hr*.17,hr*.25); g.fill();                                                           /* ear */
  const eyeOpen=!(P.lie&&o.dead)&&!(P===POSES.pray||P.head>20);
  if(eyeOpen){ g.fillStyle='#f4ece0'; ell(g,hr*.5,-hr*.13,hr*.16,hr*.1); g.fill(); g.fillStyle='#1a120a'; ell(g,hr*.58,-hr*.12,hr*.08,hr*.1); g.fill(); }
  else { g.strokeStyle='#1a120a'; g.lineWidth=ow; g.beginPath(); g.moveTo(hr*.38,-hr*.1); g.lineTo(hr*.66,-hr*.08); g.stroke(); }
  g.strokeStyle=L.beard||hair; g.lineWidth=hr*.13; g.lineCap='round'; g.beginPath(); g.moveTo(hr*.32,-hr*.36); g.lineTo(hr*.72,-hr*.33); g.stroke();   /* brow */
  if(!L.beard){ g.strokeStyle='rgba(90,40,30,.7)'; g.lineWidth=ow; g.beginPath(); g.moveTo(hr*.62,hr*.52); g.lineTo(hr*.82,hr*.5); g.stroke(); }
  if(L.beard){ g.fillStyle=L.beard; const ln=L.old?1.75:1.3;
    smooth(g,[[-hr*.15,hr*.05],[hr*.2,hr*.42],[hr*.55,hr*.38],[hr*.98,hr*.45],[hr*.85,hr*ln*.95],[hr*.35,hr*ln],[-hr*.25,hr*.75]]); g.fill();
    g.strokeStyle='rgba(0,0,0,.25)'; g.lineWidth=ow*.8; g.beginPath(); g.moveTo(hr*.55,hr*.5); g.lineTo(hr*.85,hr*.48); g.stroke(); }
  if(L.hairStyle==='pharaoh'||L.hairStyle==='egypt'){
    const ph=L.hairStyle==='pharaoh';
    g.fillStyle=ph?'#2a4a8a':'#e8e0cc';
    smooth(g,[[-hr*1.05,-hr*.55],[-hr*.1,-hr*1.12],[hr*.62,-hr*.85],[hr*.55,-hr*.25],[hr*.05,-hr*.2],[-hr*.1,hr*1.7],[-hr*1.3,hr*1.5]]); g.fill();
    g.strokeStyle=ph?'#e0b840':'#b8a888'; g.lineWidth=hr*.12;
    for(let i=0;i<4;i++){ g.beginPath(); g.moveTo(-hr*(1.05-i*.12),-hr*(.35-i*.45)); g.lineTo(hr*(.35-i*.1),-hr*(.85-i*.35)); g.stroke(); }
    if(ph){ g.fillStyle='#e0b840'; poly(g,[[hr*.45,-hr*.95],[hr*.8,-hr*1.4],[hr*.82,-hr*.9]]); g.fill(); }
  } else if(covered){
    g.fillStyle=css(rgb(covered));
    smooth(g,[[-hr*1.1,-hr*.1],[-hr*.7,-hr*1.02],[hr*.2,-hr*1.18],[hr*.78,-hr*.62],[hr*.62,-hr*.38],[hr*.1,-hr*.5],[-hr*.22,hr*.25],[-hr*.35,hr*1.2],[-hr*1.25,hr*1.1]]); g.fill();
    g.strokeStyle=out; g.lineWidth=ow; g.stroke();
    if(L.headcover&&!L.veil){ g.strokeStyle=shd(covered,-.45); g.lineWidth=hr*.16; g.beginPath(); g.moveTo(-hr*.95,-hr*.55); g.quadraticCurveTo(-hr*.1,-hr*.95,hr*.66,-hr*.6); g.stroke(); }
  } else if(L.hairStyle!=='bald'){
    g.fillStyle=hair; smooth(g,[[-hr*.95,hr*.2],[-hr*.98,-hr*.5],[-hr*.4,-hr*1.08],[hr*.35,-hr*1.05],[hr*.78,-hr*.62],[hr*.4,-hr*.66],[-hr*.1,-hr*.55],[-hr*.35,hr*.05],[-hr*.6,hr*.45]]); g.fill();
  }
  if(L.crown||o.crown){ g.fillStyle='#e6bf45'; const cy=-hr*.78; poly(g,[[-hr*.75,cy+hr*.28],[hr*.65,cy+hr*.28],[hr*.72,cy-hr*.42],[hr*.38,cy-hr*.04],[hr*.02,cy-hr*.55],[-hr*.32,cy-hr*.04],[-hr*.72,cy-hr*.42]]); g.fill();
    g.strokeStyle='rgba(90,60,10,.6)'; g.lineWidth=ow*.8; g.stroke(); g.fillStyle='#b8303a'; ell(g,-hr*.02,cy+hr*.08,hr*.1,hr*.1); g.fill(); }
  if(L.helmet){ g.fillStyle=lin(g,-hr,0,hr,0,[[0,shd(L.helmet,-.3)],[.6,css(rgb(L.helmet))],[1,shd(L.helmet,.2)]]); g.beginPath(); g.arc(0,-hr*.12,hr*1.05,PI*.98,TAU+.05); g.closePath(); g.fill(); g.fillRect(-hr*1.05,-hr*.2,hr*.5,hr*.95);
    g.strokeStyle=out; g.lineWidth=ow; g.stroke();
    if(L.crest){ g.fillStyle=L.crest; smooth(g,[[-hr*1.1,-hr*.9],[-hr*.4,-hr*1.55],[hr*.5,-hr*1.25],[hr*.1,-hr*1.0]]); g.fill(); } }
  if(L.halo||L.angel){ g.strokeStyle='rgba(255,236,170,.75)'; g.lineWidth=u*1; ell(g,0,-hr*1.35,hr*.9,hr*.26); g.stroke(); }
  g.restore();
  /* near arm, sleeve and hand, and what it holds */
  limb(g,[along(J.sh,u*2,u*3),J.eF,J.hF],armW*1.04,robeLit,out,ow);
  { const dx=J.hF[0]-J.eF[0], dy=J.hF[1]-J.eF[1], Ld=Math.hypot(dx,dy)||1, nx=-dy/Ld, ny=dx/Ld, wx=J.eF[0]+dx*.72, wy=J.eF[1]+dy*.72;
    g.fillStyle=robeLit; poly(g,[[wx+nx*armW*.5,wy+ny*armW*.5],[wx-nx*armW*.5,wy-ny*armW*.5],[wx-nx*armW*.85+dx/Ld*u*2.5,wy-ny*armW*.85+dy/Ld*u*2.5],[wx+nx*armW*.85+dx/Ld*u*2.5,wy+ny*armW*.85+dy/Ld*u*2.5]]); g.fill(); }
  g.fillStyle=skinN; ell(g,J.hF[0],J.hF[1],u*3.3,u*3.5); g.fill(); g.strokeStyle=out; g.lineWidth=ow*.8; g.stroke();
  if(o.hold) drawHeld(g,o.hold,J.hF[0],J.hF[1],h,face,t,J);
  if(o.blanket){ g.fillStyle=o.blanket; smooth(g,[[J.anF[0]+u*6,J.anF[1]+u*3],[J.anB[0]-u*8,J.anB[1]+u*3],[J.hip[0]-u*12,J.hip[1]],[J.sh[0]-u*12,J.sh[1]+u*6],[J.sh[0]+u*12,J.sh[1]+u*6],[J.hip[0]+u*14,J.hip[1]]]); g.fill(); g.strokeStyle=out; g.lineWidth=ow; g.stroke(); }
  g.restore();
  return J;
}
function figureShadow(g,x,y,h,P){
  const hr=Stage._hour||HOURS.day;
  const len=(hr===HOURS.dusk||hr===HOURS.dawn)?1.8:1;
  g.fillStyle='rgba(8,6,4,'+(.32-hr.dim*.2).toFixed(2)+')';
  ell(g,x-(hr.lx||1)*h*.06*(len-1),y+h*.005,h*(P&&P.lie?.34:.13)*len,h*.028); g.fill();
}

/* ============================== crowds ============================== */
const PAL={
  robes:['#8a6a45','#6e5a3a','#7a4a3a','#5a5a48','#9a8a64','#6a5448','#7d6a52','#4e4a3e','#8d7050','#5e4a3a','#a08058','#6a6040'],
  skins:['#7a5230','#6e4524','#83552d','#8a5a34','#6a4424','#946640','#5e3c1e'],
  hairs:['#1d1208','#2c1a0c','#3a2716','#23150b','#4a3420'],
  veils:['#c8b890','#8a6a5a','#6a5a7a','#b0a080','#7a6a4a','#a07a6a']
};
const SIDES={
  yasharal:{robe:'#5a6a8a',armor:'#9a8250',helmet:'#8a7a50',crest:null},
  bavel:   {robe:'#7a2a2a',armor:'#a88a48',helmet:'#9a8040',crest:'#c83a2a'},
  ashshur: {robe:'#5a2a3a',armor:'#707078',helmet:'#686870',crest:'#3a2a2a'},
  mitsrayim:{robe:'#e8e0cc',armor:'#c8a048',helmet:null,crest:null,short:1,egypt:1},
  pelishtim:{robe:'#6a5a3a',armor:'#9a9060',helmet:'#a89a68',crest:'#d8c8a0'},
  aram:    {robe:'#6a4a2a',armor:'#8a7a58',helmet:'#7a6a48',crest:'#6a2a1a'},
  yawan:   {robe:'#7a2a2a',armor:'#c8a048',helmet:'#c8a048',crest:'#b8202a'},
  paras:   {robe:'#4a3a6a',armor:'#a88a48',helmet:null,crest:null},
  rome:    {robe:'#8a2020',armor:'#b0a080',helmet:'#b8a060',crest:'#c02020'}
};
function crowdLook(kind,side,r){
  const pick=a=>a[Math.floor(r()*a.length)];
  const L={skin:pick(PAL.skins),hair:pick(PAL.hairs),hairStyle:'short',robe:pick(PAL.robes)};
  if(r()<.55) L.beard=L.hair;
  switch(kind){
    case 'soldiers': case 'army': case 'guards': {
      const sd=SIDES[side]||SIDES.yasharal;
      L.robe=mixc(sd.robe,pick(PAL.robes),.15); L.armor=sd.armor; if(sd.helmet){ L.helmet=sd.helmet; L.crest=sd.crest; }
      if(sd.egypt){ L.hairStyle='egypt'; L.beard=null; } L.short=1; L.beard=sd.egypt?null:L.hair; break; }
    case 'kohanim': case 'levites': L.robe='#ece6d6'; L.headcover=kind==='kohanim'?'#f4f0e4':null; L.sash=pick(['#3a4a8a','#7a2a4a','#8a2a2a']); L.beard=L.hair; break;
    case 'elders': L.robe=pick(['#4a3a2a','#3a3a4a','#5a4a3a','#6a5a48']); L.beard=pick(['#cfc8b8','#b8b0a0','#8a8478']); L.hair=L.beard; L.old=1; L.headcover=r()<.6?pick(['#d8ccb0','#b8a888','#8a7a60']):null; break;
    case 'women': L.veil=pick(PAL.veils); L.robe=pick(['#8a5a6a','#6a5a8a','#9a7a5a','#7a4a4a','#5a6a7a','#a08868']); L.beard=null; L.hairStyle='long'; break;
    case 'children': L.beard=null; L.child=1; break;
    case 'mourners': L.robe=pick(['#3a342c','#2e2a24','#4a4034']); L.sack=1; if(r()<.5){ L.veil='#3a342c'; L.beard=null; } break;
    case 'captives': L.robe=pick(['#6a5a48','#5a4a3a','#4e4438']); L.beard=L.hair; break;
    case 'kings': case 'princes': L.robe=pick(['#6a2a5a','#2a3a7a','#7a2a2a']); L.collar='#d8b040'; L.crown=kind==='kings'; break;
    case 'nations': L.robe=pick(['#7a3a5a','#3a5a7a','#8a5a2a','#5a2a2a','#2a5a4a']); L.headcover=r()<.5?pick(['#d8c8a0','#a8584a','#4a6a8a']):null; break;
    case 'angels': L.robe='#f4eee0'; L.angel=1; L.beard=null; break;
    case 'shepherds': L.robe=pick(['#8a7050','#6e5a3a','#9a8a64']); L.headcover=pick(['#d8ccb0','#b8a888']); break;
    default: if(r()<.35){ L.veil=pick(PAL.veils); L.beard=null; L.hairStyle='long'; } else if(r()<.4) L.headcover=pick(['#d8ccb0','#b8a888','#8a7a60','#a86a4a']);
  }
  return L;
}
const CROWD_DEF={soldiers:'stand',army:'stand',guards:'stand',kohanim:'stand',levites:'stand',elders:'stand',women:'stand',children:'stand',
  mourners:'mourn',captives:'bound',kings:'stand',princes:'stand',nations:'stand',angels:'stand',shepherds:'stand',people:'stand',worshippers:'raise'};
const CROWD_HOLD={soldiers:'spear',army:'spear',guards:'spear',elders:'staff',shepherds:'staff',kohanim:null};

/* ============================== props ============================== */
const PROPS={};
function prop(name,fn){ PROPS[name]=fn; }
/* each prop: (g, x, groundY, s = the stage's figure height at that depth, t, o) */
prop('throne',(g,x,y,s,t,o)=>{ const u=s/100;
  g.fillStyle='#6a4a20'; g.fillRect(x-u*34,y-u*6,u*68,u*6); g.fillStyle='#8a6a30'; g.fillRect(x-u*28,y-u*12,u*56,u*6);
  g.fillStyle=lin(g,x-u*17,0,x+u*17,0,[[0,'#a07a28'],[.5,'#f0cc60'],[1,'#a07a28']]);
  rr(g,x-u*17,y-u*112,u*34,u*80,u*6); g.fill(); g.fillStyle='#7a2a3a'; rr(g,x-u*12,y-u*104,u*24,u*56,u*4); g.fill();
  g.fillStyle='#caa040'; g.fillRect(x-u*24,y-u*50,u*48,u*8); g.fillRect(x-u*22,y-u*42,u*4,u*30); g.fillRect(x+u*18,y-u*42,u*4,u*30);
  g.fillStyle='#f4dc8a'; for(const d of[-1,1]){ ell(g,x+d*u*18,y-u*114,u*5,u*5); g.fill(); }
  g.fillStyle='#caa040'; for(const d of[-1,1]){ poly(g,[[x+d*u*20,y-u*50],[x+d*u*30,y-u*56],[x+d*u*32,y-u*48],[x+d*u*24,y-u*42]]); g.fill(); } });
prop('altar',(g,x,y,s,t,o)=>{ const u=s/100, w=u*(o.w||44), hh=u*(o.h||30), bronze=o.bronze;
  const top=bronze?'#b88a48':'#9a927e', side=bronze?'#8a6030':'#7a7262';
  g.fillStyle=side; g.fillRect(x-w/2,y-hh,w,hh); g.fillStyle=top; g.fillRect(x-w/2-u*2,y-hh-u*5,w+u*4,u*6);
  g.strokeStyle='rgba(30,24,16,.35)'; g.lineWidth=u*.7; for(let r=1;r<4;r++){ g.beginPath(); g.moveTo(x-w/2,y-hh*r/4); g.lineTo(x+w/2,y-hh*r/4); g.stroke(); }
  for(let r=0;r<4;r++) for(let c=0;c<5;c++){ if((r+c)%2) continue; g.beginPath(); g.moveTo(x-w/2+c*w/5,y-hh*r/4); g.lineTo(x-w/2+c*w/5,y-hh*(r+1)/4); g.stroke(); }
  for(const d of[-1,1]){ g.fillStyle=top; poly(g,[[x+d*w/2-d*u*1,y-hh-u*5],[x+d*w/2+d*u*1,y-hh-u*11],[x+d*w/2-d*u*5,y-hh-u*5]]); g.fill(); }
  if(o.fire!==false) fireAt(g,x,y-hh-u*5,w*.8,u*(o.big?48:30),t);
  if(o.sacrifice){ g.fillStyle='#8a4a3a'; ell(g,x,y-hh-u*9,w*.3,u*5); g.fill(); } });
prop('ark',(g,x,y,s,t,o)=>{ const u=s/100;   /* the ark of the berith */
  glow(g,x,y-u*30,u*60,'#ffe6a0',.25);
  g.fillStyle='#b88a28'; g.fillRect(x-u*42,y-u*22,u*84,u*3);
  g.fillStyle=lin(g,x-u*24,0,x+u*24,0,[[0,'#a8801c'],[.5,'#f2d060'],[1,'#a8801c']]); g.fillRect(x-u*24,y-u*30,u*48,u*26);
  g.fillStyle='#e8c450'; g.fillRect(x-u*26,y-u*34,u*52,u*5);
  g.fillStyle='#f4d870'; for(const d of[-1,1]){ poly(g,[[x+d*u*6,y-u*34],[x+d*u*22,y-u*34],[x+d*u*20,y-u*46],[x+d*u*4,y-u*58],[x+d*u*14,y-u*44]]); g.fill(); }
  g.fillStyle='#8a6010'; g.fillRect(x-u*20,y-u*4,u*4,u*4); g.fillRect(x+u*16,y-u*4,u*4,u*4); });
prop('tent',(g,x,y,s,t,o)=>{ const u=s/100, w=u*(o.w||110), hh=u*(o.h||70), c=o.color||'#6a5440';
  g.fillStyle=shd(c,-.25); poly(g,[[x-w/2,y],[x-w*.12,y-hh],[x+w*.12,y-hh],[x+w/2,y]]); g.fill();
  g.fillStyle=c; poly(g,[[x-w/2,y],[x-w*.12,y-hh],[x+w*.05,y-hh],[x-w*.08,y]]); g.fill();
  g.strokeStyle='rgba(20,14,8,.25)'; g.lineWidth=u*.8; for(let i=1;i<6;i++){ g.beginPath(); g.moveTo(x-w/2+i*w/6,y); g.lineTo(x-w*.12+i*w*.04,y-hh); g.stroke(); }
  g.fillStyle='#1a120a'; poly(g,[[x+w*.02,y],[x+w*.1,y-hh*.55],[x+w*.2,y]]); g.fill();
  g.strokeStyle='#4a3420'; g.lineWidth=u*1.2; g.beginPath(); g.moveTo(x-w*.12,y-hh); g.lineTo(x-w*.12,y-hh-u*6); g.moveTo(x+w*.12,y-hh); g.lineTo(x+w*.12,y-hh-u*6); g.stroke(); });
prop('tabernacle',(g,x,y,s,t,o)=>{ const u=s/100, w=u*140, hh=u*60;
  g.fillStyle='#e8e0cc'; g.fillRect(x-w*.9,y-u*30,w*1.8,u*30);
  g.strokeStyle='#8a7050'; g.lineWidth=u*1; for(let i=0;i<=18;i++){ g.beginPath(); g.moveTo(x-w*.9+i*w*.1,y); g.lineTo(x-w*.9+i*w*.1,y-u*30); g.stroke(); }
  g.fillStyle='#5a3a2a'; poly(g,[[x-w*.35,y-u*30],[x-w*.3,y-hh-u*22],[x+w*.3,y-hh-u*22],[x+w*.35,y-u*30]]); g.fill();
  g.fillStyle='#3a4a7a'; g.fillRect(x-u*14,y-u*30-hh*.6,u*28,hh*.6);
  g.fillStyle='rgba(230,230,240,.35)'; ell(g,x,y-hh-u*60,u*26,u*40); g.fill(); });
prop('pillar',(g,x,y,s,t,o)=>{ const u=s/100, hh=u*(o.h||150), w=u*(o.w||16), c=o.color||'#c8b890';
  g.fillStyle=lin(g,x-w/2,0,x+w/2,0,[[0,shd(c,-.35)],[.4,c],[.7,shd(c,.18)],[1,shd(c,-.3)]]); g.fillRect(x-w/2,y-hh,w,hh);
  g.fillStyle=shd(c,-.1); g.fillRect(x-w*.75,y-hh-u*6,w*1.5,u*7); g.fillRect(x-w*.7,y-u*5,w*1.4,u*5);
  if(o.bronze){ g.fillStyle='#c8903a'; ell(g,x,y-hh-u*14,w*.9,u*9); g.fill(); } });
prop('lampstand',(g,x,y,s,t,o)=>{ const u=s/100; g.strokeStyle='#e0b840'; g.lineWidth=u*2.2; g.lineCap='round';
  g.beginPath(); g.moveTo(x,y); g.lineTo(x,y-u*58); for(let i=1;i<=3;i++){ g.moveTo(x-i*u*8,y-u*58); g.quadraticCurveTo(x-i*u*8,y-u*(34-i*4),x,y-u*(34-i*4)); g.moveTo(x+i*u*8,y-u*58); g.quadraticCurveTo(x+i*u*8,y-u*(34-i*4),x,y-u*(34-i*4)); } g.stroke();
  g.fillStyle='#caa040'; poly(g,[[x-u*8,y],[x+u*8,y],[x+u*3,y-u*6],[x-u*3,y-u*6]]); g.fill();
  for(let i=-3;i<=3;i++){ const fx=x+i*u*8, fy=y-u*62, f=1+Math.sin(t/110+i)*.15; glow(g,fx,fy,u*9,'#ffc060',.35); g.fillStyle='#ffd878'; ell(g,fx,fy,u*1.6*f,u*3*f); g.fill(); } });
prop('table',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#6a4a28'; g.fillRect(x-u*30,y-u*26,u*60,u*5); g.fillRect(x-u*27,y-u*21,u*3,u*21); g.fillRect(x+u*24,y-u*21,u*3,u*21);
  if(o.bread!==false){ g.fillStyle='#c89a58'; for(let i=0;i<4;i++){ ell(g,x-u*18+i*u*12,y-u*29,u*5,u*2.5); g.fill(); } }
  if(o.cups){ g.fillStyle='#d4b050'; for(let i=0;i<3;i++) g.fillRect(x-u*16+i*u*14,y-u*33,u*3,u*6); } });
prop('bed',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#5a3a20'; g.fillRect(x-u*46,y-u*18,u*92,u*6); g.fillRect(x-u*46,y-u*18,u*4,u*18); g.fillRect(x+u*42,y-u*18,u*4,u*18); g.fillRect(x+u*42,y-u*30,u*4,u*30);
  g.fillStyle=o.color||'#b8a888'; rr(g,x-u*44,y-u*24,u*88,u*8,u*3); g.fill(); g.fillStyle='#e8e0d0'; rr(g,x+u*28,y-u*28,u*14,u*7,u*3); g.fill(); });
prop('tree',(g,x,y,s,t,o)=>{ const u=s/100, hh=u*(o.h||120), c=o.color||'#4a6a30', sway=Math.sin(t/1600+x)*u*1.5;
  g.fillStyle='#4a3420'; poly(g,[[x-u*5,y],[x+u*5,y],[x+u*3,y-hh*.55],[x-u*3,y-hh*.55]]); g.fill();
  for(const [dx,dy,r,sh] of [[-u*18,-hh*.62,u*24,-.2],[u*16,-hh*.66,u*22,-.08],[0,-hh*.82,u*28,.05],[-u*6,-hh*.6,u*20,.12]]){
    g.fillStyle=shd(c,sh); ell(g,x+dx+sway,y+dy,r,r*.85); g.fill(); }
  if(o.fruit){ g.fillStyle=o.fruit; for(let i=0;i<9;i++){ const a=i*2.4; ell(g,x+Math.cos(a)*u*20+sway,y-hh*.7+Math.sin(a)*u*14,u*2.4,u*2.4); g.fill(); } }
  if(o.bloom){ g.fillStyle='rgba(250,236,244,.9)'; for(let i=0;i<22;i++){ const a=i*2.1, r2=u*(8+(i*7)%22); ell(g,x+Math.cos(a)*r2+sway,y-hh*.72+Math.sin(a)*r2*.7,u*1.6,u*1.6); g.fill(); } } });
prop('palm',(g,x,y,s,t,o)=>{ const u=s/100, hh=u*(o.h||150), sway=Math.sin(t/1500+x)*u*3;
  g.strokeStyle='#6a5030'; g.lineWidth=u*5; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+u*8,y-hh*.5,x+sway,y-hh); g.stroke();
  g.strokeStyle='#4a7a34'; g.lineWidth=u*3; g.lineCap='round';
  for(let i=0;i<8;i++){ const a=-PI/2+(i-3.5)*.42; g.beginPath(); g.moveTo(x+sway,y-hh); g.quadraticCurveTo(x+sway+Math.cos(a)*u*30,y-hh+Math.sin(a)*u*20,x+sway+Math.cos(a)*u*44,y-hh+Math.sin(a)*u*18+u*16); g.stroke(); } });
prop('bush',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle=o.color||'#4a5a30'; for(const [dx,r] of [[-u*10,u*12],[u*8,u*13],[0,u*15]]){ ell(g,x+dx,y-r*.8,r,r*.8); g.fill(); }
  if(o.burning){ fireAt(g,x,y-u*6,u*40,u*40,t); glow(g,x,y-u*20,u*70,'#ffcc66',.3); } });
prop('rock',(g,x,y,s,t,o)=>{ const u=s/100, w=u*(o.w||40), hh=u*(o.h||26); g.fillStyle=o.color||'#7a7262';
  poly(g,[[x-w/2,y],[x-w*.42,y-hh*.7],[x-w*.1,y-hh],[x+w*.3,y-hh*.85],[x+w/2,y-hh*.2],[x+w/2,y]]); g.fill();
  g.fillStyle='rgba(255,250,235,.12)'; poly(g,[[x-w*.1,y-hh],[x+w*.3,y-hh*.85],[x+w*.2,y-hh*.5],[x-w*.05,y-hh*.6]]); g.fill();
  if(o.water){ g.strokeStyle='rgba(170,210,240,.85)'; g.lineWidth=u*3; g.beginPath(); g.moveTo(x+w*.25,y-hh*.6); g.quadraticCurveTo(x+w*.5,y-hh*.3,x+w*.55+Math.sin(t/200)*u,y); g.stroke(); } });
prop('stones',(g,x,y,s,t,o)=>{ const u=s/100, n=o.n||12; const r=rng(strHash('st'+x)); for(let i=0;i<n;i++){ const row=Math.floor(i/5), c=i%5;
  g.fillStyle=mixc('#8a8272','#b0a894',r()); ell(g,x-u*20+c*u*10+row*u*5,y-u*4-row*u*7,u*6,u*4); g.fill(); } });
prop('well',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#8a8070'; g.fillRect(x-u*20,y-u*18,u*40,u*18); g.fillStyle='#6a6254'; ell(g,x,y-u*18,u*20,u*5); g.fill(); g.fillStyle='#1a1a20'; ell(g,x,y-u*18,u*15,u*3.2); g.fill();
  g.strokeStyle='#5a4028'; g.lineWidth=u*2; g.beginPath(); g.moveTo(x-u*18,y-u*18); g.lineTo(x-u*18,y-u*46); g.lineTo(x+u*18,y-u*46); g.lineTo(x+u*18,y-u*18); g.stroke(); });
prop('pot',(g,x,y,s,t,o)=>{ const u=s/100; if(o.fire!==false) fireAt(g,x,y,u*30,u*18,t);
  g.fillStyle='#3a3a3a'; ell(g,x,y-u*20,u*20,u*16); g.fill(); g.fillStyle='#4a4a48'; ell(g,x,y-u*33,u*18,u*4); g.fill();
  for(let i=0;i<3;i++){ g.fillStyle='rgba(230,230,230,'+(.22-i*.06)+')'; ell(g,x+Math.sin(t/400+i)*u*6,y-u*(44+i*14)-(t/30%14),u*(7+i*3),u*(6+i*3)); g.fill(); }
  if(o.tilt){ g.save(); g.translate(x,y-u*20); g.rotate(.35); g.restore(); } });
prop('basket',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#9a7a40'; poly(g,[[x-u*14,y-u*16],[x+u*14,y-u*16],[x+u*10,y],[x-u*10,y]]); g.fill();
  g.strokeStyle='rgba(60,40,20,.4)'; g.lineWidth=u*.6; for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(x-u*13+i,y-u*16+i*u*4); g.lineTo(x+u*13-i,y-u*16+i*u*4); g.stroke(); }
  g.fillStyle=o.fruit||'#5a2a4a'; for(let i=0;i<6;i++){ ell(g,x-u*10+i*u*4,y-u*18-(i%2)*u*2,u*3,u*3); g.fill(); } });
prop('fire',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#3a2a1a'; for(let i=0;i<4;i++){ g.save(); g.translate(x,y-u*2); g.rotate(i*.8-1.2); g.fillRect(-u*14,-u*1.5,u*28,u*3); g.restore(); }
  fireAt(g,x,y-u*2,u*(o.w||26),u*(o.h||32),t); glow(g,x,y-u*14,u*(o.r||90),'#ffa040',.28); });
prop('gate',(g,x,y,s,t,o)=>{ const u=s/100, w=u*(o.w||150), hh=u*(o.h||120), c=o.color||'#b0a080';
  g.fillStyle=shd(c,-.12); g.fillRect(x-w/2,y-hh,w,hh);
  for(const d of[-1,1]){ g.fillStyle=c; g.fillRect(x+d*w/2-(d>0?u*34:0),y-hh-u*22,u*34,hh+u*22);
    g.fillStyle=shd(c,-.25); for(let i=0;i<4;i++) g.fillRect(x+d*w/2-(d>0?u*34:0)+i*u*9,y-hh-u*28,u*6,u*7); }
  g.fillStyle='#1c140e'; g.beginPath(); g.moveTo(x-u*26,y); g.lineTo(x-u*26,y-hh*.55); g.arc(x,y-hh*.55,u*26,PI,TAU); g.lineTo(x+u*26,y); g.closePath(); g.fill();
  if(o.open===false){ g.fillStyle='#5a3a20'; g.fillRect(x-u*24,y-hh*.55,u*48,hh*.55); g.fillStyle='#3a2a18'; g.fillRect(x-u*1,y-hh*.55,u*2,hh*.55); }
  g.strokeStyle='rgba(40,30,20,.25)'; g.lineWidth=u*.6; for(let r=1;r<8;r++){ g.beginPath(); g.moveTo(x-w/2,y-hh*r/8); g.lineTo(x+w/2,y-hh*r/8); g.stroke(); } });
prop('wall',(g,x,y,s,t,o)=>{ const u=s/100, w=VW*(o.w||1.2), hh=u*(o.h||90), c=o.color||'#b0a080';
  g.fillStyle=c; g.fillRect(x-w/2,y-hh,w,hh); g.fillStyle=shd(c,-.2); for(let i=0;i*u*12<w;i++) if(i%2===0) g.fillRect(x-w/2+i*u*12,y-hh-u*9,u*12,u*9);
  g.strokeStyle='rgba(40,30,20,.22)'; g.lineWidth=u*.6; for(let r=1;r<7;r++){ g.beginPath(); g.moveTo(x-w/2,y-hh*r/7); g.lineTo(x+w/2,y-hh*r/7); g.stroke(); }
  if(o.broken){ g.fillStyle=Stage._skyGrad||'#888'; for(const bx of[-.2,.15]){ poly(g,[[x+bx*w,y-hh-u*10],[x+bx*w+u*40,y-hh-u*10],[x+bx*w+u*30,y-hh*.4],[x+bx*w+u*12,y-hh*.55]]); g.fill(); } } });
prop('tower',(g,x,y,s,t,o)=>{ const u=s/100, hh=u*(o.h||200), c=o.color||'#a89070', tiers=o.tiers||6;
  for(let i=0;i<tiers;i++){ const w=u*(90-i*12), y0=y-hh*i/tiers, y1=y-hh*(i+1)/tiers; g.fillStyle=shd(c,-(i%2)*.1);
    poly(g,[[x-w/2,y0],[x+w/2,y0],[x+w/2-u*5,y1],[x-w/2+u*5,y1]]); g.fill(); g.fillStyle='rgba(20,14,8,.35)'; g.fillRect(x-u*4,y0-u*12,u*8,u*10); }
  if(o.unfinished){ g.strokeStyle='#5a4028'; g.lineWidth=u*1.2; for(let i=0;i<5;i++){ g.beginPath(); g.moveTo(x-u*25+i*u*12,y-hh); g.lineTo(x-u*25+i*u*12,y-hh-u*30); g.stroke(); } } });
prop('house',(g,x,y,s,t,o)=>{ const u=s/100, w=u*(o.w||70), hh=u*(o.h||50), c=o.color||'#c2a878';
  g.fillStyle=c; g.fillRect(x-w/2,y-hh,w,hh); g.fillStyle=shd(c,-.18); g.fillRect(x-w/2,y-hh-u*5,w,u*5); g.fillRect(x+w/2-u*8,y-hh,u*8,hh);
  g.fillStyle='#2a1c12'; rr(g,x-u*8,y-u*26,u*16,u*26,u*6); g.fill(); g.fillStyle='rgba(30,20,12,.8)'; g.fillRect(x+w*.22,y-hh*.7,u*8,u*8);
  if(Stage._hour&&Stage._hour.lamp>.3){ glow(g,x+w*.22+u*4,y-hh*.7+u*4,u*20,'#ffb060',.35*Stage._hour.lamp); g.fillStyle='rgba(255,190,100,.8)'; g.fillRect(x+w*.22,y-hh*.7,u*8,u*8); } });
prop('ship',(g,x,y,s,t,o)=>{ const u=s/100, rock=Math.sin(t/(o.storm?500:1100))*(o.storm?.08:.03);
  g.save(); g.translate(x,y); g.rotate(rock);
  g.fillStyle='#5a3a20'; poly(g,[[-u*70,-u*16],[u*70,-u*16],[u*52,u*10],[-u*56,u*10]]); g.fill();
  g.fillStyle='#7a5230'; g.fillRect(-u*70,-u*20,u*140,u*5);
  g.strokeStyle='#4a3020'; g.lineWidth=u*3; g.beginPath(); g.moveTo(0,-u*20); g.lineTo(0,-u*120); g.stroke();
  g.fillStyle=o.storm?'#b8b0a0':'#e8e0cc'; poly(g,[[u*2,-u*112],[u*50,-u*100+(o.storm?Math.sin(t/200)*u*6:0)],[u*46,-u*34],[u*2,-u*30]]); g.fill();
  g.restore(); });
prop('noahark',(g,x,y,s,t,o)=>{ const u=s/100, rock=Math.sin(t/1300)*.02; g.save(); g.translate(x,y); g.rotate(rock);
  g.fillStyle='#5a3a1e'; poly(g,[[-u*150,-u*40],[u*150,-u*40],[u*120,u*8],[-u*120,u*8]]); g.fill();
  g.strokeStyle='rgba(20,12,6,.4)'; g.lineWidth=u*1; for(let i=1;i<5;i++){ g.beginPath(); g.moveTo(-u*150+i*u*6,-u*40+i*u*10); g.lineTo(u*150-i*u*6,-u*40+i*u*10); g.stroke(); }
  g.fillStyle='#6a4626'; g.fillRect(-u*100,-u*80,u*200,u*40); g.fillStyle='#4a2e16'; poly(g,[[-u*110,-u*80],[u*110,-u*80],[u*80,-u*100],[-u*80,-u*100]]); g.fill();
  g.fillStyle='#1a1008'; g.fillRect(-u*60,-u*70,u*10,u*8); g.fillRect(u*20,-u*70,u*10,u*8); if(o.door) g.fillRect(-u*10,-u*72,u*20,u*30);
  g.restore(); });
prop('idol',(g,x,y,s,t,o)=>{ const u=s/100, hh=u*(o.h||70), c=o.color||'#c8a048';
  g.fillStyle='#6a6254'; g.fillRect(x-u*14,y-u*12,u*28,u*12);
  g.fillStyle=lin(g,x-u*10,0,x+u*10,0,[[0,shd(c,-.3)],[.5,c],[1,shd(c,-.3)]]); poly(g,[[x-u*9,y-u*12],[x+u*9,y-u*12],[x+u*7,y-hh+u*16],[x-u*7,y-hh+u*16]]); g.fill();
  ell(g,x,y-hh+u*9,u*9,u*9); g.fill(); if(o.horns!==false){ g.strokeStyle=c; g.lineWidth=u*2.4; g.beginPath(); g.arc(x-u*9,y-hh+u*4,u*6,-.2,-2.2,true); g.arc(x+u*9,y-hh+u*4,u*6,PI+.2,-1,false); g.stroke(); }
  if(o.fallen){ /* Dagon fallen: redrawn lying */ } });
prop('statue',(g,x,y,s,t,o)=>{ const u=s/100, hh=u*(o.h||260);   /* the image of Neḇuḵaḏnetstsar's dream / the golden image */
  const bands=o.gold?[['#e0b840',1]]:[['#e6c050',.14],['#d8dde0',.32],['#c88a48',.6],['#707078',.85],['#8a7a6a',1]];
  let y0=y; const w=u*40;
  for(let i=bands.length-1;i>=0;i--){ const f0=i?bands[i-1][1]:0, f1=bands[i][1];
    g.fillStyle=bands[i][0]; g.fillRect(x-w/2*(1-f0*.3),y-hh*f1,w*(1-f0*.3),hh*(f1-f0)+1); }
  g.fillStyle=bands[0][0]; ell(g,x,y-hh-u*8,u*11,u*12); g.fill(); });
prop('furnace',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#5a4a3a'; poly(g,[[x-u*80,y],[x-u*60,y-u*120],[x+u*60,y-u*120],[x+u*80,y]]); g.fill();
  g.fillStyle='#2a1a10'; rr(g,x-u*44,y-u*90,u*88,u*90,u*20); g.fill(); fireAt(g,x,y,u*84,u*86,t); glow(g,x,y-u*40,u*150,'#ff8030',.4); });
prop('den',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#3a3228'; ell(g,x,y-u*4,u*90,u*20); g.fill(); g.fillStyle='#0e0b08'; ell(g,x,y-u*4,u*80,u*15); g.fill(); });
prop('pit',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#5a5044'; ell(g,x,y,u*44,u*12); g.fill(); g.fillStyle='#0c0a08'; ell(g,x,y,u*36,u*9); g.fill(); });
prop('grave',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#6a6254'; poly(g,[[x-u*40,y],[x-u*34,y-u*50],[x+u*34,y-u*50],[x+u*40,y]]); g.fill(); g.fillStyle='#0e0b08'; rr(g,x-u*18,y-u*40,u*36,u*40,u*16); g.fill();
  if(o.stone!==false){ g.fillStyle='#8a8272'; ell(g,x+u*(o.open?40:10),y-u*20,u*20,u*20); g.fill(); } });
prop('sheaves',(g,x,y,s,t,o)=>{ const u=s/100; for(let i=0;i<(o.n||3);i++){ const sx=x+(i-1)*u*22; g.fillStyle='#d8b060'; poly(g,[[sx-u*8,y],[sx+u*8,y],[sx+u*3,y-u*26],[sx-u*3,y-u*26]]); g.fill();
  g.fillStyle='#e8c878'; for(let k=0;k<5;k++){ ell(g,sx-u*6+k*u*3,y-u*28-(k%2)*u*3,u*2,u*5,(k-2)*.3); g.fill(); } g.fillStyle='#8a6a30'; g.fillRect(sx-u*5,y-u*14,u*10,u*2); } });
prop('camel',(g,x,y,s,t,o)=>{ const u=s/100, d=o.face==='l'?-1:1; g.save(); g.translate(x,y); g.scale(d,1); g.fillStyle='#b08a58';
  for(const lx of[-u*22,-u*14,u*14,u*22]){ g.fillRect(lx,-u*40,u*4,u*40); } ell(g,0,-u*48,u*30,u*14); g.fill(); ell(g,-u*4,-u*60,u*12,u*10); g.fill();
  g.beginPath(); g.moveTo(u*24,-u*52); g.quadraticCurveTo(u*40,-u*56,u*38,-u*80); g.lineWidth=u*8; g.strokeStyle='#b08a58'; g.stroke(); ell(g,u*42,-u*82,u*8,u*5); g.fill();
  if(o.load){ g.fillStyle='#7a3a2a'; g.fillRect(-u*18,-u*72,u*28,u*14); } g.restore(); });
prop('donkey',(g,x,y,s,t,o)=>{ const u=s/100, d=o.face==='l'?-1:1; g.save(); g.translate(x,y); g.scale(d,1); g.fillStyle='#7a7064';
  for(const lx of[-u*14,-u*8,u*8,u*14]) g.fillRect(lx,-u*24,u*3,u*24); ell(g,0,-u*30,u*18,u*10); g.fill(); g.save(); g.translate(u*18,-u*36); g.rotate(-.5); ell(g,u*6,0,u*9,u*5); g.fill(); g.restore();
  g.fillRect(u*20,-u*50,u*2.5,u*9); g.fillRect(u*24,-u*50,u*2.5,u*9); g.restore(); });
prop('horse',(g,x,y,s,t,o)=>{ const u=s/100, d=o.face==='l'?-1:1; g.save(); g.translate(x,y); g.scale(d,1); g.fillStyle=o.color||'#5a3a24';
  for(const lx of[-u*22,-u*14,u*14,u*22]) g.fillRect(lx,-u*36,u*4,u*36); ell(g,0,-u*42,u*28,u*12); g.fill(); g.save(); g.translate(u*26,-u*52); g.rotate(-.9); ell(g,u*10,0,u*14,u*6); g.fill(); g.restore();
  g.fillStyle='#1a120a'; g.fillRect(u*22,-u*66,u*10,u*4); g.restore(); });
prop('chariot',(g,x,y,s,t,o)=>{ const u=s/100, d=o.face==='l'?-1:1, fire=o.fire; g.save(); g.translate(x,y); g.scale(d,1);
  PROPS.horse(g,u*50,0,s,t,{color:fire?'#ff9a3a':(o.color||'#6a4a2a')});
  g.fillStyle=fire?'#ffc860':'#8a6a30'; poly(g,[[-u*30,-u*14],[u*6,-u*14],[u*10,-u*44],[-u*26,-u*44]]); g.fill();
  g.strokeStyle=fire?'#fff0b0':'#4a3020'; g.lineWidth=u*2.5; g.beginPath(); g.arc(-u*12,-u*10,u*12,0,TAU); g.stroke();
  if(fire){ fireAt(g,-u*10,-u*40,u*50,u*50,t); glow(g,0,-u*40,u*120,'#ffb040',.45); }
  g.restore(); });
prop('sheep',(g,x,y,s,t,o)=>{ const u=s/100, n=o.n||5, r=rng(strHash('sh'+x)); for(let i=0;i<n;i++){ const sx=x+(r()-.5)*u*(o.w||120), sy=y-(r()*u*10), b=Math.sin(t/800+i)*u;
  g.fillStyle='#3a3028'; g.fillRect(sx-u*6,sy-u*10,u*2,u*10); g.fillRect(sx+u*4,sy-u*10,u*2,u*10);
  g.fillStyle=o.color||'#ece6d8'; ell(g,sx,sy-u*14+b,u*11,u*7); g.fill(); g.fillStyle='#3a3028'; ell(g,sx+u*11,sy-u*17+b,u*4,u*3.5); g.fill(); } });
prop('oxen',(g,x,y,s,t,o)=>{ const u=s/100, n=o.n||2; for(let i=0;i<n;i++){ const sx=x+i*u*24, sy=y-i*u*3;
  g.fillStyle='#6a4a30'; for(const lx of[-u*18,-u*12,u*12,u*18]) g.fillRect(sx+lx,sy-u*22,u*4,u*22); ell(g,sx,sy-u*30,u*24,u*12); g.fill(); ell(g,sx+u*26,sy-u*32,u*8,u*7); g.fill();
  g.strokeStyle='#d8ccb0'; g.lineWidth=u*1.6; g.beginPath(); g.arc(sx+u*26,sy-u*40,u*6,PI*1.1,PI*1.9); g.stroke(); } });
prop('lion',(g,x,y,s,t,o)=>{ const u=s/100, d=o.face==='l'?-1:1; g.save(); g.translate(x,y); g.scale(d,1);
  g.fillStyle='#b8883e'; for(const lx of[-u*22,-u*14,u*12,u*20]) g.fillRect(lx,-u*20,u*5,u*20); ell(g,0,-u*26,u*28,u*11); g.fill();
  g.fillStyle='#7a4a1e'; ell(g,u*26,-u*34,u*15,u*15); g.fill(); g.fillStyle='#c8984a'; ell(g,u*30,-u*33,u*9,u*9); g.fill();
  g.strokeStyle='#b8883e'; g.lineWidth=u*2; g.beginPath(); g.moveTo(-u*26,-u*28); g.quadraticCurveTo(-u*40,-u*20,-u*36,-u*40); g.stroke();
  if(o.roar){ g.fillStyle='#3a1a10'; ell(g,u*37,-u*30,u*3,u*3.5); g.fill(); } g.restore(); });
prop('fish',(g,x,y,s,t,o)=>{ const u=s/100, big=o.big; const k=big?3.2:1; g.save(); g.translate(x,y+Math.sin(t/700)*u*4); if(o.face==='l') g.scale(-1,1);
  g.fillStyle='#4a6a7a'; ell(g,0,0,u*40*k,u*16*k); g.fill(); poly(g,[[-u*36*k,0],[-u*58*k,-u*16*k],[-u*56*k,u*16*k]]); g.fill();
  g.fillStyle='#e8eef0'; ell(g,u*24*k,-u*4*k,u*2.6*k,u*2.6*k); g.fill(); if(big){ g.fillStyle='#8aa8b8'; ell(g,0,u*6*k,u*32*k,u*6*k); g.fill(); } g.restore(); });
prop('bones',(g,x,y,s,t,o)=>{ const u=s/100, n=o.n||14, r=rng(strHash('bn'+x)); g.strokeStyle='#e8e0cc'; g.lineWidth=u*2.2; g.lineCap='round';
  for(let i=0;i<n;i++){ const bx=x+(r()-.5)*u*(o.w||220), by=y-r()*u*14, a=r()*PI; g.beginPath(); g.moveTo(bx-Math.cos(a)*u*7,by-Math.sin(a)*u*2); g.lineTo(bx+Math.cos(a)*u*7,by+Math.sin(a)*u*2); g.stroke();
    if(i%4===0){ g.fillStyle='#e8e0cc'; ell(g,bx,by-u*4,u*4,u*3.4); g.fill(); } } });
prop('vine',(g,x,y,s,t,o)=>{ const u=s/100, w=u*(o.w||160); for(let r=0;r<2;r++){ const yy=y-r*u*14; g.strokeStyle='#5a4028'; g.lineWidth=u*1.4; g.beginPath(); g.moveTo(x-w/2,yy-u*26); g.lineTo(x+w/2,yy-u*26); g.stroke();
  for(let i=0;i<9;i++){ const vx=x-w/2+i*w/8; g.fillRect(vx,yy-u*26,u*1.5,u*26); g.fillStyle='#4a6a2a'; ell(g,vx,yy-u*28,u*9,u*6); g.fill(); g.fillStyle=o.fruit||'#4a2a4a'; ell(g,vx+u*3,yy-u*22,u*2.4,u*3.6); g.fill(); g.fillStyle='#5a4028'; } } });
prop('reeds',(g,x,y,s,t,o)=>{ const u=s/100, w=u*(o.w||100); g.strokeStyle='#6a7a3a'; g.lineWidth=u*1.2; for(let i=0;i<24;i++){ const rx=x-w/2+i*w/24, sw=Math.sin(t/900+i)*u*2; g.beginPath(); g.moveTo(rx,y); g.quadraticCurveTo(rx+sw,y-u*20,rx+sw*2,y-u*(30+(i*7)%16)); g.stroke(); } });
prop('basin',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#b88a48'; for(let i=0;i<6;i++){ g.fillRect(x-u*40+i*u*14,y-u*16,u*8,u*16); } g.fillStyle='#c8984a'; ell(g,x,y-u*28,u*50,u*14); g.fill(); g.fillStyle='#8ab0c0'; ell(g,x,y-u*32,u*44,u*8); g.fill(); });
prop('banner',(g,x,y,s,t,o)=>{ const u=s/100; g.strokeStyle='#5a4028'; g.lineWidth=u*2; g.beginPath(); g.moveTo(x,y); g.lineTo(x,y-u*110); g.stroke();
  g.fillStyle=o.color||'#8a2a2a'; const w=Math.sin(t/300+x)*u*4; poly(g,[[x,y-u*108],[x+u*34,y-u*104+w],[x+u*34,y-u*80+w],[x,y-u*84]]); g.fill(); });
prop('scroll',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#e8dcb8'; g.fillRect(x-u*20,y-u*30,u*40,u*26); g.fillStyle='#8a6a3a'; g.fillRect(x-u*23,y-u*33,u*4,u*32); g.fillRect(x+u*19,y-u*33,u*4,u*32);
  g.fillStyle='rgba(60,50,40,.5)'; for(let i=0;i<6;i++) g.fillRect(x-u*16,y-u*26+i*u*3.6,u*32,u*1); });
prop('hand',(g,x,y,s,t,o)=>{ const u=s/100; glow(g,x,y,u*40,'#fff0c0',.5); g.fillStyle='#f0dcc0'; ell(g,x,y,u*6,u*8); g.fill(); for(let i=0;i<4;i++){ g.fillRect(x-u*5+i*u*3,y-u*18,u*2.4,u*12); } g.fillRect(x+u*5,y-u*6,u*6,u*2.4);
  if(o.writing){ g.fillStyle='rgba(255,240,200,.9)'; g.font=Math.round(u*14)+'px serif'; g.fillText('MENE MENE TEQEL',x-u*120,y+u*4); } });
prop('boat',(g,x,y,s,t,o)=>{ const u=s/100, rock=Math.sin(t/900)*.04; g.save(); g.translate(x,y); g.rotate(rock); g.fillStyle='#6a4a28'; poly(g,[[-u*40,-u*8],[u*40,-u*8],[u*30,u*6],[-u*30,u*6]]); g.fill(); g.restore(); });
prop('cloud',(g,x,y,s,t,o)=>{ const u=s/100, d=Math.sin(t/3000+x)*u*6; g.fillStyle=o.dark?'rgba(60,64,72,.9)':'rgba(248,246,240,.9)'; for(const[dx,dy,r]of[[-u*30,0,u*22],[0,-u*12,u*28],[u*30,0,u*22],[u*10,u*6,u*20]]){ ell(g,x+dx+d,y+dy,r,r*.7); g.fill(); } });
prop('wheel',(g,x,y,s,t,o)=>{ const u=s/100, r=u*(o.r||50), a=t/1500; glow(g,x,y,r*1.8,'#c0e0ff',.3); g.strokeStyle='#e8f0ff'; g.lineWidth=u*2.5; g.beginPath(); g.arc(x,y,r,0,TAU); g.stroke(); g.beginPath(); g.ellipse(x,y,r,r*.35,a,0,TAU); g.stroke();
  g.fillStyle='rgba(255,255,255,.9)'; for(let i=0;i<10;i++){ const b=a+i*TAU/10; ell(g,x+Math.cos(b)*r,y+Math.sin(b)*r,u*2.2,u*2.2); g.fill(); } });
prop('cherub',(g,x,y,s,t,o)=>{ const u=s/100; const L={skin:'#e8d0a8',robe:'#f0e8d8',angel:1,hair:'#d8c070',hairStyle:'short'}; drawFigure(g,x,y,s*1.1,L,POSES.stand,o.face||'r',t,{wings:true,hold:o.sword?'sword':null}); if(o.sword){ glow(g,x+u*20,y-u*110,u*40,'#ff9030',.4); } });
prop('crown',(g,x,y,s,t,o)=>{ drawHeld(g,'crown',x,y,s*2,'r',t); });
prop('sword',(g,x,y,s,t,o)=>{ const u=s/100; g.save(); g.translate(x,y); g.rotate(o.a||-.8); glow(g,0,-u*40,u*50,'#ffb050',.35); g.fillStyle='#e8eef0'; poly(g,[[-u*3,0],[u*3,0],[u*1.5,-u*80],[0,-u*88],[-u*1.5,-u*80]]); g.fill(); g.fillStyle='#caa040'; g.fillRect(-u*10,-u*2,u*20,u*4); g.fillRect(-u*2,0,u*4,u*16); g.restore(); });

prop('calf',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#6a6254'; g.fillRect(x-u*26,y-u*14,u*52,u*14);
  g.fillStyle=lin(g,x-u*20,0,x+u*20,0,[[0,'#a07a1c'],[.5,'#f2d060'],[1,'#a07a1c']]); glow(g,x,y-u*40,u*60,'#ffd060',.25);
  for(const lx of[-u*16,-u*9,u*9,u*16]) g.fillRect(x+lx,y-u*34,u*4,u*20); ell(g,x,y-u*40,u*22,u*10); g.fill(); ell(g,x+u*22,y-u*48,u*8,u*7); g.fill();
  g.strokeStyle='#f2d060'; g.lineWidth=u*2; g.beginPath(); g.arc(x+u*22,y-u*58,u*6,PI*1.1,PI*1.9); g.stroke(); });
prop('serpent',(g,x,y,s,t,o)=>{ const u=s/100, c=o.color||'#4a6a2a';
  if(o.pole){ g.strokeStyle='#6a4a28'; g.lineWidth=u*3; g.beginPath(); g.moveTo(x,y); g.lineTo(x,y-u*120); g.moveTo(x-u*16,y-u*104); g.lineTo(x+u*16,y-u*104); g.stroke(); }
  const bx=x, by=o.pole?y-u*100:y-u*2, amp=o.pole?u*10:u*8, len=o.pole?u*70:u*90;
  g.strokeStyle=o.pole?'#c89040':c; g.lineWidth=u*(o.pole?4:6); g.lineCap='round'; g.beginPath();
  for(let i=0;i<=30;i++){ const k=i/30; const px=o.pole?bx+Math.sin(k*PI*4+t/400)*amp:bx-len/2+k*len, py=o.pole?by+k*len*.2-len*.1:by+Math.sin(k*PI*3+t/300)*amp*(o.tree?1.5:.4)-(o.rise?k*u*40:0); i?g.lineTo(px,py):g.moveTo(px,py); } g.stroke();
  const hx=o.pole?bx:bx+len/2, hy=o.pole?by-len*.12:by-(o.rise?u*40:0); g.fillStyle=o.pole?'#d8a048':shd(c,.1); ell(g,hx+u*3,hy,u*6,u*4); g.fill(); g.fillStyle='#e8d060'; ell(g,hx+u*5,hy-u*1.5,u*1.2,u*1.2); g.fill(); });
prop('ladder',(g,x,y,s,t,o)=>{ const u=s/100; glow(g,x+u*30,y-u*260,u*120,'#fff0c0',.45); g.strokeStyle='rgba(255,236,190,.8)'; g.lineWidth=u*2.4;
  for(const d of[-1,1]){ g.beginPath(); g.moveTo(x+d*u*14,y); g.lineTo(x+u*30+d*u*8,y-u*320); g.stroke(); }
  for(let i=1;i<18;i++){ const k=i/18; g.beginPath(); g.moveTo(lerp(x-u*14,x+u*22,k),y-u*320*k); g.lineTo(lerp(x+u*14,x+u*38,k),y-u*320*k); g.stroke(); }
  for(let i=0;i<5;i++){ const k=((t/9000+i/5)%1), kk=i%2?k:1-k; drawFigure(g,lerp(x,x+u*30,kk),y-u*320*kk,s*.32,{skin:'#e8d0a8',robe:'#f4eee0',angel:1,hair:'#d8c070'},POSES.climb,'r',t,{}); } });
prop('sacks',(g,x,y,s,t,o)=>{ const u=s/100; for(let i=0;i<(o.n||4);i++){ const sx=x+(i%3-1)*u*18, sy=y-Math.floor(i/3)*u*16; g.fillStyle=mixc('#b8a070','#9a8458',(i*.37)%1); smooth(g,[[sx-u*9,sy],[sx+u*9,sy],[sx+u*8,sy-u*18],[sx+u*3,sy-u*22],[sx-u*3,sy-u*22],[sx-u*8,sy-u*18]]); g.fill();
  g.strokeStyle='#6a5030'; g.lineWidth=u*1; g.beginPath(); g.moveTo(sx-u*4,sy-u*19); g.lineTo(sx+u*4,sy-u*19); g.stroke(); } });
prop('bricks',(g,x,y,s,t,o)=>{ const u=s/100, n=o.n||14; for(let i=0;i<n;i++){ const r2=Math.floor(i/5), c=i%5; g.fillStyle=mixc('#a8683a','#c08048',((i*7)%5)/5); g.fillRect(x-u*30+c*u*12+(r2%2)*u*6,y-u*6-r2*u*6,u*11,u*5.4); }
  if(o.mould){ g.fillStyle='#6a4a28'; g.fillRect(x+u*40,y-u*4,u*16,u*4); } });
prop('pyramid',(g,x,y,s,t,o)=>{ const u=s/100, w=u*(o.w||320), hh=u*(o.h||200); g.fillStyle=o.color||'#d8b878'; poly(g,[[x-w/2,y],[x,y-hh],[x+w/2,y]]); g.fill();
  g.fillStyle='rgba(60,40,20,.28)'; poly(g,[[x,y-hh],[x+w/2,y],[x+w*.05,y]]); g.fill(); g.strokeStyle='rgba(80,60,30,.2)'; g.lineWidth=1;
  for(let i=1;i<14;i++){ const k=i/14; g.beginPath(); g.moveTo(x-w/2*k,y-hh*(1-k)); g.lineTo(x+w/2*k,y-hh*(1-k)); g.stroke(); } });
prop('obelisk',(g,x,y,s,t,o)=>{ const u=s/100, hh=u*(o.h||180); g.fillStyle=lin(g,x-u*10,0,x+u*10,0,[[0,'#8a7050'],[.5,'#d8c090'],[1,'#8a7050']]); poly(g,[[x-u*10,y],[x+u*10,y],[x+u*7,y-hh],[x,y-hh-u*12],[x-u*7,y-hh]]); g.fill();
  g.fillStyle='rgba(60,40,20,.35)'; for(let i=0;i<8;i++) g.fillRect(x-u*3,y-hh*.2-i*u*14,u*6,u*6); });
prop('ziggurat',(g,x,y,s,t,o)=>{ PROPS.tower(g,x,y,s,t,Object.assign({tiers:5,h:230,color:'#b08a5a'},o)); });
prop('cart',(g,x,y,s,t,o)=>{ const u=s/100, d=o.face==='l'?-1:1; g.save(); g.translate(x,y); g.scale(d,1); g.fillStyle='#7a5430'; g.fillRect(-u*40,-u*34,u*70,u*16);
  g.strokeStyle='#4a3020'; g.lineWidth=u*3; g.beginPath(); g.arc(-u*24,-u*14,u*14,0,TAU); g.stroke(); g.beginPath(); g.arc(u*14,-u*14,u*14,0,TAU); g.stroke(); g.beginPath(); g.moveTo(u*30,-u*26); g.lineTo(u*70,-u*30); g.stroke();
  if(o.ark) PROPS.ark(g,-u*6,-u*34,s*.8,t,{}); if(o.load){ g.fillStyle='#8a6a3a'; g.fillRect(-u*36,-u*50,u*60,u*16); } g.restore(); });
prop('goat',(g,x,y,s,t,o)=>{ const u=s/100, d=o.face==='l'?-1:1; g.save(); g.translate(x,y); g.scale(d,1); const c=o.color||'#4a3a2e'; g.fillStyle=c;
  for(const lx of[-u*12,-u*7,u*7,u*12]) g.fillRect(lx,-u*20,u*2.6,u*20); ell(g,0,-u*24,u*16,u*8); g.fill(); ell(g,u*17,-u*30,u*6,u*5); g.fill();
  g.strokeStyle=o.ram?'#d8ccb0':'#3a2e24'; g.lineWidth=u*2.2; g.beginPath(); if(o.ram){ g.arc(u*15,-u*33,u*5,PI,PI*2.6); } else { g.moveTo(u*15,-u*34); g.lineTo(u*11,-u*42); } g.stroke();
  if(o.ram){ g.fillStyle='#e8e2d4'; ell(g,0,-u*25,u*16,u*9); g.fill(); } g.fillStyle='#3a2e24'; g.fillRect(u*20,-u*27,u*2,u*5); g.restore(); });
prop('ram',(g,x,y,s,t,o)=>{ PROPS.goat(g,x,y,s,t,Object.assign({ram:1},o)); if(o.thicket){ PROPS.bush(g,x-s*.1,y,s*.9,t,{color:'#3e4e2a'}); } });
prop('bull',(g,x,y,s,t,o)=>{ PROPS.oxen(g,x,y,s*1.1,t,{n:1}); });
prop('bear',(g,x,y,s,t,o)=>{ const u=s/100, d=o.face==='l'?-1:1; g.save(); g.translate(x,y); g.scale(d,1); g.fillStyle='#4a3020';
  for(const lx of[-u*20,-u*12,u*10,u*18]) g.fillRect(lx,-u*20,u*7,u*20); ell(g,0,-u*30,u*28,u*16); g.fill(); ell(g,u*28,-u*34,u*11,u*10); g.fill(); ell(g,u*22,-u*44,u*3.5,u*3.5); g.fill(); g.restore(); });
prop('dog',(g,x,y,s,t,o)=>{ const u=s/100, d=o.face==='l'?-1:1; g.save(); g.translate(x,y); g.scale(d,1); g.fillStyle=o.color||'#7a6040';
  for(const lx of[-u*10,-u*6,u*6,u*10]) g.fillRect(lx,-u*14,u*2.4,u*14); ell(g,0,-u*18,u*13,u*6); g.fill(); ell(g,u*14,-u*23,u*5,u*4.5); g.fill(); poly(g,[[u*12,-u*27],[u*14,-u*33],[u*16,-u*27]]); g.fill(); g.restore(); });
prop('coat',(g,x,y,s,t,o)=>{ const u=s/100; const cols=['#c83a3a','#e8b040','#3a7ac8','#4aa860','#9a4ab8']; for(let i=0;i<5;i++){ g.fillStyle=cols[i]; poly(g,[[x-u*18+i*u*7,y-u*40],[x-u*11+i*u*7,y-u*40],[x-u*9+i*u*7,y],[x-u*16+i*u*7,y]]); g.fill(); }
  if(o.blood){ g.fillStyle='rgba(110,10,10,.7)'; ell(g,x,y-u*14,u*12,u*8); g.fill(); } });
prop('chest',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle='#6a4a28'; g.fillRect(x-u*18,y-u*16,u*36,u*16); g.fillStyle='#8a6a38'; g.fillRect(x-u*19,y-u*20,u*38,u*5); g.fillStyle='#c8a048'; g.fillRect(x-u*2,y-u*14,u*4,u*5);
  if(o.gold){ g.fillStyle='#f0c850'; for(let i=0;i<6;i++){ ell(g,x-u*12+i*u*5,y-u*21-(i%2)*u*2,u*3,u*1.8); g.fill(); } } });
prop('manna',(g,x,y,s,t,o)=>{ const u=s/100, r=rng(9); g.fillStyle='rgba(250,248,240,.9)'; for(let i=0;i<120;i++){ ell(g,r()*VW,VH*(.6+r()*.35),u*1.4,u*.8); g.fill(); } });
prop('mizbeach',(g,x,y,s,t,o)=>{ PROPS.altar(g,x,y,s,t,o); });
prop('menorah',(g,x,y,s,t,o)=>{ PROPS.lampstand(g,x,y,s,t,o); });
prop('seat',(g,x,y,s,t,o)=>{ const u=s/100; g.fillStyle=o.color||'#6a5a44'; rr(g,x-u*14,y-u*24,u*28,u*24,u*2); g.fill(); });

function fireAt(g,x,y,w,h,t){
  for(let i=0;i<7;i++){
    const fx=x+(i-3)*w/8, ph=t/120+i*1.7, fh=h*(.55+.45*Math.abs(Math.sin(ph))), fw=w/6*(1+Math.sin(ph*1.3)*.1);
    g.fillStyle=i%2?'rgba(255,120,40,.85)':'rgba(255,170,60,.9)';
    g.beginPath(); g.moveTo(fx-fw,y); g.quadraticCurveTo(fx-fw*.6,y-fh*.6,fx+Math.sin(ph)*fw*.4,y-fh); g.quadraticCurveTo(fx+fw*.6,y-fh*.5,fx+fw,y); g.closePath(); g.fill();
  }
  for(let i=0;i<4;i++){ const fx=x+(i-1.5)*w/7, ph=t/100+i*2.3, fh=h*(.35+.25*Math.abs(Math.sin(ph)));
    g.fillStyle='rgba(255,236,160,.9)'; g.beginPath(); g.moveTo(fx-w/16,y); g.quadraticCurveTo(fx,y-fh,fx+w/16,y); g.closePath(); g.fill(); }
  for(let i=0;i<5;i++){ const k=((t/900+i*.21)%1); g.fillStyle='rgba(255,200,120,'+(1-k).toFixed(2)+')'; g.fillRect(x+Math.sin(i*7+t/400)*w*.4,y-h*(.6+k*1.2),2,2); }
}

/* ============================== sets ============================== */
/* a set paints its unchanging layers once into a cache (`paint`), and may add motion (`anim`) */
const SETS={};
function set(name,def){ SETS[name]=def; }

function skyPaint(g,H,r,o){
  o=o||{};
  const hz=VH*(o.hz||.5);
  Stage._skyGrad=lin(g,0,0,0,hz,[[0,H.sky[0]],[.6,H.sky[1]],[1,H.sky[2]]]); g.fillStyle=Stage._skyGrad; g.fillRect(0,0,VW,hz+2);
  if(H===HOURS.night){ for(let i=0;i<180;i++){ const x=r()*VW, y=r()*hz*.95, s=r()<.1?1.8:1; g.fillStyle='rgba(235,238,255,'+(.25+r()*.6).toFixed(2)+')'; g.fillRect(x,y,s,s); }
    const mx=VW*(.15+r()*.7), my=hz*(.18+r()*.2); glow(g,mx,my,VH*.12,'#dfe6ff',.28); g.fillStyle='#eef0f8'; g.beginPath(); g.arc(mx,my,VH*.028,0,TAU); g.fill(); }
  else if(H.sun&&!o.noSun){ const sx=VW*(H.lx>0?.78:.22)+(r()-.5)*VW*.1, sy=hz*(H===HOURS.day||H===HOURS.noon?.25:.82);
    glow(g,sx,sy,VH*.3,H.sun,.45); glow(g,sx,sy,VH*.08,'#ffffff',.6); g.fillStyle=H.sun; g.beginPath(); g.arc(sx,sy,VH*.035,0,TAU); g.fill(); }
  if(H!==HOURS.night&&!o.noClouds){ const n=H===HOURS.storm?14:3+Math.floor(r()*4);
    for(let i=0;i<n;i++){ const cx=r()*VW, cy=hz*(.1+r()*.5), cw=VW*(.08+r()*.14);
      g.fillStyle=H===HOURS.storm?'rgba(40,44,50,.75)':css(mix('#ffffff',H.sky[2],.3),.55);
      for(let k=0;k<5;k++){ ell(g,cx+(k-2)*cw*.22,cy+Math.sin(k*1.7)*cw*.05,cw*(.22+r()*.12),cw*(.1+r()*.06)); g.fill(); } } }
}
function ridge(g,y,amp,col,r,o){
  o=o||{}; const step=o.step||VW/40, rough=o.rough||.5, pts=[];
  let phase=r()*10, ph2=r()*10;
  for(let x=-step;x<=VW+step;x+=step){ pts.push([x,y-amp*(.5+.5*Math.sin(x/VW*TAU*(o.freq||1.3)+phase))*(1-rough)-amp*rough*Math.abs(Math.sin(x/VW*TAU*(o.freq2||3.7)+ph2))*(o.jag?1:.6)]); }
  g.fillStyle=col; g.beginPath(); g.moveTo(-step,VH); for(const[px,py]of pts) g.lineTo(px,py); g.lineTo(VW+step,VH); g.closePath(); g.fill();
  if(o.lit){ g.strokeStyle=o.lit; g.lineWidth=2; g.beginPath(); pts.forEach(([px,py],i)=>i?g.lineTo(px,py):g.moveTo(px,py)); g.stroke(); }
}
function groundPaint(g,H,c1,c2,hz){ const y=VH*hz; g.fillStyle=lin(g,0,y,0,VH,[[0,mixc(c1,H.haze,.35)],[.35,css(rgb(c1))],[1,css(rgb(c2))]]); g.fillRect(0,y,VW,VH-y); }
function tex(g,r,y0,y1,col,n,sz){ for(let i=0;i<n;i++){ const y=lerp(y0,y1,Math.pow(r(),.7)), s=sz*(.4+(y-y0)/(y1-y0+1)); g.fillStyle=col; g.fillRect(r()*VW,y,s*(1+r()*2),Math.max(1,s*.4)); } }
const tintHour=(c,H,k)=>mixc(c,H.amb,(k||.3)*(H.dim*1.6+.15));

set('wilderness',{horizon:.5,paint(g,H,r){ skyPaint(g,H,r);
  ridge(g,VH*.46,VH*.1,tintHour(mixc('#8a8070',H.haze,.55),H),r,{jag:1});
  ridge(g,VH*.5,VH*.07,tintHour(mixc('#8a7458',H.haze,.3),H),r,{rough:.7});
  groundPaint(g,H,tintHour('#a08a64',H),tintHour('#6e5a3e',H),.5); tex(g,r,VH*.52,VH,'rgba(60,44,28,.25)',260,3);
  for(let i=0;i<9;i++){ const x=r()*VW, y=VH*(.56+r()*.12); PROPS.rock(g,x,y,VH*.2*(y/VH),0,{color:tintHour('#7a6e5a',H),w:30+r()*40,h:16+r()*20}); }
  for(let i=0;i<10;i++){ const x=r()*VW, y=VH*(.55+r()*.2); PROPS.bush(g,x,y,VH*.12*(y/VH),0,{color:tintHour('#5a5a34',H)}); } }});
set('desert',{horizon:.52,paint(g,H,r){ skyPaint(g,H,r,{hz:.52});
  for(let k=0;k<4;k++) ridge(g,VH*(.5+k*.05),VH*(.05+k*.02),tintHour(mixc(k%2?'#d8b078':'#c89a60',H.haze,.45-k*.12),H),r,{freq:.8+k*.3,rough:.1});
  groundPaint(g,H,tintHour('#d4a868',H),tintHour('#a87a44',H),.66); tex(g,r,VH*.66,VH,'rgba(120,80,40,.18)',220,3); }});
set('mountain',{horizon:.52,paint(g,H,r){ skyPaint(g,H,r,{hz:.52});
  ridge(g,VH*.42,VH*.12,tintHour(mixc('#7a7468',H.haze,.6),H),r,{jag:1,freq:2.2});
  const px=VW*(.35+r()*.3), top=VH*.07, base=VH*.56;
  const rock=tintHour(mixc('#6e6558',H.haze,.2),H), dark=tintHour(mixc('#463f36',H.haze,.1),H);
  const L=[[px-VW*.55,base],[px-VW*.3,base-VH*.16],[px-VW*.18,top+VH*.16],[px-VW*.07,top+VH*.07],[px,top],[px+VW*.06,top+VH*.05],[px+VW*.17,top+VH*.17],[px+VW*.34,base-VH*.14],[px+VW*.6,base]];
  g.fillStyle=rock; poly(g,L); g.fill();
  g.fillStyle=dark; poly(g,[[px,top],[px+VW*.06,top+VH*.05],[px+VW*.17,top+VH*.17],[px+VW*.34,base-VH*.14],[px+VW*.6,base],[px+VW*.08,base],[px+VW*.04,top+VH*.2]]); g.fill();
  g.strokeStyle='rgba(20,16,12,.25)'; g.lineWidth=2;
  for(let i=0;i<14;i++){ const k=r(), x0=lerp(px-VW*.25,px+VW*.3,k), y0=lerp(top+VH*.06,base-VH*.05,r()); g.beginPath(); g.moveTo(x0,y0); g.lineTo(x0+(r()-.5)*VW*.04,y0+VH*(.04+r()*.08)); g.stroke(); }
  g.strokeStyle='rgba(255,250,235,.22)'; g.lineWidth=2.5; g.beginPath(); g.moveTo(px-VW*.18,top+VH*.16); g.lineTo(px-VW*.07,top+VH*.07); g.lineTo(px,top); g.stroke();
  g.fillStyle=tintHour('#4e6a34',H); for(let i=0;i<40;i++){ const x=lerp(px-VW*.5,px+VW*.5,r()), y=base-VH*(r()*.12); ell(g,x,y,VW*.012,VH*.012); g.fill(); }
  ridge(g,VH*.57,VH*.05,tintHour('#7a6a50',H),r,{rough:.6});
  groundPaint(g,H,tintHour('#8a7a58',H),tintHour('#5e5038',H),.57); tex(g,r,VH*.59,VH,'rgba(50,40,26,.25)',200,3);
  for(let i=0;i<7;i++) PROPS.rock(g,r()*VW,VH*(.6+r()*.15),VH*.16,0,{color:tintHour('#6e6452',H)}); }});
set('field',{horizon:.52,paint(g,H,r){ skyPaint(g,H,r,{hz:.52}); ridge(g,VH*.5,VH*.05,tintHour(mixc('#6a7a4a',H.haze,.5),H),r);
  groundPaint(g,H,tintHour('#c8a850',H),tintHour('#8a7030',H),.53);
  for(let row=0;row<40;row++){ const y=VH*(.54+row*.012); g.strokeStyle=css(rgb(tintHour('#e0c068',H)),.25+row*.01); g.lineWidth=1+row*.05; g.beginPath(); for(let x=0;x<VW;x+=6+row*.4){ g.moveTo(x,y); g.lineTo(x+1,y-3-row*.2); } g.stroke(); }
  for(let i=0;i<3;i++) PROPS.tree(g,r()*VW,VH*.52,VH*.12,0,{color:tintHour('#4a6a30',H)}); },
  anim(g,H,t){ g.strokeStyle='rgba(255,240,180,.08)'; g.lineWidth=2; for(let i=0;i<5;i++){ const y=VH*(.6+i*.07), x=((t/30+i*300)%(VW*1.4))-VW*.2; g.beginPath(); g.moveTo(x,y); g.lineTo(x+VW*.25,y); g.stroke(); } }});
set('garden',{horizon:.5,paint(g,H,r){ skyPaint(g,H,r); ridge(g,VH*.48,VH*.06,tintHour(mixc('#4a7a44',H.haze,.45),H),r);
  groundPaint(g,H,tintHour('#5a8a3a',H),tintHour('#2e5a26',H),.5); tex(g,r,VH*.52,VH,'rgba(30,60,20,.3)',300,3);
  for(let i=0;i<60;i++){ g.fillStyle=['#f0e070','#f4a0b0','#ffffff','#c080e0'][i%4]; ell(g,r()*VW,VH*(.55+r()*.45),2,2); g.fill(); }
  for(let i=0;i<8;i++){ const x=r()*VW, y=VH*(.5+r()*.08); PROPS.tree(g,x,y,VH*.2*(y/VH),0,{color:tintHour(['#3e7a34','#4a8a3a','#2e6a2a'][i%3],H),fruit:i%3===0?'#d85a3a':null}); }
  g.fillStyle='rgba(160,210,240,.7)'; ell(g,VW*.5,VH*.64,VW*.18,VH*.018); g.fill(); }});
set('river',{horizon:.5,paint(g,H,r){ skyPaint(g,H,r); ridge(g,VH*.48,VH*.05,tintHour(mixc('#6a7a50',H.haze,.5),H),r);
  groundPaint(g,H,tintHour('#8a8a58',H),tintHour('#5a5a38',H),.5);
  g.fillStyle=lin(g,0,VH*.56,0,VH*.68,[[0,tintHour(mixc('#4a7a9a',H.sky[2],.35),H)],[1,tintHour('#2a5a7a',H)]]);
  g.beginPath(); g.moveTo(0,VH*.57); g.bezierCurveTo(VW*.3,VH*.55,VW*.6,VH*.6,VW,VH*.56); g.lineTo(VW,VH*.66); g.bezierCurveTo(VW*.6,VH*.7,VW*.3,VH*.64,0,VH*.68); g.closePath(); g.fill();
  for(let i=0;i<5;i++) PROPS.reeds(g,r()*VW,VH*.57,VH*.14,0,{w:80}); for(let i=0;i<4;i++) PROPS.palm(g,r()*VW,VH*.52,VH*.14,0,{}); },
  anim(g,H,t){ g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=1.5; for(let i=0;i<8;i++){ const y=VH*(.585+i*.01), x=((t/20+i*170)%VW); g.beginPath(); g.moveTo(x,y); g.lineTo(x+30,y); g.stroke(); } }});
set('sea',{horizon:.48,paint(g,H,r){ skyPaint(g,H,r,{hz:.48});
  g.fillStyle=lin(g,0,VH*.48,0,VH,[[0,tintHour(mixc('#3a6a8a',H.sky[2],.4),H)],[1,tintHour('#123a52',H)]]); g.fillRect(0,VH*.48,VW,VH*.52);
  g.fillStyle=tintHour('#c8b080',H); g.beginPath(); g.moveTo(0,VH*.8); g.quadraticCurveTo(VW*.4,VH*.7,VW,VH*.78); g.lineTo(VW,VH); g.lineTo(0,VH); g.closePath(); g.fill(); },
  anim(g,H,t){ for(let i=0;i<22;i++){ const y=VH*(.5+i*.014), a=.06+i*.006; g.strokeStyle='rgba(255,255,255,'+a+')'; g.lineWidth=1+i*.08; g.beginPath();
    for(let x=0;x<=VW;x+=24) g.lineTo(x,y+Math.sin(x*.02+t/600+i)*(1+i*.2)); g.stroke(); } }});
set('storm',{horizon:.46,hour:'storm',paint(g,H,r){ skyPaint(g,HOURS.storm,r,{hz:.46});
  g.fillStyle=lin(g,0,VH*.46,0,VH,[[0,'#2a3a44'],[1,'#0c161e']]); g.fillRect(0,VH*.46,VW,VH*.54); },
  anim(g,H,t){ for(let i=0;i<14;i++){ const y=VH*(.48+i*.04); g.fillStyle='rgba(200,220,230,'+(.05+i*.01)+')'; g.beginPath(); g.moveTo(0,VH);
    for(let x=0;x<=VW;x+=20) g.lineTo(x,y+Math.sin(x*.012+t/300+i*1.3)*(6+i*2)); g.lineTo(VW,VH); g.closePath(); g.fill(); } }});
set('city',{horizon:.5,paint(g,H,r){ skyPaint(g,H,r); ridge(g,VH*.46,VH*.05,tintHour(mixc('#7a7a60',H.haze,.5),H),r);
  const stone=tintHour('#c8b088',H), stone2=tintHour('#a89068',H);
  for(let k=0;k<3;k++){ const by=VH*(.46+k*.035), sc=.5+k*.25; for(let i=0;i<14-k*3;i++){ const w=VW*(.05+r()*.05)*sc*2, x=r()*VW, hh=VH*(.05+r()*.07)*sc*1.6;
    g.fillStyle=mixc(k%2?stone:stone2,H.haze,.4-k*.13); g.fillRect(x,by-hh,w,hh+VH*.02); g.fillStyle='rgba(30,20,12,'+(.35+k*.1)+')'; g.fillRect(x+w*.3,by-hh*.6,w*.12,hh*.15);
    if(H.lamp>.3&&r()<.5){ g.fillStyle='rgba(255,190,100,'+(.7*H.lamp)+')'; g.fillRect(x+w*.3,by-hh*.6,w*.12,hh*.15); } } }
  groundPaint(g,H,tintHour('#b0986c',H),tintHour('#7a6444',H),.56);
  for(let i=0;i<24;i++){ g.strokeStyle='rgba(60,44,28,.18)'; g.lineWidth=1; const y=VH*(.58+i*.018); g.beginPath(); g.moveTo(0,y); g.lineTo(VW,y); g.stroke(); } }});
set('gate',{horizon:.5,paint(g,H,r){ SETS.city.paint(g,H,r); PROPS.wall(g,VW*.5,VH*.56,VH*.3,0,{w:1.2,color:tintHour('#b8a07a',H),h:120}); PROPS.gate(g,VW*.5,VH*.565,VH*.34,0,{color:tintHour('#b8a07a',H)}); }});
set('walls',{horizon:.52,paint(g,H,r){ skyPaint(g,H,r,{hz:.52}); ridge(g,VH*.5,VH*.06,tintHour(mixc('#7a7a60',H.haze,.5),H),r);
  const c=tintHour('#b8a07a',H), yb=VH*.54, sc=VH*.2;
  PROPS.wall(g,VW*.5,yb,sc,0,{w:1.3,h:110,color:c});
  for(const tx of[.1,.34,.66,.9]) PROPS.tower(g,VW*tx,yb,sc,0,{h:150,tiers:2,color:tintHour('#a8906a',H)});
  PROPS.gate(g,VW*.5,yb+1,sc*1.05,0,{color:c,h:118,w:120});
  groundPaint(g,H,tintHour('#9a8660',H),tintHour('#6a5a3e',H),.54); tex(g,r,VH*.56,VH,'rgba(50,36,22,.22)',220,3);
  for(let i=0;i<6;i++) PROPS.rock(g,r()*VW,VH*(.6+r()*.2),VH*.12,0,{color:tintHour('#7a6e5a',H)}); }});
set('ruins',{horizon:.5,paint(g,H,r){ skyPaint(g,H,r,{noSun:true}); g.fillStyle='rgba(40,30,24,.35)'; g.fillRect(0,0,VW,VH*.5);
  PROPS.wall(g,VW*.5,VH*.52,VH*.3,0,{w:1.3,h:110,color:tintHour('#8a7a60',H),broken:true});
  groundPaint(g,H,tintHour('#7a6a52',H),tintHour('#4a3e30',H),.52);
  for(let i=0;i<40;i++){ const x=r()*VW, y=VH*(.54+r()*.4); g.fillStyle=mixc('#6a5e4c','#9a8a70',r()); poly(g,[[x,y],[x+8+r()*20,y],[x+6+r()*14,y-6-r()*12]]); g.fill(); }
  for(let i=0;i<3;i++) PROPS.pillar(g,VW*(.2+r()*.6),VH*(.56+r()*.1),VH*.25,0,{h:40+r()*60,color:'#9a8a70'}); },
  anim(g,H,t){ for(let i=0;i<5;i++){ const x=VW*(.15+i*.18), k=(t/4000+i*.2)%1; g.fillStyle='rgba(40,34,30,'+(.25*(1-k)).toFixed(3)+')'; ell(g,x+Math.sin(t/900+i)*20,VH*(.5-k*.4),30+k*80,20+k*50); g.fill(); } }});
set('camp',{horizon:.5,paint(g,H,r){ SETS.wilderness.paint(g,H,r);
  for(let i=0;i<12;i++){ const y=VH*(.51+r()*.06), sc=VH*.18*(y/VH)*.9; PROPS.tent(g,r()*VW,y,sc,0,{color:tintHour(['#6a5440','#7a6048','#5a4838','#8a6a50'][i%4],H),w:90,h:55}); } },
  anim(g,H,t){ if(H.lamp>.3) for(let i=0;i<4;i++){ const x=VW*(.12+i*.25), y=VH*(.58+(i%2)*.03); fireAt(g,x,y,14,16,t+i*300); glow(g,x,y-6,50,'#ffa040',.25); } }});
set('palace',{horizon:.44,interior:1,paint(g,H,r){
  g.fillStyle=lin(g,0,0,0,VH*.44,[[0,'#2a1c16'],[1,'#5a4230']]); g.fillRect(0,0,VW,VH*.44);
  g.fillStyle='#3a2a20'; for(let i=0;i<7;i++){ const x=VW*(i/6); PROPS.pillar(g,x,VH*.44,VH*.36,0,{h:170,w:22,color:'#b8a07a'}); }
  for(let i=0;i<6;i++){ const x=VW*((i+.5)/6); g.fillStyle=i%2?'#6a2a3a':'#2a3a6a'; poly(g,[[x-VW*.05,VH*.02],[x+VW*.05,VH*.02],[x+VW*.04,VH*.36],[x,VH*.33],[x-VW*.04,VH*.36]]); g.fill();
    g.fillStyle='rgba(230,190,90,.5)'; g.fillRect(x-VW*.05,VH*.02,VW*.1,VH*.012); }
  g.fillStyle=lin(g,0,VH*.44,0,VH,[[0,'#6a5038'],[1,'#3a2a1c']]); g.fillRect(0,VH*.44,VW,VH*.56);
  g.strokeStyle='rgba(20,12,6,.3)'; g.lineWidth=1; for(let i=0;i<14;i++){ const y=VH*.44+Math.pow(i/14,1.6)*VH*.56; g.beginPath(); g.moveTo(0,y); g.lineTo(VW,y); g.stroke(); }
  for(let i=-10;i<=10;i++){ g.beginPath(); g.moveTo(VW/2+i*VW*.04,VH*.44); g.lineTo(VW/2+i*VW*.16,VH); g.stroke(); }
  g.fillStyle='rgba(140,30,40,.55)'; poly(g,[[VW*.44,VH*.44],[VW*.56,VH*.44],[VW*.7,VH],[VW*.3,VH]]); g.fill();
  g.fillStyle='#8a7050'; g.fillRect(VW*.36,VH*.43,VW*.28,VH*.03); },
  anim(g,H,t){ for(const x of[.08,.92]){ const fx=VW*x, fy=VH*.2; glow(g,fx,fy,VH*.16,'#ffa850',.3+Math.sin(t/140+x*9)*.04); fireAt(g,fx,fy,16,22,t+x*500); g.fillStyle='#5a4028'; g.fillRect(fx-3,fy,6,VH*.05); } }});
set('temple',{horizon:.46,paint(g,H,r){ skyPaint(g,H,r,{hz:.46});
  const st=tintHour('#d8c8a0',H), st2=tintHour('#b8a47c',H), cx=VW*.5;
  g.fillStyle=st2; g.fillRect(cx-VW*.34,VH*.12,VW*.68,VH*.36); g.fillStyle=st; g.fillRect(cx-VW*.3,VH*.08,VW*.6,VH*.06);
  g.fillStyle=tintHour('#c8a048',H); g.fillRect(cx-VW*.3,VH*.13,VW*.6,VH*.012);
  g.fillStyle='#2a1c10'; g.fillRect(cx-VW*.07,VH*.2,VW*.14,VH*.28); g.fillStyle=lin(g,cx-VW*.06,0,cx+VW*.06,0,[[0,'#8a6a1c'],[.5,'#e6c460'],[1,'#8a6a1c']]); g.fillRect(cx-VW*.06,VH*.21,VW*.12,VH*.27);
  PROPS.pillar(g,cx-VW*.13,VH*.48,VH*.3,0,{h:120,w:20,color:tintHour('#c8903a',H),bronze:1}); PROPS.pillar(g,cx+VW*.13,VH*.48,VH*.3,0,{h:120,w:20,color:tintHour('#c8903a',H),bronze:1});
  for(let i=0;i<5;i++){ g.fillStyle=mixc(st,'#000',i*.05); g.fillRect(cx-VW*(.36+i*.03),VH*(.48+i*.012),VW*(.72+i*.06),VH*.012); }
  groundPaint(g,H,tintHour('#c8b48c',H),tintHour('#9a8660',H),.54);
  g.strokeStyle='rgba(60,44,28,.2)'; g.lineWidth=1; for(let i=0;i<12;i++){ const y=VH*(.55+i*.04); g.beginPath(); g.moveTo(0,y); g.lineTo(VW,y); g.stroke(); } },
  anim(g,H,t){ for(let i=0;i<3;i++){ const k=(t/5000+i/3)%1; g.fillStyle='rgba(240,236,228,'+(.12*(1-k)).toFixed(3)+')'; ell(g,VW*.5+Math.sin(t/1500+i)*30,VH*(.4-k*.35),40+k*60,20+k*30); g.fill(); } }});
set('court',{horizon:.46,paint(g,H,r){ SETS.temple.paint(g,H,r); }});
set('house',{horizon:.42,interior:1,paint(g,H,r){
  g.fillStyle=lin(g,0,0,0,VH*.42,[[0,'#3a2a1c'],[1,'#6a5236']]); g.fillRect(0,0,VW,VH*.42);
  g.strokeStyle='rgba(30,20,12,.25)'; g.lineWidth=1; for(let i=0;i<30;i++){ const y=r()*VH*.4; g.beginPath(); g.moveTo(r()*VW,y); g.lineTo(r()*VW,y); g.stroke(); }
  g.fillStyle='#2a1c10'; for(let i=0;i<5;i++) g.fillRect(0,VH*(.02+i*.004)+i*VH*.01,VW,VH*.012);
  g.fillStyle='#1a120a'; rr(g,VW*.7,VH*.1,VW*.08,VH*.12,6); g.fill(); g.fillStyle=css(rgb(H.sky[1]),.9); rr(g,VW*.708,VH*.11,VW*.064,VH*.1,4); g.fill();
  g.fillStyle=lin(g,0,VH*.42,0,VH,[[0,'#6a563e'],[1,'#3a2e20']]); g.fillRect(0,VH*.42,VW,VH*.58);
  for(let i=0;i<5;i++){ g.fillStyle=['#7a3a2a','#3a4a6a','#6a5a2a'][i%3]; ell(g,VW*(.1+r()*.8),VH*(.7+r()*.2),VW*.07,VH*.02); g.fill(); } },
  anim(g,H,t){ const x=VW*.3, y=VH*.36; g.fillStyle='#8a5a2a'; g.fillRect(x-4,y,8,VH*.06); drawHeld(g,'lamp',x,y,VH*.3,'r',t); glow(g,x,y-10,VH*.3,'#ffb060',.18); }});
set('tentin',{horizon:.4,interior:1,paint(g,H,r){ g.fillStyle=lin(g,0,0,0,VH*.4,[[0,'#3a2418'],[1,'#7a5438']]); g.fillRect(0,0,VW,VH*.4);
  for(let i=0;i<9;i++){ g.strokeStyle='rgba(20,12,6,.3)'; g.lineWidth=2; g.beginPath(); g.moveTo(VW*i/8,0); g.lineTo(VW*.5+(i-4)*VW*.16,VH*.4); g.stroke(); }
  g.fillStyle=lin(g,0,VH*.4,0,VH,[[0,'#5a4430'],[1,'#2e2218']]); g.fillRect(0,VH*.4,VW,VH*.6);
  for(let i=0;i<4;i++){ g.fillStyle=['#8a3a2a','#3a5a7a','#7a6a3a','#5a3a5a'][i]; ell(g,VW*(.15+i*.23),VH*(.72+(i%2)*.1),VW*.09,VH*.025); g.fill(); } },
  anim(g,H,t){ fireAt(g,VW*.5,VH*.62,20,22,t); glow(g,VW*.5,VH*.58,VH*.3,'#ffa850',.22); }});
set('prison',{horizon:.4,interior:1,paint(g,H,r){ g.fillStyle='#16120e'; g.fillRect(0,0,VW,VH);
  for(let y=0;y<VH*.6;y+=VH*.05) for(let x=((y/(VH*.05))%2)*VW*.04;x<VW;x+=VW*.08){ g.fillStyle=mixc('#2a241c','#3a3228',r()); g.fillRect(x+1,y+1,VW*.08-2,VH*.05-2); }
  g.fillStyle='#0c0a08'; g.fillRect(0,VH*.6,VW,VH*.4);
  g.fillStyle=css(rgb(H.sky[1]),.5); g.fillRect(VW*.46,VH*.06,VW*.08,VH*.08); g.strokeStyle='#0c0a08'; g.lineWidth=4; for(let i=1;i<4;i++){ g.beginPath(); g.moveTo(VW*(.46+i*.02),VH*.06); g.lineTo(VW*(.46+i*.02),VH*.14); g.stroke(); }
  g.fillStyle='rgba(200,200,180,.07)'; poly(g,[[VW*.46,VH*.14],[VW*.54,VH*.14],[VW*.64,VH*.8],[VW*.36,VH*.8]]); g.fill(); }});
set('pit',{horizon:.3,interior:1,paint(g,H,r){ g.fillStyle='#0e0b08'; g.fillRect(0,0,VW,VH);
  g.fillStyle=css(rgb(H.sky[1]),.9); ell(g,VW*.5,VH*.06,VW*.14,VH*.05); g.fill();
  g.fillStyle='rgba(200,190,160,.1)'; poly(g,[[VW*.38,VH*.06],[VW*.62,VH*.06],[VW*.7,VH*.85],[VW*.3,VH*.85]]); g.fill();
  for(let i=0;i<60;i++){ g.fillStyle=mixc('#1e1a14','#342c22',r()); ell(g,r()*VW,r()*VH*.7,20+r()*40,10+r()*20); g.fill(); }
  g.fillStyle='#2a2016'; ell(g,VW*.5,VH*.84,VW*.45,VH*.12); g.fill(); g.fillStyle='rgba(40,32,20,.8)'; ell(g,VW*.5,VH*.8,VW*.3,VH*.05); g.fill(); }});
set('cave',{horizon:.46,interior:1,paint(g,H,r){
  g.fillStyle=lin(g,0,0,0,VH,[[0,'#16110c'],[.5,'#2a2118'],[1,'#120e0a']]); g.fillRect(0,0,VW,VH);
  /* the mouth of the cave, and the day beyond it */
  const mx=VW*.78, my=VH*.5;
  g.save(); g.beginPath(); g.moveTo(VW*.62,VH*.64); g.bezierCurveTo(VW*.6,VH*.2,VW*.96,VH*.12,VW*.98,VH*.64); g.closePath(); g.clip();
  skyPaint(g,H,r,{hz:.5,noClouds:true}); groundPaint(g,H,tintHour('#9a8660',H),tintHour('#6a5a3e',H),.5); ridge(g,VH*.5,VH*.05,tintHour(mixc('#7a7a60',H.haze,.5),H),r); g.restore();
  glow(g,mx,my,VH*.55,H.light,.22);
  /* strata of the rock */
  for(let i=0;i<22;i++){ const y=r()*VH*.6, x=r()*VW; g.strokeStyle='rgba(80,64,44,'+(.15+r()*.2).toFixed(2)+')'; g.lineWidth=2+r()*4; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+VW*.1,y+(r()-.5)*20,x+VW*(.15+r()*.2),y+(r()-.5)*30); g.stroke(); }
  g.fillStyle=lin(g,0,VH*.56,0,VH,[[0,'#3a3026'],[1,'#1a1510']]); g.beginPath(); g.moveTo(0,VH*.6); g.quadraticCurveTo(VW*.4,VH*.54,VW,VH*.62); g.lineTo(VW,VH); g.lineTo(0,VH); g.closePath(); g.fill();
  g.fillStyle='rgba(0,0,0,.35)'; poly(g,[[0,0],[VW*.25,0],[0,VH*.5]]); g.fill(); }});
set('night',{horizon:.52,hour:'night',paint(g,H,r){ skyPaint(g,HOURS.night,r,{hz:.52}); ridge(g,VH*.5,VH*.06,'#141a28',r);
  groundPaint(g,HOURS.night,'#1e2432','#0c1018',.52); }});
set('heaven',{horizon:.62,hour:'glory',paint(g,H,r){ g.fillStyle=lin(g,0,0,0,VH,[[0,'#2a2040'],[.4,'#8a7aa8'],[.7,'#f0dca8'],[1,'#fff6d8']]); g.fillRect(0,0,VW,VH);
  for(let i=0;i<28;i++){ const x=r()*VW, y=VH*(.5+r()*.5), w=VW*(.1+r()*.2); g.fillStyle='rgba(255,252,240,'+(.3+r()*.4).toFixed(2)+')'; for(let k=0;k<4;k++){ ell(g,x+(k-1.5)*w*.25,y,w*.25,w*.08); g.fill(); } }
  glow(g,VW*.5,VH*.3,VH*.6,'#fff6d0',.6); },
  anim(g,H,t){ for(let i=0;i<16;i++){ const a=i/16*TAU+t/12000; g.strokeStyle='rgba(255,246,210,.12)'; g.lineWidth=VW*.02; g.beginPath(); g.moveTo(VW*.5,VH*.3); g.lineTo(VW*.5+Math.cos(a)*VW,VH*.3+Math.sin(a)*VW); g.stroke(); } }});
set('vision',{horizon:.6,hour:'night',paint(g,H,r){ g.fillStyle=rad(g,VW*.5,VH*.35,10,VW*.8,[[0,'#3a4a7a'],[.5,'#141a38'],[1,'#05060e']]); g.fillRect(0,0,VW,VH);
  for(let i=0;i<120;i++){ g.fillStyle='rgba(200,220,255,'+(r()*.6).toFixed(2)+')'; g.fillRect(r()*VW,r()*VH,1.5,1.5); } },
  anim(g,H,t){ for(let i=0;i<5;i++){ const rr2=VH*(.1+i*.08)+Math.sin(t/800+i)*6; g.strokeStyle='rgba(180,210,255,'+(.25-i*.04)+')'; g.lineWidth=2; g.beginPath(); g.ellipse(VW*.5,VH*.35,rr2*1.6,rr2*.6,t/(4000+i*800),0,TAU); g.stroke(); }
    glow(g,VW*.5,VH*.35,VH*.25,'#e0ecff',.3+Math.sin(t/600)*.05); }});
set('valley',{horizon:.46,paint(g,H,r){ skyPaint(g,H,r,{hz:.46}); ridge(g,VH*.44,VH*.14,tintHour(mixc('#7a7058',H.haze,.45),H),r,{jag:1});
  g.fillStyle=tintHour('#6a5a42',H); poly(g,[[0,VH*.3],[VW*.3,VH*.6],[0,VH*.8]]); g.fill(); poly(g,[[VW,VH*.28],[VW*.7,VH*.6],[VW,VH*.8]]); g.fill();
  groundPaint(g,H,tintHour('#9a8a62',H),tintHour('#5e4e36',H),.56); tex(g,r,VH*.58,VH,'rgba(50,36,22,.25)',200,3); }});
set('battle',{horizon:.48,paint(g,H,r){ SETS.valley.paint(g,H,r); g.fillStyle='rgba(120,100,70,.25)'; g.fillRect(0,VH*.4,VW,VH*.3); },
  anim(g,H,t){ for(let i=0;i<24;i++){ const k=(t/3000+i/24)%1; g.fillStyle='rgba(170,150,110,'+(.12*(1-k)).toFixed(3)+')'; ell(g,(i*97+t/20)%VW,VH*(.62-k*.2),20+k*40,8+k*18); g.fill(); } }});
set('threshing',{horizon:.52,paint(g,H,r){ SETS.field.paint(g,H,r); g.fillStyle=tintHour('#b89a60',H); ell(g,VW*.5,VH*.7,VW*.3,VH*.06); g.fill();
  g.fillStyle=tintHour('#e0c070',H); for(let i=0;i<3;i++){ ell(g,VW*(.4+i*.1),VH*.66,VW*.04,VH*.03); g.fill(); } }});
set('vineyard',{horizon:.5,paint(g,H,r){ skyPaint(g,H,r); ridge(g,VH*.48,VH*.07,tintHour(mixc('#6a7a4a',H.haze,.5),H),r);
  groundPaint(g,H,tintHour('#7a6a40',H),tintHour('#4a3e24',H),.5);
  for(let k=0;k<5;k++) PROPS.vine(g,VW*.5,VH*(.54+k*.05),VH*(.1+k*.04),0,{w:(VW/(VH*(.1+k*.04)/100))*1.1}); }});
set('flood',{horizon:.44,hour:'storm',paint(g,H,r){ skyPaint(g,HOURS.storm,r,{hz:.44}); g.fillStyle=lin(g,0,VH*.44,0,VH,[[0,'#3a4a52'],[1,'#10181e']]); g.fillRect(0,VH*.44,VW,VH*.56);
  g.fillStyle='#1a2228'; ell(g,VW*.85,VH*.46,VW*.08,VH*.02); g.fill(); },
  anim(g,H,t){ SETS.storm.anim(g,H,t); }});
set('highplace',{horizon:.5,paint(g,H,r){ SETS.wilderness.paint(g,H,r); for(let i=0;i<5;i++) PROPS.tree(g,VW*(.1+i*.2)+r()*30,VH*.52,VH*.16,0,{color:tintHour('#3a5a2a',H)}); }});
set('road',{horizon:.5,paint(g,H,r){ SETS.wilderness.paint(g,H,r); g.fillStyle=tintHour('#b8a07a',H); poly(g,[[VW*.47,VH*.5],[VW*.53,VH*.5],[VW*.8,VH],[VW*.2,VH]]); g.fill(); }});
set('shore',{horizon:.48,paint(g,H,r){ SETS.sea.paint(g,H,r); for(let i=0;i<3;i++) PROPS.palm(g,VW*(.05+i*.12),VH*.82,VH*.22,0,{}); }, anim(g,H,t){ SETS.sea.anim(g,H,t); }});
set('tomb',{horizon:.5,paint(g,H,r){ SETS.wilderness.paint(g,H,r); PROPS.grave(g,VW*.72,VH*.6,VH*.3,0,{}); }});
set('lionsden',{horizon:.3,interior:1,paint(g,H,r){ SETS.pit.paint(g,H,r); }});
set('fiery',{horizon:.5,paint(g,H,r){ SETS.city.paint(g,H,r); PROPS.furnace(g,VW*.5,VH*.62,VH*.3,0,{}); }});
set('black',{horizon:.5,interior:1,paint(g,H,r){ g.fillStyle='#050404'; g.fillRect(0,0,VW,VH); }});

set('egypt',{horizon:.5,paint(g,H,r){ skyPaint(g,H,r); ridge(g,VH*.49,VH*.03,tintHour(mixc('#c8a870',H.haze,.5),H),r,{rough:.1});
  PROPS.pyramid(g,VW*.72,VH*.5,VH*.22,0,{w:300,h:190,color:tintHour(mixc('#d8b878',H.haze,.35),H)}); PROPS.pyramid(g,VW*.88,VH*.5,VH*.16,0,{w:260,h:160,color:tintHour(mixc('#d0b070',H.haze,.45),H)});
  groundPaint(g,H,tintHour('#c8a468',H),tintHour('#9a7644',H),.5);
  g.fillStyle=tintHour(mixc('#3a6a8a',H.sky[2],.3),H); g.beginPath(); g.moveTo(0,VH*.6); g.bezierCurveTo(VW*.3,VH*.57,VW*.5,VH*.62,VW*.62,VH*.58); g.lineTo(VW*.62,VH*.6); g.bezierCurveTo(VW*.5,VH*.65,VW*.3,VH*.6,0,VH*.64); g.closePath(); g.fill();
  for(let i=0;i<5;i++) PROPS.palm(g,VW*(.05+r()*.5),VH*.58,VH*.15,0,{}); PROPS.obelisk(g,VW*.3,VH*.55,VH*.2,0,{h:150}); }});
set('egyptcourt',{horizon:.44,interior:1,paint(g,H,r){ g.fillStyle=lin(g,0,0,0,VH*.44,[[0,'#3a2a14'],[1,'#7a5a30']]); g.fillRect(0,0,VW,VH*.44);
  for(let i=0;i<7;i++){ const x=VW*(i/6); g.fillStyle=lin(g,x-VW*.03,0,x+VW*.03,0,[[0,'#8a6a3a'],[.5,'#e0c890'],[1,'#8a6a3a']]); g.fillRect(x-VW*.028,VH*.04,VW*.056,VH*.4);
    g.fillStyle='#3a7a8a'; g.fillRect(x-VW*.03,VH*.04,VW*.06,VH*.025); g.fillStyle='#c8a048'; for(let k=0;k<5;k++) g.fillRect(x-VW*.028,VH*(.1+k*.06),VW*.056,VH*.008);
    g.fillStyle='#4a8a5a'; poly(g,[[x-VW*.04,VH*.065],[x+VW*.04,VH*.065],[x+VW*.03,VH*.1],[x-VW*.03,VH*.1]]); g.fill(); }
  g.fillStyle='#2a4a7a'; g.fillRect(0,VH*.0,VW,VH*.035); g.fillStyle='#c8a048'; for(let i=0;i<40;i++) g.fillRect(VW*i/40,VH*.012,VW*.012,VH*.012);
  g.fillStyle=lin(g,0,VH*.44,0,VH,[[0,'#8a7048'],[1,'#4a3a22']]); g.fillRect(0,VH*.44,VW,VH*.56);
  g.fillStyle='rgba(30,70,110,.35)'; poly(g,[[VW*.42,VH*.44],[VW*.58,VH*.44],[VW*.72,VH],[VW*.28,VH]]); g.fill(); }});
set('babylon',{horizon:.5,paint(g,H,r){ skyPaint(g,H,r); PROPS.ziggurat(g,VW*.75,VH*.5,VH*.3,0,{color:tintHour(mixc('#b08a5a',H.haze,.3),H)});
  PROPS.wall(g,VW*.4,VH*.52,VH*.3,0,{w:.9,h:100,color:tintHour('#2a5a9a',H)}); g.fillStyle=tintHour('#e0c060',H);
  for(let i=0;i<8;i++){ const x=VW*(.05+i*.09); g.fillRect(x,VH*.52-VH*.3*.6,VW*.03,VH*.012); }
  PROPS.gate(g,VW*.4,VH*.525,VH*.34,0,{color:tintHour('#2a5a9a',H)});
  groundPaint(g,H,tintHour('#b89a6a',H),tintHour('#7a6444',H),.53); for(let i=0;i<3;i++) PROPS.palm(g,VW*(.8+i*.07),VH*.56,VH*.16,0,{}); }});
set('persia',{horizon:.44,interior:1,paint(g,H,r){ g.fillStyle=lin(g,0,0,0,VH*.44,[[0,'#2a2030'],[1,'#6a5a70']]); g.fillRect(0,0,VW,VH*.44);
  for(let i=0;i<7;i++){ const x=VW*(i/6); g.fillStyle=lin(g,x-VW*.018,0,x+VW*.018,0,[[0,'#8a8078'],[.5,'#e0d8c8'],[1,'#8a8078']]); g.fillRect(x-VW*.016,VH*.08,VW*.032,VH*.36);
    g.strokeStyle='rgba(90,80,70,.4)'; g.lineWidth=1; for(let k=0;k<6;k++){ g.beginPath(); g.moveTo(x-VW*.012+k*VW*.005,VH*.1); g.lineTo(x-VW*.012+k*VW*.005,VH*.44); g.stroke(); }
    g.fillStyle='#c8a048'; poly(g,[[x-VW*.04,VH*.05],[x+VW*.04,VH*.05],[x+VW*.03,VH*.09],[x-VW*.03,VH*.09]]); g.fill(); }
  for(let i=0;i<5;i++){ g.fillStyle=['#e8e0f0','#3a5a9a','#e8e0f0','#6a3a8a','#e8e0f0'][i]; g.fillRect(0,VH*(.0+i*.01),VW,VH*.01); }
  g.fillStyle=lin(g,0,VH*.44,0,VH,[[0,'#7a6a70'],[1,'#3a3038']]); g.fillRect(0,VH*.44,VW,VH*.56);
  for(let i=0;i<9;i++) for(let j=0;j<5;j++){ if((i+j)%2) continue; g.fillStyle='rgba(255,255,255,.05)'; poly(g,[[VW*(i/9),VH*(.44+j*.112)],[VW*((i+1)/9),VH*(.44+j*.112)],[VW*((i+1)/9),VH*(.44+(j+1)*.112)],[VW*(i/9),VH*(.44+(j+1)*.112)]]); g.fill(); } },
  anim(g,H,t){ SETS.palace.anim(g,H,t); }});
set('greek',{horizon:.48,paint(g,H,r){ skyPaint(g,H,r,{hz:.48}); const st=tintHour('#e8e0d0',H);
  g.fillStyle=st; poly(g,[[VW*.2,VH*.14],[VW*.5,VH*.04],[VW*.8,VH*.14]]); g.fill(); g.fillRect(VW*.2,VH*.14,VW*.6,VH*.03);
  for(let i=0;i<8;i++) PROPS.pillar(g,VW*(.23+i*.077),VH*.46,VH*.28,0,{h:100,w:12,color:st});
  g.fillStyle=tintHour('#c8c0b0',H); for(let i=0;i<3;i++) g.fillRect(VW*(.18-i*.02),VH*(.46+i*.012),VW*(.64+i*.04),VH*.012);
  groundPaint(g,H,tintHour('#b8a888',H),tintHour('#7a6a54',H),.5); }});
set('partedsea',{horizon:.46,paint(g,H,r){ skyPaint(g,H,r,{hz:.46}); groundPaint(g,H,tintHour('#8a7a5a',H),tintHour('#5a4a36',H),.46);
  g.fillStyle=tintHour('#b8a070',H); poly(g,[[VW*.44,VH*.46],[VW*.56,VH*.46],[VW*.8,VH],[VW*.2,VH]]); g.fill(); },
  anim(g,H,t){ for(const d of[-1,1]){ const x0=VW*(d<0?0:1), xe=VW*(.5+d*.08), xb=VW*(.5+d*.33);
      g.fillStyle=lin(g,x0,0,xe,0,[[0,'#123a5a'],[.8,'#2e6a8a'],[1,'#8ac0d8']]);
      g.beginPath(); g.moveTo(x0,VH*.2); g.lineTo(xe,VH*.44+Math.sin(t/500)*4); g.lineTo(xb,VH); g.lineTo(x0,VH); g.closePath(); g.fill();
      g.strokeStyle='rgba(230,245,255,.6)'; g.lineWidth=3; g.beginPath(); g.moveTo(xe,VH*.44+Math.sin(t/500)*4); g.lineTo(xb,VH); g.stroke();
      for(let i=0;i<10;i++){ const k=i/10, yy=lerp(VH*.44,VH,k), xx=lerp(xe,xb,k); g.fillStyle='rgba(240,250,255,.35)'; ell(g,xx+d*6,yy+Math.sin(t/200+i)*4,6,3); g.fill(); } } }});
set('sky',{horizon:.9,paint(g,H,r){ skyPaint(g,H,r,{hz:1}); }});
set('ark',{horizon:.46,hour:'storm',paint(g,H,r){ SETS.flood.paint(g,H,r); }, anim(g,H,t){ SETS.storm.anim(g,H,t); }});
set('art',{horizon:.5,paint(g,H,r){}});
const SET_NAMES=Object.keys(SETS);

/* ============================== weather & effects ============================== */
function weather(g,wx,t){
  if(!wx) return;
  if(wx==='rain'||wx==='storm'){ g.strokeStyle='rgba(190,205,220,.35)'; g.lineWidth=1.2; g.beginPath();
    for(let i=0;i<180;i++){ const x=(i*97.3+t*.5)%(VW+60)-30, y=(i*53.1+t*1.4)%(VH+40)-20; g.moveTo(x,y); g.lineTo(x-6,y+18); } g.stroke();
    g.fillStyle='rgba(30,36,44,.18)'; g.fillRect(0,0,VW,VH); }
  if(wx==='storm'){ const k=(t%5200); if(k<120||(k>220&&k<300)){ g.fillStyle='rgba(235,240,255,'+(k<120?.45:.25)+')'; g.fillRect(0,0,VW,VH); } }
  if(wx==='dust'||wx==='wind'){ for(let i=0;i<70;i++){ const x=(i*131+t*.25)%VW, y=VH*(.35+((i*37)%60)/100)+Math.sin(t/500+i)*6; g.fillStyle='rgba(200,170,120,.22)'; g.fillRect(x,y,3,1.4); } g.fillStyle='rgba(190,150,100,.1)'; g.fillRect(0,0,VW,VH); }
  if(wx==='snow'){ g.fillStyle='rgba(255,255,255,.8)'; for(let i=0;i<120;i++){ const x=(i*97+Math.sin(t/900+i)*20)%VW, y=(i*61+t*.05)%VH; g.fillRect(x,y,2,2); } }
  if(wx==='haze'||wx==='mist'){ g.fillStyle='rgba(220,220,215,.14)'; g.fillRect(0,VH*.35,VW,VH*.4); }
  if(wx==='embers'){ for(let i=0;i<50;i++){ const k=((t/5000+i*.137)%1); g.fillStyle='rgba(255,160,70,'+(1-k).toFixed(2)+')'; g.fillRect((i*89+Math.sin(t/700+i)*30)%VW,VH*(1-k),2,2); } }
}
const FX={
  glory(g,t,o){ const x=VW*(o.x!=null?o.x:.5), y=VH*(o.y!=null?o.y:.1); for(let i=0;i<14;i++){ const a=PI/2+(i-6.5)*.12+Math.sin(t/3000)*.05; g.fillStyle='rgba(255,246,210,.07)'; poly(g,[[x,y],[x+Math.cos(a-.03)*VH*1.4,y+Math.sin(a-.03)*VH*1.4],[x+Math.cos(a+.03)*VH*1.4,y+Math.sin(a+.03)*VH*1.4]]); g.fill(); }
    glow(g,x,y,VH*.45,'#fff4d0',.55+Math.sin(t/900)*.05); glow(g,x,y,VH*.12,'#ffffff',.8); },
  rays(g,t,o){ const x=VW*(o.x!=null?o.x:.5); for(let i=0;i<7;i++){ const k=(i-3)*.07; g.fillStyle='rgba(255,244,200,'+(.08+Math.sin(t/1200+i)*.02).toFixed(3)+')'; poly(g,[[x+k*VW*.3,0],[x+k*VW*.3+VW*.03,0],[x+k*VW+VW*.08,VH],[x+k*VW-VW*.02,VH]]); g.fill(); } },
  fire(g,t,o){ const y=VH*(o.y||.74); for(let i=0;i<9;i++) fireAt(g,VW*(.06+i*.11),y,VW*.08,VH*(.12+(i%3)*.04),t+i*400); glow(g,VW*.5,y,VW*.6,'#ff8030',.25); },
  smoke(g,t,o){ for(let i=0;i<8;i++){ const k=(t/6000+i/8)%1, x=VW*(o.x!=null?o.x:.5)+Math.sin(t/1800+i)*VW*.06; g.fillStyle='rgba(50,44,40,'+(.3*(1-k)).toFixed(3)+')'; ell(g,x+k*VW*.1,VH*(.6-k*.6),VW*(.04+k*.1),VH*(.03+k*.08)); g.fill(); } },
  lightning(g,t,o){ const k=t%3800; if(k<180){ const r=rng(Math.floor(t/3800)+7); let x=VW*(.2+r()*.6), y=0; g.strokeStyle='rgba(240,245,255,.95)'; g.lineWidth=3; g.beginPath(); g.moveTo(x,y);
    while(y<VH*.6){ x+=(r()-.5)*VW*.08; y+=VH*.06; g.lineTo(x,y); } g.stroke(); g.fillStyle='rgba(230,236,255,.2)'; g.fillRect(0,0,VW,VH); } },
  quake(g,t,o){},
  darkness(g,t,o){ g.fillStyle='rgba(4,3,6,'+(o.amt||.62)+')'; g.fillRect(0,0,VW,VH); },
  cloud(g,t,o){ const x=VW*(o.x!=null?o.x:.5); for(let i=0;i<8;i++){ g.fillStyle='rgba(236,236,240,'+(.55-i*.04)+')'; ell(g,x+Math.sin(t/1200+i)*VW*.02,VH*(.66-i*.08),VW*.07+i*2,VH*.07); g.fill(); } },
  firepillar(g,t,o){ const x=VW*(o.x!=null?o.x:.5); glow(g,x,VH*.35,VH*.5,'#ffa040',.4); for(let i=0;i<9;i++){ fireAt(g,x+Math.sin(t/400+i)*8,VH*(.72-i*.08),VW*.08,VH*.12,t+i*200); } },
  rainbow(g,t,o){ const cols=['#e04040','#f08a30','#f0d040','#50b050','#4080d0','#6050b0','#9040a0']; g.lineWidth=VH*.018; for(let i=0;i<7;i++){ g.strokeStyle=css(rgb(cols[i]),.42); g.beginPath(); g.arc(VW*.5,VH*.95,VW*.46-i*VH*.018,PI*1.05,PI*1.95); g.stroke(); } },
  dove(g,t,o){ const x=VW*(o.x!=null?o.x:.5)+Math.sin(t/1400)*VW*.1, y=VH*(o.y||.22)+Math.sin(t/500)*6, w=Math.sin(t/140)*12; g.fillStyle='#f8f6f0'; ell(g,x,y,14,7); g.fill(); poly(g,[[x-4,y],[x-18,y-12-w],[x+6,y-2]]); g.fill(); poly(g,[[x+2,y],[x+16,y-12+w],[x+8,y-1]]); g.fill(); },
  blood(g,t,o){ g.fillStyle='rgba(120,10,10,.35)'; g.fillRect(0,VH*.55,VW,VH*.45); },
  locusts(g,t,o){ g.fillStyle='rgba(30,30,20,.8)'; for(let i=0;i<260;i++){ const x=(i*73+t*(.15+(i%5)*.05))%VW, y=(i*41+Math.sin(t/300+i)*20)%(VH*.8); g.fillRect(x,y,3,1.4); } g.fillStyle='rgba(60,50,20,.15)'; g.fillRect(0,0,VW,VH); },
  hail(g,t,o){ g.fillStyle='rgba(240,248,255,.9)'; for(let i=0;i<120;i++){ const x=(i*97)%VW, y=(i*61+t*.9)%VH; g.fillRect(x,y,3,3); } },
  stars(g,t,o){ for(let i=0;i<90;i++){ g.fillStyle='rgba(255,250,230,'+(.4+Math.sin(t/500+i)*.3).toFixed(2)+')'; g.fillRect((i*131)%VW,(i*71)%(VH*.5),2,2); } },
  spotlight(g,t,o){ const x=VW*(o.x!=null?o.x:.5); g.fillStyle=rad(g,x,VH*.55,VH*.1,VH*.7,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.6)']]); g.fillRect(0,0,VW,VH); },
  sword(g,t,o){ PROPS.sword(g,VW*(o.x!=null?o.x:.6),VH*(o.y||.3),VH*.35,t,{a:-2.6}); },
  embers(g,t,o){ weather(g,'embers',t); },
  wind(g,t,o){ weather(g,'wind',t); },
  bright(g,t,o){ g.fillStyle='rgba(255,250,235,'+(o.amt||.3)+')'; g.fillRect(0,0,VW,VH); },
  red(g,t,o){ g.fillStyle='rgba(120,20,10,'+(o.amt||.25)+')'; g.fillRect(0,0,VW,VH); },
  firefall(g,t,o){ const x=VW*(o.x!=null?o.x:.5), y=VH*(o.y!=null?o.y:.6), w=VW*(o.w||.07);
    g.fillStyle=lin(g,0,0,0,y,[[0,'rgba(255,240,200,.1)'],[.5,'rgba(255,190,90,.55)'],[1,'rgba(255,150,50,.9)']]);
    g.beginPath(); g.moveTo(x-w*.3,0); g.lineTo(x+w*.3,0); g.lineTo(x+w*(.6+Math.sin(t/90)*.1),y); g.lineTo(x-w*(.6+Math.cos(t/110)*.1),y); g.closePath(); g.fill();
    glow(g,x,y,VW*.2,'#ffb050',.55); fireAt(g,x,y,w*1.6,VH*.16,t); for(let i=0;i<20;i++){ const k=((t/700+i*.13)%1); g.fillStyle='rgba(255,220,150,'+(1-k).toFixed(2)+')'; g.fillRect(x+(Math.sin(i*9.1)*w*.8),y*k,2.5,6); } },
  frogs(g,t,o){ g.fillStyle='#4a7a2a'; for(let i=0;i<70;i++){ const x=(i*131)%VW, y=VH*(.62+((i*37)%35)/100), j=Math.abs(Math.sin(t/300+i))*8; ell(g,x,y-j,6,4); g.fill(); } },
  quail(g,t,o){ g.fillStyle='#6a5a44'; for(let i=0;i<80;i++){ const x=(i*97+t*.2)%VW, y=(i*43)%(VH*.5)+Math.sin(t/200+i)*6; ell(g,x,y,5,3); g.fill(); } },
  ravens(g,t,o){ g.fillStyle='#141210'; for(let i=0;i<(o.n||3);i++){ const x=VW*(o.x!=null?o.x:.5)+Math.sin(t/1400+i*2)*VW*.12, y=VH*(o.y||.2)+Math.sin(t/700+i)*20, w=Math.sin(t/120+i)*8; ell(g,x,y,10,5); g.fill(); poly(g,[[x-3,y],[x-18,y-10-w],[x+4,y-2]]); g.fill(); poly(g,[[x+2,y],[x+16,y-10+w],[x+7,y-1]]); g.fill(); } },
  manna(g,t,o){ g.fillStyle='rgba(250,248,240,.9)'; for(let i=0;i<160;i++){ const x=(i*131)%VW, y=VH*(.6+((i*37)%40)/100); g.fillRect(x,y,3,2); } },
  flies(g,t,o){ g.fillStyle='rgba(20,20,20,.8)'; for(let i=0;i<200;i++){ g.fillRect((i*73+Math.sin(t/90+i)*20)%VW,(i*41+Math.cos(t/110+i)*20)%VH,2,2); } },
  boils(g,t,o){ FX.red(g,t,{amt:.12}); },
  pillar(g,t,o){ FX.cloud(g,t,o); },
  shekinah(g,t,o){ FX.cloud(g,t,o); FX.glory(g,t,Object.assign({y:.4},o)); }
};
const FX_NAMES=Object.keys(FX);

/* ============================== the stage ============================== */
const Stage={
  SETS, PROPS, FX, POSES, HOURS, SIDES, CROWD_DEF,
  _cache:null, _cacheKey:'', _lay:null, _hour:HOURS.day, _parts:null,
  ok:true,
  /* split a verse into its caption parts; joining them gives back the text exactly */
  parts(text){
    const t=String(text||''); const out=[]; let cur='';
    const re=/(…\s*|—\s+|[.;!?][”’"]*\s+)/g; let last=0, m;
    while((m=re.exec(t))){ cur+=t.slice(last,m.index+m[0].length); last=m.index+m[0].length; if(cur.replace(/[\s…—]/g,'').length>=18){ out.push(cur); cur=''; } }
    cur+=t.slice(last); if(cur){ if(out.length&&cur.replace(/[\s…—.”’]/g,'').length<18) out[out.length-1]+=cur; else out.push(cur); }
    return out.length?out:[t];
  },
  partTimes(parts){ let acc=250; return parts.map(p=>{ const at=acc; acc+=cl(p.length*42,1300,4200); return at; }).concat([acc]); },
  cur:null,
  prepare(slide){
    const st=slide.stage; const parts=this.parts(slide.text||''); const times=this.partTimes(parts);
    this.cur={slide,st,parts,times,revealed:0,allAt:null};
    return this.cur;
  },
  beatTime(i){ const c=this.cur; if(!c||i==null) return 0; i=Math.max(0,Math.min(i,c.parts.length-1)); return c.times[i]; },
  revealedAll(st){ const c=this.cur; if(!c) return true; return c.allAt!=null||st>=c.times[c.parts.length-1]; },
  revealAll(){ const c=this.cur; if(c&&c.allAt==null) c.allAt=Game.slideT||0; },
  /* the caption: one span per part, lit as the part's time comes */
  mountCaption(slide){
    const tx=$('slide-text'); if(!tx) return;
    const c=this.prepare(slide);
    tx.textContent='';
    c.spans=c.parts.map(p=>{ const s=document.createElement('span'); s.className='cp'; s.textContent=p; tx.appendChild(s); return s; });
    document.body.classList.add('staged');
  },
  unmountCaption(){ document.body.classList.remove('staged'); this.cur=null; },
  tickCaption(st){
    const c=this.cur; if(!c||!c.spans) return;
    for(let i=0;i<c.spans.length;i++){ const on=c.allAt!=null||st>=c.times[i]; if(on&&!c.spans[i].classList.contains('on')) c.spans[i].classList.add('on'); }
  },
  /* the camera: a slow move over the length of the telling */
  camera(g,cam,st,dur,focus){
    const k=ease(st/Math.max(6000,dur+2500));
    let z0=1.0,z1=1.06,x0=0,x1=0,y0=0,y1=0;
    if(focus!=null){ const dx=(.5-focus)*VW*.18; x0=dx*.3; x1=dx; }
    switch(cam){
      case 'still': z1=1.0; break;
      case 'pull': z0=1.12; z1=1.0; break;
      case 'panl': case 'pan-l': x0=VW*.03; x1=-VW*.03; z0=z1=1.08; break;
      case 'panr': case 'pan-r': x0=-VW*.03; x1=VW*.03; z0=z1=1.08; break;
      case 'up': y0=VH*.03; y1=-VH*.02; z0=z1=1.07; break;
      case 'close': z0=1.1; z1=1.2; break;
      default: break;   /* push */
    }
    const z=lerp(z0,z1,k), x=lerp(x0,x1,k), y=lerp(y0,y1,k);
    g.translate(VW/2+x,VH*.55+y); g.scale(z,z); g.translate(-VW/2,-VH*.55);
  },
  draw(g,slide,st,t){
    const S0=slide.stage;
    if(!this.cur||this.cur.slide!==slide){ this.prepare(slide); }
    const setDef=SETS[S0.set]||SETS.wilderness;
    const H=HOURS[S0.time]||HOURS[setDef.hour]||(setDef.interior?HOURS.night:HOURS.day);
    this._hour=setDef.interior&&!S0.time?Object.assign({},HOURS.day,{lamp:1,dim:.25,amb:'#3a2a20',lx:1}):H;
    const lay=this._lay=layout(S0.hz!=null?{horizon:S0.hz}:setDef);
    /* the painted set, cached */
    const key=[S0.set,S0.time||'',VW,VH,DPR,strHash(slide.text||'')].join('|');
    if(this._cacheKey!==key){
      const c=this._cache||(this._cache=document.createElement('canvas'));
      c.width=Math.round(VW*DPR); c.height=Math.round(VH*DPR);
      const cg=c.getContext('2d'); cg.setTransform(DPR,0,0,DPR,0,0); cg.imageSmoothingEnabled=true;
      try{ setDef.paint(cg,this._hour,rng(strHash(slide.text||S0.set))); }catch(e){ cg.fillStyle='#222'; cg.fillRect(0,0,VW,VH); }
      this._cacheKey=key;
    }
    const c=this.cur, dur=c.times[c.parts.length-1];
    g.save();
    g.imageSmoothingEnabled=true;
    let shake=0; const qk=(S0.fx||[]).find(f=>(f.k||f)==='quake');
    if(qk&&st>=(qk.at!=null?this.beatTime(qk.at):0)) shake=Math.sin(t/40)*VH*.006*(1+Math.sin(t/300));   /* from its part on */
    g.translate(shake,shake*.5);
    this.camera(g,S0.cam,st,dur,S0.focus);
    if(S0.set==='art'){ try{ _drawSlideArt(g,slide.art||'void',st,t,slide); }catch(e){} }
    else { g.drawImage(this._cache,0,0,VW,VH); if(setDef.anim) try{ setDef.anim(g,this._hour,t); }catch(e){} }
    /* everything on the stage, back to front */
    const items=[];
    for(const p of (S0.props||[])) items.push({z:p.z||0,kind:'prop',p});
    (S0.cast||[]).forEach((a,i)=>items.push({z:a.z||0,kind:'cast',a,i}));
    (S0.crowd||[]).forEach((cw,i)=>{ const r=rng(strHash((slide.text||'')+i)); const n=cl(cw.n||6,1,40), w=cw.w!=null?cw.w:.3;
      for(let k=0;k<n;k++){ const zz=(cw.z||0)+(r()-.5)*(cw.dz!=null?cw.dz:.2); const lk=crowdLook(cw.kind||'people',cw.side,r); if(cw.look) Object.assign(lk,cw.look); items.push({z:zz,kind:'extra',cw,x:(cw.x!=null?cw.x:.5)+(n>1?(k/(n-1)-.5)*w:0)+(r()-.5)*.03,look:lk,ph:r()*10,k}); } });
    items.sort((a,b)=>b.z-a.z);
    this._labels=[];
    for(const it of items){
      try{
        if(it.kind==='prop') this.drawProp(g,it.p,st,t);
        else if(it.kind==='cast') this.drawActor(g,it.a,it.i,st,t);
        else this.drawExtra(g,it,st,t);
      }catch(e){ if(!this._warned){ this._warned=1; console.warn('stage',e); } }
    }
    for(const f of (S0.fx||[])){ const k=f.k||f; const at=f.at!=null?this.beatTime(f.at):0; if(st<at) continue;
      if(FX[k]){ g.save(); g.globalAlpha*=ease((st-at)/900); try{ FX[k](g,t,typeof f==='object'?f:{}); }catch(e){} g.restore(); } }
    if(S0.wxAt==null||st>=this.beatTime(S0.wxAt)){ g.save(); if(S0.wxAt!=null) g.globalAlpha*=ease((st-this.beatTime(S0.wxAt))/1200); weather(g,S0.wx||(setDef.hour==='storm'?'storm':null),t); g.restore(); }
    if(this._hour.dim>0&&!setDef.interior){ g.fillStyle=css(rgb(this._hour.amb),this._hour.dim*.35); g.fillRect(0,0,VW,VH); }
    g.restore();
    /* vignette and the caption's backing */
    g.fillStyle=rad(g,VW/2,VH*.45,VH*.35,VW*.75,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.45)']]); g.fillRect(0,0,VW,VH);
    const fade=(typeof Sky!=='undefined'&&Sky._noFade)?1:cl(st/700,0,1); if(fade<1){ g.fillStyle='rgba(0,0,0,'+(1-fade).toFixed(3)+')'; g.fillRect(0,0,VW,VH); }
    this.tickCaption(st);
  },
  drawProp(g,p,st,t){
    const at=p.at!=null?this.beatTime(p.at):0; if(st<at) return;
    const lay=this._lay, z=p.z||0, s=lay.H0*lay.sc(z)*(p.s||1), x=lay.X(p.x!=null?p.x:.5), y=lay.gy(z)+(p.dy||0)*VH;
    const fn=PROPS[p.k]; if(!fn) return;
    g.save(); if(p.at!=null) g.globalAlpha*=ease((st-at)/700);
    if(p.flip){ g.translate(x,0); g.scale(-1,1); g.translate(-x,0); }
    fn(g,x,y,s,t,p); g.restore();
  },
  /* an actor's timeline.
     x, face, pose: where it stands, which way it looks, how it holds itself.
     enter:'l'|'r' — it walks in from that side at part `at` (default 0) to x (or `to`).
     at (without enter) — it appears at that part; with `from` it is seen from the start in
       the `from` pose and takes `pose` at `at`.
     to — at part `at` it walks from x to `to`, then takes `pose`.
     acts:[{at, to, exit:'l'|'r', pose, face, run}] — later steps, in order. */
  actorState(a,st){
    const bt=i=>this.beatTime(i);
    const base=a.x!=null?a.x:.5;
    const T0=a.at!=null?bt(a.at):0;
    let x=a.enter==='l'?-.12:a.enter==='r'?1.12:base;
    let face=a.face||'r', alpha=1, walking=false, shown=a.at!=null?T0:0, pose;
    if(st<T0){
      if(a.enter) return {visible:false};
      if(a.from) return {visible:true,x,pose:POSES[a.from]||POSES.stand,face,alpha:1,walking:false,shown:0};
      return {visible:false};
    }
    const steps=[{T:T0,to:a.enter?(a.to!=null?a.to:base):a.to,pose:a.pose,face:a.face,run:a.run}];
    for(const q of (a.acts||[])) steps.push({T:bt(q.at||0),to:q.to,exit:q.exit,pose:q.pose,face:q.face,run:q.run});
    let prev=a.from?(POSES[a.from]||POSES.stand):null;
    for(let i=0;i<steps.length;i++){
      const sp=steps[i]; if(st<sp.T) break;
      const nextT=i+1<steps.length?Math.max(sp.T,steps[i+1].T):Infinity, now=Math.min(st,nextT), e=now-sp.T;
      const dest=sp.exit==='l'?-.15:sp.exit==='r'?1.15:(sp.to!=null?sp.to:x);
      const moving=Math.abs(dest-x)>.001, walkT=moving?Math.abs(dest-x)*(sp.run?3600:7400):0;   /* the same pace on any screen width */
      const target=sp.pose?(POSES[sp.pose]||POSES.stand):(i===0?(POSES[a.pose]||POSES.stand):(prev||POSES.stand));
      if(moving){ face=dest<x?'l':'r'; }
      if(moving&&e<walkT){ x=lerp(x,dest,e/walkT); pose=sp.run?POSES.run:POSES.walk; walking=true; prev=POSES.stand; if(now===st) break; walking=false; continue; }
      if(moving){ x=dest; if(sp.exit) return {visible:false}; }
      const start=moving?POSES.stand:prev, se=e-walkT;
      pose=(start&&start!==target)?blendPose(start,target,cl(se/550,0,1)):target;
      if(i===0&&!start&&a.at!=null&&!a.enter) alpha=ease(se/600);
      if(sp.face) face=sp.face;
      if(i===0&&moving) shown=sp.T+walkT;
      prev=target; walking=false;
    }
    if(!pose) pose=POSES[a.pose]||POSES.stand;
    if(a.turn&&st>=bt(a.turn[0])&&!walking) face=a.turn[1];
    return {visible:true,x,pose,face,alpha,walking,shown};
  },
  drawActor(g,a,i,st,t){
    const S1=this.actorState(a,st); if(!S1.visible) return;
    const lay=this._lay, z=a.z||0, x=lay.X(S1.x);
    let h=lay.H0*lay.sc(z)*(a.s||1), y=lay.gy(z)+(a.dy||0)*VH;
    const id=a.id||'';
    if((CHARS[id]&&CHARS[id].divine)||id==='voice'||id==='divine'){ g.save(); g.globalAlpha*=S1.alpha; FX.glory(g,t,{x:S1.x,y:.14}); g.restore(); return; }
    const L=lookOf(id,a.look);
    if(L.serpent||(CHARS[id]&&CHARS[id].serpent)){ g.save(); g.globalAlpha*=S1.alpha; PROPS.serpent(g,x,y,h*.6,t,{tree:a.pose==='raise',rise:a.pose!=='lie',color:'#5a7a2a'}); g.restore(); return; }
    if(L.giant||/giant|nephil|anaq|golyath|goliath/i.test(id)) h*=1.55;
    if(L.darkAngel) { L.robe=L.robe||'#2a2230'; }
    if(L.child||a.child) h*=.62;
    let P=S1.pose;
    const c=this.cur;
    const speaking=a.say!=null&&c&&st>=this.beatTime(a.say)&&(a.say>=c.parts.length-1||st<this.beatTime(a.say+1));
    if(speaking&&!S1.walking&&!P.lie&&!P.low&&P!==POSES.raise&&P!==POSES.fight&&!P.throne) P=blendPose(P,POSES.speak,.8);
    P=animPose(P,t+i*777,i*1.7);
    if(P.throne){ PROPS.throne(g,x,y,h,t,{}); y-=h*.12; }
    if(a.onbed&&(P.lie||S1.pose===POSES.lie)){ PROPS.bed(g,x,y,h,t,{}); y-=h*.2; } else if(a.bed){ PROPS.bed(g,x,y,h,t,{}); }
    if(a.pose==='sit'&&!P.throne&&!a.noseat&&!S1.walking){ g.fillStyle='#6a5a44'; rr(g,x-h*.13*(S1.face==='l'?-1:1)-h*.1,y-h*.235,h*.2,h*.235,h*.02); g.fill(); }
    if(!P.lie) figureShadow(g,x,y,h,P); else { g.fillStyle='rgba(8,6,4,.25)'; ell(g,x,y+h*.005,h*.5,h*.03); g.fill(); }
    drawFigure(g,x,y,h,L,P,S1.face,t,{hold:a.hold,hold2:a.hold2,crown:a.crown,wings:a.wings,alpha:S1.alpha<1?S1.alpha:null,dead:a.pose==='dead',blanket:(a.onbed&&P.lie)?(a.blanket||'#9a7a5a'):null});
    /* a name, the first time a figure is seen (once the chapter's title card has gone) */
    if(a.label!==false&&L.name&&!S1.walking&&st>S1.shown+300){
      const key=i, lab=this.cur.labels||(this.cur.labels={});
      const card=document.getElementById('chapter-card');
      if(lab[key]==null&&!(card&&card.classList.contains('show'))) lab[key]=st;
      const t0=lab[key];
      if(t0!=null&&st<t0+2800){
        const k=Math.min(1,(st-t0)/400,(t0+2800-st)/500);
        g.save(); g.font='italic '+Math.round(cl(h*.085,11,17))+'px Georgia,serif'; g.textAlign='center';
        const w=g.measureText(L.name).width+14;
        let top=y-h*(P.lie?.32:P.low?.84:P.throne?1.04:1.1);
        const placed=this._labels||[];
        for(let tries=0;tries<4;tries++){ if(placed.some(r=>Math.abs(r[0]-x)<(r[2]+w)/2&&Math.abs(r[1]-top)<22)) top-=24; else break; }
        placed.push([x,top,w]);
        g.globalAlpha=k*.95; g.fillStyle='rgba(0,0,0,.6)'; rr(g,x-w/2,top-15,w,20,8); g.fill();
        g.fillStyle='#f4e2b0'; g.fillText(L.name,x,top); g.restore();
      }
    }
  },
  drawExtra(g,it,st,t){
    const cw=it.cw, lay=this._lay;
    const hasAt=cw.at!=null, at=hasAt?this.beatTime(cw.at):0;
    if(st<at&&(cw.enter||!cw.from)) return;
    const h=lay.H0*lay.sc(it.z)*(cw.s||1)*(it.look.child?.62:1)*(1+(((it.k*7)%5)-2)*.025);
    let x=it.x, alpha=1;
    const walkT=2600+it.k*90;
    let walking=cw.enter&&st>=at&&st<at+walkT;
    if(cw.enter){ const from=cw.enter==='l'?x-.7:x+.7; x=lerp(from,x,cl((st-at)/walkT,0,1)); }
    let exitDir=null;
    if(cw.exit&&cw.exitAt!=null){ const et=this.beatTime(cw.exitAt)+it.k*120; if(st>=et){ const k=(st-et)/(cw.run?1800:3200); if(k>=1) return; x=lerp(x,x+(cw.exit==='l'?-.8:.8),k); walking=true; exitDir=cw.exit; } }
    let P;
    if(walking) P=(cw.run||exitDir)?POSES.run:POSES.walk;
    else if(st<at) P=POSES[cw.from]||POSES.stand;
    else { const P1=POSES[cw.pose||CROWD_DEF[cw.kind]||'stand']||POSES.stand, P0=cw.from?(POSES[cw.from]||POSES.stand):(cw.enter?POSES.stand:null);
      const se=st-at-(cw.enter?walkT:0);
      if(P0) P=blendPose(P0,P1,cl((se-it.k*60)/600,0,1)); else { P=P1; if(hasAt) alpha=ease(se/700); } }
    P=animPose(P,t+it.ph*1000,it.ph);
    const face=exitDir?(exitDir==='l'?'l':'r'):walking?(cw.enter==='l'?'r':'l'):(cw.face||(it.k%2?'l':'r'));
    const y=lay.gy(it.z);
    if(!P.lie) figureShadow(g,VW*x,y,h,P);
    const hold=cw.hold!==undefined?cw.hold:CROWD_HOLD[cw.kind];
    drawFigure(g,VW*x,y,h,it.look,P,face,t,{hold:hold||null,hold2:(cw.kind==='soldiers'||cw.kind==='army')&&it.k%3===0?'shield':null,alpha:alpha<1?alpha:null});
  }
};
window.Stage=Stage;

/* ============================== hooks into the game ============================== */
const _drawSlideArt=drawSlideArt;
window.drawSlideArt=function(g,key,st,t,slide){
  if(slide&&slide.stage&&Stage.ok){
    try{ Stage.draw(g,slide,st,t); return; }catch(e){ console.warn('stage failed',e); Stage.ok=false; }
  }
  return _drawSlideArt(g,key,st,t,slide);
};
const _showSlide=Game.showSlide;
Game.showSlide=function(){
  _showSlide.apply(this,arguments);
  const s=this.slideList&&this.slideList[this.slideIdx];
  if(s&&s.stage&&Stage.ok) Stage.mountCaption(s); else Stage.unmountCaption();
};
const _advance=Game.advanceSlide;
Game.advanceSlide=function(){ const r=_advance.apply(this,arguments); if(this.state!=='slides'||this._slideEnding) Stage.unmountCaption(); return r; };
const _onAction=Game.onAction;
Game.onAction=function(){
  if(this.state==='slides'&&Stage.cur&&document.body.classList.contains('staged')&&!this._slideEnding){
    if(this.slideT>350&&!Stage.revealedAll(this.slideT)){ Stage.revealAll(); Stage.tickCaption(this.slideT); try{ Sound.sfx('blip'); }catch(e){} return; }
  }
  return _onAction.apply(this,arguments);
};
/* the caption's look on a staged slide */
const cssEl=document.createElement('style');
cssEl.textContent=`
body.staged #slide-ui{padding:5.5vh 5vw 3.2vh;background:linear-gradient(180deg,rgba(5,5,10,0) 0,rgba(5,5,10,.72) 4.5vh,rgba(5,5,10,.86) 100%)}
body.staged #slide-text{font-size:clamp(14px,2.35vmin,21px);line-height:1.55;max-width:84ch}
body.staged #slide-text .cp{opacity:.0;transition:opacity .7s ease}
body.staged #slide-text .cp.on{opacity:1}
body.staged #slide-hint{margin-top:1.2vh}
body.staged #chapter-card{top:5.5%}
`;
document.head.appendChild(cssEl);
})();
