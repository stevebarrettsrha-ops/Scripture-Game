/* acts.js — people at their work, acted out, for every game.

   A map may set people at the work its verses tell of: a feature {type:'act', act:'…', x, y, char?, …}
   draws a worker (one of the book's own people) doing it, over and over, with the things of the work:

     mould   making bricks: kneeling at the wooden mould, pressing in the clay, the new bricks laid out to dry
     tread   treading the clay (and the straw) in its pit
     carry   carrying bricks from one place to another and coming back for more   (to:[dx,dy] in tiles)
     stack   stacking the dried bricks
     build   laying bricks, course on course, on a wall
     kiln    tending the brick kiln: the fire, the smoke, the bricks stacked by it
     gather  gathering stubble for straw, bending to pick it up, a bundle under the arm   (grain:true for gleaning)
     beat    a taskmaster striking a worker bowed under him   (master: the taskmaster's character)
     dig     digging with the mattock, the earth thrown up beside the pit
             (water:true — a well where water rises; grave:true — a grave; ditch:true — a long trench)
     draw    drawing water at a well with a jar on its rope, and pouring it into the trough
             (nowell:true — at a well already standing a little to its right; notrough:true — no trough of its own)
     water   pouring water into the trough for the flock, the sheep drinking   (no sheep:false)
     pour    pouring water out on the ground   (oil:true — oil poured into vessels)
     reap    reaping the grain with the sickle, the sheaves laid by
     thresh  beating out the grain on the threshing-floor
     winnow  tossing the threshed grain with the fork, the chaff blowing away
     grind   grinding at the millstone, the flour falling
     potter  at the wheel: the clay rising into a vessel, spoiled in his hand and made again
     hew     cutting wood with the axe, the chips flying
     plant   kneeling to plant, the sapling rising
     raise   the staff or the hand lifted high, stretched out
     bless   the hands lifted over those blessed
     read    reading a scroll aloud;  write  kneeling to write on it
     blow    sounding the ram's horn or the trumpet
     proclaim crying aloud with arms spread
     throw   casting a stone or the lot
     eat     eating bread
     strike  striking with the rod or staff
     offer   lifting up an offering
     weep    weeping, the tears running
     pray    on the knees in prayer

   Nothing here stands in anyone's way (an act feature is not solid unless it says so). Without this file
   the games play as before. */
