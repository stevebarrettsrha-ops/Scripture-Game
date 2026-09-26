/* play.js — the fighting and the struggles of the Scripture Game, for every game.

   The skirmishes (Yo'aḇ up the stronghold, Benayah and the lion, the three at the well…):
   you have strength (hearts); you strike with a swing that reaches the foes before you,
   and you can dodge. The foes circle, and before each blow they gather themselves — a red
   warning — then lunge: step aside and strike them as they recover. Blows land with weight
   (a pause, a flash, a push back), a third blow in a row throws the foe. If your strength
   fails you rise and fight on; each time the foes grow slower to strike. The story is
   the story: the fight is always won in the end.

   The struggles (holding on until daybreak): a clear prompt for the button to press, a
   grip meter and the dawn coming; holding the button down keeps pressing for you.

   Controllers work in every game (stick or d-pad to move, A to act, B for the menu,
   X or RB to dodge), with a rumble when you are struck. On touch screens a dodge button
   appears beside ✦ when a fight or a chase is on. Without this file the games play as
   before. */
(function(){
'use strict';
if(typeof Game==='undefined'||typeof Input==='undefined'||typeof TILE==='undefined') return;

const PLAY=window.PLAY={on:true};
const cl=(v,a,b)=>v<a?a:(v>b?b:v);
const now=()=>Game.t||0;
const dist2=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);
const canWalk=(m,x,y,fx,fy)=>typeof walkP==='function'?walkP(m,x,y,fx,fy):walkable(m,x,y,fx,fy);

/* ---------------------------------------------------------------- sound */
function sfx(kind){
  const S=typeof Sound!=='undefined'?Sound:null; if(!S||!S.ctx||!S.enabled) return;
  const a=S.ctx, t=a.currentTime, out=S.master||a.destination;
  const noise=(dur,f0,f1,q,vol)=>{ const n=a.createBuffer(1,Math.max(1,a.sampleRate*dur|0),a.sampleRate), d=n.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const src=a.createBufferSource(); src.buffer=n; const bp=a.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=q;
    bp.frequency.setValueAtTime(f0,t); bp.frequency.exponentialRampToValueAtTime(f1,t+dur);
    const g=a.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(bp); bp.connect(g); g.connect(out); src.start(t); src.stop(t+dur); };
  const tone=(type,f0,f1,dur,vol)=>{ const o=a.createOscillator(), g=a.createGain(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g); g.connect(out); o.start(t); o.stop(t+dur); };
  if(kind==='swing') noise(.16,900,2600,1.2,.22);
  else if(kind==='hit'){ tone('triangle',180,60,.16,.3); noise(.08,1400,500,.8,.22); }
  else if(kind==='heavy'){ tone('triangle',140,40,.28,.38); noise(.14,900,300,.7,.3); }
  else if(kind==='hurt'){ tone('sawtooth',220,90,.22,.14); noise(.12,700,300,.9,.18); }
  else if(kind==='dodge') noise(.14,500,1500,1.4,.14);
  else if(kind==='warn') tone('square',660,640,.07,.05);
  else if(kind==='fall'){ tone('sine',330,110,.9,.18); }
  else if(kind==='clang'){ tone('square',1240,1180,.09,.08); tone('triangle',1860,1700,.18,.07); }
}
function rumble(strong,weak,ms){
  try{ for(const gp of (navigator.getGamepads?navigator.getGamepads():[])){ if(gp&&gp.vibrationActuator&&gp.vibrationActuator.playEffect)
    gp.vibrationActuator.playEffect('dual-rumble',{duration:ms||140,strongMagnitude:strong,weakMagnitude:weak}); } }catch(e){}
  try{ if(document.body.classList.contains('touch')&&navigator.vibrate) navigator.vibrate(ms||60); }catch(e){}
}

/* ---------------------------------------------------------------- input */
let lastDevice='key';                                      /* key | pad | touch — for the prompts */
const held={key:false,pad:false,touch:false};
addEventListener('keydown',e=>{ lastDevice='key';
  if(['Space','Enter','KeyE'].includes(e.code)) held.key=true;
  if(!e.repeat&&(e.code==='ShiftLeft'||e.code==='ShiftRight'||e.code==='KeyQ'||e.code==='KeyX')) PLAY.dodge();
});
addEventListener('keyup',e=>{ if(['Space','Enter','KeyE'].includes(e.code)) held.key=false; });
addEventListener('touchstart',()=>{ lastDevice='touch'; },{passive:true});
function hookTouch(){
  const act=document.getElementById('act-btn');
  if(act){ act.addEventListener('touchstart',()=>{ held.touch=true; },{passive:true}); act.addEventListener('touchend',()=>{ held.touch=false; },{passive:true}); act.addEventListener('touchcancel',()=>{ held.touch=false; },{passive:true}); }
  const b=document.createElement('div'); b.id='dodge-btn'; b.textContent='⤳'; b.title='Dodge';
  b.style.cssText='position:absolute;z-index:31;display:none;width:62px;height:62px;border-radius:50%;align-items:center;justify-content:center;'
    +'font-size:30px;color:#efe3c8;background:rgba(10,14,26,.62);border:2px solid rgba(232,198,106,.55);box-shadow:0 4px 16px rgba(0,0,0,.45);'
    +'right:calc(4.5vw + 100px + env(safe-area-inset-right,0px));bottom:calc(6.5vh + 8px);user-select:none;-webkit-user-select:none;touch-action:none';
  b.addEventListener('touchstart',e=>{ e.preventDefault(); PLAY.dodge(); },{passive:false});
  b.addEventListener('mousedown',e=>{ e.preventDefault(); PLAY.dodge(); });
  (document.getElementById('hud')||document.body).parentNode.appendChild(b);
  PLAY._dodgeBtn=b;
}
if(document.readyState==='loading') addEventListener('DOMContentLoaded',hookTouch); else hookTouch();

/* controllers: every game gets them (BERĔSHITH polled its own; the rest now do too) */
const padPrev={};
const nativePad=typeof Input.pollGamepad==='function';
if(!nativePad){
  Input.pad={x:0,y:0,active:false};
  const _mv=Input.moveVec.bind(Input);
  Input.moveVec=function(){ const v=_mv(); if(this.pad&&this.pad.active&&!this.joy.active&&!v.x&&!v.y) return {x:this.pad.x,y:this.pad.y}; return v; };
}
function pollPads(){
  let gp=null; try{ for(const g of (navigator.getGamepads?navigator.getGamepads():[])){ if(g&&g.connected){ gp=g; break; } } }catch(e){}
  if(!gp){ held.pad=false; if(!nativePad&&Input.pad.active) Input.pad={x:0,y:0,active:false}; return; }
  const btn=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed);
  const edge=(i,fn)=>{ const p=btn(i); if(p&&!padPrev[i]){ lastDevice='pad'; fn(); } padPrev[i]=p; };
  if(!nativePad){
    const dz=.25; let ax=gp.axes[0]||0, ay=gp.axes[1]||0; if(Math.abs(ax)<dz) ax=0; if(Math.abs(ay)<dz) ay=0;
    if(btn(14)) ax=-1; if(btn(15)) ax=1; if(btn(12)) ay=-1; if(btn(13)) ay=1;
    const m=Math.hypot(ax,ay); if(m>1){ ax/=m; ay/=m; }
    Input.pad.x=ax; Input.pad.y=ay; Input.pad.active=(ax!==0||ay!==0); if(Input.pad.active) lastDevice='pad';
    edge(0,()=>Game.onAction()); edge(9,()=>Game.onAction()); edge(1,()=>Game.onEscape&&Game.onEscape());
  }
  edge(2,()=>PLAY.dodge()); edge(5,()=>PLAY.dodge());
  held.pad=btn(0); if(held.pad) lastDevice='pad';
}

