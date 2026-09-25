/* gfx.js — richer ground and light for the Scripture Game world.

   Every ground tile keeps the colour the game gives it, but is painted with a texture
   for its kind — blades of grass, rippled sand, pebbled paths, paving with its joints,
   courses of brick, blocks of stone — laid in world space so it stays put as the camera
   moves and hides the square grid. Over the finished frame goes a soft light: a warm
   fall from the sky, a gentle vignette, and at night a cool dimming. Without this file
   the world is drawn exactly as before. */
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
      for(let i=0;i<9;i++){ const y=r()*P, x=r()*P, w=8+r()*16; g.strokeStyle=i%3?'rgba(255,255,255,.07)':'rgba(0,20,40,.12)'; g.lineWidth=1;
        g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+w/2,y-2,x+w,y); g.stroke(); }
      break; }
  }
  return cv;
}

function patternFor(ctx,kind,color){
  const key=kind+'|'+color;
  let e=cache.get(key);
  if(!e){ if(cache.size>600) cache.clear(); const cv=paint(kind,color); const p=ctx.createPattern(cv,'repeat'); e={p,f:-1}; cache.set(key,e); }
  if(e.f!==frame){ try{ e.p.setTransform(new DOMMatrix([1/cacheDpr,0,0,1/cacheDpr,offX,offY])); }catch(err){} e.f=frame; }
  return e.p;
}

let curCtx=null;
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
      L=any?cv:null;
    }
    map._gfxBlend=L;
  }
  if(!L) return;
  const g=curCtx; g.save(); g.imageSmoothingEnabled=false;
  const sx=Math.max(0,-offX), sy=Math.max(0,-offY), sw=Math.min(L.width-sx,VW-Math.max(0,offX)), sh=Math.min(L.height-sy,VH-Math.max(0,offY));
  if(sw>0&&sh>0) g.drawImage(L,sx,sy,sw,sh,sx+offX,sy+offY,sw,sh);
  g.restore();
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
