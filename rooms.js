/* rooms.js — houses, tents and caves you can walk into, for every game.

   A dwelling big enough to stand in has walls about it and a way in where its door, flap or
   mouth is drawn. Step through it and the roof is lifted away: the room is seen from above,
   as it was in its day — the beaten-earth floor and plastered wall of a house with its
   hearth or clay oven, grindstone, storage jars, lamp in its niche and loom; the woven rugs,
   cushions, tent-pole and waterskin of a tent of hair; the rugs, couch and arms of a
   captain's tent; the rock floor and fire ring of a cave. The world outside grows dim while
   you are within, and when you step out again the dwelling stands whole. People of the
   story who are inside are seen when you are inside with them.

   Where an engine draws no house, captain's tent or cave at all, one is drawn for it. The temple,
   the dwelling place of YAHUAH (the mishkan), towers and booths are left as they are.
   Without this file the games play as before. */
(function(){
'use strict';
if(typeof Game==='undefined'||typeof drawProp!=='function'||typeof walkable!=='function'||typeof drawWorld!=='function'||typeof TILE==='undefined') return;

const ROOMS=window.ROOMS={on:true, list:[], of:map=>roomsOf(map)};
const KIND={house:'house',tent:'tent',wartent:'wartent',cave:'cave'};
/* the smallest a room may be, in tiles, to be stood in */
const MIN_W=2.6, MIN_H=1.5;
const cl=(v,a,b)=>v<a?a:(v>b?b:v);
function rnd(seed){ let a=(seed>>>0)||1; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; }; }

/* ------------------------------------------------------------------ a house where the engine draws none */
function drawHouse(g,px,py,p){
  /* a house of mud brick: flat roof of beams and packed earth, a parapet, door and a small window */
  const u=TILE/40, w=4.4*TILE, h=3.0*TILE, hc=p.col||'#b48c5a';
  g.save(); g.translate(px,py);
  g.fillStyle='rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0,2,w*.58,TILE*.42,0,0,Math.PI*2); g.fill();
  g.fillStyle=hc; g.fillRect(-w/2,-h,w,h);                                  /* the front wall */
  g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(w*.08,-h,w*.42,h);
  g.fillStyle='rgba(60,40,20,.22)';                                         /* courses of brick */
  for(let i=1;i<7;i++) g.fillRect(-w/2,-h+i*h/7,w,Math.max(1,u));
  for(let i=0;i<7;i++) for(let j=0;j<6;j++) g.fillRect(-w/2+((j+(i%2)*.5)*w/6),-h+i*h/7,Math.max(1,u),h/7);
  g.fillStyle='#d2b88c'; g.fillRect(-w/2-2*u,-h-7*u,w+4*u,7*u);             /* the roof edge and parapet */
  g.fillStyle='#8a6a40'; g.fillRect(-w/2-2*u,-h-1.5*u,w+4*u,2.4*u);
  g.fillStyle='#6e5232'; for(let i=0;i<9;i++) g.fillRect(-w/2+i*w/8.4,-h-1*u,3*u,4*u);   /* beam ends */
  g.fillStyle='#21180e'; g.fillRect(-.5*TILE,-1.7*TILE,TILE,1.7*TILE);      /* the door */
  g.fillStyle='#7a5a34'; g.fillRect(-.62*TILE,-1.82*TILE,1.24*TILE,.16*TILE);
  g.fillRect(-.62*TILE,-1.7*TILE,.12*TILE,1.7*TILE); g.fillRect(.5*TILE,-1.7*TILE,.12*TILE,1.7*TILE);
  g.fillStyle='#21180e'; g.fillRect(w*.22,-h*.72,.42*TILE,.32*TILE);         /* a small window */
  if(p.blood){ /* the blood of the lamb on the two doorposts and on the lintel (SHEMOTH 12:7, 22) */
    g.fillStyle='#8e1a14'; g.fillRect(-.62*TILE,-1.82*TILE,1.24*TILE,.16*TILE);
    g.fillRect(-.62*TILE,-1.66*TILE,.12*TILE,.9*TILE); g.fillRect(.5*TILE,-1.66*TILE,.12*TILE,.9*TILE);
    g.fillStyle='rgba(142,26,20,.6)'; g.fillRect(-.6*TILE,-.76*TILE,.08*TILE,.2*TILE); g.fillRect(.52*TILE,-.7*TILE,.08*TILE,.16*TILE); }
  g.restore();
}

function drawWartent(g,px,py,p){
  /* a captain's tent: striped cloth over its poles, the door-flap tied back, a pennant on the peak */
  const u=TILE/40, w=3.2*TILE, h=2.2*TILE, c1=p.col||'#8a4a32', c2='#d8c49a';
  g.save(); g.translate(px,py);
  g.fillStyle='rgba(0,0,0,.24)'; g.beginPath(); g.ellipse(0,2,w*.6,TILE*.4,0,0,Math.PI*2); g.fill();
  g.beginPath(); g.moveTo(-w/2,0); g.lineTo(-w*.42,-h*.62); g.lineTo(0,-h); g.lineTo(w*.42,-h*.62); g.lineTo(w/2,0); g.closePath();
  g.save(); g.clip();
  for(let i=0;i<8;i++){ g.fillStyle=i%2?c2:c1; g.fillRect(-w/2+i*w/8,-h,w/8+1,h); }
  g.fillStyle='rgba(0,0,0,.16)'; g.fillRect(0,-h,w/2,h);
  g.restore();
  g.fillStyle='#21180e'; g.beginPath(); g.moveTo(-.46*TILE,0); g.lineTo(0,-1.3*TILE); g.lineTo(.46*TILE,0); g.closePath(); g.fill();
  g.fillStyle=c1; g.beginPath(); g.moveTo(0,-1.3*TILE); g.lineTo(.46*TILE,0); g.lineTo(.8*TILE,0); g.closePath(); g.fill();
  g.strokeStyle='#5d4426'; g.lineWidth=Math.max(2,2*u); g.beginPath(); g.moveTo(0,-h); g.lineTo(0,-h-.5*TILE); g.stroke();
  g.fillStyle='#c8a24a'; g.beginPath(); g.moveTo(0,-h-.5*TILE); g.lineTo(.5*TILE,-h-.38*TILE); g.lineTo(0,-h-.26*TILE); g.closePath(); g.fill();
  g.restore();
}
function drawGate(g,px,py,p){
  /* a city gate where the engine draws none: two towers of brick on stone footings, the passage between them with
     its doors of wood standing open, a parapet along the top */
  const u=TILE/40, w=3.8*TILE, h=3.1*TILE, tw=1.15*TILE, c=p.col||'#b0895a';
  g.save(); g.translate(px,py);
  g.fillStyle='rgba(0,0,0,.24)'; g.beginPath(); g.ellipse(0,2,w*.58,TILE*.42,0,0,Math.PI*2); g.fill();
  g.fillStyle=c; g.fillRect(-w/2,-h*.82,w,h*.82);                           /* the wall over the passage */
  g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(-w/2,-h*.82,w,h*.82);
  for(const sx of [-w/2, w/2-tw]){ g.fillStyle=c; g.fillRect(sx,-h,tw,h);        /* the towers */
    g.fillStyle='#8a7a62'; g.fillRect(sx-2*u,-h*.22,tw+4*u,h*.22);             /* stone footings */
    g.fillStyle='rgba(60,40,20,.2)'; for(let i=1;i<8;i++) g.fillRect(sx,-h+i*h*.1,tw,Math.max(1,u));
    g.fillStyle='#d2b88c'; for(let i=0;i<3;i++) g.fillRect(sx+i*tw/2.6,-h-6*u,tw/4,6*u);   /* parapet */
    g.fillStyle='#21180e'; g.fillRect(sx+tw*.38,-h*.7,tw*.24,TILE*.32); }        /* a slit */
  g.fillStyle='#d2b88c'; for(let i=0;i<4;i++) g.fillRect(-w/2+tw+i*(w-2*tw)/4+3*u,-h*.82-5*u,(w-2*tw)/7,5*u);
  g.fillStyle='#1a120a'; g.beginPath(); g.moveTo(-.75*TILE,0); g.lineTo(-.75*TILE,-1.7*TILE); g.lineTo(.75*TILE,-1.7*TILE); g.lineTo(.75*TILE,0); g.closePath(); g.fill();
  g.fillStyle='#6e5232'; g.fillRect(-.95*TILE,-1.86*TILE,1.9*TILE,.2*TILE);      /* the lintel beam */
  g.fillStyle='#5a3c22'; g.fillRect(-.75*TILE,-1.66*TILE,.28*TILE,1.66*TILE); g.fillRect(.47*TILE,-1.66*TILE,.28*TILE,1.66*TILE);   /* the doors, open */
  g.restore();
}
function drawCave(g,px,py){
  /* a hill of rock with a dark mouth */
  const cw=TILE*5.4, ch=TILE*4;
  g.save(); g.translate(px,py);
  g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0,4,cw*.62,TILE*.4,0,0,Math.PI*2); g.fill();
  const gr=g.createLinearGradient(0,-ch,0,0); gr.addColorStop(0,'#8d8276'); gr.addColorStop(1,'#5d564c'); g.fillStyle=gr;
  g.beginPath(); g.moveTo(-cw/2,0); g.quadraticCurveTo(-cw/2,-ch*.85,-cw*.15,-ch); g.quadraticCurveTo(cw*.3,-ch*1.05,cw/2,-ch*.4); g.quadraticCurveTo(cw*.56,-ch*.15,cw/2,0); g.closePath(); g.fill();
  g.fillStyle='#100a06'; g.beginPath(); g.moveTo(-TILE*1.05,0); g.quadraticCurveTo(-TILE*1.05,-TILE*2.1,0,-TILE*2.2); g.quadraticCurveTo(TILE*1.05,-TILE*2.1,TILE*1.05,0); g.closePath(); g.fill();
  g.restore();
}
const OWN={house:{s:{x0:-2.25,x1:2.25,h:3.2},draw:drawHouse}, wartent:{s:{x0:-1.65,x1:1.65,h:2.3},draw:drawWartent}, cave:{s:{x0:-2.7,x1:2.7,h:4},draw:drawCave}};

