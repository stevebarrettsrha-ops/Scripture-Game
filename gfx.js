/* gfx.js — richer ground and light for the Scripture Game world.

   Every ground tile keeps the colour the game gives it, but is painted with a texture
   for its kind — blades of grass, rippled sand, pebbled paths, paving with its joints,
   courses of brick, blocks of stone — laid in world space so it stays put as the camera
   moves and hides the square grid. Rivers run with the current and lakes and the sea
   drift, with glints on the water and foam at the banks; trees are painted with bark,
   branches and full crowns of leaves, and sway. Over the finished frame goes a soft
   light: a warm fall from the sky, a gentle vignette, and at night a cool dimming.
   Without this file the world is drawn exactly as before. */
(function(){
'use strict';
if(typeof tileColor!=='function'||typeof drawWorld!=='function'||typeof T==='undefined'||typeof Camera==='undefined') return;

const GFX=window.GFX={on:true};
try{ const v=localStorage.getItem('scripture-gfx'); if(v==='off') GFX.on=false; }catch(e){}

const P=160;                                  /* texture period in world pixels: four tiles */
const cache=new Map();
let cacheDpr=0, frame=0, offX=0, offY=0;

function rgbOf(c){
  const m=String(c).match(/rgba?\(([^)]+)\)/);
  if(m){ const p=m[1].split(',').map(Number); return [p[0],p[1],p[2]]; }
  let s=String(c).replace('#',''); if(s.length===3) s=s.split('').map(ch=>ch+ch).join('');
  const n=parseInt(s,16); return [(n>>16)&255,(n>>8)&255,n&255];
}
const cl=(v,a,b)=>v<a?a:(v>b?b:v);
function tone(c,amt){ const k=rgbOf(c); return amt<0?`rgb(${k[0]*(1+amt)|0},${k[1]*(1+amt)|0},${k[2]*(1+amt)|0})`
  :`rgb(${k[0]+(255-k[0])*amt|0},${k[1]+(255-k[1])*amt|0},${k[2]+(255-k[2])*amt|0})`; }
function rnd(seed){ let a=seed>>>0||1; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; }; }

const KIND={};
KIND[T.GRASS]='grass'; KIND[T.GRASS2]='grass'; KIND[T.FLOWER]='grass'; KIND[T.PATH]='path'; KIND[T.SAND]='sand';
KIND[T.DIRT]='dirt'; KIND[T.MUD]='mud'; KIND[T.TILLED]='dirt'; KIND[T.FLOOR]='floor'; KIND[T.BRICK]='brick'; KIND[T.WALL]='wall';
KIND[T.ROCK]='rock'; KIND[T.MTN]='rock'; KIND[T.SNOW]='snow'; KIND[T.WATER]='water'; KIND[T.DEEP]='water';
if(T.FORD!=null) KIND[T.FORD]='water';