(function(){
'use strict';
if(typeof drawProp!=='function'||typeof drawChar!=='function'||typeof TILE==='undefined'||typeof CHARS==='undefined') return;

const WORKERS=['hebrew','hebrew2','builder','builder2','builder3','servant','shepherd','farmer','man','villager','soldier'];
const MASTERS=['taskmaster','egyptian','overseer','soldier','guard'];
const WOMEN=['hebreww','woman','maid','riveqah','rachel','ruth'];
const who=(c,alts)=>{ if(c&&CHARS[c]) return c; for(const a of alts) if(CHARS[a]) return a;
  return Object.keys(CHARS).find(k=>{ const v=CHARS[k]; return v&&v.name&&!v.angel&&!v.serpent&&!v.dragon&&!v.child&&k!=='narrator'&&k!=='voice'; }); };
const hsh=(a,b)=>{ let h=(a*374761393+b*668265263)|0; h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; };

function act(g,p,t){
  const TL=TILE, a=p.act, seed=Math.round((p.x||0)*13+(p.y||0)*7), T=(t||0)+seed*137;
  const W=who(p.char,a==='draw'||a==='grind'||a==='water'?WOMEN.concat(WORKERS):WORKERS);
  const person=(x,y,o,ch)=>drawChar(g,x,y,ch||W,Object.assign({t:T},o||{}));
  /* a worker sunk behind what is before him (kneeling, stooping, standing in a pit): what is below the line is hidden */
  const low=(x,y,depth,o,ch)=>{ g.save(); g.beginPath(); g.rect(x-TL*3,y-TL*5,TL*6,TL*5); g.clip(); person(x,y+depth,o,ch); g.restore(); };
  const brick=(x,y,s,col)=>{ s=(s||1)*1.3; g.fillStyle='#5a3418'; g.fillRect(x-TL*.15*s,y-TL*.08*s,TL*.3*s,TL*.16*s);
    g.fillStyle=col||'#b9824c'; g.fillRect(x-TL*.13*s,y-TL*.065*s,TL*.26*s,TL*.125*s);
    g.fillStyle='rgba(255,230,180,.35)'; g.fillRect(x-TL*.13*s,y-TL*.065*s,TL*.26*s,TL*.035*s); };
  const shadow=(x,y,rx)=>{ g.fillStyle='rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x,y+1,rx,rx*.32,0,0,Math.PI*2); g.fill(); };
  const stick=(x0,y0,x1,y1,w,col)=>{ g.strokeStyle=col||'#6e4e2a'; g.lineWidth=w||TL*.07; g.lineCap='round'; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); g.lineCap='butt'; };
  const handsY=y=>y-TL*.62;
  const cyc=(per,off)=>(((T+(off||0))%per)+per)%per/per;
  const x=0, y=0;
  switch(a){
    case 'mould': {
      const f=cyc(1700), press=f<.35?Math.sin(f/.35*Math.PI):0;
      g.fillStyle='#7a5a3a'; g.beginPath(); g.ellipse(x-TL*.85,y-TL*.05,TL*.42,TL*.22,0,0,Math.PI*2); g.fill();      /* the heap of clay */
      g.fillStyle='#8a6a48'; g.beginPath(); g.ellipse(x-TL*.9,y-TL*.14,TL*.28,TL*.13,0,0,Math.PI*2); g.fill();
      const n=2+Math.floor(cyc(1700*8)*8);                                                                       /* the bricks laid out to dry */
      for(let i=0;i<n;i++){ const bx=x+TL*(.65+(i%4)*.34), by=y+TL*(.05+Math.floor(i/4)*.24); brick(bx,by,1,i===n-1&&f<.5?'#8f5f36':'#c08a52'); }
      low(x,y+TL*.02,TL*.42+press*TL*.08,{dir:'right'});
      g.fillStyle='#5d4426'; g.fillRect(x+TL*.05,y-TL*.16,TL*.42,TL*.2); g.fillStyle='#3a2a18'; g.fillRect(x+TL*.08,y-TL*.13,TL*.36,TL*.14);   /* the mould */
      g.fillStyle=f<.55?'#8f5f36':'#3a2a18'; g.fillRect(x+TL*.09,y-TL*.12,TL*.16,TL*.12); g.fillRect(x+TL*.27,y-TL*.12,TL*.16,TL*.12);
      g.fillStyle='#5d4426'; g.fillRect(x+TL*.25,y-TL*.16,TL*.02,TL*.2);
      break; }
    case 'tread': {
      g.fillStyle='#5e4228'; g.beginPath(); g.ellipse(x,y,TL*.75,TL*.3,0,0,Math.PI*2); g.fill();
      g.fillStyle='#7a5636'; g.beginPath(); g.ellipse(x,y+TL*.02,TL*.65,TL*.24,0,0,Math.PI*2); g.fill();
      g.strokeStyle='rgba(220,190,110,.8)'; g.lineWidth=1.2;                                                     /* the straw in the clay */
      for(let i=0;i<10;i++){ const sx=x+(hsh(seed,i)-.5)*TL*1.1, sy=y+(hsh(i,seed)-.5)*TL*.36; g.beginPath(); g.moveTo(sx,sy); g.lineTo(sx+TL*.12,sy-TL*.03); g.stroke(); }
      const step=Math.abs(Math.sin(T/260));
      low(x,y-TL*.04,TL*.3+step*TL*.06,{dir:cyc(5000)<.5?'left':'right',moving:true});
      if(step>.95){ g.fillStyle='rgba(120,86,54,.7)'; for(let i=0;i<3;i++) g.fillRect(x+(i-1)*TL*.18,y-TL*.12-i*2,3,3); }
      break; }
    case 'carry': case 'carrywater': {
      const to=p.to||[3,0], dx=to[0]*TL, dy=to[1]*TL, f=cyc(p.period||8000), go=f<.5, k=go?f*2:2-f*2;
      const e=k<.08||k>.92?(k<.08?0:1):(k-.08)/.84, px=x+dx*e, py=y+dy*e, moving=k>.08&&k<.92;
      const dir=Math.abs(dx)>=Math.abs(dy)?((go?dx:-dx)>=0?'right':'left'):((go?dy:-dy)>=0?'down':'up');
      if(a==='carry'){ for(let i=0;i<4;i++) brick(x+dx+TL*.45,y+dy+TL*(.05-i*.11),1,'#c08a52');                   /* the stack at the end */
        for(let i=0;i<5;i++) brick(x-TL*.45+(i%2)*TL*.05,y+TL*(.05-i*.11)); }                                    /* and the stack at the start */
      person(px,py,{dir,moving});
      if(go&&moving||go&&k<.08){ const sy=py-TL*1.25;                                                             /* the load on the shoulder */
        if(a==='carry'){ for(let i=0;i<3;i++) brick(px+(dir==='left'?-1:1)*TL*.05,sy-i*TL*.11,1); }
        else { g.fillStyle='#a8683a'; g.beginPath(); g.ellipse(px,sy,TL*.13,TL*.17,0,0,Math.PI*2); g.fill(); } }
      break; }
    case 'stack': case 'build': {
      const f=cyc(1500), bend=Math.max(0,Math.sin(f*Math.PI)), b=a==='build';
      const rows=b?4:5, laid=Math.floor(cyc(1500*rows*4)*rows*4);
      const wx=x+TL*.55;
      for(let r=0;r<rows;r++) for(let c=0;c<4;c++){ const i=r*4+c; if(i>laid) continue;
        brick(wx+(c-1.5)*TL*.3+(r%2?TL*.15:0)*(b?1:0),y-r*TL*.13,1,b?'#b07a46':'#c08a52'); }
      if(b){ g.fillStyle='rgba(200,190,170,.5)'; g.fillRect(wx-TL*.6,y-rows*TL*.13-TL*.02,TL*1.3,2); }
      low(x-TL*.25,y,bend*TL*.32,{dir:'right'});
      if(bend<.6) brick(x+TL*.05,handsY(y)+bend*TL*.4,1);
      for(let i=0;i<3;i++) brick(x-TL*.85,y+TL*(.05-i*.11));                                                       /* the bricks to hand */
      break; }
    case 'kiln': {
      const kx=x+TL*.6;
      g.fillStyle='#8a5a36'; g.beginPath(); g.ellipse(kx,y-TL*.55,TL*.7,TL*.62,0,Math.PI,0); g.lineTo(kx+TL*.7,y); g.lineTo(kx-TL*.7,y); g.closePath(); g.fill();
      g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(kx+TL*.1,y-TL*1.1,TL*.6,TL*1.1);
      const fl=.6+.4*Math.sin(T/120);
      g.fillStyle=`rgba(255,${120+fl*90|0},40,.95)`; g.beginPath(); g.ellipse(kx,y-TL*.18,TL*.24,TL*.2,0,Math.PI,0); g.fill();
      const gl=g.createRadialGradient(kx,y-TL*.2,2,kx,y-TL*.2,TL*.9); gl.addColorStop(0,`rgba(255,170,80,${.3*fl})`); gl.addColorStop(1,'rgba(255,170,80,0)'); g.fillStyle=gl; g.fillRect(kx-TL,y-TL*1.1,TL*2,TL*1.2);
      for(let i=0;i<4;i++){ const k=cyc(2400,i*600); g.fillStyle=`rgba(110,100,90,${.45*(1-k)})`; g.beginPath(); g.arc(kx+Math.sin(k*5+i)*TL*.15,y-TL*1.15-k*TL*1.3,TL*(.12+k*.25),0,Math.PI*2); g.fill(); }
      for(let i=0;i<6;i++) brick(x-TL*.9+(i%3)*TL*.3,y+TL*(.05-Math.floor(i/3)*.11),1,'#a8643a');
      const f=cyc(2000), bend=f<.4?Math.sin(f/.4*Math.PI):0;
      low(x,y,bend*TL*.3,{dir:'right'});
      break; }
    case 'gather': {
      const grain=!!p.grain, n=7;
      const spots=[...Array(n)].map((_,i)=>[x+(hsh(seed,i*3)-.5)*TL*2.6,y+(hsh(seed+1,i*5)-.5)*TL*1.2]);
      for(const [sx,sy] of spots){ g.strokeStyle=grain?'#d8b85a':'#b8a060'; g.lineWidth=1.4;                     /* the stubble (or the ears left behind) */
        for(let k=0;k<4;k++){ g.beginPath(); g.moveTo(sx+k*2-3,sy); g.lineTo(sx+k*2-4+(k%2)*3,sy-TL*.16); g.stroke(); }
        if(grain){ g.fillStyle='#e0c060'; g.fillRect(sx-3,sy-TL*.2,3,4); } }
      const per=3200, f=cyc(per*n), i=Math.floor(f*n), ff=(f*n)%1, A=spots[i], B=spots[(i+1)%n];
      const walking=ff<.45, e=walking?ff/.45:1, px=A[0]+(B[0]-A[0])*e, py=A[1]+(B[1]-A[1])*e;
      const bend=walking?0:Math.sin((ff-.45)/.55*Math.PI);
      if(walking) person(px,py,{dir:B[0]>=A[0]?'right':'left',moving:true});
      else low(px,py,bend*TL*.34,{dir:B[0]>=A[0]?'right':'left'});
      g.fillStyle=grain?'#d8b85a':'#c2a866'; g.save(); g.translate(px+TL*.1,handsY(py)+bend*TL*.34+TL*.1); g.rotate(-.6);
      g.fillRect(-TL*.05,-TL*.22,TL*.1+Math.min(TL*.12,i*2),TL*.44); g.restore();                                 /* the bundle under the arm */
      break; }
    case 'beat': {
      const M=who(p.master,MASTERS), f=cyc(1300), hit=f>.42&&f<.5;
      const ang=f<.42?-1.9+f/.42*.4:(f<.5?-1.5+(f-.42)/.08*2.2:.7-(f-.5)/.5*2.6);
      low(x+TL*.85,y,TL*.42+(hit?TL*.05:0),{dir:'left'});                                                         /* the one bowed down under the blow */
      person(x-TL*.3,y,{dir:'right'},M);
      const hx=x-TL*.1, hy=handsY(y)-TL*.08; stick(hx,hy,hx+Math.cos(ang)*TL*1.15,hy+Math.sin(ang)*TL*1.15,TL*.08,'#4a2e12');
      if(hit){ g.fillStyle='rgba(255,240,200,.85)'; g.beginPath(); g.arc(x+TL*.8,y-TL*.5,TL*.13,0,Math.PI*2); g.fill(); }
      break; }
    case 'dig': {
      const grave=!!p.grave, ditch=!!p.ditch, well=!!p.water;
      const px=x+TL*.75, py=y+TL*.06, rx=TL*(ditch?1.1:grave?.62:.5), ry=TL*(ditch?.22:grave?.26:.24);
      g.fillStyle='#8a7350'; g.beginPath(); g.ellipse(x-TL*.6,y+TL*.02,TL*.45,TL*.2,0,0,Math.PI*2); g.fill();     /* the earth thrown up */
      g.fillStyle='#9a8460'; g.beginPath(); g.ellipse(x-TL*.62,y-TL*.06,TL*.3,TL*.13,0,0,Math.PI*2); g.fill();
      g.fillStyle='#4a3a26';
      if(grave||ditch){ g.fillRect(px-rx,py-ry,rx*2,ry*2); g.fillStyle='#2a2016'; g.fillRect(px-rx+3,py-ry+3,rx*2-6,ry*2-4); }
      else { g.beginPath(); g.ellipse(px,py,rx,ry,0,0,Math.PI*2); g.fill(); g.fillStyle='#241a10'; g.beginPath(); g.ellipse(px,py+2,rx*.82,ry*.7,0,0,Math.PI*2); g.fill(); }
      if(well){ const sh=.5+.5*Math.sin(T/300); g.fillStyle=`rgba(80,140,190,${.75})`; g.beginPath(); g.ellipse(px,py+3,rx*.6,ry*.42,0,0,Math.PI*2); g.fill();
        g.fillStyle=`rgba(220,240,255,${.35+.3*sh})`; g.fillRect(px-rx*.3,py+1,rx*.25,1.5); }
      if(grave&&!p.empty){ g.fillStyle='#e8e0cc'; g.beginPath(); g.ellipse(px,py-ry-TL*.22,rx*.82,TL*.13,0,0,Math.PI*2); g.fill();   /* the dead, wrapped */
        g.strokeStyle='rgba(120,100,70,.5)'; g.lineWidth=1; for(let i=-2;i<=2;i++){ g.beginPath(); g.moveTo(px+i*rx*.3,py-ry-TL*.33); g.lineTo(px+i*rx*.3,py-ry-TL*.11); g.stroke(); } }
      const f=cyc(1100), ang=f<.55?-2.4+f/.55*.5:(f<.66?-1.9+(f-.55)/.11*2.3:.4-(f-.66)/.34*2.8), hit=f>.62&&f<.7;
      person(x+TL*.05,y,{dir:'right'});
      const hx=x+TL*.18, hy=handsY(y);                                                                            /* the mattock */
      const ex=hx+Math.cos(ang)*TL*.85, ey=hy+Math.sin(ang)*TL*.85; stick(hx,hy,ex,ey,TL*.075);
      g.save(); g.translate(ex,ey); g.rotate(ang+Math.PI/2); g.fillStyle='#8a8478'; g.fillRect(-TL*.06,-TL*.04,TL*.32,TL*.09); g.fillStyle='#b0aa9c'; g.fillRect(-TL*.06,-TL*.04,TL*.32,TL*.025); g.restore();
      if(f>.62&&f<.95){ const k=(f-.62)/.33; g.fillStyle='rgba(110,86,54,.85)';                                  /* the earth flying */
        for(let i=0;i<5;i++){ const dx=-TL*(.3+i*.12)*k, dy=-TL*.9*k*(1-k)*2-i*2; g.fillRect(px-TL*.2+dx,py-TL*.2+dy,3,3); } }
      break; }
    case 'draw': case 'water': {
      const draw=a==='draw', wx=x+TL*.7, tx=x-TL*.95;
      if(draw&&!p.nowell){ g.fillStyle='#8a8070'; g.beginPath(); g.ellipse(wx,y,TL*.48,TL*.22,0,0,Math.PI*2); g.fill();     /* the well's stones */
        g.fillStyle='#2a3440'; g.beginPath(); g.ellipse(wx,y-TL*.02,TL*.32,TL*.13,0,0,Math.PI*2); g.fill();
        g.fillStyle='#a09684'; for(let i=0;i<8;i++){ const an=i/8*Math.PI*2; g.fillRect(wx+Math.cos(an)*TL*.4-3,y+Math.sin(an)*TL*.18-3,6,5); } }
      if(!p.notrough){ g.fillStyle='#7a6a54'; g.fillRect(tx-TL*.45,y-TL*.16,TL*.9,TL*.2); g.fillStyle='#4a6a8a'; g.fillRect(tx-TL*.4,y-TL*.14,TL*.8,TL*.08); }   /* the trough */
      const f=cyc(draw?5200:3000);
      if(draw){ const up=f<.45, k=up?f/.45:Math.min(1,(f-.45)/.2), atWell=f<.55;
        person(atWell?x+TL*.15:x-TL*.35,y,{dir:atWell?'right':'left'});
        if(f<.45){ const jy=y-TL*.05+(1-Math.abs(k*2-1))*0+TL*.0; stick(x+TL*.32,handsY(y),wx,y-TL*.05+ (1-k)*TL*.0,1.2,'#c8b48a');
          g.fillStyle='#a8683a'; g.beginPath(); g.ellipse(wx,y-TL*.05-k*TL*.45,TL*.1,TL*.13,0,0,Math.PI*2); g.fill(); }
        else if(f<.6){ g.fillStyle='#a8683a'; g.beginPath(); g.ellipse(x+TL*.3,handsY(y),TL*.1,TL*.13,0,0,Math.PI*2); g.fill(); }
        else { const pk=(f-.6)/.4; g.save(); g.translate(x-TL*.6,handsY(y)); g.rotate(-1.2*Math.min(1,pk*3)); g.fillStyle='#a8683a'; g.beginPath(); g.ellipse(0,0,TL*.1,TL*.13,0,0,Math.PI*2); g.fill(); g.restore();
          if(pk>.25&&pk<.9){ g.strokeStyle='rgba(140,190,230,.8)'; g.lineWidth=TL*.05; g.beginPath(); g.moveTo(x-TL*.7,handsY(y)); g.quadraticCurveTo(x-TL*.85,y-TL*.35,tx,y-TL*.12); g.stroke(); } } }
      else { person(x,y,{dir:'left'}); const pour=f<.6;
        g.save(); g.translate(x-TL*.22,handsY(y)); g.rotate(pour?-1.1:-.2); g.fillStyle='#a8683a'; g.beginPath(); g.ellipse(0,0,TL*.1,TL*.13,0,0,Math.PI*2); g.fill(); g.restore();
        if(pour){ g.strokeStyle='rgba(140,190,230,.8)'; g.lineWidth=TL*.05; g.beginPath(); g.moveTo(x-TL*.35,handsY(y)); g.quadraticCurveTo(x-TL*.5,y-TL*.35,tx+TL*.2,y-TL*.12); g.stroke(); } }
      if(p.sheep!==false&&typeof drawAnimal==='function'){ for(let i=0;i<(draw?2:3);i++){ try{ drawAnimal(g,tx-TL*(.3-i*.35),y-TL*.3-(i%2)*TL*.08,'sheep',{t:T+i*400,dir:'down',scale:.9}); }catch(e){} } }
      break; }
    case 'pour': {
      const f=cyc(3600), pour=f>.2&&f<.8;
      person(x,y,{dir:'right'});
      g.save(); g.translate(x+TL*.22,handsY(y)); g.rotate(pour?1.2:.2); g.fillStyle='#a8683a'; g.beginPath(); g.ellipse(0,0,TL*.1,TL*.13,0,0,Math.PI*2); g.fill(); g.restore();
      if(p.oil){                                                        /* oil poured into the vessels, filling them one by one (MELAḴIM B 4:5–6) */
        const vx=x+TL*.55, lv=Math.min(1,f*1.3);
        for(let i=1;i<=3;i++){ g.fillStyle='#8a5a32'; g.beginPath(); g.ellipse(vx+TL*.32*i,y-TL*.12,TL*.1,TL*.13,0,0,Math.PI*2); g.fill(); g.fillStyle='#d8a838'; g.fillRect(vx+TL*.32*i-TL*.06,y-TL*.26,TL*.12,TL*.03); }
        g.fillStyle='#8a5a32'; g.beginPath(); g.ellipse(vx,y-TL*.12,TL*.11,TL*.14,0,0,Math.PI*2); g.fill();
        g.fillStyle='#d8a838'; g.fillRect(vx-TL*.07,y-TL*.27+TL*.1*(1-lv),TL*.14,TL*.03);
        if(pour){ g.strokeStyle='rgba(216,168,56,.95)'; g.lineWidth=TL*.04; g.beginPath(); g.moveTo(x+TL*.36,handsY(y)+TL*.05); g.quadraticCurveTo(x+TL*.5,y-TL*.42,vx,y-TL*.26); g.stroke(); }
        break; }
      if(pour){ g.strokeStyle='rgba(140,190,230,.85)'; g.lineWidth=TL*.05; g.beginPath(); g.moveTo(x+TL*.36,handsY(y)+TL*.05); g.quadraticCurveTo(x+TL*.5,y-TL*.3,x+TL*.52,y); g.stroke(); }
      g.fillStyle=`rgba(90,130,170,${.25+.4*Math.min(1,f*1.5)})`; g.beginPath(); g.ellipse(x+TL*.55,y+TL*.04,TL*(.15+.25*Math.min(1,f*1.4)),TL*.08,0,0,Math.PI*2); g.fill();
      break; }
    case 'reap': {
      for(let i=0;i<14;i++){ const sx=x+TL*(.4+(i%7)*.2), sy=y+TL*(-.15+Math.floor(i/7)*.25);                     /* the standing grain */
        g.strokeStyle='#b89a40'; g.lineWidth=1.3; g.beginPath(); g.moveTo(sx,sy); g.lineTo(sx+1,sy-TL*.5); g.stroke(); g.fillStyle='#e0c060'; g.fillRect(sx-1.5,sy-TL*.58,3,TL*.12); }
      const f=cyc(1000), ang=f<.6?-.8+f/.6*1.6:.8-(f-.6)/.4*1.6;
      person(x,y,{dir:'right'});
      const hx=x+TL*.2, hy=handsY(y)+TL*.12; stick(hx,hy,hx+Math.cos(ang)*TL*.25,hy+Math.sin(ang)*TL*.25,TL*.05,'#6e4e2a');
      g.strokeStyle='#b8b0a0'; g.lineWidth=2; g.beginPath(); g.arc(hx+Math.cos(ang)*TL*.38,hy+Math.sin(ang)*TL*.38,TL*.14,ang-1.4,ang+1.2); g.stroke();
      for(let i=0;i<2;i++){ g.save(); g.translate(x-TL*(.6+i*.4),y); g.fillStyle='#d8b85a'; g.fillRect(-TL*.1,-TL*.5,TL*.2,TL*.5); g.fillStyle='#b8983a'; g.fillRect(-TL*.12,-TL*.3,TL*.24,TL*.05); g.restore(); }
      break; }
    case 'thresh': {
      g.fillStyle='#c8b070'; g.beginPath(); g.ellipse(x+TL*.5,y,TL*.9,TL*.38,0,0,Math.PI*2); g.fill();            /* the floor spread with the sheaves */
      g.strokeStyle='rgba(180,150,70,.9)'; g.lineWidth=1.2; for(let i=0;i<16;i++){ const sx=x+TL*.5+(hsh(seed,i)-.5)*TL*1.5, sy=y+(hsh(i,seed)-.5)*TL*.6; g.beginPath(); g.moveTo(sx,sy); g.lineTo(sx+TL*.14,sy-TL*.02); g.stroke(); }
      const f=cyc(900), ang=f<.5?-2.2+f/.5*.6:(-1.6+(f-.5)/.5*2.4), hit=f>.85;
      person(x,y,{dir:'right'});
      const hx=x+TL*.18, hy=handsY(y), ex=hx+Math.cos(ang)*TL*.7, ey=hy+Math.sin(ang)*TL*.7; stick(hx,hy,ex,ey,TL*.05);
      stick(ex,ey,ex+Math.cos(ang+.9)*TL*.35,ey+Math.sin(ang+.9)*TL*.35,TL*.05,'#5a3a1a');
      if(hit){ g.fillStyle='rgba(230,210,140,.8)'; for(let i=0;i<5;i++) g.fillRect(x+TL*(.6+i*.08),y-TL*(.1+i%2*.12),2,2); }
      break; }
    case 'winnow': {
      g.fillStyle='#d8b860'; g.beginPath(); g.ellipse(x+TL*.5,y,TL*.42,TL*.16,0,0,Math.PI*2); g.fill();            /* the grain that falls back */
      const f=cyc(1600), up=f<.4;
      person(x,y,{dir:'right'});
      const hx=x+TL*.18, hy=handsY(y), ang=up?-.4-f/.4*.9:-1.3+(f-.4)/.6*.9; stick(hx,hy,hx+Math.cos(ang)*TL*.8,hy+Math.sin(ang)*TL*.8,TL*.05);
      if(!up){ const k=(f-.4)/.6; for(let i=0;i<8;i++){ g.fillStyle=`rgba(230,215,170,${.7*(1-k)})`; g.fillRect(x+TL*(.5+k*1.6+i*.08),y-TL*(1.2-k*.3)+i*2,3,2); }   /* the chaff the wind drives away */
        for(let i=0;i<4;i++){ g.fillStyle='rgba(216,184,96,.9)'; g.fillRect(x+TL*(.45+i*.05),y-TL*(1-k)*1.1,2,2); } }
      break; }
    case 'potter': {                                                  /* at the wheel: the clay rising into a vessel; spoiled in his hand, and made again (YIRMEYAHU 18:3–4) */
      const wx=x+TL*.5, wy=y-TL*.06, f=cyc(9000), spin=T/90;
      g.fillStyle='#5d4426'; g.beginPath(); g.ellipse(wx,wy+TL*.04,TL*.34,TL*.12,0,0,Math.PI*2); g.fill();          /* the wheel */
      g.fillStyle='#7a5a3a'; g.beginPath(); g.ellipse(wx,wy,TL*.32,TL*.1,0,0,Math.PI*2); g.fill();
      g.strokeStyle='rgba(40,26,12,.55)'; g.lineWidth=1.2;
      for(let i=0;i<4;i++){ const an=spin+i*Math.PI/2; g.beginPath(); g.moveTo(wx,wy); g.lineTo(wx+Math.cos(an)*TL*.3,wy+Math.sin(an)*TL*.09); g.stroke(); }
      for(let i=0;i<3;i++){ const px2=x-TL*(.75+i*.28), py2=y+TL*(.02+(i%2)*.06);                                   /* the vessels made, set by */
        g.fillStyle='#9a5e32'; g.beginPath(); g.ellipse(px2,py2-TL*.16,TL*.1,TL*.14,0,0,Math.PI*2); g.fill(); g.fillRect(px2-TL*.05,py2-TL*.34,TL*.1,TL*.06); }
      low(x,y+TL*.02,TL*.4,{dir:'right'});
      /* the vessel on the wheel: it rises (0–.45), slumps, ruined (.45–.6), is pressed down again (.6–.7) and rises anew (.7–1) */
      const k=f<.45?f/.45:f<.6?1-(f-.45)/.15*.55:f<.7?.45-(f-.6)/.1*.45:(f-.7)/.3;
      const ruined=f>=.45&&f<.7, h=TL*(.08+.36*k), w=TL*(.13+(ruined?.06:0)), lean=ruined?Math.sin((f-.45)*20)*TL*.04:0;
      g.fillStyle='#a8683a'; g.beginPath();
      g.moveTo(wx-w,wy); g.quadraticCurveTo(wx-w*1.25+lean,wy-h*.5,wx-w*.55+lean*1.5,wy-h); g.lineTo(wx+w*.55+lean*1.5,wy-h);
      g.quadraticCurveTo(wx+w*1.25+lean,wy-h*.5,wx+w,wy); g.closePath(); g.fill();
      g.fillStyle='rgba(255,220,170,.22)'; g.fillRect(wx-w*.5+lean,wy-h*.9,w*.25,h*.8);
      g.fillStyle='#6e4426'; g.beginPath(); g.ellipse(wx+lean*1.5,wy-h,w*.55,TL*.03,0,0,Math.PI*2); g.fill();
      const hy=wy-h*.55, sw=Math.sin(T/200)*TL*.015;                                                               /* his hands about it */
      g.fillStyle='#7a4a2a'; g.beginPath(); g.arc(wx-w*1.05+sw,hy,TL*.045,0,Math.PI*2); g.arc(wx+w*1.05-sw,hy,TL*.045,0,Math.PI*2); g.fill();
      break; }
    case 'grind': {
      g.fillStyle='#8b8375'; g.beginPath(); g.ellipse(x+TL*.42,y-TL*.04,TL*.36,TL*.14,0,0,Math.PI*2); g.fill();   /* the lower millstone */
      g.fillStyle='#e8e0d0'; g.beginPath(); g.ellipse(x+TL*.82,y+TL*.02,TL*.14,TL*.06,0,0,Math.PI*2); g.fill();
      const f=Math.sin(T/380);
      low(x,y,TL*.42,{dir:'right'});
      g.fillStyle='#a39a8a'; g.beginPath(); g.ellipse(x+TL*(.36+f*.1),y-TL*.1,TL*.16,TL*.07,0,0,Math.PI*2); g.fill();   /* the upper stone, pushed and drawn back */
      break; }
    case 'hew': {
      g.fillStyle='#7a5a34'; g.fillRect(x+TL*.35,y-TL*.12,TL*.75,TL*.16); g.fillStyle='#a07a4a'; g.beginPath(); g.ellipse(x+TL*1.1,y-TL*.04,TL*.06,TL*.08,0,0,Math.PI*2); g.fill();
      for(let i=0;i<3;i++){ g.fillStyle='#8a6a40'; g.fillRect(x-TL*.9,y-TL*(.06+i*.1),TL*.5,TL*.08); }             /* the wood split */
      const f=cyc(1000), ang=f<.6?-2.3+f/.6*.4:(f<.7?-1.9+(f-.6)/.1*2.4:.5-(f-.7)/.3*2.8), hit=f>.66&&f<.74;
      person(x,y,{dir:'right'});
      const hx=x+TL*.18, hy=handsY(y), ex=hx+Math.cos(ang)*TL*.62, ey=hy+Math.sin(ang)*TL*.62; stick(hx,hy,ex,ey,TL*.05);
      g.save(); g.translate(ex,ey); g.rotate(ang); g.fillStyle='#9a948a'; g.fillRect(-TL*.04,-TL*.08,TL*.1,TL*.16); g.restore();
      if(hit){ g.fillStyle='#c8a070'; for(let i=0;i<4;i++) g.fillRect(x+TL*(.55+i*.06),y-TL*(.2+i*.07),3,2); }
      break; }
    case 'plant': {
      const f=cyc(p.period||2200), dig=f<.55;
      g.fillStyle='#6e5a3c'; g.beginPath(); g.ellipse(x+TL*.5,y+TL*.04,TL*.22,TL*.09,0,0,Math.PI*2); g.fill();
      low(x,y,TL*.38,{dir:'right'});
      if(dig){ const k=Math.sin(f/.55*Math.PI*3); stick(x+TL*.16,y-TL*.42,x+TL*.42,y-TL*.08+k*TL*.06,TL*.05); }
      else { const h=Math.min(1,(f-.55)/.3); g.strokeStyle='#5d7a35'; g.lineWidth=TL*.05; g.beginPath(); g.moveTo(x+TL*.5,y); g.lineTo(x+TL*.5,y-TL*.5*h); g.stroke();
        g.fillStyle='#6e8a3e'; for(let i=0;i<3;i++){ g.beginPath(); g.ellipse(x+TL*(.42+i*.08),y-TL*(.42+(i%2)*.08)*h,TL*.08*h,TL*.05*h,0,0,Math.PI*2); g.fill(); } }
      break; }
    case 'strike': {
      const f=cyc(p.period||1400), ang=f<.5?-1.8+f/.5*.2:(f<.6?-1.6+(f-.5)/.1*2.1:.5-(f-.6)/.4*2.3), hit=f>.57&&f<.66;
      person(x,y,{dir:'right'});
      const hx=x+TL*.16, hy=handsY(y)-TL*.05; stick(hx,hy,hx+Math.cos(ang)*TL*1.0,hy+Math.sin(ang)*TL*1.0,TL*.07,'#6e4e2a');
      if(hit){ g.fillStyle='rgba(255,240,200,.85)'; g.beginPath(); g.arc(hx+Math.cos(.5)*TL*1.0,hy+Math.sin(.5)*TL*1.0,TL*.14,0,Math.PI*2); g.fill(); }
      break; }
    case 'offer': {
      const f=cyc(2400), lift=Math.min(1,f*2.5)*(f<.85?1:(1-f)/.15);
      person(x,y,{dir:'up'});
      const ox=x, oy=handsY(y)-TL*(.2+lift*.55);
      g.fillStyle='#e8dcc0'; g.fillRect(ox-TL*.16,oy-TL*.06,TL*.32,TL*.12); g.fillStyle='#c8a24a'; g.fillRect(ox-TL*.16,oy+TL*.04,TL*.32,TL*.03);
      g.strokeStyle='rgba(255,240,200,'+(.35*lift)+')'; g.lineWidth=2; g.beginPath(); g.arc(ox,oy,TL*.32,0,Math.PI*2); g.stroke();
      break; }
    case 'raise': {                                                   /* the staff (or the hand) lifted high, stretched out */
      const f=cyc(2600), up=Math.min(1,f*3)*(f<.88?1:(1-f)/.12);
      person(x,y,{dir:'right'});
      const hx=x+TL*.14, hy=handsY(y)-TL*.1-up*TL*.35, ang=-1.2-up*.25;
      stick(hx,hy+TL*.5,hx+Math.cos(ang)*TL*.5,hy+Math.sin(ang)*TL*1.1,TL*.07,'#7a5a34');
      g.strokeStyle='rgba(255,236,190,'+(.4*up)+')'; g.lineWidth=2; g.beginPath(); g.arc(hx+Math.cos(ang)*TL*.5,hy+Math.sin(ang)*TL*1.1,TL*(.18+.1*Math.sin(T/200)),0,Math.PI*2); g.stroke();
      break; }
    case 'bless': {                                                   /* the hands lifted over those blessed */
      person(x,y,{dir:'right'});
      const k=.5+.5*Math.sin(T/500);
      g.fillStyle='rgba(255,236,190,'+(.25+.25*k)+')'; g.beginPath(); g.arc(x+TL*.55,handsY(y)-TL*.35,TL*(.22+.06*k),0,Math.PI*2); g.fill();
      stick(x+TL*.15,handsY(y),x+TL*.45,handsY(y)-TL*.35,TL*.08,'#8a5a3a');
      break; }
    case 'read': case 'write': {                                      /* the scroll held open, read aloud; or the reed writing on it */
      const wr=a==='write';
      if(wr) low(x,y,TL*.38,{dir:'right'}); else person(x,y,{dir:'down'});
      const sx=wr?x+TL*.35:x, sy=wr?y-TL*.18:handsY(y)+TL*.05;
      g.fillStyle='#e8d8b0'; g.fillRect(sx-TL*.22,sy-TL*.1,TL*.44,TL*.2); g.fillStyle='#8a6038'; g.fillRect(sx-TL*.27,sy-TL*.13,TL*.06,TL*.26); g.fillRect(sx+TL*.21,sy-TL*.13,TL*.06,TL*.26);
      g.fillStyle='rgba(60,40,20,.55)'; const lines=wr?Math.floor(cyc(4000)*5)+1:4; for(let i=0;i<lines;i++) g.fillRect(sx-TL*.17,sy-TL*.06+i*TL*.035,TL*(.3-(i%2)*.06),1.2);
      if(wr){ const k=cyc(600); stick(sx+TL*(-.1+k*.25),sy-TL*.02,sx+TL*(0+k*.25),sy-TL*.22,1.6,'#5a4020'); }
      else { for(let i=0;i<3;i++){ const k=cyc(1200,i*400); g.strokeStyle='rgba(255,246,220,'+(.5*(1-k))+')'; g.lineWidth=1.5; g.beginPath(); g.arc(x,y-TL*1.15,TL*(.12+k*.3),-2.4,-.7); g.stroke(); } }
      break; }
    case 'blow': {                                                    /* the ram's horn (or the trumpet) sounded */
      person(x,y,{dir:'right'});
      g.strokeStyle='#d8c8a0'; g.lineWidth=TL*.08; g.lineCap='round'; g.beginPath(); g.moveTo(x+TL*.1,y-TL*1.0); g.quadraticCurveTo(x+TL*.45,y-TL*1.05,x+TL*.62,y-TL*1.3); g.stroke(); g.lineCap='butt';
      for(let i=0;i<3;i++){ const k=cyc(900,i*300); g.strokeStyle='rgba(255,246,220,'+(.6*(1-k))+')'; g.lineWidth=2; g.beginPath(); g.arc(x+TL*.66,y-TL*1.34,TL*(.1+k*.45),-1.4,.3); g.stroke(); }
      break; }
    case 'proclaim': {                                                /* crying aloud, the arms spread */
      person(x,y,{dir:'down'});
      stick(x-TL*.18,handsY(y),x-TL*.45,handsY(y)-TL*.3,TL*.08,'#8a5a3a'); stick(x+TL*.18,handsY(y),x+TL*.45,handsY(y)-TL*.3,TL*.08,'#8a5a3a');
      for(let i=0;i<3;i++){ const k=cyc(1000,i*330); g.strokeStyle='rgba(255,246,220,'+(.6*(1-k))+')'; g.lineWidth=2; g.beginPath(); g.arc(x,y-TL*1.2,TL*(.15+k*.5),-2.6,-.5); g.stroke(); }
      break; }
    case 'throw': {                                                   /* a stone (or the lot) cast */
      const f=cyc(1500), ang=f<.4?.6-f/.4*2.6:-2+(f-.4)/.2*2.6;
      person(x,y,{dir:'right'});
      const hx=x+TL*.14, hy=handsY(y); stick(hx,hy,hx+Math.cos(ang)*TL*.35,hy+Math.sin(ang)*TL*.35,TL*.08,'#8a5a3a');
      if(f>.55){ const k=(f-.55)/.45; g.fillStyle='#8a8070'; g.beginPath(); g.arc(hx+TL*(.3+k*2.4),hy-TL*.4+k*k*TL*1.0-k*TL*.6,TL*.07,0,Math.PI*2); g.fill(); }
      else if(f<.4){ g.fillStyle='#8a8070'; g.beginPath(); g.arc(hx+Math.cos(ang)*TL*.38,hy+Math.sin(ang)*TL*.38,TL*.07,0,Math.PI*2); g.fill(); }
      break; }
    case 'eat': {                                                     /* bread to the mouth */
      const f=cyc(1600), up=f<.5?f*2:2-f*2;
      low(x,y,TL*.36,{dir:'down'});
      g.fillStyle='#c8964e'; g.beginPath(); g.ellipse(x+TL*.16,y-TL*(.15+up*.42),TL*.1,TL*.06,0,0,Math.PI*2); g.fill();
      g.fillStyle='#8a6040'; g.beginPath(); g.ellipse(x,y+TL*.12,TL*.3,TL*.08,0,0,Math.PI*2); g.fill();
      break; }
    case 'weep': {
      person(x,y,{dir:p.dir||'down'});
      const eu=2.6*(TILE/40);
      for(let k=0;k<2;k++){ const tp=cyc(560,k*280), ex2=x+(k?2.3:-2.3)*eu, ey=y-TL*1.0;
        g.fillStyle='rgba(175,220,255,.85)'; g.fillRect(ex2-1,ey,2,TL*.2);
        g.fillStyle=`rgba(175,220,255,${(.95*(1-tp)).toFixed(2)})`; g.beginPath(); g.ellipse(ex2,ey+TL*.2+tp*TL*.4,TL*.05,TL*.075,0,0,Math.PI*2); g.fill(); }
      break; }
    case 'pray': {
      low(x,y,TL*.4,{dir:p.dir||'up'});
      shadow(x,y,TL*.35);
      break; }
    default: return false;
  }
  return true;
}

/* ---- the player acts out what the story has him do ----
   When a task of the play is taken up (pressing on its thing, reaching its place) and its words name a work —
   digging, planting, reaping, building, drawing water, praying, weeping… — the one you play does that work there for
   a little while before the story goes on; and through a task of strength (a "mash"), for as long as it lasts. */
const VERBS=[
  [/^(?:dig|dug)\b|^break up (?:the|your) (?:ground|fallow|tilable)/,'dig',s=>({water:/well|water|spring/.test(s),grave:/grave/.test(s)})],
  [/^(?:bury|hide (?:it|them|the))\b/,'dig',s=>({grave:/^bury/.test(s),empty:/^hide/.test(s)})],
  [/^(?:plant|sow)\b/,'plant'],
  [/^(?:reap|harvest)\b/,'reap'],
  [/^glean\b/,'gather',()=>({grain:true})],
  [/^gather (?:the |all )?(?:people|elders|seventy|qahal|remnant|congregation|men\b|tribes|army|servants|all his)|^gather (?:at|to|round|together)\b|^(?:assemble|summon)\b/,'proclaim'],
  [/^(?:gather|pick up|collect)\b/,'gather'],
  [/^thresh\b/,'thresh'],[/^winnow\b/,'winnow'],[/^grind\b/,'grind'],
  [/^(?:build|rebuild|repair|make (?:bricks|booths|a sukkah|the sukkah)|lay (?:the|your|a|its) (?:course|courses|stones?|foundations?|bricks)|set up (?:the|a|an) (?:stones?|pillar|altar|mizbe|standard|memorial)|raise (?:up )?(?:the|a|an) (?:great )?(?:stones?|pillar|altar|mizbe)|pile (?:up )?(?:the )?stones)/,'build'],
  [/^(?:draw (?:water|from the well)|water (?:the|his|her|their|your) (?:flock|flocks|sheep|camels)|give (?:\w+ )?(?:a )?drink)/,'draw'],
  [/^pour out (?:your|my|his|her) (?:soul|prayer|heart)/,'pray'],
  [/^(?:pour|anoint|fill (?:the|his|your) (?:horn|lamps?)|trim)\b/,'pour'],
  [/^(?:hew|chop|cut (?:down|wood|the tree|the wood)|split (?:the )?wood)\b/,'hew'],
  [/^break (?:the|a) (?:jug|jar|jars|vessel|pot|flask)/,'throw'],
  [/^(?:slaughter|kill) (?:the|a|an|your) (?:pesach|lamb|ram|goat|bull|offering|passover|sacrifice)/,'offer'],
  [/^(?:strike|smite|break (?:down|the|even)|smash|shatter|slay|fight)\b/,'strike'],
  [/^(?:pray|kneel|worship|bow (?:down|low|before)|fall (?:on|to) (?:your|his|her|the) (?:face|ground|knees)|cry (?:out )?to\b|call (?:up)?on\b|call to\b|in prayer|(?:the )?prayer\b|cry the [\w ]*prayer|spread (?:your|his) hands)/,'pray'],
  [/^(?:weep\b|mourn\b|lament\b|rend\b|tear (?:your|his|her) (?:garments|clothes)|take up (?:the|a) lament)/,'weep'],
  [/^(?:offer|sacrifice|burn (?:the|an|a|your) (?:offering|incense|burnt)|lift up the (?:offering|wave|heave)|bring (?:your|the|an|a|my) (?:offering|lamb|ram|goat|bull|gift|firstfruits|tithe)|prepare (?:your|the) [\w ]*offering|lay (?:your|the) offering|set (?:the )?meal|light (?:the )?(?:fire|lamps?))/,'offer'],
  [/^(?:carry|bear|take up|bring) (?:(?:your|the|a|his|her|their) )?(?:exile[’']s )?(?:burden|load|baggage|basket|stones?|wood|bricks?|water|sheaves|straw)/,'stack'],
  [/^(?:raise|lift|lift up|stretch out|hold out|hold up) (?:your|his|the|my) (?:staff|rod|hand|hands|arm|spear)/,'raise'],
  [/^bless\b/,'bless'],
  [/^read\b/,'read'],
  [/^(?:write|inscribe|engrave|seal (?:the|it|this|up))\b/,'write'],
  [/^(?:blow|sound (?:the )?(?:trumpets?|shophars?|horn|ram))/,'blow'],
  [/^(?:proclaim|cry (?:aloud|out)\b|shout\b|call out|herald|announce|prophesy)/,'proclaim'],
  [/^(?:throw|cast|sling)\b/,'throw'],
  [/^(?:eat|break bread)\b/,'eat'],
  [/^kindle\b/,'offer'],[/^burn\b/,'throw'],
];
/* only what the words bid the one you play to do: each clause of the task is read from its first word, so "the
   kohanim weep", "watch the goat break the ram", "do not eat", "written in the book" are not acted by you */
const NEVER=/break through|smite the shepherd|read the exile/;
const PASS=/^gather (?:at|to|round|together)\b|^cast up\b|^offer \S+ a sign/;
const LEAD=/^(?:(?:and|then|now|so|there|but|yes|o|come|let us|go and)\s+)+/;
const MOVE=/^(?:stand|go|come|rise|arise|turn|run|hurry|remain behind|return|help (?:your|his|her) \w+)(?: (?:up|down|out|in|back|aside|softly))?(?: to)?\s+/;
const actFor=text=>{ const s=String(text||'').toLowerCase().replace(/[“”"‘]/g,' ');
  if(NEVER.test(s)) return null;
  for(let c of s.split(/\s*[—–:;,!?.…]\s*|\s+and\s+/)){
    const c0=c.trim().replace(LEAD,''); c=c0.replace(MOVE,'').replace(LEAD,'');
    if(!c||PASS.test(c)) continue;
    if(/^(?:go|went) out weeping/.test(c0)) return {act:'weep'};
    for(const [re,a,opt] of VERBS) if(re.test(c)) return Object.assign({act:a},opt?opt(c):{});
  }
  return null; };
const ACTS_STATE={cur:null};
const NOW=()=>performance.now();
const asAct=v=>typeof v==='string'?{act:v}:(v&&typeof v==='object'&&v.act?Object.assign({},v):null);
/* the task's own act (objective.act, false for none), else what its words bid; it lasts while the verse is read */
if(typeof Game==='object'&&Game&&typeof Game.runScript==='function'){
  const _rs=Game.runScript;
  Game.runScript=function(script,onEnd){
    try{
      const o=script&&script.length?(this.objectives||[]).find(o=>!o.done&&o.type!=='talk'&&o.script&&o.script[0]===script[0]):null;
      const a=o&&o.act!==false?(asAct(o.act)||actFor(o.text)):null;
      const w=this.world, pl=w&&w.player;
      /* objective.actAfter {act…, at:[x,y]}: when its telling (and its fight) is over, the one you play goes there and does it */
      const aa=o&&asAct(o.actAfter);
      if(aa&&pl){ const G=this, _e0=onEnd;
        onEnd=function(){ const r=_e0&&_e0.apply(this,arguments);
          try{ const ww=G.world, p=ww&&ww.player, ox=+G.ox||0, oy=+G.oy||0;
            if(p&&ww===w){ if(aa.at) G.execOp({move:['player',aa.at[0]+ox,aa.at[1]+oy,aa.speed||.06,'bg']});
              ACTS_STATE.cur=Object.assign({},aa,{world:ww,lx:p.x,ly:p.y,stopAt:NOW()+(aa.ms||7000),ended:false,face:aa.face!=null?aa.face+ox:null}); } }catch(e){}
          return r; };
      }
      if(a&&pl&&!script.some(op=>op&&op.mash)){
        let tx=null;
        if(o.type==='interact'&&w.map){ const d=(w.map.decor||[]).find(d=>d.id===o.prop); if(d) tx=d.x; }
        else if(o.x!=null&&Math.abs(o.x-pl.x)>.6) tx=o.x;
        const cur=ACTS_STATE.cur=Object.assign({face:a.face!=null?a.face:tx,world:w,lx:pl.x,ly:pl.y,min:NOW()+(a.ms||2400),ended:false},a);
        const _end=onEnd; onEnd=function(){ cur.ended=true; return _end&&_end.apply(this,arguments); };
      }
    }catch(e){}
    return _rs.call(this,script,onEnd);
  };
}
/* as the verse is read, it is done: scene.cues [{on:'words of the line', ops:[…]}] — when a line holding those words
   begins, its people do what it tells (show, hide, face, emote, hold, prop, addProp, teleport; move, walking while the
   words go on; act:[id, {act:'draw',…} or null], 'player' for the one you play). The words are not touched. */
if(typeof Game==='object'&&Game&&typeof Game.execOp==='function'){
  const _ex=Game.execOp;
  const SAFE=new Set(['show','hide','face','emote','hold','prop','addProp','teleport','move','act','charSwap','burst','sfx','mount','spawn','set','shake','mapcfg']);
  const WORDY=/^(say|script|text|lines|talk|dialogue|examine|complete|title|prompt|needText)$/;
  const runCue=(G,ops)=>{
    const ox=+G.ox||0, oy=+G.oy||0, w=G.world;
    for(const op0 of ops||[]){
      const k=Object.keys(op0||{})[0]; if(!SAFE.has(k)) continue;
      const op=JSON.parse(JSON.stringify(op0));
      try{
        if(k==='act'){ const [id,spec]=op.act;
          if(id==='player'){ const pl=w.player, a=asAct(spec);
            ACTS_STATE.cur=a&&pl?Object.assign({},a,{world:w,lx:pl.x,ly:pl.y,stopAt:NOW()+(a.ms||4200),ended:false,face:a.face!=null?a.face+ox:null}):null; }
          else { const n=w.npcs.find(n=>n.id===id); if(n){ n.act=spec||null; if(spec&&spec.face) n.dir=spec.face; } }
          continue; }
        if(k==='move'){ op.move[1]+=ox; op.move[2]+=oy; op.move[4]='bg'; }
        if(k==='teleport'){ op.teleport[1]+=ox; op.teleport[2]+=oy; }
        if(k==='burst'){ op.burst[0]+=ox; op.burst[1]+=oy; }
        if(k==='addProp'){ op.addProp.x+=ox; op.addProp.y+=oy; }
        if(k==='spawn'){ if(w.npcs.some(n=>n.id===op.spawn.id)) continue; op.spawn.x+=ox; op.spawn.y+=oy; G.__cueSpawn=G.__cueSpawn||new Set(); G.__cueSpawn.add(op.spawn.id); }
        if(k==='set'){ const [id,props]=op.set, n=w.npcs.find(n=>n.id===id); if(n) for(const q in props) if(!WORDY.test(q)) n[q]=props[q]; continue; }
        if(k==='mapcfg'){ const m=w.map; if(m){ m.cfg=m.cfg||{}; Object.assign(m.cfg,op.mapcfg); } continue; }
        _ex.call(G,op);
      }catch(e){}
    }
  };
  /* what the narration tells a person of the scene doing, that person does as it is read: "and Ya‛aqoḇ … wept",
     "Mosheh struck the rock", "Aḇraham fell on his face", "Shemu'ĕl built a mizbe'ach there". The person is found by
     name among those standing in the scene (or the one you play); "Yosĕph's brothers bowed" is not Yosĕph. */
  const norm=t=>String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[‘’‛'`ʼ]/g,'').toLowerCase();
  const AUTO=[
    [/^(?:wept|lifted up (?:his|her|their) voice and wept|tore (?:his|her) (?:garments|clothes)|rent (?:his|her) (?:garments|clothes)|mourned|lamented)\b/,'weep'],
    [/^(?:bowed|worshipped|prayed|knelt|kneeled|fell on (?:his|her) face|fell to the ground|cried (?:out )?to (?:yahuah|aluahim))\b/,'pray'],
    [/^(?:blessed|baruk)\b/,'bless'],
    [/^(?:built|set up (?:a|the) (?:stone|pillar|mizbe))/,'build'],
    [/^dug\b/,'dig'],
    [/^drew water\b/,'draw'],
    [/^poured\b/,'pour'],
    [/^(?:struck|smote)\b/,'strike'],
    [/^(?:threw|cast (?:it|the|his|her|lots))\b/,'throw'],
    [/^(?:ate|did eat)\b/,'eat'],
    [/^(?:stretched out (?:his|her) (?:hand|rod|staff|spear)|lifted up (?:his|her) (?:hand|hands|rod|staff))\b/,'raise'],
    [/^(?:blew|sounded) (?:the|a) (?:horn|shophar|trumpet|ram)/,'blow'],
    [/^read\b/,'read'],[/^wrote\b/,'write'],
    [/^(?:offered|sacrificed|burned incense)\b/,'offer'],
    [/^(?:planted|sowed)\b/,'plant'],[/^(?:reaped)\b/,'reap'],[/^(?:gleaned)\b/,'gather'],
  ];
  const STOPW=/^(?:said|says|saw|heard|when|who|whom|that|which|people|they|he|she|men|sons|daughters|brothers|servants|all|but|if|not|shall|will|would|to|was|were|is|are|be|been|had|has|have)$/;
  /* the one named does it only when the name stands as the doer: at the head of a clause ("And Mosheh …", "Then our
     father Aḏam …"), not after "of", "before", "against", "kissed" ("the heart of Dawiḏ smote him", "fell on her face
     before Dawiḏ and bowed", "kissed Raḥal and … wept" are not his or her acts) */
  const HEAD=/^(?:\||and|then|so|but|now|when|again|afterward|also|the|sovereign|king|father|mother|our|daughter|wife|son|brother|sister|servant|prophet|kohen|while)$/;
  const GENERIC=/^(?:man|woman|men|women|elder|elders|people|son|daughter|wife|boy|girl|child|young|old|an|a|one|voice|narrator)$/;
  const keyOf=nm=>{ const k=norm(String(nm||'').replace(/^the\s+/i,'').split(/,|\(| of | son of | daughter of /)[0]).trim(); return k.length>=3&&!/\s/.test(k)&&!GENERIC.test(k)?k:null; };
  /* the acts a line tells of: [{who, act}] for those of ents (people with a char) named in it as doing them */
  const autoMatch=(line,ents)=>{
    const T=norm(line).replace(/[^a-z\s]/g,m=>m==='-'?' ':' | ').trim().split(/\s+/), out=[];
    for(const e of ents){
      if(!e||!e.char||!CHARS[e.char]) continue;
      const k=keyOf(CHARS[e.char].name); if(!k) continue;
      let hit=null;
      for(let t=0;t<T.length&&!hit;t++){
        if(T[t]!==k||!HEAD.test(t>0?T[t-1]:'|')) continue;
        for(let j=t+1;j<=t+9&&j<T.length;j++){
          if(T[j]==='|'||STOPW.test(T[j])) break;
          const rest=T.slice(j,j+8).join(' ');
          hit=AUTO.find(([re])=>re.test(rest)); if(hit) break;
        }
      }
      if(hit) out.push({who:e,act:hit[1]});
    }
    return out;
  };
  const autoActs=(G,line)=>{
    const w=G.world; if(!w) return;
    const ms=Math.max(3500,Math.min(9000,String(line).length*60));
    for(const {who:e,act:a} of autoMatch(line,[w.player].concat((w.npcs||[]).filter(n=>!n.animal&&!n.hidden&&!n.mount&&!n.lying)))){
      if(e===w.player){ if(!ACTS_STATE.cur&&!e.hidden&&!e.lying&&!e.mount) ACTS_STATE.cur={act:a,world:w,lx:e.x,ly:e.y,stopAt:NOW()+ms,ended:false}; }
      else if(!e.act){ e.act={act:a}; e.__auto=NOW()+ms; }
    }
  };
  window.__actsAutoMatch=autoMatch;
  for(const f of ['startChapter','startScene']) if(typeof Game[f]==='function'){ const _f=Game[f]; Game[f]=function(){ this.__cueW=null; return _f.apply(this,arguments); }; }
  Game.execOp=function(op){
    try{
      /* one the telling brought on early is not brought on twice */
      if(op&&op.spawn&&this.__cueSpawn&&this.__cueSpawn.has(op.spawn.id)&&this.world&&this.world.npcs.some(n=>n.id===op.spawn.id)) return true;
      const line=op&&(op.say?op.say[1]:null);
      const cues=line&&this.chapter&&this.chapter.scene&&this.chapter.scene.cues;
      if(cues&&this.world){
        if(this.__cueW!==this.world||this.__cueCh!==this.chapter){ this.__cueW=this.world; this.__cueCh=this.chapter; this.__cueDone=new Set(); }
        const done=this.__cueDone;
        cues.forEach((c,i)=>{ if(!done.has(i)&&c.on&&String(line).indexOf(c.on)>=0){ done.add(i); runCue(this,c.ops); } });
      }
      if(line&&op.say[0]==='narrator') autoActs(this,line);
    }catch(e){}
    return _ex.apply(this,arguments);
  };
}
/* the people of a scene at their work: an npc with act ('draw', or {act:'draw', flip, nowell, …}) does it where it
   stands, while it is still; actFrom/actTill: only once that task is done / until it is done */
const npcActs=w=>{
  const out=[], obs=(typeof Game==='object'&&Game&&Game.objectives)||[];
  for(const n of w.npcs||[]){
    if(n.__auto&&NOW()>n.__auto){ n.act=null; n.__auto=0; }
    if(!n.act||n.hidden||n.animal||n.mount||n.lying) continue;
    if(n.actTill!=null&&obs[n.actTill]&&obs[n.actTill].done) continue;
    if(n.actFrom!=null&&!(obs[n.actFrom]&&obs[n.actFrom].done)) continue;
    const mv=n.__ax!==undefined&&(Math.abs(n.__ax-n.x)>.002||Math.abs(n.__ay-n.y)>.002); n.__ax=n.x; n.__ay=n.y;
    if(mv) n.__mv=NOW(); if(n.__mv&&NOW()-n.__mv<350) continue;
    const a=asAct(n.act); if(!a) continue;
    out.push({who:n,a,flip:!!a.flip});
  }
  return out;
};
/* each one acting is drawn in its own place among the rest (behind what stands before it, under the evening's
   dusk): it is given a mark for a name while the world is drawn, and where that mark is drawn the work is drawn */
const ACTORS=new Map(); let actorN=0;
const _dc=window.drawChar;
window.drawChar=function(g,px,py,id,o){
  const A=ACTORS.size&&typeof id==='string'?ACTORS.get(id):null;
  if(!A) return _dc.apply(this,arguments);
  A.drawn=true; drawActor(g,px,py,A,o);
};
const drawActor=(g,px,py,A,o)=>{
  g.save(); g.translate(px,py); if(A.flip) g.scale(-1,1); if(o&&o.alpha!=null) g.globalAlpha*=o.alpha;
  try{ act(g,Object.assign({x:A.who.x,y:A.who.y},A.a,{char:A.char,type:'act'}),NOW()); }catch(e){} finally{ g.restore(); }
};
const _dw=window.drawWorld;
window.drawWorld=function(g,world,t){
  const pl=world&&world.player, list=[];
  let a=ACTS_STATE.cur;
  if(a){
    const mv=pl&&(Math.abs(pl.x-a.lx)>.03||Math.abs(pl.y-a.ly)>.03);
    if(a.world!==world||(a.ended&&(mv||NOW()>a.min))||(a.stopAt&&NOW()>a.stopAt)) a=ACTS_STATE.cur=null;
    else if(mv){ a.lx=pl.x; a.ly=pl.y; a=null; }
  }
  if(!a&&typeof Game==='object'&&Game&&Game.mash&&Game.mash.text){ const m=actFor(Game.mash.text); if(m) a=m; }
  if(a&&pl&&!pl.hidden&&!pl.mount&&!pl.lying&&!pl.submerged) list.push({who:pl,a,flip:a.face!=null?a.face<pl.x:(pl.dir==='left')});
  try{ if(world&&world.npcs) list.push(...npcActs(world)); }catch(e){}
  for(const A of list){ A.char=A.who.char; A.mark='\u007fact'+(actorN++%1e6); ACTORS.set(A.mark,A); A.who.char=A.mark; }
  let r;
  try{ r=_dw.apply(this,arguments); }
  finally{ for(const A of list){ A.who.char=A.char; ACTORS.delete(A.mark); } }
  /* one not drawn among the rest (a world drawn some other way) is drawn over it */
  for(const A of list) if(!A.drawn&&!A.who.hidden){
    const lift=(typeof elevAt==='function'&&typeof ESTEP!=='undefined'&&world.map&&world.map.elev)?elevAt(world.map,A.who.x,A.who.y)*ESTEP:0;
    drawActor(g,A.who.x*TILE+VW/2-Camera.x,A.who.y*TILE+VH/2-Camera.y-lift,A,null);
  }
  return r;
};

const _dp=window.drawProp;
window.drawProp=function(g,px,py,p,t){
  if(p&&p.type==='act'&&!p.hidden){
    g.save(); g.translate(px,py);
    try{ act(g,p,t); } catch(e){} finally{ g.restore(); }
    return;
  }
  if(p&&p.type==='well'&&p.stone){                    /* a large stone on the well's mouth (BERĔSHITH 29:2–3), or rolled aside */
    const r=_dp.apply(this,arguments);
    const u=2.6*(TILE/40)*((typeof PROP_SCALE!=='undefined'&&PROP_SCALE.well)||1), aside=p.stone==='aside';
    const sx=px+(aside?7.4*u:0), sy=py+(aside?1.4*u:-2.6*u);
    g.save();
    g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(sx,sy+1.6*u,4*u,1.5*u,0,0,Math.PI*2); g.fill();
    g.fillStyle='#7f786c'; g.beginPath(); g.ellipse(sx,sy,3.9*u,2.5*u,0,0,Math.PI*2); g.fill();
    g.fillStyle='#9a9384'; g.beginPath(); g.ellipse(sx-.5*u,sy-.6*u,3*u,1.7*u,0,0,Math.PI*2); g.fill();
    g.fillStyle='rgba(255,250,235,.18)'; g.beginPath(); g.ellipse(sx-1.2*u,sy-1.1*u,1.5*u,.7*u,0,0,Math.PI*2); g.fill();
    g.restore();
    return r;
  }
  return _dp.apply(this,arguments);
};
window.ACTS={draw:act,actFor,state:ACTS_STATE,actors:ACTORS};
})();