/* ------------------------------------------------------------------ how big each dwelling is drawn */
const SIZE=new Map();
function size(p){
  const key=p.type+'|'+(p.scale||1)+'|'+(p.col?1:0);
  if(SIZE.has(key)) return SIZE.get(key);
  const W=640, H=640, AX=320, AY=560;
  const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d');
  const P=typeof Particles!=='undefined'?Particles:null, sp=P&&P.spawn; if(P) P.spawn=()=>{};
  try{ baseDraw(g,AX,AY,Object.assign({},p,{x:0,y:0}),1000); }catch(e){}
  if(P) P.spawn=sp;
  const d=g.getImageData(0,0,W,H).data; let x0=1e9,x1=-1,y0=1e9;
  for(let y=0;y<AY;y++) for(let x=0;x<W;x++) if(d[(y*W+x)*4+3]>200){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; }
  const s=x1<0?null:{x0:(x0-AX)/TILE, x1:(x1-AX)/TILE, h:(AY-y0)/TILE};
  SIZE.set(key,s); return s;
}

/* ------------------------------------------------------------------ the rooms of a map */
function makeRoom(d){
  const kind=KIND[d.type]; if(!kind||d.room===false||d.hidden||d.fallen) return null;
  let s=size(d);
  /* a house the story goes into (room: true) where the engine draws only a small hut: the house of mud brick is
     drawn for it instead, big enough to stand in */
  if(s&&d.room===true&&OWN[kind]&&(s.x1-s.x0<MIN_W||s.h<MIN_H)) s=null;
  if(!s&&OWN[kind]) s=Object.assign({drawn:true},OWN[kind].s);
  if(!s||s.x1-s.x0<MIN_W||s.h<MIN_H) return null;
  const R={d, kind, ax:d.x, ay:d.y, k:0, drawn:!!s.drawn};
  const inset=kind==='cave'?.45:(kind==='tent'?.3:.12);
  R.L=d.x+s.x0+inset; R.R=d.x+s.x1-inset;
  if(kind==='cave'){ const half=Math.min((s.x1-s.x0)/2-.4,2.3); R.L=d.x-half; R.R=d.x+half; }
  R.F=d.y; R.T=d.y-s.h+(kind==='tent'?.15:.05);
  R.bw=kind==='tent'?cl(s.h*.26,.35,.6):cl(s.h*.3,.55,1.05);   /* the back wall's face */
  R.fy0=R.T+R.bw*.7;                                              /* where the floor one can stand on begins */
  R.door=kind==='cave'?.85:(kind==='house'?.48:.46);
  R.furn=furnish(R);
  return R;
}
function sigOf(map){ let s=map.decor.length+':'; for(const d of map.decor) if(KIND[d.type]) s+=d.type[0]+(d.x*10|0)+','+(d.y*10|0)+(d.hidden?'h':'')+(d.fallen?'f':'')+';'; return s; }
function roomsOf(map){
  if(!map||!map.decor) return [];
  if(map.biome==='interior'||/interior/.test(map.biome||'')) return [];
  const now=performance.now();
  if(map.__rooms&&now-map.__roomsChk<400) return map.__rooms;
  if(map.__rooms&&map.__roomsSig===sigOf(map)){ map.__roomsChk=now; return map.__rooms; }
  /* (re)build: take out what was put in for the old rooms, then make them anew */
  for(let i=map.decor.length-1;i>=0;i--) if(map.decor[i].__r) map.decor.splice(i,1);
  const old=new Map((map.__rooms||[]).map(r=>[r.d,r]));
  const rooms=[];
  const hit=(a,b)=>a.L-.2<b.R&&b.L-.2<a.R&&a.T-.2<b.F+.6&&b.T-.2<a.F+.6;
  for(const d of map.decor){ const r=makeRoom(d); if(!r) continue;
    /* a dwelling crowded against another, or with something solid standing within it, is left as it was */
    if(rooms.some(q=>hit(q,r))) continue;
    if(map.decor.some(e=>e!==d&&e.solid&&!e.__r&&e.x>r.L&&e.x<r.R&&e.y>r.T+.2&&e.y<r.F+.3)) continue;
    const o=old.get(d); if(o) r.k=o.k; rooms.push(r); }
  for(const r of rooms){
    /* the floor is laid row by row (an engine that paints its ground a row at a time, with those who stand
       on the row, would otherwise paint the nearer rows of ground over it) */
    for(let row=Math.floor(r.T-.2);row<=Math.floor(r.F-1e-6);row++) map.decor.push({type:'__roomfloor', x:r.ax, y:row+.0005, row, __r:r});
    for(const f of r.furn) map.decor.push({type:'__furn', x:f.x, y:f.y, __r:r, f});
    /* a doorway that would take you to another place, set at this dwelling's door, is no longer needed */
    for(const d2 of map.decor) if(d2.type==='doorway'&&d2.enter&&Math.abs(d2.x-r.ax)<1.2&&d2.y>=r.F-.2&&d2.y<r.F+1.8){ d2.enter=false; d2.__byRoom=true; }
  }
  map.__rooms=rooms; map.__roomsSig=sigOf(map); map.__roomsChk=now;
  return rooms;
}

/* ------------------------------------------------------------------ what stands in each room */
/* a dwelling may be furnished for what the story makes of it (its feature's furnish):
     palace   — beds of ivory with their canopies, a table set with bowls of wine, a harp, the lampstand
     feast    — a long low table spread with bread and bowls, cushions about it, jars of wine
     court    — a king's seat on a step, a rug before it, a lampstand on either side, arms
     chamber  — the little upper room: a bed, a table, a stool and a lampstand (MELAḴIM B 4:10)
     poor     — a hearth, a mat, one jar and a lamp, and nothing else
     store    — jars and sacks and baskets, stacked
     shrine   — a carved image on its stand, incense burning before it, lamps (a house of idols)
     prison   — straw, fetters on the wall, the stocks, a jar of water
     scribe   — a table of scrolls with a stool, scroll jars, a fire-pot burning */