/* paint one texture tile (P×P world px, drawn at device resolution) */
function paint(kind,base){
  const d=cacheDpr, S=Math.round(P*d);
  const cv=document.createElement('canvas'); cv.width=S; cv.height=S;
  const g=cv.getContext('2d'); g.scale(d,d);
  g.fillStyle=base; g.fillRect(0,0,P,P);
  /* broad, soft variation across the ground */
  if(kind!=='floor'&&kind!=='brick'&&kind!=='wall'){ const r0=rnd(rgbOf(base).reduce((a,b)=>a*17+b,3)); for(let i=0;i<14;i++){ const x=r0()*P, y=r0()*P, rr=18+r0()*34, lt0=r0()<.5;
    for(const dx of[-P,0,P]) for(const dy of[-P,0,P]){ const gr=g.createRadialGradient(x+dx,y+dy,0,x+dx,y+dy,rr); gr.addColorStop(0,lt0?'rgba(255,250,230,.07)':'rgba(0,0,0,.08)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x+dx-rr,y+dy-rr,rr*2,rr*2); } } }
  const r=rnd(kind.length*977+rgbOf(base).reduce((a,b)=>a*31+b,7));
  const dk=tone(base,-.16), dk2=tone(base,-.3), lt=tone(base,.1), lt2=tone(base,.2);
  const wrap=(fn)=>{ for(const dx of[-P,0,P]) for(const dy of[-P,0,P]){ g.save(); g.translate(dx,dy); fn(); g.restore(); } };
  switch(kind){
    case 'grass': {
      const blades=[]; for(let i=0;i<560;i++) blades.push([r()*P,r()*P,2+r()*5,(r()-.5)*2.4,r()]);
      wrap(()=>{ for(const [x,y,h,lean,k] of blades){ g.strokeStyle=k<.55?dk:(k<.85?lt:dk2); g.lineWidth=k<.9?1:1.4; g.beginPath(); g.moveTo(x,y); g.lineTo(x+lean,y-h); g.stroke(); } });
      for(let i=0;i<10;i++){ g.fillStyle='rgba(0,0,0,.05)'; g.beginPath(); g.ellipse(r()*P,r()*P,6+r()*10,3+r()*5,0,0,Math.PI*2); g.fill(); }
      break; }
    case 'sand': {
      for(let i=0;i<14;i++){ const y0=i*P/14+r()*4; g.strokeStyle=i%2?'rgba(255,248,230,.16)':'rgba(120,90,50,.13)'; g.lineWidth=1.2;
        g.beginPath(); for(let x=-4;x<=P+4;x+=4){ const y=y0+Math.sin((x/P)*Math.PI*4+i)*2.2; x<0?g.moveTo(x,y):g.lineTo(x,y); } g.stroke(); }
      for(let i=0;i<360;i++){ g.fillStyle=r()<.5?'rgba(110,80,40,.22)':'rgba(255,250,235,.25)'; g.fillRect(r()*P,r()*P,1,1); }
      break; }
    case 'path': case 'dirt': case 'mud': {
      for(let i=0;i<620;i++){ g.fillStyle=r()<.5?dk:lt; g.fillRect(r()*P,r()*P,1+(r()<.2?1:0),1); }
      const stones=kind==='path'?52:30;
      wrap(()=>{ const rr=rnd(kind.length*31); for(let i=0;i<stones;i++){ const x=rr()*P, y=rr()*P, w=2+rr()*(kind==='path'?5:3), h=w*.6;
        g.fillStyle=kind==='mud'?'rgba(40,30,20,.3)':dk; g.beginPath(); g.ellipse(x,y+.8,w,h,0,0,Math.PI*2); g.fill();
        g.fillStyle=kind==='mud'?'rgba(170,160,140,.18)':lt2; g.beginPath(); g.ellipse(x,y,w,h,0,0,Math.PI*2); g.fill(); } });
      if(kind==='mud'){ for(let i=0;i<5;i++){ g.fillStyle='rgba(150,170,180,.12)'; g.beginPath(); g.ellipse(r()*P,r()*P,5+r()*6,2+r()*2,0,0,Math.PI*2); g.fill(); } }
      break; }
    case 'floor': {
      /* paving: one slab per tile, joints on the tile lines, each slab its own tone, a few cracks */
      const N=P/40;
      for(let sy=0;sy<N;sy++) for(let sx=0;sx<N;sx++){ const k=r(); g.fillStyle=k<.33?tone(base,-.025):k<.66?tone(base,.02):base; g.fillRect(sx*40+1,sy*40+1,38,38);
        g.fillStyle='rgba(255,250,235,.07)'; g.fillRect(sx*40+1,sy*40+1,38,2); g.fillStyle='rgba(0,0,0,.08)'; g.fillRect(sx*40+1,sy*40+37,38,2); }
      g.fillStyle=tone(base,-.35); for(let i=0;i<=N;i++){ g.fillRect(0,i*40,P,1); g.fillRect(i*40,0,1,P); }
      g.strokeStyle='rgba(0,0,0,.14)'; g.lineWidth=.8; for(let i=0;i<8;i++){ let x=r()*P, y=r()*P; g.beginPath(); g.moveTo(x,y); for(let k=0;k<4;k++){ x+=(r()-.5)*10; y+=(r()-.5)*10; g.lineTo(x,y); } g.stroke(); }
      for(let i=0;i<220;i++){ g.fillStyle='rgba(0,0,0,.06)'; g.fillRect(r()*P,r()*P,1,1); }
      break; }
    case 'brick': {
      for(let row=0;row<P/10;row++){ const y=row*10, off=(row%2)*10; for(let x=-10;x<P;x+=20){ const k=r(); g.fillStyle=k<.3?tone(base,-.1):k<.6?tone(base,.06):base; g.fillRect(x+off+1,y+1,18,8); } }
      g.fillStyle=tone(base,-.38); for(let row=0;row<=P/10;row++) g.fillRect(0,row*10,P,1);
      for(let row=0;row<P/10;row++){ const off=(row%2)*10; for(let x=off;x<P;x+=20) g.fillRect(x,row*10,1,10); }
      break; }
    case 'wall': {
      for(let row=0;row<12;row++){ const y=row*(P/12), off=(row%2)*13; for(let x=-13;x<P;x+=26){ const k=r(); g.fillStyle=k<.3?tone(base,-.12):k<.6?tone(base,.08):base; g.fillRect(x+off+1,y+1,24,P/12-2);
        g.fillStyle='rgba(255,250,235,.08)'; g.fillRect(x+off+1,y+1,24,1.5); } }
      g.fillStyle=tone(base,-.45); for(let row=0;row<=12;row++) g.fillRect(0,row*(P/12),P,1);
      break; }
    case 'rock': {
      for(let i=0;i<480;i++){ g.fillStyle=r()<.5?dk:lt; g.fillRect(r()*P,r()*P,1+(r()<.3?1:0),1); }
      g.strokeStyle=dk2; g.lineWidth=1; for(let i=0;i<18;i++){ let x=r()*P, y=r()*P; g.beginPath(); g.moveTo(x,y); for(let k=0;k<3;k++){ x+=(r()-.5)*14; y+=r()*8; g.lineTo(x,y); } g.stroke(); }
      for(let i=0;i<6;i++){ g.fillStyle='rgba(130,150,90,.18)'; g.beginPath(); g.ellipse(r()*P,r()*P,2+r()*3,1.5+r()*2,0,0,Math.PI*2); g.fill(); }
      break; }
    case 'snow': {
      for(let i=0;i<40;i++){ g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(r()*P,r()*P,1,1); }
      for(let i=0;i<6;i++){ g.fillStyle='rgba(150,170,200,.12)'; g.beginPath(); g.ellipse(r()*P,r()*P,8+r()*10,2+r()*3,0,0,Math.PI*2); g.fill(); }
      break; }
    case 'water': {
      /* ripples: soft troughs and bright crests, broken into short arcs */
      for(let i=0;i<70;i++){ const x=r()*P, y=r()*P, w=10+r()*26, k=r();
        wrap(()=>{ g.strokeStyle=k<.45?'rgba(0,18,40,.16)':(k<.9?'rgba(255,255,255,.1)':'rgba(255,255,255,.22)'); g.lineWidth=k<.45?2:1.2;
          g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+w/2,y-2.5,x+w,y); g.stroke(); }); }
      break; }
  }
  return cv;
}

function patternFor(ctx,kind,color){
  const key=kind+'|'+color;
  let e=cache.get(key);
  if(!e){ if(cache.size>600) cache.clear(); const cv=paint(kind,color); const p=ctx.createPattern(cv,'repeat'); e={p,f:-1}; cache.set(key,e); }
  if(e.f!==frame){ const w=kind==='water', k=1/cacheDpr;
    /* a river running down turns its ripples to lie along the current */
    const m=w&&flowDown?[0,k,-k,0,offX+flowX,offY+flowY]:[k,0,0,k,offX+(w?flowX:0),offY+(w?flowY:0)];
    try{ e.p.setTransform(new DOMMatrix(m)); }catch(err){} e.f=frame; }
  return e.p;
}


/* ============================== trees ==============================
   Each kind of tree is painted once per variety (a few shapes per kind and colour) into
   its own canvas — a tapered trunk with bark and branches, a crown built of many leaf
   clusters lit from the upper left with shade beneath, fruit or blossom — and then laid
   down with a soft shadow and a gentle sway. */
const treeCache=new Map();
function mixRGB(a,b,k){ const A=rgbOf(a), B=rgbOf(b); return `rgb(${A[0]+(B[0]-A[0])*k|0},${A[1]+(B[1]-A[1])*k|0},${A[2]+(B[2]-A[2])*k|0})`; }
function paintTree(kind,H,col,opt,seed){
  const d=cacheDpr||((typeof DPR!=='undefined')?DPR:1);
  const W=Math.ceil(H*(kind==='palm'?1.25:1.05)), HH=Math.ceil(H*1.08);
  const cv=document.createElement('canvas'); cv.width=Math.ceil(W*d); cv.height=Math.ceil(HH*d);
  const g=cv.getContext('2d'); g.scale(d,d); g.translate(W/2,HH-1);
  const r=rnd(seed*7919+H*13+kind.length);
  const bark='#5a4026', barkD='#3a2816', barkL='#7a5a38';
  const leafD=mixRGB(col,'#0a1206',.45), leafM=col, leafL=mixRGB(col,'#e8f0a0',.2), leafH=mixRGB(col,'#fffbe0',.34);
  const trunk=(h0,w0,w1,lean)=>{
    const top=-h0;
    g.fillStyle=(()=>{ const gr=g.createLinearGradient(-w0,0,w0,0); gr.addColorStop(0,barkL); gr.addColorStop(.45,bark); gr.addColorStop(1,barkD); return gr; })();
    g.beginPath(); g.moveTo(-w0*1.5,0); g.quadraticCurveTo(-w0*.8,-h0*.12,-w0*.9,-h0*.25);
    g.quadraticCurveTo(-w1+lean*.5,-h0*.6,-w1+lean,top); g.lineTo(w1+lean,top); g.quadraticCurveTo(w1+lean*.5,-h0*.6,w0*.9,-h0*.25);
    g.quadraticCurveTo(w0*.8,-h0*.12,w0*1.5,0); g.closePath(); g.fill();
    g.strokeStyle='rgba(20,12,4,.35)'; g.lineWidth=Math.max(.6,H*.006);
    for(let i=0;i<5;i++){ const xx=(r()-.5)*w0*1.4; g.beginPath(); g.moveTo(xx,-h0*r()*.2); g.quadraticCurveTo(xx+(r()-.5)*w0*.4,-h0*.5,xx*.6+lean*.7,-h0*(.7+r()*.3)); g.stroke(); }
  };
  const blob=(cx,cy,rc,tone)=>{
    const c1=mixRGB(leafD,leafM,Math.min(1,tone*1.6)), c2=tone>.55?mixRGB(leafM,leafL,(tone-.55)*2.2):c1;
    for(let k=0;k<7;k++){ const a=r()*6.283, dd=rc*(.15+r()*.5), rr=rc*(.42+r()*.3);
      g.fillStyle=k<3?c1:c2; g.beginPath(); g.arc(cx+Math.cos(a)*dd,cy+Math.sin(a)*dd*.8,rr,0,6.283); g.fill(); }
    /* light on the upper left of each cluster */
    g.fillStyle=mixRGB(c2,leafH,.35); g.globalAlpha=.55;
    for(let k=0;k<3;k++){ g.beginPath(); g.arc(cx-rc*(.25+r()*.2),cy-rc*(.3+r()*.2),rc*(.22+r()*.12),0,6.283); g.fill(); }
    g.globalAlpha=1;
    /* the leaves themselves */
    for(let k=0;k<Math.round(rc*1.4);k++){ const a=r()*6.283, dd=rc*Math.sqrt(r())*.95; const px=cx+Math.cos(a)*dd, py=cy+Math.sin(a)*dd*.85;
      g.fillStyle=r()<.55?leafD:(py<cy?leafH:leafL); g.globalAlpha=.45; g.beginPath(); g.ellipse(px,py,Math.max(.7,H*.009),Math.max(.5,H*.006),r()*3,0,6.283); g.fill(); }
    g.globalAlpha=1;
  };
  if(kind==='palm'){
    const h0=H*.8, lean=(r()-.5)*H*.16;
    g.strokeStyle=barkD; g.lineCap='round';
    const tx=lean, ty=-h0;
    const seg=14; for(let i=0;i<seg;i++){ const k0=i/seg, k1=(i+1)/seg; const x0=lean*k0*k0, y0=-h0*k0, x1=lean*k1*k1, y1=-h0*k1, w=H*(.05-.018*k0);
      g.fillStyle=i%2?bark:barkL; g.beginPath(); g.moveTo(x0-w,y0); g.lineTo(x1-w*.95,y1); g.lineTo(x1+w*.95,y1); g.lineTo(x0+w,y0); g.closePath(); g.fill();
      g.strokeStyle='rgba(20,12,4,.45)'; g.lineWidth=Math.max(.6,H*.006); g.beginPath(); g.moveTo(x1-w*.95,y1); g.quadraticCurveTo(x1,y1+H*.01,x1+w*.95,y1); g.stroke(); }
    if(opt.fruit!==false){ g.fillStyle=opt.fruit||'#b8702a'; for(let i=0;i<9;i++){ g.beginPath(); g.arc(tx+(r()-.5)*H*.08,ty+H*.03+r()*H*.05,H*.013,0,6.283); g.fill(); } }
    const fr=10;
    for(let i=0;i<fr;i++){
      const a=-Math.PI/2+(i/(fr-1)-.5)*Math.PI*1.25+(r()-.5)*.15, len=H*(.34+r()*.1), droop=H*(.12+r()*.1);
      const ex=tx+Math.cos(a)*len, ey=ty+Math.sin(a)*len*.55+droop, mx=tx+Math.cos(a)*len*.55, my=ty+Math.sin(a)*len*.45-H*.03;
      const back=Math.sin(a)<-.6, tone=back?leafD:(Math.cos(a)<0?leafL:leafM);
      g.strokeStyle=tone; g.lineWidth=Math.max(.8,H*.012); g.beginPath(); g.moveTo(tx,ty); g.quadraticCurveTo(mx,my,ex,ey); g.stroke();
      for(let k=1;k<18;k++){ const q=k/18, bx=(1-q)*(1-q)*tx+2*(1-q)*q*mx+q*q*ex, by=(1-q)*(1-q)*ty+2*(1-q)*q*my+q*q*ey;
        const dx=2*(1-q)*(mx-tx)+2*q*(ex-mx), dy=2*(1-q)*(my-ty)+2*q*(ey-my), L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L, ll=H*.075*(1-q*.7);
        g.lineWidth=Math.max(.6,H*.006);
        for(const sd of[-1,1]){ g.beginPath(); g.moveTo(bx,by); g.lineTo(bx+(nx*sd+dx/L*.5)*ll,by+(ny*sd+dy/L*.5)*ll+ll*.5); g.stroke(); } }
    }
  } else if(kind==='dead'){
    trunk(H*.5,H*.07,H*.035,0);
    const branch=(x,y,a,len,w,depth)=>{ if(depth>4||len<H*.03) return; const ex=x+Math.cos(a)*len, ey=y+Math.sin(a)*len;
      g.strokeStyle=depth<2?bark:barkD; g.lineWidth=Math.max(.6,w); g.lineCap='round'; g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo((x+ex)/2+(r()-.5)*len*.3,(y+ey)/2,ex,ey); g.stroke();
      const n=depth<1?3:2; for(let i=0;i<n;i++) branch(ex,ey,a+(r()-.5)*1.3,len*(.55+r()*.2),w*.62,depth+1); };
    for(let i=0;i<3;i++) branch(0,-H*.48,-Math.PI/2+(i-1)*.6+(r()-.5)*.3,H*.22,H*.03,0);
  } else {
    const bush=kind==='bush';
    const cy=bush?-H*.45:-H*.64, Rx=bush?H*.56:H*.5, Ry=bush?H*.42:H*.36;
    if(!bush){ const lean=(r()-.5)*H*.06; trunk(H*.44,H*.055,H*.03,lean);
      g.strokeStyle=bark; g.lineCap='round';
      for(let i=0;i<4;i++){ const a=-Math.PI/2+(i-1.5)*.55+(r()-.5)*.2; g.lineWidth=H*.02; g.beginPath(); g.moveTo(lean,-H*.42); g.quadraticCurveTo(lean+Math.cos(a)*H*.12,-H*.5+Math.sin(a)*H*.06,Math.cos(a)*H*.25,cy+Math.sin(a)*H*.18); g.stroke(); } }
    /* the shade within the crown, then the clusters from the back and top to the front */
    g.fillStyle=leafD; g.beginPath(); g.ellipse(0,cy+Ry*.12,Rx*.92,Ry*.88,0,0,6.283); g.fill();
    const n=bush?14:36, cl=[];
    for(let i=0;i<n;i++){ const a=r()*6.283, dd=Math.sqrt(r()); const x=Math.cos(a)*dd*Rx*.82, y=cy+Math.sin(a)*dd*Ry*.8; cl.push([x,y,H*(bush?.15:.11)+r()*H*(bush?.1:.07)]); }
    cl.sort((A,B)=>A[1]-B[1]);
    for(const [x,y,rc] of cl){ const tone=Math.max(0,Math.min(1,.62-(x/Rx)*.35-((y-cy)/Ry)*.42)); blob(x,y,rc,tone); }
    if(opt.fruit){ g.fillStyle=opt.fruit; for(let i=0;i<(bush?7:20);i++){ const a=r()*6.283, dd=Math.sqrt(r())*.8; const fx=Math.cos(a)*dd*Rx, fy=cy+Math.sin(a)*dd*Ry+Ry*.1;
      g.beginPath(); g.arc(fx,fy,Math.max(1.6,H*.022),0,6.283); g.fill(); g.fillStyle='rgba(255,255,255,.35)'; g.beginPath(); g.arc(fx-H*.005,fy-H*.005,Math.max(.5,H*.006),0,6.283); g.fill(); g.fillStyle=opt.fruit; } }
    if(opt.bloom){ for(let i=0;i<40;i++){ const a=r()*6.283, dd=Math.sqrt(r()); g.fillStyle=r()<.7?'rgba(252,240,246,.95)':'rgba(240,190,210,.9)';
      g.beginPath(); g.arc(Math.cos(a)*dd*Rx*.9,cy+Math.sin(a)*dd*Ry*.85,Math.max(.8,H*.01),0,6.283); g.fill(); } }
    if(!bush){ const gr=g.createRadialGradient(0,cy+Ry*.8,0,0,cy+Ry*.8,Rx*.5); gr.addColorStop(0,'rgba(10,14,6,.35)'); gr.addColorStop(1,'rgba(10,14,6,0)'); g.fillStyle=gr; g.fillRect(-Rx,cy,Rx*2,Ry*1.4); }
  }
  return {cv,W,HH};
}
function drawTree(g,x,y,H,kind,opt,t,seed){
  opt=opt||{}; H=Math.max(6,H); const col=opt.col||'#4a6a30';
  const variant=Math.abs(seed|0)%5, Hq=Math.round(H/2)*2;
  const key=[kind,col,opt.fruit||'',opt.bloom?1:0,variant,Hq,cacheDpr||1].join('|');
  let e=treeCache.get(key); if(!e){ if(treeCache.size>400) treeCache.clear(); e=paintTree(kind,Hq,col,opt,variant+1); treeCache.set(key,e); }
  /* shadow on the ground, cast toward the lower right */
  const sw=kind==='bush'?H*.5:(kind==='palm'?H*.32:H*.4);
  const sg=g.createRadialGradient(x+sw*.25,y+sw*.06,0,x+sw*.25,y+sw*.06,sw);
  sg.addColorStop(0,'rgba(8,10,4,.34)'); sg.addColorStop(1,'rgba(8,10,4,0)');
  g.fillStyle=sg; g.beginPath(); g.ellipse(x+sw*.25,y+sw*.06,sw,sw*.34,0,0,6.283); g.fill();
  const sway=kind==='dead'?0:Math.sin((t||0)/1500+seed)*(kind==='palm'?.035:.018);
  g.save(); g.translate(x,y); g.transform(1,0,sway,1,0,0);
  g.drawImage(e.cv,-e.W/2,-e.HH+1,e.W,e.HH); g.restore();
}
GFX.tree=(g,x,y,H,opt,t)=>drawTree(g,x,y,H,opt&&opt.dead?'dead':'broad',opt,t,(opt&&opt.seed)||Math.round(x*7+y*3));
GFX.palm=(g,x,y,H,opt,t)=>drawTree(g,x,y,H,'palm',opt,t,(opt&&opt.seed)||Math.round(x*7+y*3));
GFX.bush=(g,x,y,H,opt,t)=>drawTree(g,x,y,H,'bush',opt,t,(opt&&opt.seed)||Math.round(x*7+y*3));

/* the game's own trees, palms and bushes are drawn this way too */
if(typeof drawProp==='function'){
  const _drawProp=drawProp;
  window.drawProp=function(g,px,py,p,t){
    if(!GFX.on||!p) return _drawProp(g,px,py,p,t);
    const ty=p.type;
    if(ty!=='tree'&&ty!=='palm'&&ty!=='bush'&&ty!=='treeLife'&&ty!=='treeKnow') return _drawProp(g,px,py,p,t);
    const u=2.6*(TILE/40)*((typeof PROP_SCALE!=='undefined'&&PROP_SCALE[ty])||1);
    const seed=Math.round((p.x||0)*31+(p.y||0)*17);
    if(ty==='tree') drawTree(g,px,py,26*u,p.dead?'dead':'broad',{col:p.col||'#3f7032',fruit:p.fruit},t,seed);
    else if(ty==='palm') drawTree(g,px,py,19*u,'palm',{col:p.col||'#4e7a3e'},t,seed);
    else if(ty==='bush') drawTree(g,px,py,8.5*u,'bush',{col:p.col||'#4e7a3e',fruit:p.berry?'#c8584a':null},t,seed);
    else if(ty==='treeLife'){ const pulse=.5+Math.sin(t/600)*.5; const gl=g.createRadialGradient(px,py-14*u,2*u,px,py-14*u,24*u);
      gl.addColorStop(0,`rgba(255,235,150,${.4+pulse*.2})`); gl.addColorStop(1,'rgba(255,235,150,0)'); g.fillStyle=gl; g.beginPath(); g.arc(px,py-14*u,24*u,0,Math.PI*2); g.fill();
      drawTree(g,px,py,30*u,'broad',{col:'#6fa04a',fruit:'#ffe070'},t,seed); }
    else drawTree(g,px,py,28*u,'broad',{col:'#4f6e3a',fruit:'#c84a3a'},t,seed);
  };
}
let curCtx=null;
let flowX=0, flowY=0, flowDown=false;
function mapFlow(map){
  if(map._gfxFlow) return map._gfxFlow;
  /* which way the water runs: a river is long one way and narrow the other and does not
     lie along the map's side (that is a shore); a lake or the sea only drifts */
  const W=map.w, H=map.h, isW=(x,y)=>KIND[map.tiles[y*W+x]]==='water';
  let n=0, hs=0, vs=0, eL=0, eR=0, eT=0, eB=0;
  for(let y=0;y<H;y++){ let r=0; for(let x=0;x<=W;x++){ if(x<W&&isW(x,y)){ r++; n++; } else if(r){ hs+=r*r; r=0; } } }
  for(let x=0;x<W;x++){ let r=0; for(let y=0;y<=H;y++){ if(y<H&&isW(x,y)) r++; else if(r){ vs+=r*r; r=0; } } }
  for(let y=0;y<H;y++){ if(isW(0,y)) eL++; if(isW(W-1,y)) eR++; }
  for(let x=0;x<W;x++){ if(isW(x,0)) eT++; if(isW(x,H-1)) eB++; }
  const hr=n?hs/n:0, vr=n?vs/n:0;           /* tile-weighted mean run across and down */
  let f;
  if(!n) f=[0,0,0];
  else if(W*H>12000) f=[.8,.45,7];                               /* the whole land: seas and rivers together */
  else if(vr>hr*1.8&&eL<H*.25&&eR<H*.25) f=[0,1,22];            /* a river running down */
  else if(hr>vr*1.8&&eT<W*.25&&eB<W*.25) f=[1,0,22];            /* a river running across */
  else f=[.8,.45,7];                                              /* a lake or the sea: a slow drift */
  return (map._gfxFlow=f);
}
let glint=null;
function glintPattern(ctx){
  if(glint&&glint.d===cacheDpr) return glint.p;
  const d=cacheDpr, S=Math.round(P*d), cv=document.createElement('canvas'); cv.width=S; cv.height=S; const g=cv.getContext('2d'); g.scale(d,d);
  const r=rnd(4242);
  for(let i=0;i<46;i++){ const x=r()*P, y=r()*P, w=3+r()*9; g.strokeStyle='rgba(255,255,255,'+(.25+r()*.45).toFixed(2)+')'; g.lineWidth=1+r()*.8; g.beginPath(); g.moveTo(x,y); g.lineTo(x+w,y); g.stroke(); }
  for(let i=0;i<30;i++){ g.fillStyle='rgba(255,255,240,.8)'; g.fillRect(r()*P,r()*P,1.5,1.5); }
  glint={d,p:ctx.createPattern(cv,'repeat')}; return glint.p;
}
function waterGlints(){
  const map=curMap, g=curCtx; if(!map||!g) return;
  const f=mapFlow(map); if(!f[2]) return;
  const TL=TILE, sec=curT/1000;
  const x0=Math.max(0,Math.floor((Camera.x-VW/2)/TL)-1), x1=Math.min(map.w-1,Math.ceil((Camera.x+VW/2)/TL)+1);
  const y0=Math.max(0,Math.floor((Camera.y-VH/2)/TL)-1), y1=Math.min(map.h-1,Math.ceil((Camera.y+VH/2)/TL)+1);
  const p=glintPattern(g);
  const k=1/cacheDpr, gx=offX+f[0]*sec*f[2]*1.8+Math.sin(sec*.9)*4, gy=offY+f[1]*sec*f[2]*1.8+Math.cos(sec*.7)*3;
  try{ p.setTransform(new DOMMatrix(f[1]===1?[0,k,-k,0,gx,gy]:[k,0,0,k,gx,gy])); }catch(e){}
  g.save(); g.globalAlpha=.55+Math.sin(sec*1.7)*.15; g.fillStyle=p;
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ if(KIND[map.tiles[y*map.w+x]]!=='water') continue; g.fillRect(x*TL+offX,y*TL+offY,TL+1,TL+1); }
  g.restore();
  /* foam lapping at the banks: a broken line that comes and goes along each shore */
  const isW=(x,y)=>x<0||y<0||x>=map.w||y>=map.h||KIND[map.tiles[y*map.w+x]]==='water';
  g.save(); g.strokeStyle='rgba(240,248,250,.7)'; g.lineCap='round';
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    if(KIND[map.tiles[y*map.w+x]]!=='water') continue;
    for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
      if(isW(x+dx,y+dy)) continue;
      const ph=sec*1.3+(x*1.7+y*2.3), k=Math.sin(ph); if(k<-.2) continue;
      const lap=3+k*3;                                      /* the wash comes in and draws back */
      g.globalAlpha=.25+.35*(k+.2)/1.2; g.lineWidth=1.4;
      const X=x*TL+offX, Y=y*TL+offY;
      g.beginPath();
      for(let s2=0;s2<=4;s2++){ const a=s2/4*TL, w=Math.sin(a*.35+ph*2)*1.4;
        const px=dx>0?X+TL-lap+w:dx<0?X+lap+w:X+a, py=dy>0?Y+TL-lap+w:dy<0?Y+lap+w:Y+a;
        s2?g.lineTo(px,py):g.moveTo(px,py); }
      g.stroke();
    }
  }
  g.restore();
}
const _tileColor=tileColor;
window.tileColor=function(map,id,x,y){
  if(!GFX.on||!curCtx||GFX.noTex) return _tileColor(map,id,x,y);
  const kind=KIND[id]; if(!kind) return _tileColor(map,id,x,y);
  /* one colour per kind of ground (the texture carries the variation), so no chequerboard */
  const bk=map._gfxBase||(map._gfxBase={});
  let c=bk[id];
  if(!c){ if(kind==='grass'){ const a1=rgbOf(_tileColor(map,T.GRASS,5,7)), a2=rgbOf(_tileColor(map,T.GRASS2,5,7)); c=`rgb(${(a1[0]+a2[0])/2|0},${(a1[1]+a2[1])/2|0},${(a1[2]+a2[2])/2|0})`; }
    else c=_tileColor(map,id,5,7); bk[id]=c; }
  return patternFor(curCtx,kind,c);
};