/* ---------------------------------------------------------------- the skirmish */
const C={active:false,stats:{frames:0,swings:0,landed:0,guarded:0,taken:0},hp:5,max:5,inv:0,falls:0,swingT:-9e9,swingA:0,combo:0,lastSwing:-9e9,buffer:false,
         dashT:-9e9,dashCD:0,dashV:[0,0],hitstop:0,redT:-9e9,p0:null,foes:[],fallT:-9e9,tokens:2};
PLAY.combat=C;
const fighting=()=>{ const b=Game.battle; return !!(PLAY.on&&b&&b.phase!=='rally'&&Game.state==='play'&&Game.world&&Game.world.player&&!Game.dlgChar); };
const chasing=()=>{ const w=Game.world; return !!(PLAY.on&&Game.state==='play'&&w&&w.npcs&&w.npcs.some(n=>n.chase&&!n.hidden&&!n.lying)); };
function begin(G){
  const w=G.world, p=w.player;
  C.active=true; C.stats={frames:0,swings:0,landed:0,guarded:0,taken:0}; C.hp=C.max; C.inv=now()+600; C.falls=0; C.combo=0; C.p0=[p.x,p.y]; C.buffer=false;
  C.foes=w.npcs.filter(n=>n.foe&&!n.hidden&&!n.lying);
  C.foes.forEach((n,i)=>{ n.hp=(n.hp||2)*3; n._c={st:'approach',t:now(),cd:now()+500+i*450,hpMax:n.hp,x0:n.x,y0:n.y,kb:[0,0],flash:0,orbit:(i/Math.max(1,C.foes.length))*Math.PI*2}; });
}
function end(){ C.active=false; const p=Game.world&&Game.world.player; if(p) p.alpha=undefined; }
function windupMs(){ return 640+C.falls*170; }
function blink(p,t){ if(t<C.inv){ p.alpha=Math.floor(t/90)%2?.45:1; C.blinking=true; } else if(C.blinking){ p.alpha=undefined; C.blinking=false; } }
function faceTo(e,dx,dy){ e.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down'); }
function push(m,e,vx,vy){ const nx=e.x+vx, ny=e.y+vy;
  if(!canWalk(m,e.x,e.y)){ e.x=nx; e.y=ny; return; }                /* set down inside a wall or a house: it walks out */
  if(canWalk(m,nx,e.y,e.x,e.y)) e.x=nx; if(canWalk(m,e.x,ny,e.x,e.y)) e.y=ny; }
function hurtPlayer(G,from){
  const p=G.world.player;
  if(now()<C.inv||now()<C.dashT+300) return false;
  C.hp--; C.stats.taken++; C.inv=now()+1000; C.redT=now(); C.hitstop=90;
  const a=Math.atan2(p.y-from.y,p.x-from.x); for(let k=0;k<6;k++) push(G.world.map,p,Math.cos(a)*.16,Math.sin(a)*.16);
  Camera.shake=Math.max(Camera.shake||0,3.2); sfx('hurt'); rumble(.8,.5,220);
  if(C.hp<=0) fall(G);
  return true;
}
function fall(G){
  const w=G.world, p=w.player;
  C.falls++; C.hp=C.max; C.inv=now()+1800; C.fallT=now(); sfx('fall');
  if(typeof toast==='function') toast(C.falls===1?'You fall — but rise, and fight on!':'Rise again — the foes grow weary.');
  if(C.p0){ p.x=C.p0[0]; p.y=C.p0[1]; }
  for(const n of C.foes){ if(n.lying) continue; const c=n._c; n.hp=c.hpMax; n.x=c.x0; n.y=c.y0; c.st='approach'; c.cd=now()+900; c.kb=[0,0]; }
}
function killFoe(G,n){
  const b=G.battle; n.foe=false; n.lying=true; n.moving=false; n.noTalk=true; n.target=null;
  b.left--; sfx('heavy');
  if(b.left>0){}                                          /* the panel keeps the count */
  else if(b.rally){
    b.phase='rally'; b.deadUntil=G.t+800;
    if(typeof toast==='function') toast(b.won||'The foes are fallen'); if(typeof Sound!=='undefined') Sound.sfx('chime');
    G.world.gotoMark={x:b.rally[0],y:b.rally[1]}; end();
  } else {
    const cb=b.onDone, won=b.won; G.battle=null;
    if(typeof toast==='function') toast(won||'The foes are fallen'); if(typeof Sound!=='undefined') Sound.sfx('chime');
    if(G.endSkirmish) G.endSkirmish(); end();
    if(cb) cb();
  }
}
PLAY.attack=function(G){
  G=G||Game; const w=G.world, p=w.player, t=now();
  if(t<C.swingT+300){ C.buffer=true; return; }
  C.buffer=false;
  /* aim: toward the nearest foe close by (a helping hand), else the way you face */
  let tgt=null, bd=2.6;
  for(const n of C.foes){ if(n.lying) continue; const d=dist2(p.x,p.y,n.x,n.y); if(d<bd){ bd=d; tgt=n; } }
  const dirA={left:Math.PI,right:0,up:-Math.PI/2,down:Math.PI/2}[p.dir]||0;
  const a=tgt?Math.atan2(tgt.y-p.y,tgt.x-p.x):dirA;
  if(tgt) faceTo(p,tgt.x-p.x,tgt.y-p.y);
  C.stats.swings++; C.combo=(t-C.lastSwing<750)?C.combo+1:1; C.lastSwing=t; C.swingT=t; C.swingA=a;
  sfx('swing');
  let hitAny=false, blocked=false;
  for(const n of C.foes){
    if(n.lying) continue;
    const dx=n.x-p.x, dy=n.y-p.y, d=Math.hypot(dx,dy); if(d>1.8) continue;
    let da=Math.abs(Math.atan2(dy,dx)-a); if(da>Math.PI) da=Math.PI*2-da;
    if(d>.55&&da>1.25) continue;
    const c=n._c;
    /* a foe on guard turns an idle blow aside: strike while it gathers itself or as it recovers */
    if(c.st==='approach'&&Math.random()<Math.max(.15,.6-C.falls*.15)){ c.guardT=t; c.cd=Math.min(c.cd,t+150); blocked=true;
      if(typeof Particles!=='undefined') Particles.burst(n.x*TILE,(n.y-.6)*TILE,'spark',4); continue; }
    hitAny=true;
    const heavy=C.combo>=3;
    n.hp=(n.hp||1)-1; c.flash=t;
    const k=heavy?1.7:1; c.kb=[Math.cos(Math.atan2(dy,dx))*.11*k,Math.sin(Math.atan2(dy,dx))*.11*k];
    /* a blow gathered past its start is not stopped — step aside from it; a recovering foe reels */
    if(c.st==='recover'||(c.st==='windup'&&t-c.t<windupMs()*.25)){ c.st='stagger'; c.t=t; }
    if(typeof Particles!=='undefined') Particles.burst(n.x*TILE,n.y*TILE,'spark',heavy?16:9);
    if(n.hp<=0){ killFoe(G,n); if(!G.battle||G.battle.phase==='rally') break; }
  }
  if(hitAny) C.stats.landed++; else if(blocked) C.stats.guarded++;
  if(blocked&&!hitAny){ sfx('clang'); C.combo=0; Camera.shake=Math.max(Camera.shake||0,.8); }
  if(hitAny){ const hv=C.combo>=3; C.hitstop=hv?110:65; Camera.shake=Math.max(Camera.shake||0,hv?2.6:1.5); sfx(hv?'heavy':'hit'); rumble(.35,.25,80); if(hv) C.combo=0; }
};
PLAY.dodge=function(){
  const G=Game; if(!(fighting()||chasing())) return;
  const w=G.world, p=w.player, t=now(); if(t<C.dashCD) return;
  let v=Input.moveVec?Input.moveVec():{x:0,y:0};
  if(!v.x&&!v.y){ let nn=null,bd=9; for(const n of w.npcs){ if(!(n.foe||n.chase)||n.lying||n.hidden) continue; const d=dist2(p.x,p.y,n.x,n.y); if(d<bd){ bd=d; nn=n; } }
    if(nn){ const a=Math.atan2(p.y-nn.y,p.x-nn.x); v={x:Math.cos(a),y:Math.sin(a)}; } else { const a={left:Math.PI,right:0,up:-Math.PI/2,down:Math.PI/2}[p.dir]||0; v={x:Math.cos(a),y:Math.sin(a)}; } }
  const m=Math.hypot(v.x,v.y)||1; C.dashV=[v.x/m,v.y/m]; C.dashT=t; C.dashCD=t+650; sfx('dodge');
  if(typeof Particles!=='undefined') Particles.burst(p.x*TILE,p.y*TILE+TILE*.3,'mote',6);
};
function combat(G,dt){
  const w=G.world, p=w.player, t=now(), m=w.map;
  /* the dodge: a quick dash, untouchable while it lasts */
  if(t<C.dashT+190){ const s=dt*.0085; push(m,p,C.dashV[0]*s,C.dashV[1]*s); }
  blink(p,t);
  if(C.buffer&&t>=C.swingT+300) PLAY.attack(G);
  const live=C.foes.filter(n=>!n.lying);
  let busy=live.filter(n=>n._c&&(n._c.st==='windup'||n._c.st==='strike')).length;
  const tokens=C.falls>=2?1:2;
  live.forEach((n,i)=>{
    const c=n._c; if(!c) return;
    /* knocked back */
    if(Math.abs(c.kb[0])+Math.abs(c.kb[1])>.002){ push(m,n,c.kb[0]*dt/16,c.kb[1]*dt/16); c.kb[0]*=Math.pow(.82,dt/16); c.kb[1]*=Math.pow(.82,dt/16); }
    const dx=p.x-n.x, dy=p.y-n.y, d=Math.hypot(dx,dy)||1e-6;
    const spd=(n.foeSpeed||.045)*.06*(1-Math.min(.35,C.falls*.08));
    n.target=null;
    switch(c.st){
      case 'approach': {
        /* close in — but if others are already striking, circle at a distance */
        const wait=busy>=tokens||t<c.cd;
        let gx=p.x, gy=p.y;
        if(wait){ c.orbit+=dt*.0006*(i%2?1:-1); const r=2.1; gx=p.x+Math.cos(c.orbit)*r; gy=p.y+Math.sin(c.orbit)*r; }
        const ex=gx-n.x, ey=gy-n.y, ed=Math.hypot(ex,ey);
        if(ed>.2){ push(m,n,ex/ed*spd*dt,ey/ed*spd*dt); n.moving=true; } else n.moving=false;
        faceTo(n,dx,dy);
        if(!wait&&d<1.45){ c.st='windup'; c.t=t; busy++; n.moving=false; sfx('warn'); }
        break; }
      case 'windup': {
        n.moving=false; faceTo(n,dx,dy);
        if(t-c.t>windupMs()){ c.st='strike'; c.t=t; const a=Math.atan2(dy,dx), L=Math.min(d,1.15); c.lunge=[Math.cos(a)*L,Math.sin(a)*L]; c.hit=false; }
        break; }
      case 'strike': {
        const k=Math.min(1,(t-c.t)/160), prev=c.lk||0; c.lk=k;
        push(m,n,c.lunge[0]*(k-prev),c.lunge[1]*(k-prev)); n.moving=true;
        if(!c.hit&&k>=.5){ c.hit=true; if(dist2(n.x,n.y,p.x,p.y)<.95) hurtPlayer(G,n); }
        if(k>=1){ c.st='recover'; c.t=t; c.lk=0; }
        break; }
      case 'recover': { n.moving=false; if(t-c.t>560){ c.st='approach'; c.cd=t+700+Math.random()*700; } break; }
      case 'stagger': { n.moving=false; if(t-c.t>320){ c.st='approach'; c.cd=t+500+Math.random()*500; } break; }
    }
    /* never stand inside the player */
    if(d<.55&&c.st!=='strike'){ push(m,n,-dx/d*.02*dt/16,-dy/d*.02*dt/16); }
  });
}

/* ---------------------------------------------------------------- hooks */
const _update=Game.update;
Game.update=function(dt){
  const f=fighting();
  if(f&&!C.active) begin(this);
  if(!f&&C.active&&!(this.battle&&this.battle.phase!=='rally')) end();
  let off=null;
  if(f){ off=this.world.npcs.filter(n=>n.foe&&!n.lying); for(const n of off) n.foe=false;   /* the old shoving is replaced by the fight below */
    if(C.hitstop>0){ C.hitstop-=dt; dt*=.2; } }
  else if(chasing()){ const p=this.world.player;
    if(now()<C.dashT+190) push(this.world.map,p,C.dashV[0]*dt*.0085,C.dashV[1]*dt*.0085);
    /* a pursuer that reaches you throws you forward and must gather itself again — unless the story
       itself says what a catch means (the garment left in her hand) */
    if(!(this.flags&&this.flags.chase)&&now()>C.inv&&now()>C.dashT+300){
      for(const n of this.world.npcs){ if(!n.chase||n.hidden||n.lying) continue;
        if(Math.hypot(n.x-p.x,n.y-p.y)<.75){ const a=Math.atan2(p.y-n.y,p.x-n.x);
          for(let k=0;k<8;k++) push(this.world.map,p,Math.cos(a)*.14,Math.sin(a)*.14);
          C.inv=now()+1400; C.redT=now(); Camera.shake=Math.max(Camera.shake||0,3); sfx('hurt'); rumble(.7,.4,200);
          n._paused=now()+1100; n._spd=n.chaseSpeed; n.chaseSpeed=.001; n.target=null;
          if(typeof toast==='function') toast('It is upon you — run!'); break; } }
      for(const n of this.world.npcs){ if(n._paused&&now()>n._paused){ n.chaseSpeed=n._spd; n._paused=0; } }
    }
    blink(p,now()); }
  else if(C.blinking&&this.world&&this.world.player){ this.world.player.alpha=undefined; C.blinking=false; }
  let r;
  try{ r=_update.call(this,dt); } finally{ if(off) for(const n of off) if(!n.lying) n.foe=true; }
  if(f&&this.battle&&this.battle.phase!=='rally'){ C.stats.frames++; combat(this,dt); }
  if(this.mash&&(held.key||held.pad||held.touch)){ if(now()-(C.mashAuto||0)>190){ C.mashAuto=now(); this.onAction(); } }
  if(PLAY._dodgeBtn){ const show=document.body.classList.contains('touch')&&(fighting()||chasing()); PLAY._dodgeBtn.style.display=show?'flex':'none'; }
  return r;
};
const _onAction=Game.onAction;
Game.onAction=function(){
  if(fighting()&&!this.mash){ if(typeof Sound!=='undefined'&&Sound.init) Sound.init(); if(!C.active) begin(this); PLAY.attack(this); return; }   /* a blow in the very first moment of a fight */
  if(this.mash&&this.state==='play'&&!this.dlgChar) C.mashPress=now();
  return _onAction.apply(this,arguments);
};
(function loop(){ try{ pollPads(); }catch(e){} requestAnimationFrame(loop); })();

/* ---------------------------------------------------------------- drawing */
const promptKey=()=>lastDevice==='pad'?'A':(lastDevice==='touch'?'✦':'E');
const dodgeKey=()=>lastDevice==='pad'?'X':(lastDevice==='touch'?'⤳':'Shift');
function screen(x,y){ return [x*TILE-Camera.x+VW/2, y*TILE-Camera.y+VH/2]; }
if(typeof drawWorld==='function'){
  const _dw=window.drawWorld;
  window.drawWorld=function(g,world,t){
    _dw.apply(this,arguments);
    if(!C.active||!Game.battle||world!==Game.world) return;
    const tt=now(), p=world.player;
    g.save();
    for(const n of C.foes){ if(n.lying||!n._c) continue; const c=n._c, [sx,sy]=screen(n.x,n.y);
      if(c.st==='windup'){ const k=cl((tt-c.t)/windupMs(),0,1);                  /* the blow gathering */
        g.fillStyle=`rgba(220,40,30,${(.15+.35*k).toFixed(3)})`; g.beginPath(); g.ellipse(sx,sy+2,TILE*(.5+.5*k),TILE*(.2+.18*k),0,0,Math.PI*2); g.fill();
        g.fillStyle=`rgba(255,${(220-160*k)|0},60,.95)`; g.font=`bold ${Math.round(TILE*.55)}px Georgia`; g.textAlign='center'; g.fillText('!',sx,sy-TILE*2.05-Math.sin(tt/60)*2); }
      if(c.st==='strike'){ g.strokeStyle='rgba(255,230,200,.55)'; g.lineWidth=3; g.beginPath(); g.moveTo(sx-c.lunge[0]*TILE*.8,sy-TILE*.6-c.lunge[1]*TILE*.8); g.lineTo(sx,sy-TILE*.6); g.stroke(); }
      if(tt-(c.guardT||-9e9)<220){ const k=1-(tt-c.guardT)/220, a=Math.atan2(p.y-n.y,p.x-n.x);          /* turned aside */
        g.strokeStyle=`rgba(210,220,235,${(.9*k).toFixed(3)})`; g.lineWidth=3; g.beginPath(); g.arc(sx,sy-TILE*.6,TILE*.55,a-.9,a+.9); g.stroke(); }
      const hm=c.hpMax, bw=Math.max(18,hm*9), x0=sx-bw/2, y0=sy-TILE*1.75;             /* its strength */
      g.fillStyle='rgba(10,8,6,.7)'; g.fillRect(x0-1,y0-1,bw+2,6);
      for(let k=0;k<hm;k++){ g.fillStyle=k<n.hp?'#d8503a':'rgba(120,110,100,.5)'; g.fillRect(x0+k*(bw/hm)+1,y0,bw/hm-2,4); } }
    /* the swing */
    const sk=(tt-C.swingT)/260;
    if(sk>=0&&sk<1){ const [px,py]=screen(p.x,p.y), R=TILE*1.35, a=C.swingA, sp=1.35;
      g.strokeStyle=`rgba(255,240,200,${(.85*(1-sk)).toFixed(3)})`; g.lineWidth=TILE*.16*(1-sk*.6); g.lineCap='round';
      g.beginPath(); g.arc(px,py-TILE*.5,R*(.8+sk*.2),a-sp*(1-sk*.3),a-sp+sp*2*Math.min(1,sk*1.8)); g.stroke();
      g.strokeStyle=`rgba(255,200,90,${(.5*(1-sk)).toFixed(3)})`; g.lineWidth=2; g.beginPath(); g.arc(px,py-TILE*.5,R*1.05,a-sp,a-sp+sp*2*Math.min(1,sk*1.8)); g.stroke(); }
    /* the dodge */
    if(tt<C.dashT+220){ const [px,py]=screen(p.x,p.y); for(let k=1;k<=3;k++){ g.fillStyle=`rgba(230,220,200,${(.18-.05*k).toFixed(3)})`; g.beginPath(); g.ellipse(px-C.dashV[0]*k*TILE*.35,py-TILE*.5-C.dashV[1]*k*TILE*.35,TILE*.3,TILE*.6,0,0,Math.PI*2); g.fill(); } }
    g.restore();
  };
}
if(typeof drawChar==='function'){
  const _dc=window.drawChar;
  window.drawChar=function(g,px,py,id,o){
    if(C.active){ const tt=now();
      for(const n of C.foes){ const c=n._c; if(!c||n.lying||tt-c.flash>=120) continue;
        const [sx,sy]=screen(n.x,n.y); if(Math.abs(sx-px)<6&&Math.abs(sy-py)<6){ g.save(); g.filter='brightness(2.4) saturate(.4)'; try{ return _dc.apply(this,arguments); } finally{ g.restore(); } } } }
    return _dc.apply(this,arguments);
  };
}
function heart(g,x,y,s,full){
  g.beginPath(); g.moveTo(x,y+s*.3); g.bezierCurveTo(x,y,x-s*.5,y,x-s*.5,y+s*.3); g.bezierCurveTo(x-s*.5,y+s*.6,x,y+s*.78,x,y+s); g.bezierCurveTo(x,y+s*.78,x+s*.5,y+s*.6,x+s*.5,y+s*.3); g.bezierCurveTo(x+s*.5,y,x,y,x,y+s*.3); g.closePath();
  g.fillStyle=full?'#d8443a':'rgba(60,40,36,.7)'; g.fill(); g.strokeStyle='rgba(20,10,8,.8)'; g.lineWidth=1.5; g.stroke();
  if(full){ g.fillStyle='rgba(255,220,200,.55)'; g.beginPath(); g.ellipse(x-s*.22,y+s*.24,s*.1,s*.07,-.6,0,Math.PI*2); g.fill(); }
}
if(typeof drawBattleUI==='function'){
  const _bui=window.drawBattleUI;
  window.drawBattleUI=function(g,b,t){
    if(!PLAY.on||!C.active||b.phase==='rally') return _bui.apply(this,arguments);
    const tt=now();
    /* struck: a red edge to the view */
    if(tt-C.redT<320){ const k=1-(tt-C.redT)/320; const gr=g.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*.3,VW/2,VH/2,Math.max(VW,VH)*.7); gr.addColorStop(0,'rgba(160,0,0,0)'); gr.addColorStop(1,`rgba(170,10,10,${(.45*k).toFixed(3)})`); g.fillStyle=gr; g.fillRect(0,0,VW,VH); }
    if(tt-C.fallT<900){ g.fillStyle=`rgba(0,0,0,${(.6*(1-(tt-C.fallT)/900)).toFixed(3)})`; g.fillRect(0,0,VW,VH); }
    const w=Math.min(600,VW*.9), x=VW/2-w/2, y=Math.max(52,VH*.085);
    g.save();
    g.fillStyle='rgba(10,14,26,.78)'; g.strokeStyle='rgba(200,74,58,.55)'; g.lineWidth=1.5;
    g.beginPath(); if(g.roundRect) g.roundRect(x,y,w,54,10); else g.rect(x,y,w,54); g.fill(); g.stroke();
    for(let k=0;k<C.max;k++) heart(g,x+22+k*22,y+10,17,k<C.hp);
    g.textAlign='center'; g.fillStyle='#f5ecd6'; g.font='italic 14px Georgia';
    g.fillText(b.text||'Fight!',VW/2,y+21);
    g.font='12px Georgia'; g.fillStyle='rgba(232,198,106,.95)';
    g.fillText(`${promptKey()} strike   ·   ${dodgeKey()} dodge   ·   when a foe gathers himself (!) step aside, then strike`,VW/2,y+42);
    g.textAlign='right'; g.fillStyle='#e8dfc8'; g.font='bold 13px Georgia';
    g.fillText('Foes '+b.left,x+w-14,y+21);
    if(C.combo>=2&&tt-C.lastSwing<750){ g.fillStyle='#ffd070'; g.fillText(C.combo+' in a row',x+w-14,y+42); }
    g.restore();
  };
}
if(typeof drawMashUI==='function'){
  window.drawMashUI=function(g,m,t){
    if(!PLAY.on) return;
    const tt=now(), W=Math.min(560,VW*.86), x=VW/2-W/2, y=VH-Math.max(120,VH*.22);
    g.save();
    g.fillStyle='rgba(10,14,26,.84)'; g.strokeStyle='rgba(232,198,106,.5)'; g.lineWidth=1.5;
    g.beginPath(); if(g.roundRect) g.roundRect(x-16,y-44,W+32,108,12); else g.rect(x-16,y-44,W+32,108); g.fill(); g.stroke();
    g.textAlign='center'; g.fillStyle='#f5ecd6'; g.font='italic 15px Georgia';
    g.fillText(m.text||'Hold on until the day breaks!',VW/2+30,y-20);
    /* the button to press, pulsing with each press, its ring the grip */
    const bx=x+34, by=y+14, pk=cl(1-(tt-(C.mashPress||-9e9))/160,0,1), R=26+pk*5, grip=cl(m.grip,0,1);
    g.fillStyle=grip>.3?'rgba(232,198,106,.16)':'rgba(200,60,40,.2)'; g.beginPath(); g.arc(bx,by,R+8,0,Math.PI*2); g.fill();
    g.strokeStyle='rgba(255,255,255,.12)'; g.lineWidth=6; g.beginPath(); g.arc(bx,by,R+4,0,Math.PI*2); g.stroke();
    g.strokeStyle=grip>.3?'#e8c66a':'#d8503a'; g.beginPath(); g.arc(bx,by,R+4,-Math.PI/2,-Math.PI/2+Math.PI*2*grip); g.stroke();
    g.fillStyle=`rgb(${40+pk*60|0},${34+pk*50|0},${22+pk*30|0})`; g.beginPath(); g.arc(bx,by,R-2,0,Math.PI*2); g.fill();
    g.fillStyle='#fff3cf'; g.font=`bold ${Math.round(18+pk*4)}px Georgia`; g.textBaseline='middle'; g.fillText(promptKey(),bx,by+1); g.textBaseline='alphabetic';
    /* the dawn coming */
    const bx0=x+84, bw=W-84;
    g.fillStyle='rgba(170,200,255,.14)'; g.fillRect(bx0,y+4,bw,10);
    const dg=g.createLinearGradient(bx0,0,bx0+bw,0); dg.addColorStop(0,'#46608a'); dg.addColorStop(1,'#f6d690'); g.fillStyle=dg; g.fillRect(bx0,y+4,bw*cl(m.prog,0,1),10);
    g.strokeStyle='rgba(170,200,255,.35)'; g.strokeRect(bx0+.5,y+4.5,bw,10);
    for(const q of [.34,.7]){ g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(bx0+bw*q,y+2,1.5,14); }
    g.font='10px Georgia'; g.textAlign='center'; g.fillStyle='#9d987f'; g.fillText(m.barA||'YOUR GRIP',bx,by+R+15);     /* the ring is the grip */
    g.font='11px Georgia'; g.textAlign='right'; g.fillText(m.barB||'UNTIL DAY BREAKS',bx0+bw,y+30);
    const pul=.5+Math.sin(tt/220)*.5; g.textAlign='center'; g.fillStyle=`rgba(255,243,207,${(.45+pul*.5).toFixed(3)})`; g.font='12px Georgia';
    g.fillText(grip<.3?'Your grip is slipping — press faster!':`Press ${promptKey()} again and again — or hold it down`,bx0+bw/2,y+50);
    g.restore();
  };
}
})();