const STYLE={
  palace:[['rug',.5,.55,{under:true}],['bed',.24,.3,{solid:.45,ivory:true}],['bed',.76,.3,{solid:.45,ivory:true}],['table',.5,.72,{solid:.35,bowls:true}],
          ['harp',.08,.62,{solid:.2}],['lampstand',.93,.1,{solid:.15}],['jars',.06,.12,{solid:.4}],['lamp',.5,-.05,{wall:true}]],
  feast:[['rug',.5,.55,{under:true}],['table',.5,.5,{solid:.4,long:true,bread:true,bowls:true}],['cushion',.2,.5],['cushion',.8,.5],['cushion',.36,.86],['cushion',.64,.86],
         ['cushion',.36,.16],['cushion',.64,.16],['jars',.95,.12,{solid:.4}],['lampstand',.05,.12,{solid:.15}],['lamp',.5,-.05,{wall:true}]],
  court:[['rug',.5,.62,{under:true}],['throne',.5,.12,{solid:.45}],['lampstand',.22,.1,{solid:.15}],['lampstand',.78,.1,{solid:.15}],['arms',.92,.7,{solid:.3}],['chest',.08,.72,{solid:.3}]],
  chamber:[['bed',.22,.32,{solid:.45}],['table',.6,.38,{solid:.3}],['seat',.8,.72,{solid:.2}],['lampstand',.92,.12,{solid:.15}],['lamp',.45,-.05,{wall:true}]],
  poor:[['hearth',.15,.25,{solid:.42}],['mat',.75,.7],['jar',.88,.18,{solid:.2}],['lamp',.55,-.05,{wall:true}]],
  store:[['jars',.1,.15,{solid:.45}],['jars',.32,.12,{solid:.45}],['jars',.9,.15,{solid:.45}],['sacks',.68,.15,{solid:.4}],['sacks',.12,.72,{solid:.4}],
         ['basket',.88,.75],['basket',.78,.82],['jar',.5,.2,{solid:.2}],['lamp',.5,-.05,{wall:true}]],
  shrine:[['idol',.5,.12,{solid:.4}],['incense',.5,.5,{solid:.25}],['lamp',.3,.2],['lamp',.7,.2],['jars',.08,.15,{solid:.4}],['mat',.5,.85]],
  prison:[['straw',.3,.6,{under:true}],['straw',.75,.4,{under:true}],['chains',.25,-.03,{wall:true}],['chains',.75,-.03,{wall:true}],['stocks',.7,.75,{solid:.3}],['jar',.08,.2,{solid:.2}]],
  scribe:[['table',.4,.35,{solid:.35,scrolls:true}],['seat',.4,.68,{solid:.2}],['jars',.9,.14,{solid:.4,scroll:true}],['brazier',.12,.62,{solid:.3}],['lamp',.65,-.05,{wall:true}],['mat',.78,.75]]};
function furnish(R){
  const r=rnd(Math.round(R.ax*97+R.ay*131)+R.kind.length), W=R.R-R.L, D=R.F-R.fy0;
  const at=(u,v)=>({x:R.L+.3+(W-.6)*u, y:R.fy0+.1+(D-.25)*v});
  const out=[]; const put=(kind,u,v,o)=>out.push(Object.assign(at(u,v),{kind},o||{}));
  const st=R.kind!=='cave'&&STYLE[R.d.furnish];
  if(st){ for(const [k,u,v,o] of st) put(k,u,v,Object.assign({},o)); return out; }
  if(R.kind==='house'){
    const left=r()<.5;
    put(r()<.5?'oven':'hearth', left?.12:.88, .2, {solid:.42});
    put('jars', left?.88:.12, .12, {solid:.45});
    put('quern', left?.8:.22, .7, {solid:.25});
    put('basket', left?.95:.05, .78);
    put('mat', left?.22:.78, .72);
    if(W>3.6) put('loom', .5, -.02, {wall:true});
    put('lamp', left?.62:.38, -.05, {wall:true});
  } else if(R.kind==='tent'){
    put('rug', .5, .55, {under:true});
    put('pole', .5, .05, {solid:.12});
    put('skin', .58, .02);
    put('cushion', .14, .35); put('cushion', .86, .35);
    put('lamp', .3, .1);
    put('jar', .9, .8, {solid:.2});
  } else if(R.kind==='wartent'){
    put('rug', .5, .55, {under:true});
    put('couch', .22, .25, {solid:.45});
    put('arms', .86, .15, {solid:.3});
    put('chest', .84, .72, {solid:.3});
    put('lamp', .55, .12);
  } else if(R.kind==='cave'){
    put('fire', .3, .42, {solid:.32});
    put('skins', .76, .3);
    put('jar', .88, .78, {solid:.2});
    for(let i=0;i<5;i++) put('stone', r()<.5?r()*.18:.82+r()*.18, r()*.9);
    put('drips', .5, -.05, {wall:true});
  }
  return out;
}

/* ------------------------------------------------------------------ walking: walls, and the way in */
function inRoom(R,x,y){ return x>R.L&&x<R.R&&y>R.T&&y<R.F; }
function roomBlocks(R,x,y){
  /* undefined: not this room's ground. true: a wall or a thing stands there. false: open floor */
  if(x<R.L-.02||x>R.R+.02||y<R.T||y>R.F+.6) return undefined;
  if(y>=R.F) return false;                                  /* the ground before the door */
  if(y>R.F-.26) return Math.abs(x-R.ax)>=R.door;            /* the front wall, open at the door */
  const side=R.kind==='cave'?.42:.3;
  if(x<R.L+side||x>R.R-side) return true;                   /* the side walls */
  if(y<R.fy0) return true;                                  /* the back wall */
  for(const f of R.furn) if(f.solid&&Math.hypot((x-f.x)*.9,(y-f.y)*1.3)<f.solid) return true;
  return false;
}
const _walkable=walkable;
window.walkable=function(map,x,y,fx,fy){
  if(ROOMS.on&&map&&map.decor){
    const rooms=roomsOf(map);
    for(const R of rooms){
      const b=roomBlocks(R,x,y); if(b===undefined) continue;
      if(b) return false;
      /* open floor of the room: the ground beneath decides, the dwelling itself does not stand in the way */
      const was=R.d.solid; R.d.solid=false;
      try{ return _walkable.apply(this,arguments); } finally{ R.d.solid=was; }
    }
  }
  return _walkable.apply(this,arguments);
};

/* ------------------------------------------------------------------ painting */
const baseDraw=drawProp;
const LOOSE=new Set(['bones','bed','couch','table','seat','lampstand','harp','sacks','brazier','stocks','incense','jars','quern','loom','mat','cushion','rug','chest','arms','oven','hearth','chains','straw']);
const COL={
  house:{floor:'#8c6c4a', wall:'#a5825a', top:'#5e4528', face:'#cdb48a', faceLo:'#b39a70'},
  tent:{floor:'#9b8462', wall:'#3e3128', top:'#2a211a', face:'#4a3b2f', faceLo:'#3a2e24'},
  wartent:{floor:'#957c58', wall:'#5a3a2a', top:'#3a251a', face:'#6e4632', faceLo:'#583826'},
  cave:{floor:'#5d554a', wall:'#4a433a', top:'#2e2924', face:'#625a4e', faceLo:'#4f483e'}};

function drawFloor(g,R,ox,oy,t,a){
  const X=x=>x*TILE+ox, Y=y=>y*TILE+oy, C=COL[R.kind], u=TILE/40;
  const L=X(R.L), Rr=X(R.R), T=Y(R.T), F=Y(R.F), bw=R.bw*TILE;
  g.save(); g.globalAlpha=a;
  if(R.kind==='cave'){
    /* the rock gives way to a hollow: uneven walls, a rock floor */
    g.fillStyle=C.floor; roughRect(g,L,T,Rr,F,R,7); g.fill();
    g.fillStyle=C.face; g.beginPath(); g.moveTo(L,T+bw);
    for(let i=0;i<=10;i++){ const xx=L+(Rr-L)*i/10; g.lineTo(xx,T+bw*(.85+.15*Math.sin(i*2.1+R.ax))); }
    g.lineTo(Rr,T); g.lineTo(L,T); g.closePath(); g.fill();
    speckle(g,L,T+bw,Rr,F,R,'rgba(0,0,0,.14)',60);
    speckle(g,L,T+bw,Rr,F,R,'rgba(255,255,255,.05)',30);
  } else {
    g.fillStyle=C.floor; g.fillRect(L,T,Rr-L,F-T);
    speckle(g,L,T+bw,Rr,F,R,'rgba(40,24,10,.16)',70);
    /* the back wall's face, seen from the room */
    g.fillStyle=C.face; g.fillRect(L,T,Rr-L,bw);
    g.fillStyle=C.faceLo; g.fillRect(L,T+bw*.78,Rr-L,bw*.22);
    if(R.kind==='house'){ g.fillStyle='rgba(80,56,30,.18)'; for(let i=1;i<4;i++) g.fillRect(L,T+bw*i/4.2,Rr-L,Math.max(1,u)); }
    else { g.fillStyle='rgba(0,0,0,.18)'; for(let i=1;i<9;i++) g.fillRect(L+(Rr-L)*i/9,T,Math.max(1.5,1.6*u),bw); }
  }
  /* the walls' cut tops, left, right and back */
  const wt=(R.kind==='tent'?.14:.2)*TILE;
  g.fillStyle=C.top;
  if(R.kind!=='cave'){ g.fillRect(L-wt*.5,T-wt*.5,Rr-L+wt,wt); g.fillRect(L-wt*.5,T,wt,F-T); g.fillRect(Rr-wt*.5,T,wt,F-T); }
  else { g.lineWidth=wt*1.4; g.strokeStyle=C.top; roughRect(g,L,T,Rr,F,R,7); g.stroke(); }
  /* things on the back wall and laid on the floor */
  for(const f of R.furn) if(f.wall||f.under) drawFurn(g,R,f,X(f.x),Y(f.y),t,ox,oy);
  g.restore();
}
function drawFront(g,R,ox,oy,t,a){
  /* the front wall, low, with its door: it stands before those within */
  const X=x=>x*TILE+ox, Y=y=>y*TILE+oy, C=COL[R.kind];
  const L=X(R.L), Rr=X(R.R), F=Y(R.F), dl=X(R.ax-R.door), dr=X(R.ax+R.door), wt=(R.kind==='tent'?.16:.24)*TILE;
  g.save(); g.globalAlpha=a;
  g.fillStyle=C.wall; g.fillRect(L-wt*.5,F-wt,dl-L+wt*.5,wt); g.fillRect(dr,F-wt,Rr-dr+wt*.5,wt);
  g.fillStyle=C.top; g.fillRect(L-wt*.5,F-wt,dl-L+wt*.5,wt*.4); g.fillRect(dr,F-wt,Rr-dr+wt*.5,wt*.4);
  if(R.kind==='house'||R.kind==='wartent'){ g.fillStyle='#6e5232'; g.fillRect(dl-wt*.3,F-wt*1.1,wt*.3,wt*1.1); g.fillRect(dr,F-wt*1.1,wt*.3,wt*1.1); }
  if(R.kind==='tent'||R.kind==='wartent'){ /* the flap, rolled back beside the opening */
    g.fillStyle=R.kind==='tent'?'#6b5844':'#7e5238'; g.beginPath(); g.ellipse(dr+wt*.6,F-wt*.5,wt*.7,wt*.45,0,0,Math.PI*2); g.fill(); }
  g.restore();
}