/* soften the edges between kinds of ground: once the tiles are down and before anything
   stands on them, lay irregular tongues of each ground across its borders */
const SOFT={grass:1,path:1,sand:1,dirt:1,mud:1,snow:1,rock:0};
let blendDone=-1, curMap=null, curT=0;
function blendEdges(){
  if(blendDone===frame||!curCtx||!curMap||curMap.elev||GFX.noBlend) return; blendDone=frame;   /* stepped maps paint ground and figures row by row */
  const map=curMap, TL=TILE;
  /* the tongues for the whole map are painted once into a layer, then laid down each frame */
  let L=map._gfxBlend;
  if(L===undefined){
    L=null;
    const W=map.w*TL, H=map.h*TL;
    if(W*H<=9e6){
      const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const g=cv.getContext('2d');
      const kindAt=(x,y)=>KIND[map.tiles[y*map.w+x]];
      const pats={};
      const pat=(id,x,y)=>{ const k=KIND[id]; const bk=map._gfxBase||(map._gfxBase={}); let c=bk[id];
        if(!c){ window.tileColor(map,id,x,y); c=bk[id]; }
        const key=k+'|'+c; if(!pats[key]){ const src=paint(k,c); const p=g.createPattern(src,'repeat'); try{ p.setTransform(new DOMMatrix([1/cacheDpr,0,0,1/cacheDpr,0,0])); }catch(e){} pats[key]=p; } return pats[key]; };
      const lip=curWorld&&curWorld.overlook?curWorld.overlook.cliffY:-1;
      let any=false;
      for(let y=0;y<map.h-1;y++) for(let x=0;x<map.w-1;x++){
        if(y<=lip) continue;
        const k=kindAt(x,y); if(!SOFT[k]) continue;
        for(const [dx,dy] of [[1,0],[0,1]]){
          const k2=kindAt(x+dx,y+dy); if(!SOFT[k2]||k2===k) continue;
          const pa=pat(map.tiles[y*map.w+x],x,y), pb=pat(map.tiles[(y+dy)*map.w+x+dx],x+dx,y+dy);
          const ex=(x+dx)*TL, ey=(y+dy)*TL, r=rnd(x*7919+y*104729+dx*31);
          for(let i=0;i<4;i++){
            const along=(i+.2+r()*.6)/4*TL, side=r()<.5?-1:1, reach=4+r()*10, rad=5+r()*8;
            const bx=dx?ex+side*reach:x*TL+along, by=dx?y*TL+along:ey+side*reach;
            g.fillStyle=side<0?pb:pa; g.beginPath(); g.ellipse(bx,by,rad*(dx?.9:1.5),rad*(dx?1.5:.9),0,0,Math.PI*2); g.fill(); any=true;
          }
        }
      }
      /* water: the deep and the shallows run into each other, the bank is damp and the
         shallows pale where they meet it */
      const base=(id,x,y)=>{ const bk=map._gfxBase||(map._gfxBase={}); if(!bk[id]) window.tileColor(map,id,x,y); return bk[id]; };
      const rgba=(c,a)=>{ const k=rgbOf(c); return `rgba(${k[0]},${k[1]},${k[2]},${a})`; };
      const blob=(x,y,rad,c,a)=>{ const gr=g.createRadialGradient(x,y,0,x,y,rad); gr.addColorStop(0,rgba(c,a)); gr.addColorStop(1,rgba(c,0)); g.fillStyle=gr; g.fillRect(x-rad,y-rad,rad*2,rad*2); };
      for(let y=0;y<map.h;y++) for(let x=0;x<map.w;x++){
        if(y<=lip) continue;
        const id=map.tiles[y*map.w+x]; if(KIND[id]!=='water') continue;
        for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
          const xx=x+dx, yy=y+dy; if(xx<0||yy<0||xx>=map.w||yy>=map.h) continue;
          const id2=map.tiles[yy*map.w+xx], k2=KIND[id2]; if(id2===id) continue;
          const r=rnd(x*6151+y*92821+dx*17+dy*29);
          const ex=dx>0?(x+1)*TL:dx<0?x*TL:null, ey=dy>0?(y+1)*TL:dy<0?y*TL:null;
          if(k2==='water'){ if(dx<0||dy<0) continue;                      /* deep and shallow: blur the step */
            const c=mixRGB(base(id,x,y),base(id2,xx,yy),.5);
            for(let i=0;i<3;i++){ const along=(i+.2+r()*.6)/3*TL, bx=ex!==null?ex+(r()-.5)*8:x*TL+along, by=ey!==null?ey+(r()-.5)*8:y*TL+along; blob(bx,by,14+r()*10,c,.55); }
            any=true; continue; }
          if(!SOFT[k2]&&k2!=='rock') continue;
          const land=base(id2,xx,yy), wat=base(id,x,y);
          for(let i=0;i<3;i++){ const along=(i+.2+r()*.6)/3*TL;
            const bx=ex!==null?ex:x*TL+along, by=ey!==null?ey:y*TL+along;
            if(k2!=='rock') blob(bx+dx*(6+r()*4),by+dy*(6+r()*4),11+r()*7,tone(land,-.3),.5);     /* damp bank */
            blob(bx-dx*(5+r()*4),by-dy*(5+r()*4),10+r()*6,tone(wat,.35),.4); }                  /* pale shallows */
          any=true;
        }
      }
      L=any?cv:null;
    }
    map._gfxBlend=L;
  }
  if(L){ const g=curCtx; g.save(); g.imageSmoothingEnabled=false;
  const sx=Math.max(0,-offX), sy=Math.max(0,-offY), sw=Math.min(L.width-sx,VW-Math.max(0,offX)), sh=Math.min(L.height-sy,VH-Math.max(0,offY));
  if(sw>0&&sh>0) g.drawImage(L,sx,sy,sw,sh,sx+offX,sy+offY,sw,sh);
  g.restore(); }
  waterGlints();
}
let curWorld=null;
function hookDecor(map){
  if(!map||!map.decor||map.decor.__gfx) return;
  const arr=map.decor;
  const it=Array.prototype[Symbol.iterator];
  Object.defineProperty(arr,Symbol.iterator,{configurable:true,value:function(){ if(curCtx) blendEdges(); return it.call(this); }});
  Object.defineProperty(arr,'__gfx',{value:true});
}
const _drawWorld=drawWorld;
window.drawWorld=function(g,world,t){
  if(!GFX.on) return _drawWorld(g,world,t);
  const d=typeof DPR!=='undefined'?DPR:1;
  if(d!==cacheDpr){ cache.clear(); cacheDpr=d; }
  frame++;
  offX=VW/2-Camera.x+(Camera.shake?Math.sin(t/30)*Camera.shake:0)+(Camera.sway?Math.sin(t/1900)*Camera.sway:0);
  offY=VH/2-Camera.y+(Camera.shake?Math.cos(t/36)*Camera.shake*.7:0)+(Camera.sway?Math.sin(t/2600+1)*Camera.sway*.45:0);
  curCtx=g; curMap=world&&world.map; curWorld=world; curT=t; if(curMap) hookDecor(curMap);
  if(curMap){ const f=mapFlow(curMap); flowX=f[0]*t/1000*f[2]; flowY=f[1]*t/1000*f[2]; flowDown=f[1]===1; }
  try{ _drawWorld(g,world,t); } finally { curCtx=null; curMap=null; curWorld=null; }
  if(!GFX.noLight) light(g,world,t);
};