/* ------------------------------------------------------------------ the things of the house, the tent and the cave */
function drawFurn(g,R,f,x,y,t,ox,oy){
  const u=TILE/40*(R.kind==='tent'?1.45:1.75)*(f.scale||1);   /* things drawn to the size of the people */
  const sh=(w)=>{ g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x,y+1*u,w*u,w*u*.35,0,0,Math.PI*2); g.fill(); };
  const jar=(jx,jy,s,c)=>{ g.fillStyle=c||'#b0703e'; g.beginPath(); g.ellipse(jx,jy-7*s*u,5*s*u,7*s*u,0,0,Math.PI*2); g.fill();
    g.fillStyle='rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(jx+1.6*s*u,jy-6*s*u,3*s*u,6*s*u,0,0,Math.PI*2); g.fill();
    g.fillStyle='#8c5530'; g.fillRect(jx-2.2*s*u,jy-15.5*s*u,4.4*s*u,2.6*s*u); g.fillStyle='#2a1a0e'; g.fillRect(jx-1.6*s*u,jy-15.8*s*u,3.2*s*u,1*s*u); };
  switch(f.kind){
    case 'hearth': { sh(9); for(let i=0;i<9;i++){ const a=i/9*Math.PI*2; g.fillStyle=i%2?'#7d7466':'#948a7a';
        g.beginPath(); g.ellipse(x+Math.cos(a)*7*u,y-4*u+Math.sin(a)*3.4*u,2.4*u,1.8*u,0,0,Math.PI*2); g.fill(); }
      const fl=.6+.4*Math.sin(t/120+R.ax); g.fillStyle=`rgba(255,${120+fl*80|0},40,.9)`; g.beginPath(); g.ellipse(x,y-4*u,4.4*u,1.8*u,0,0,Math.PI*2); g.fill();
      g.fillStyle='#3a2a1c'; g.beginPath(); g.ellipse(x,y-8*u,4.2*u,3.4*u,0,0,Math.PI*2); g.fill();     /* a pot on the fire */
      glow(g,x,y-6*u,30*u,.22*fl); break; }
    case 'oven': { sh(9); /* the tabun: a dome of clay with its mouth and the glow within */
      g.fillStyle='#b98a5c'; g.beginPath(); g.ellipse(x,y-6*u,9*u,8*u,0,Math.PI,0); g.lineTo(x+9*u,y-1*u); g.lineTo(x-9*u,y-1*u); g.closePath(); g.fill();
      g.fillStyle='#9a6e46'; g.beginPath(); g.ellipse(x,y-13*u,3.4*u,1.4*u,0,0,Math.PI*2); g.fill();
      const fl=.6+.4*Math.sin(t/140+R.ax); g.fillStyle=`rgba(255,${130+fl*70|0},50,.95)`; g.beginPath(); g.ellipse(x,y-3*u,3.2*u,2.6*u,0,Math.PI,0); g.fill();
      glow(g,x,y-4*u,24*u,.18*fl); break; }
    case 'jars': { sh(10); jar(x-5*u,y-1*u,.95); jar(x+4*u,y,1.1,'#a8683a'); jar(x,y+3*u,.8,'#b87a46'); break; }
    case 'jar': { sh(5); jar(x,y,.8); break; }
    case 'quern': { sh(7); /* the saddle quern, and the stone that grinds on it */
      g.fillStyle='#8b8375'; g.beginPath(); g.ellipse(x,y-2*u,8*u,3.4*u,-.15,0,Math.PI*2); g.fill();
      g.fillStyle='#a39a8a'; g.beginPath(); g.ellipse(x-1*u,y-3.6*u,6*u,2*u,-.15,0,Math.PI*2); g.fill();
      g.fillStyle='#d8cdb0'; g.beginPath(); g.ellipse(x+2*u,y-3*u,2.2*u,.8*u,0,0,Math.PI*2); g.fill();
      g.fillStyle='#6e675c'; g.beginPath(); g.ellipse(x-2*u,y-5.2*u,3*u,1.6*u,0,0,Math.PI*2); g.fill(); break; }
    case 'basket': { sh(5); g.fillStyle='#a8844a'; g.beginPath(); g.ellipse(x,y-3*u,5*u,4*u,0,0,Math.PI*2); g.fill();
      g.strokeStyle='rgba(80,56,24,.6)'; g.lineWidth=Math.max(1,.8*u); for(let i=-1;i<=1;i++){ g.beginPath(); g.moveTo(x-4.6*u,y-3*u+i*2*u); g.lineTo(x+4.6*u,y-3*u+i*2*u); g.stroke(); }
      g.fillStyle='#d8b860'; g.beginPath(); g.ellipse(x,y-6.4*u,4.2*u,1.6*u,0,0,Math.PI*2); g.fill(); break; }
    case 'mat': { /* a mat of reeds, and the bedding rolled at its head */
      g.fillStyle='#b9a36a'; g.fillRect(x-11*u,y-6*u,22*u,10*u);
      g.strokeStyle='rgba(110,86,40,.55)'; g.lineWidth=Math.max(1,.7*u); for(let i=1;i<11;i++){ g.beginPath(); g.moveTo(x-11*u+i*2*u,y-6*u); g.lineTo(x-11*u+i*2*u,y+4*u); g.stroke(); }
      g.fillStyle='#8a5a3a'; g.beginPath(); g.ellipse(x-8*u,y-1*u,3*u,5*u,0,0,Math.PI*2); g.fill();
      g.fillStyle='rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(x-8.6*u,y-2.4*u,1.4*u,3*u,0,0,Math.PI*2); g.fill(); break; }
    case 'loom': { /* the upright loom against the wall, its threads weighted with clay */
      const top=y-R.bw*TILE*.95, bot=y+2*u; g.fillStyle='#6e5232'; g.fillRect(x-12*u,top,1.6*u,bot-top); g.fillRect(x+10.4*u,top,1.6*u,bot-top);
      g.fillRect(x-13*u,top,26*u,1.6*u);
      g.fillStyle='rgba(225,210,170,.85)'; g.fillRect(x-10*u,top+2*u,20*u,(bot-top)*.45);
      g.strokeStyle='rgba(160,60,40,.7)'; g.lineWidth=Math.max(1,1*u); for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(x-10*u,top+4*u+i*3*u); g.lineTo(x+10*u,top+4*u+i*3*u); g.stroke(); }
      g.strokeStyle='rgba(225,210,170,.7)'; g.lineWidth=Math.max(1,.5*u); for(let i=0;i<9;i++){ const lx=x-9*u+i*2.25*u; g.beginPath(); g.moveTo(lx,top+2*u+(bot-top)*.45); g.lineTo(lx,bot-3*u); g.stroke(); }
      g.fillStyle='#9a6e46'; for(let i=0;i<9;i++){ g.beginPath(); g.arc(x-9*u+i*2.25*u,bot-2*u,1.2*u,0,Math.PI*2); g.fill(); } break; }
    case 'lamp': { /* a little lamp of clay, its wick burning */
      const ly=f.wall?y-R.bw*TILE*.5:y; if(f.wall){ g.fillStyle='rgba(40,24,10,.5)'; g.beginPath(); g.ellipse(x,ly-1*u,5*u,4.4*u,0,Math.PI,0); g.lineTo(x+5*u,ly+2*u); g.lineTo(x-5*u,ly+2*u); g.closePath(); g.fill(); }
      g.fillStyle='#a8683a'; g.beginPath(); g.ellipse(x,ly,3.4*u,1.6*u,0,0,Math.PI*2); g.fill();
      const fl=.7+.3*Math.sin(t/90+R.ay); g.fillStyle=`rgba(255,${200+fl*40|0},110,.95)`; g.beginPath(); g.ellipse(x+2.8*u,ly-2.4*u,1*u,2*u*fl,0,0,Math.PI*2); g.fill();
      glow(g,x+2.8*u,ly-2*u,22*u,.2*fl); break; }
    case 'rug': { const w=(R.R-R.L)*TILE*.62, h=(R.F-R.fy0)*TILE*.62, x0=x-w/2, y0=y-h/2;
      const war=R.kind==='wartent';
      g.fillStyle=war?'#7a2a24':'#8e3a2a'; g.fillRect(x0,y0,w,h);
      g.fillStyle=war?'#c8a24a':'#e0c890'; g.fillRect(x0+3*u,y0+3*u,w-6*u,2*u); g.fillRect(x0+3*u,y0+h-5*u,w-6*u,2*u);
      g.fillStyle='#2a1c14'; for(let i=0;i<5;i++) g.fillRect(x0+w*(.12+i*.18),y0+h*.36,w*.08,h*.28);
      g.fillStyle=war?'#c8a24a':'#d8b070'; for(let i=0;i<5;i++){ const cx=x0+w*(.16+i*.18), cy=y0+h*.5; g.beginPath(); g.moveTo(cx,cy-h*.1); g.lineTo(cx+w*.035,cy); g.lineTo(cx,cy+h*.1); g.lineTo(cx-w*.035,cy); g.closePath(); g.fill(); }
      break; }
    case 'cushion': { sh(6); g.fillStyle='#6e3a52'; g.beginPath(); g.ellipse(x,y-2*u,6*u,3.6*u,0,0,Math.PI*2); g.fill();
      g.fillStyle='#c8a24a'; g.fillRect(x-5*u,y-2.4*u,10*u,1*u); break; }
    case 'pole': { sh(3); g.fillStyle='#5d4426'; g.fillRect(x-1.2*u,y-R.bw*TILE*1.4,2.4*u,R.bw*TILE*1.4); g.fillStyle='#7a5a34'; g.beginPath(); g.arc(x,y-R.bw*TILE*1.4,1.8*u,0,Math.PI*2); g.fill(); break; }
    case 'skin': { /* a waterskin hung on the tent-pole */
      g.strokeStyle='#5d4426'; g.lineWidth=Math.max(1,.6*u); g.beginPath(); g.moveTo(x-2*u,y-R.bw*TILE*1.1); g.lineTo(x,y-R.bw*TILE*.8); g.stroke();
      g.fillStyle='#7a5434'; g.beginPath(); g.ellipse(x+1*u,y-R.bw*TILE*.55,3.2*u,4.6*u,.3,0,Math.PI*2); g.fill(); break; }
    case 'couch': { sh(14); /* a couch with its canopy (the kind a captain lay on in his tent) */
      g.fillStyle='#6e4a2a'; g.fillRect(x-14*u,y-8*u,28*u,9*u);
      g.fillStyle='#c8b48a'; g.fillRect(x-13*u,y-9*u,26*u,6*u); g.fillStyle='#8a2a2a'; g.fillRect(x-13*u,y-9*u,6*u,6*u);
      g.strokeStyle='#c8a24a'; g.lineWidth=Math.max(1,1*u); g.beginPath(); g.moveTo(x-14*u,y-8*u); g.lineTo(x-14*u,y-24*u); g.moveTo(x+14*u,y-8*u); g.lineTo(x+14*u,y-24*u); g.stroke();
      g.fillStyle='rgba(240,232,210,.35)'; g.beginPath(); g.moveTo(x-15*u,y-24*u); g.lineTo(x+15*u,y-24*u); g.lineTo(x+16*u,y-6*u); g.lineTo(x-16*u,y-6*u); g.closePath(); g.fill();
      g.fillStyle='#c8a24a'; g.fillRect(x-15*u,y-25*u,30*u,1.6*u); break; }
    case 'arms': { sh(9); /* spears in their rack, and a shield leaned against it */
      g.fillStyle='#6e5232'; g.fillRect(x-8*u,y-3*u,16*u,2*u);
      g.strokeStyle='#7a5a34'; g.lineWidth=Math.max(1.5,1.2*u); for(let i=0;i<4;i++){ const sx2=x-6*u+i*4*u; g.beginPath(); g.moveTo(sx2,y-1*u); g.lineTo(sx2+1*u,y-26*u); g.stroke();
        g.fillStyle='#b8b0a0'; g.beginPath(); g.moveTo(sx2+1*u,y-30*u); g.lineTo(sx2+2.4*u,y-25*u); g.lineTo(sx2-.4*u,y-25*u); g.closePath(); g.fill(); }
      g.fillStyle='#8a5a2a'; g.beginPath(); g.ellipse(x+9*u,y-6*u,5*u,6.4*u,0,0,Math.PI*2); g.fill(); g.fillStyle='#c8a24a'; g.beginPath(); g.arc(x+9*u,y-6*u,1.6*u,0,Math.PI*2); g.fill(); break; }
    case 'chest': { sh(8); g.fillStyle='#6e4a2a'; g.fillRect(x-8*u,y-9*u,16*u,9*u); g.fillStyle='#8a6038'; g.fillRect(x-8*u,y-11*u,16*u,3*u);
      g.fillStyle='#c8a24a'; g.fillRect(x-8*u,y-6*u,16*u,1*u); g.fillRect(x-1*u,y-8*u,2*u,3*u); break; }
    case 'fire': { sh(10); for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; g.fillStyle='#6e675c'; g.beginPath(); g.ellipse(x+Math.cos(a)*7*u,y-3*u+Math.sin(a)*3*u,2.2*u,1.6*u,0,0,Math.PI*2); g.fill(); }
      g.strokeStyle='#4a3420'; g.lineWidth=Math.max(1.5,1.6*u); g.beginPath(); g.moveTo(x-5*u,y-2*u); g.lineTo(x+4*u,y-5*u); g.moveTo(x+5*u,y-2*u); g.lineTo(x-4*u,y-5*u); g.stroke();
      const fl=.6+.4*Math.sin(t/110+R.ax); g.fillStyle=`rgba(255,${130+fl*90|0},40,.95)`; g.beginPath(); g.moveTo(x-3.4*u,y-3*u); g.quadraticCurveTo(x,y-(12+fl*4)*u,x+3.4*u,y-3*u); g.closePath(); g.fill();
      glow(g,x,y-5*u,46*u,.3*fl); break; }
    case 'skins': { g.fillStyle='#7a5a3a'; g.beginPath(); g.ellipse(x,y-2*u,10*u,5*u,.2,0,Math.PI*2); g.fill();
      g.fillStyle='#9a7a52'; g.beginPath(); g.ellipse(x+3*u,y-3*u,6*u,3.4*u,-.3,0,Math.PI*2); g.fill(); break; }
    case 'stone': { g.fillStyle='#6e675c'; g.beginPath(); g.ellipse(x,y-1.4*u,2.6*u,1.8*u,0,0,Math.PI*2); g.fill(); break; }
    case 'bed': { sh(13); /* a bed on its frame (of ivory in the palaces of the rich), with its coverlet and canopy */
      const fr=f.ivory?'#e8dcc0':'#6e4a2a', fr2=f.ivory?'#c8b890':'#5a3c22';
      g.fillStyle=fr2; g.fillRect(x-13*u,y-3*u,2*u,4*u); g.fillRect(x+11*u,y-3*u,2*u,4*u);
      g.fillStyle=fr; g.fillRect(x-13*u,y-8*u,26*u,6*u); g.fillRect(x-13*u,y-13*u,3*u,10*u);
      g.fillStyle=f.ivory?'#7a3a5a':'#9a8a64'; g.fillRect(x-10*u,y-10*u,22*u,5*u);
      g.fillStyle=f.ivory?'#c8a24a':'#b8a478'; g.fillRect(x-10*u,y-6*u,22*u,1*u);
      g.fillStyle='#e8e0cc'; g.beginPath(); g.ellipse(x-7*u,y-10*u,3.4*u,2*u,0,0,Math.PI*2); g.fill();
      if(f.ivory){ g.strokeStyle='#d8c8a0'; g.lineWidth=Math.max(1,1*u); g.beginPath(); g.moveTo(x-13*u,y-8*u); g.lineTo(x-13*u,y-22*u); g.moveTo(x+13*u,y-8*u); g.lineTo(x+13*u,y-22*u); g.stroke();
        g.fillStyle='rgba(240,228,200,.3)'; g.beginPath(); g.moveTo(x-14*u,y-22*u); g.lineTo(x+14*u,y-22*u); g.lineTo(x+15*u,y-7*u); g.lineTo(x-15*u,y-7*u); g.closePath(); g.fill(); }
      break; }
    case 'table': { const L2=f.long?20:10; sh(L2+2); /* a low table of wood, and what is set on it */
      g.fillStyle='#5a3c22'; g.fillRect(x-(L2-1)*u,y-3*u,2*u,4*u); g.fillRect(x+(L2-3)*u,y-3*u,2*u,4*u);
      g.fillStyle='#7a5432'; g.fillRect(x-L2*u,y-7*u,2*L2*u,5*u); g.fillStyle='#8e6640'; g.fillRect(x-L2*u,y-7*u,2*L2*u,1.4*u);
      if(f.bread) for(let i=0;i<Math.round(L2/5);i++){ g.fillStyle='#c8964e'; g.beginPath(); g.ellipse(x-L2*u+(4+i*8)*u,y-7.6*u,2.6*u,1.4*u,0,0,Math.PI*2); g.fill(); }
      if(f.bowls) for(let i=0;i<Math.round(L2/4);i++){ const bx=x-L2*u+(6.5+i*7.2)*u; g.fillStyle=i%2?'#c8a24a':'#b8b0a0'; g.beginPath(); g.ellipse(bx,y-7.4*u,2.2*u,1*u,0,0,Math.PI*2); g.fill();
        g.fillStyle='#6a1e2a'; g.beginPath(); g.ellipse(bx,y-7.7*u,1.5*u,.5*u,0,0,Math.PI*2); g.fill(); }
      if(f.scrolls) for(let i=0;i<3;i++){ g.fillStyle='#e0d0a8'; g.fillRect(x-7*u+i*5*u,y-9.4*u,4*u,2*u); g.fillStyle='#8a6038'; g.fillRect(x-7.6*u+i*5*u,y-9.8*u,1*u,2.8*u); g.fillRect(x-3.4*u+i*5*u,y-9.8*u,1*u,2.8*u); }
      break; }
    case 'seat': { sh(5); /* a stool of wood */
      g.fillStyle='#5a3c22'; g.fillRect(x-4*u,y-5*u,1.4*u,6*u); g.fillRect(x+2.6*u,y-5*u,1.4*u,6*u);
      g.fillStyle='#7a5432'; g.fillRect(x-5*u,y-7*u,10*u,2.6*u); break; }
    case 'throne': { sh(14); /* the king's seat upon its step, with arms and a high back */
      g.fillStyle='#8a7a5a'; g.fillRect(x-14*u,y-3*u,28*u,4*u); g.fillStyle='#a8966e'; g.fillRect(x-14*u,y-3*u,28*u,1.2*u);
      g.fillStyle='#b08a3a'; g.fillRect(x-8*u,y-24*u,16*u,18*u); g.fillStyle='#d4b25a'; g.fillRect(x-8*u,y-24*u,16*u,2*u);
      g.fillStyle='#7a2a2a'; g.fillRect(x-6*u,y-20*u,12*u,10*u); g.fillRect(x-7*u,y-9*u,14*u,4*u);
      g.fillStyle='#c8a24a'; g.fillRect(x-10*u,y-13*u,3*u,8*u); g.fillRect(x+7*u,y-13*u,3*u,8*u); break; }
    case 'lampstand': { sh(4); /* a lamp set up on its tall stand */
      g.fillStyle='#8a6a34'; g.fillRect(x-4*u,y-1.6*u,8*u,1.8*u); g.fillRect(x-.8*u,y-20*u,1.6*u,19*u);
      g.fillStyle='#a8683a'; g.beginPath(); g.ellipse(x,y-20.5*u,3.6*u,1.5*u,0,0,Math.PI*2); g.fill();
      const fl=.7+.3*Math.sin(t/90+R.ax+x); g.fillStyle=`rgba(255,${200+fl*40|0},110,.95)`; g.beginPath(); g.ellipse(x+2.6*u,y-23*u,1*u,2*u*fl,0,0,Math.PI*2); g.fill();
      glow(g,x+2.6*u,y-22*u,26*u,.22*fl); break; }
    case 'harp': { sh(5); /* a harp of wood, its strings */
      g.strokeStyle='#7a5432'; g.lineWidth=Math.max(1.5,1.6*u); g.beginPath(); g.moveTo(x-4*u,y); g.lineTo(x-4*u,y-16*u); g.quadraticCurveTo(x+2*u,y-19*u,x+5*u,y-12*u); g.lineTo(x-4*u,y); g.stroke();
      g.strokeStyle='rgba(230,215,170,.8)'; g.lineWidth=Math.max(1,.4*u); for(let i=1;i<5;i++){ g.beginPath(); g.moveTo(x-4*u+i*1.7*u,y-2*u-i*1.2*u); g.lineTo(x-4*u+i*1.7*u,y-15.5*u+i*.5*u); g.stroke(); } break; }
    case 'sacks': { sh(9); for(const [dx,dy,s] of [[-4,0,1],[4,1,1.05],[0,-4,.9]]){ g.fillStyle='#b8a074'; g.beginPath(); g.ellipse(x+dx*u,y+dy*u-6*s*u,5*s*u,6.4*s*u,0,0,Math.PI*2); g.fill();
        g.fillStyle='#9a8258'; g.fillRect(x+dx*u-2*s*u,y+dy*u-13*s*u,4*s*u,2*s*u); } break; }
    case 'idol': { sh(7); /* a carved image upon its stand */
      g.fillStyle='#7a6e5a'; g.fillRect(x-6*u,y-5*u,12*u,5*u); g.fillStyle='#968a72'; g.fillRect(x-6*u,y-5*u,12*u,1.2*u);
      g.fillStyle='#a8925a'; g.fillRect(x-3*u,y-19*u,6*u,14*u); g.beginPath(); g.arc(x,y-21*u,3.2*u,0,Math.PI*2); g.fill();
      g.fillStyle='#d4b25a'; g.beginPath(); g.moveTo(x-3.2*u,y-23*u); g.lineTo(x,y-28*u); g.lineTo(x+3.2*u,y-23*u); g.closePath(); g.fill();
      g.fillStyle='#4a3a22'; g.fillRect(x-1.6*u,y-21.6*u,1*u,1*u); g.fillRect(x+.6*u,y-21.6*u,1*u,1*u); break; }
    case 'incense': { sh(5); /* a little altar of incense, its smoke going up */
      g.fillStyle='#8a7a62'; g.fillRect(x-3.4*u,y-9*u,6.8*u,9*u); g.fillStyle='#a8966e'; g.fillRect(x-4*u,y-10*u,8*u,2*u);
      g.fillRect(x-4*u,y-11.4*u,1.6*u,1.6*u); g.fillRect(x+2.4*u,y-11.4*u,1.6*u,1.6*u);
      for(let i=0;i<4;i++){ const k=((t/1400+i/4)%1); g.fillStyle=`rgba(210,205,195,${.35*(1-k)})`; g.beginPath(); g.arc(x+Math.sin(k*6+i)*2*u,y-12*u-k*18*u,(1.6+k*3)*u,0,Math.PI*2); g.fill(); }
      break; }
    case 'chains': { /* fetters of bronze hung from the wall */
      const cy=y-R.bw*TILE*.6; g.strokeStyle='#6e5a3a'; g.lineWidth=Math.max(1,1*u);
      for(const dx of [-5,5]){ g.beginPath(); for(let i=0;i<6;i++){ g.moveTo(x+dx*u+1.4*u,cy+i*2.2*u); g.arc(x+dx*u,cy+i*2.2*u,1.4*u,0,Math.PI*2); } g.stroke();
        g.strokeStyle='#8a7248'; g.beginPath(); g.ellipse(x+dx*u,cy+15*u,2.6*u,1.6*u,0,0,Math.PI*2); g.stroke(); g.strokeStyle='#6e5a3a'; }
      g.fillStyle='#4a3a28'; g.fillRect(x-7*u,cy-2*u,14*u,2*u); break; }
    case 'straw': { g.fillStyle='rgba(196,168,96,.75)'; g.beginPath(); g.ellipse(x,y,11*u,5*u,0,0,Math.PI*2); g.fill();
      g.strokeStyle='rgba(150,120,60,.7)'; g.lineWidth=Math.max(1,.5*u); for(let i=0;i<12;i++){ const a=i*2.4; g.beginPath(); g.moveTo(x+Math.cos(a)*8*u,y+Math.sin(a)*3*u); g.lineTo(x+Math.cos(a+.6)*3*u,y+Math.sin(a+.6)*1.4*u); g.stroke(); } break; }
    case 'stocks': { sh(11); /* the stocks: two beams of wood, holes for the feet */
      g.fillStyle='#5a3c22'; g.fillRect(x-11*u,y-3*u,2*u,4*u); g.fillRect(x+9*u,y-3*u,2*u,4*u);
      g.fillStyle='#6e4a2a'; g.fillRect(x-12*u,y-8*u,24*u,5*u); g.fillStyle='#8a6038'; g.fillRect(x-12*u,y-8*u,24*u,1.2*u);
      g.fillStyle='#21180e'; for(const dx of [-6,-2,2,6]){ g.beginPath(); g.arc(x+dx*u,y-5.6*u,1.3*u,0,Math.PI*2); g.fill(); } break; }
    case 'brazier': { sh(7); /* a fire-pot burning on its stand */
      g.fillStyle='#4a3a28'; g.fillRect(x-4*u,y-6*u,1.4*u,6*u); g.fillRect(x+2.6*u,y-6*u,1.4*u,6*u);
      g.fillStyle='#7a5a3a'; g.beginPath(); g.ellipse(x,y-7*u,6*u,3*u,0,0,Math.PI); g.fill(); g.fillStyle='#5a4028'; g.beginPath(); g.ellipse(x,y-7*u,6*u,1.6*u,0,0,Math.PI*2); g.fill();
      const fl=.6+.4*Math.sin(t/110+R.ax); g.fillStyle=`rgba(255,${130+fl*90|0},40,.95)`; g.beginPath(); g.moveTo(x-3.4*u,y-7*u); g.quadraticCurveTo(x,y-(15+fl*3)*u,x+3.4*u,y-7*u); g.closePath(); g.fill();
      glow(g,x,y-9*u,34*u,.24*fl); break; }
    case 'bones': { /* dry bones lying on the ground: long bones and skulls, scattered */
      const r=rnd(Math.round(x*7+y*13)), n=f.n||9;
      for(let i=0;i<n;i++){ const bx=x+(r()-.5)*30*u, by=y+(r()-.5)*12*u, a=r()*Math.PI;
        g.fillStyle='rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(bx,by+1*u,5*u,1.6*u,a*.2,0,Math.PI*2); g.fill();
        if(r()<.22){ g.fillStyle='#ddd4bc'; g.beginPath(); g.ellipse(bx,by-2.2*u,2.6*u,2.2*u,0,0,Math.PI*2); g.fill();
          g.fillStyle='#4a3e2e'; g.fillRect(bx-1.4*u,by-2.6*u,.9*u,.9*u); g.fillRect(bx+.5*u,by-2.6*u,.9*u,.9*u); }
        else { const dx=Math.cos(a)*4.6*u, dy=Math.sin(a)*1.6*u; g.strokeStyle='#d8cfb4'; g.lineWidth=Math.max(1.5,1.3*u); g.lineCap='round';
          g.beginPath(); g.moveTo(bx-dx,by-dy); g.lineTo(bx+dx,by+dy); g.stroke(); g.lineCap='butt';
          g.fillStyle='#e4dcc4'; g.beginPath(); g.arc(bx-dx,by-dy,1.1*u,0,Math.PI*2); g.arc(bx+dx,by+dy,1.1*u,0,Math.PI*2); g.fill(); } }
      break; }
    case 'drips': { /* the cave's roof hangs down in drips of stone over the back */
      g.fillStyle='#4a433a'; for(let i=0;i<7;i++){ const dx=x+(i-3)*TILE*.45, len=(6+((i*37)%9))*u;
        g.beginPath(); g.moveTo(dx-2.4*u,y-R.bw*TILE*.9); g.lineTo(dx+2.4*u,y-R.bw*TILE*.9); g.lineTo(dx,y-R.bw*TILE*.9+len); g.closePath(); g.fill(); } break; }
  }
}
function glow(g,x,y,r,a){ const gr=g.createRadialGradient(x,y,1,x,y,r); gr.addColorStop(0,`rgba(255,210,120,${a})`); gr.addColorStop(1,'rgba(255,210,120,0)'); g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); }
function speckle(g,x0,y0,x1,y1,R,col,n){ const r=rnd(Math.round(R.ax*53+R.ay*29)); g.fillStyle=col; const s=Math.max(1,TILE/20);
  for(let i=0;i<n;i++) g.fillRect(x0+r()*(x1-x0),y0+r()*(y1-y0),s*(1+r()),s); }
function roughRect(g,x0,y0,x1,y1,R,n){ const r=rnd(Math.round(R.ax*71+R.ay*13)); const j=TILE*.12;
  g.beginPath(); g.moveTo(x0,y1);
  for(let i=0;i<=n;i++) g.lineTo(x0+(r()-.5)*j,y1+(y0-y1)*i/n);
  for(let i=0;i<=n;i++) g.lineTo(x0+(x1-x0)*i/n,y0+(r()-.5)*j);
  for(let i=0;i<=n;i++) g.lineTo(x1+(r()-.5)*j,y0+(y1-y0)*i/n);
  g.closePath(); }

window.drawProp=function(g,px,py,p,t){
  if(p&&p.__r){
    const R=p.__r; if(R.k<=0.01) return;
    const ox=px-p.x*TILE, oy=py-p.y*TILE;
    if(p.type==='__roomfloor'){
      const top=p.row===Math.floor(R.T-.2)?-1e6:p.row*TILE+oy, bot=p.row===Math.floor(R.F-1e-6)?1e6:(p.row+1)*TILE+oy;
      g.save(); g.beginPath(); g.rect(-1e5,top,2e5,bot-top); g.clip(); drawFloor(g,R,ox,oy,t,R.k); g.restore();
    }
    else if(!p.f.wall&&!p.f.under){ g.save(); g.globalAlpha=R.k; drawFurn(g,R,p.f,px,py,t,ox,oy); g.restore(); }
    return;
  }
  /* the things of a house may also stand on a map of their own (a hall, a sickroom), where the engine draws none */
  if(p&&LOOSE.has(p.type)&&!size(p)){
    drawFurn(g,{kind:'house',ax:p.x||0,ay:p.y||0,bw:.8,L:(p.x||0)-1.6,R:(p.x||0)+1.6,fy0:(p.y||0)-1,F:(p.y||0)+1},Object.assign({},p,{kind:p.type,wall:false,scale:(p.scale||1)*1.3}),px,py,t,0,0); return;
  }
  const map=Game.world&&Game.world.map, R=p&&KIND[p.type]&&map&&map.__rooms?map.__rooms.find(r=>r.d===p):null;
  if(!R){
    if(p&&p.type==='citygate'&&!size(p)){ drawGate(g,px,py,p); return; }
    if(p&&OWN[p.type]&&(!size(p)||p.room===true&&(()=>{ const s=size(p); return s.x1-s.x0<MIN_W||s.h<MIN_H; })())){ OWN[p.type].draw(g,px,py,p); return; }
    return baseDraw.apply(this,arguments);
  }
  const ox=px-p.x*TILE, oy=py-p.y*TILE;
  if(R.k<.99){ const a=g.globalAlpha; g.globalAlpha=a*(1-R.k);
    try{ if(R.drawn) OWN[R.kind].draw(g,px,py,p); else baseDraw.apply(this,arguments); } finally{ g.globalAlpha=a; } }
  if(R.k>.01) drawFront(g,R,ox,oy,t,R.k);
};