/* the light over the finished frame */
function light(g,world,t){
  const sc=(typeof Game!=='undefined'&&Game.chapter&&Game.chapter.scene)||{};
  const time=sc.time||'', interior=world&&world.map&&(world.map.biome==='interior'||/interior|house|tent|cave|palace|temple/.test(world.map.biome||''));
  g.save();
  /* a warm fall of light from the upper left, a cool shade toward the lower right */
  if(!interior&&time!=='night'){
    const lg=g.createLinearGradient(0,0,VW,VH);
    lg.addColorStop(0,time==='dusk'||time==='dawn'?'rgba(255,190,120,.12)':'rgba(255,246,220,.09)');
    lg.addColorStop(.55,'rgba(255,255,255,0)');
    lg.addColorStop(1,time==='dusk'?'rgba(60,30,70,.16)':'rgba(20,30,60,.1)');
    g.fillStyle=lg; g.fillRect(0,0,VW,VH);
  }
  if(interior){ const rg=g.createRadialGradient(VW/2,VH*.45,VH*.2,VW/2,VH*.5,VW*.7); rg.addColorStop(0,'rgba(255,190,110,.06)'); rg.addColorStop(1,'rgba(20,10,0,.32)'); g.fillStyle=rg; g.fillRect(0,0,VW,VH); }
  /* vignette */
  const vg=g.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.42,VW/2,VH/2,Math.max(VW,VH)*.75);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,time==='night'?'rgba(0,0,10,.5)':'rgba(10,6,2,.3)');
  g.fillStyle=vg; g.fillRect(0,0,VW,VH);
  /* motes drifting in the light */
  if(!interior&&time!=='night'){ for(let i=0;i<18;i++){ const x=((i*197.3+t*.012*(1+i%3))%(VW+40))-20, y=((i*91.7+Math.sin(t/1700+i)*30+t*.005)%(VH+40))-20;
    g.fillStyle='rgba(255,248,220,'+(.12+.1*Math.sin(t/900+i)).toFixed(3)+')'; g.fillRect(x,y,2,2); } }
  if(time==='night'){ for(let i=0;i<10;i++){ const k=Math.sin(t/700+i*1.7); if(k<.4) continue; const x=(i*211+Math.sin(t/3000+i)*60)%VW, y=(i*137+Math.cos(t/2500+i)*40)%VH;
    g.fillStyle='rgba(220,240,140,'+((k-.4)*.9).toFixed(3)+')'; g.fillRect(x,y,2,2); } }
  g.restore();
}
})();