/* ------------------------------------------------------------------ a cave of rock (an interior map marked cave: true)
   An interior map is a hall of dressed stone; a cave is not: its floor and walls are rock, boulders lie along its
   walls and its way out is a rough dark mouth, not an arched door. */
const caveOf=map=>!!(map&&map.cfg&&map.cfg.cave);
if(typeof window.tileColor==='function'){
  const _tc=window.tileColor;
  window.tileColor=function(map,id,x,y){
    if(caveOf(map)&&typeof T!=='undefined'&&(id===T.FLOOR||id===T.WALL)){
      const n=(hash2(x*7,y*13)*.25+hash2(x>>1,y>>1)*.35+hash2(x>>2,y>>2)*.4), v=(n-.5)*(id===T.WALL?16:9);
      return shadeC(id===T.WALL?'#332c25':((map.cfg.floorCol&&map.cfg.floorCol!=='#6e5d48')?map.cfg.floorCol:'#5e554a'),v);
    }
    return _tc.apply(this,arguments);
  };
}
if(typeof window.generateMap==='function'){
  const _gm=window.generateMap;
  window.generateMap=function(cfg){
    const m=_gm.apply(this,arguments);
    if(cfg&&cfg.cave&&m&&m.decor){
      const r=rnd((cfg.seed||1)*31+7), w=m.w, h=m.h;
      const doors=m.decor.filter(d=>d.type==='doorway').map(d=>d.x);
      const ok=(x,y)=>!doors.some(dx=>Math.abs(dx-x)<1.8&&y<3)&&!m.decor.some(d=>d.id&&Math.hypot(d.x-x,d.y-y)<1.3);
      const put=(x,y,s,side)=>{ if(ok(x,y)) m.decor.push({type:'__caverock',x,y,s,side,seed:(r()*1e6)|0}); };
      for(let x=.6;x<w-.4;x+=1.3+r()*1.1) put(x,1.05+r()*.2,1.1+r()*.9,'top');
      for(let y=1.8;y<h-1;y+=1.2+r()*1.1){ put(.55+r()*.2,y,.9+r()*.7,'left'); put(w-.55-r()*.2,y,.9+r()*.7,'right'); }
      for(let x=.8;x<w-.6;x+=1.6+r()*1.4) put(x,h-.35,.8+r()*.5,'bottom');
      m.decor.sort((a,b)=>a.y-b.y);
    }
    return m;
  };
}
{ const _dp=window.drawProp;
  window.drawProp=function(g,px,py,p,t){
    const map=Game.world&&Game.world.map;
    if(p&&(p.type==='rock'||p.type==='stone'||p.type==='pit')&&p.scale>1&&!p.__scaled){
      /* a great rock (the rock at Ḥorĕḇ, the rock at Qaḏĕsh): the engine draws a rock at one size only */
      g.save(); g.translate(px,py); g.scale(p.scale,p.scale);
      try{ _dp.call(this,g,0,0,Object.assign({},p,{__scaled:true}),t); } finally{ g.restore(); }
      return;
    }
    if(p&&p.type==='__caverock'){
      /* a mass of rock leaning out from the cave's wall */
      const r=rnd(p.seed||1), u=TILE, s=p.s||1, W=u*(1.1+r()*.6)*s, H=u*(p.side==='top'?1.3+r()*.7:p.side==='bottom'?.55:1+r()*.6)*s;
      const pts=[]; for(let i=0;i<9;i++){ const a=Math.PI+i/8*Math.PI, rr=1-.18*r(); pts.push([Math.cos(a)*W*.5*rr,Math.sin(a)*H*rr]); }
      g.save(); g.translate(px,py);
      g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0,1,W*.55,u*.2,0,0,Math.PI*2); g.fill();
      const gr=g.createLinearGradient(0,-H,0,0); gr.addColorStop(0,'#6a6155'); gr.addColorStop(1,'#3e372f'); g.fillStyle=gr;
      g.beginPath(); g.moveTo(-W*.5,0); for(const [x,y] of pts) g.lineTo(x,y); g.lineTo(W*.5,0); g.closePath(); g.fill();
      g.fillStyle='rgba(255,240,210,.08)'; g.beginPath(); g.moveTo(pts[2][0],pts[2][1]); g.lineTo(pts[4][0],pts[4][1]); g.lineTo(pts[5][0]*.4,pts[5][1]*.55); g.closePath(); g.fill();
      g.strokeStyle='rgba(0,0,0,.22)'; g.lineWidth=Math.max(1,u*.03); g.beginPath(); g.moveTo(pts[3][0]*.6,pts[3][1]*.7); g.lineTo(pts[6][0]*.3,pts[6][1]*.2); g.stroke();
      g.restore(); return;
    }
    if(p&&p.type==='doorway'&&caveOf(map)){
      /* the mouth of the cave: a ragged dark opening in the rock, the daylight beyond it */
      const u=TILE/40, dw=TILE*1.5, dh=TILE*1.9;
      g.save(); g.translate(px,py);
      g.fillStyle='#4a4239'; g.beginPath(); g.moveTo(-dw*.95,2); g.lineTo(-dw*.9,-dh*.55); g.lineTo(-dw*.55,-dh*1.05); g.lineTo(0,-dh*1.2);
      g.lineTo(dw*.6,-dh*1.02); g.lineTo(dw*.95,-dh*.5); g.lineTo(dw,2); g.closePath(); g.fill();
      g.fillStyle='#0e0a06'; g.beginPath(); g.moveTo(-dw*.5,0); g.lineTo(-dw*.52,-dh*.45); g.lineTo(-dw*.3,-dh*.82); g.lineTo(dw*.05,-dh*.92);
      g.lineTo(dw*.36,-dh*.74); g.lineTo(dw*.5,-dh*.4); g.lineTo(dw*.48,0); g.closePath(); g.fill();
      const gl=g.createRadialGradient(0,-dh*.4,2,0,-dh*.4,dw*.6); gl.addColorStop(0,'rgba(255,236,190,.28)'); gl.addColorStop(1,'rgba(255,236,190,0)');
      g.fillStyle=gl; g.fillRect(-dw*.6,-dh,dw*1.2,dh);
      g.fillStyle='rgba(0,0,0,.16)'; for(let i=0;i<5;i++){ g.fillRect(-dw*.85+i*dw*.38,-dh*(.3+((i*37)%5)*.12),dw*.2,2*u); }
      g.restore(); return;
    }
    return _dp.apply(this,arguments);
  };
}

/* ------------------------------------------------------------------ each frame: which room is the player in */
let lastT=0;
const _drawWorld=drawWorld;
window.drawWorld=function(g,world,t){
  const now=performance.now(), dt=Math.min(100,lastT?now-lastT:16); lastT=now;
  const map=world&&world.map, rooms=ROOMS.on&&map?roomsOf(map):[], p=world&&world.player;
  ROOMS.list=rooms; ROOMS.inside=null;
  for(const R of rooms){
    const inside=!!(p&&!p.hidden&&inRoom(R,p.x,p.y));
    if(inside) ROOMS.inside=R;
    R.k=cl(R.k+(inside?1:-1)*dt/260,0,1);
  }
  const r=_drawWorld.apply(this,arguments);
  /* within, the world outside grows dim; in a cave, the dark gathers but for the fire and the one who enters */
  const R=rooms.find(q=>q.k>.01);
  if(R){
    const lift=(typeof elevAt==='function'&&typeof ESTEP!=='undefined'&&map.elev)?elevAt(map,R.ax,R.ay-.5)*ESTEP:0;
    const ox=VW/2-Camera.x, oy=VH/2-Camera.y-lift;
    const L=R.L*TILE+ox, Rr=R.R*TILE+ox, T=R.T*TILE+oy, F=(R.F+.05)*TILE+oy;
    g.save(); g.fillStyle=`rgba(12,8,4,${.42*R.k})`;
    g.fillRect(0,0,VW,Math.max(0,T)); g.fillRect(0,F,VW,VH-F); g.fillRect(0,T,Math.max(0,L),F-T); g.fillRect(Rr,T,VW-Rr,F-T);
    if(R.kind==='cave'&&p){
      const fire=R.furn.find(f=>f.kind==='fire'), cx=p.x*TILE+ox, cy=(p.y-.6)*TILE+oy;
      g.beginPath(); g.rect(L,T,Rr-L,F-T); g.clip();
      const dk=g.createRadialGradient(cx,cy,TILE*.8,cx,cy,TILE*3.2); dk.addColorStop(0,'rgba(8,5,2,0)'); dk.addColorStop(1,`rgba(8,5,2,${.45*R.k})`);
      g.fillStyle=dk; g.fillRect(L,T,Rr-L,F-T);
      if(fire) glow(g,fire.x*TILE+ox,(fire.y-.2)*TILE+oy,TILE*2.2,.18*R.k);
    }
    g.restore();
  }
  return r;
};
})();
