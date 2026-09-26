/* face.js — faces that feel what the scene feels, and mouths that move with the voice.

   Every face is drawn from an expression: calm, stern, sorrow, weep, fear, anger, joy, awe, and
   eyes closed in prayer, in sleep or in death. The brows, the lids and the gaze, and the shape of
   the mouth, follow it; only joy turns the mouth up.

   Where the expression comes from:
     · one who is speaking: the words being said ("I weep", "rejoice", "be afraid")
     · in a staged telling: the pose the verse gives (weeping, praying, fighting, fleeing), else
       the words of the part being read when they name that person
     · in battle: the fury of the field; lying down: eyes closed
     · otherwise the mood of the scene (its music: sorrow, tension)
   The mouth of whoever is speaking opens and closes with the recording being played, vowel by
   vowel (voice.js keeps the timing); the portrait in the dialogue box speaks too.

   The in-game figures take this through drawChar (each game draws its eyes and mouth only when
   this file is absent); the staged figures through cinema.js's drawFigure. */
(function(){
'use strict';
const W=window;
const game=()=>typeof Game!=='undefined'?Game:null;
const chars=()=>typeof CHARS!=='undefined'?CHARS:{};
const snd=()=>typeof Sound!=='undefined'?Sound:null;
const voice=()=>W.Voice||null;
const shadeC=(c,a)=>typeof shade==='function'?shade(c,a):c;

/* ------------------------------------------------------------ what a face should show */
const WORDS=[
  ['weep',  /\b(wept|weep|weeps|weeping|tears|wail\w*|mourn\w*|lament\w*|sackcloth)\b/i,3],
  ['sorrow',/\b(sorrow\w*|griev\w*|grief|sad|sadness|bitter\w*|woe|alas|forsaken|desolate|ashamed|shame|broken|heavy|lost|alone|dead|died|die\b)/i,2],
  ['fear',  /\b(afraid|fear\w*|terr\w+|trembl\w+|dread|help me|save me|flee|fled|hide|run)\b/i,2],
  ['anger', /\b(wrath|anger|angry|furious|fury|rage|curse[ds]?|how dare|fools?|liars?|kill|slay|destroy|smite|smote|never|away with)\b/i,2],
  ['joy',   /\b(rejoic\w*|joy\w*|glad\w*|laugh\w*|halleluyah|praise[ds]?|sing|sang|danc\w+|delight\w*|good news|feast|blessed be|thank\w*)\b/i,2],
  ['awe',   /\b(behold|glory|wonder\w*|marvel\w*|amazed|astonish\w*|holy|qadosh|fire from|fell on (his|their) faces?)\b/i,2]
];
function ofText(t){
  if(!t) return null;
  const s=String(t); let best=null, bs=0;
  for(const [e,re,w] of WORDS){ const m=s.match(new RegExp(re.source,'gi')); if(m){ const sc=m.length*w; if(sc>bs){ bs=sc; best=e; } } }
  if(best) return best;
  const caps=(s.match(/\b[A-Z]{3,}\b/g)||[]).filter(w=>!/^(YAHUAH|HWHY|ALUAHIM|I)$/.test(w)).length;
  if(caps>=2||/!{2,}/.test(s)) return 'anger';
  if(/!\s*$/.test(s)&&/\b(no|stop|go|get|out|enough)\b/i.test(s)) return 'stern';
  return null;
}
const POSE={ weep:'weep', mourn:'weep', pray:'pray', bow:'awe', kneel:'awe', raise:'awe', look:'awe', dance:'joy',
  fight:'anger', strike:'anger', flee:'fear', fall:'fear', bound:'sorrow', dead:'dead', lie:'rest', point:'stern',
  enthroned:'stern', bless:'calm', sitground:'sorrow' };
function ofMood(m){ return m==='sorrow'?'sorrow':m==='tense'||m==='storm'?'stern':null; }

/* ------------------------------------------------------------ the expressions */
/* open: how open the eyes (1 as at rest), lid: how far the upper lid comes down, low: the lower
   lid rising (the eyes of joy), gaze: -1 up … 1 down, bi/bo: the brow's inner and outer end
   (negative raised), mouth: its shape at rest */
const X={
  calm:  {open:1,   lid:.12,low:0,  gaze:0,   bi:0,   bo:0,   mouth:'flat'},
  stern: {open:.8,  lid:.32,low:0,  gaze:0,   bi:.28, bo:-.06,mouth:'tight'},
  anger: {open:.72, lid:.42,low:.1, gaze:0,   bi:.55, bo:-.25,mouth:'tight',thick:1},
  sorrow:{open:.8,  lid:.38,low:0,  gaze:.6,  bi:-.5, bo:.12, mouth:'down'},
  weep:  {closed:1, tears:1,        gaze:0,   bi:-.55,bo:.16, mouth:'cry'},
  fear:  {open:1.3, lid:0,  low:0,  gaze:0,   bi:-.65,bo:-.4, mouth:'o'},
  awe:   {open:1.22,lid:0,  low:0,  gaze:-.7, bi:-.5, bo:-.45,mouth:'o'},
  joy:   {open:.85, lid:.05,low:.35,gaze:0,   bi:-.18,bo:-.22,mouth:'up'},
  pray:  {closed:1,                 gaze:0,   bi:-.1, bo:0,   mouth:'flat'},
  rest:  {closed:1,                 gaze:0,   bi:0,   bo:0,   mouth:'flat'},
  dead:  {closed:1,                 gaze:0,   bi:0,   bo:.1,  mouth:'flat'}
};

/* ------------------------------------------------------------ the in-game figures */
const IRIS='#1c120b', WHITE='#e7ddcf', TEAR='#a6d8ff', INSIDE='#3a1810';
function browCol(c){ const h=c.hair||'#2c1a0c'; const m=/^#?([0-9a-f]{6})$/i.exec(h); if(!m) return h;
  const n=parseInt(m[1],16), l=((n>>16&255)+(n>>8&255)+(n&255))/765; return l>.55?shadeC(h,-38):h; }
/* one eye: box at x (width w), the top of the eye at y0 (2 tall at rest) */
function spriteEye(R,x,w,y0,E,skin,irisX,iw){
  iw=iw||1;
  const lidC=shadeC(skin,-22);
  if(E.closed){ R(x,y0+1.1,w,.5,IRIS); return; }
  const h=Math.min(2.2,1.6*E.open), top=y0+(2-h)/2+E.lid*h*.6, bot=y0+(2+h)/2-E.low*h*.6, hh=Math.max(.5,bot-top);
  R(x,top,w,hh,WHITE);
  const ih=Math.min(hh,1.2), iy=Math.max(top,Math.min(bot-ih,top+(hh-ih)/2+E.gaze*.35));
  R(irisX,iy,iw,ih,IRIS);
  if(E.lid>.2) R(x-.1,top-.4,w+.2,.45,lidC);
}
function spriteMouth(R,x,y,w,E,m,skin,side){
  const lip=shadeC(skin,-34);
  if(m!=null&&m>.02){ const h=.35+m*1.4, ww=w*.8+m*.35; R(x+(w-ww)/2+(side?.3:0),y-.3,ww,h,INSIDE); return; }
  switch(E.mouth){
    case 'tight': R(x-(side?0:.3),y,w+(side?0:.6),.5,shadeC(skin,-44)); break;
    case 'down':  R(x+.4,y-.1,w-.8,.5,lip); if(!side) R(x,y+.3,.55,.5,lip); R(x+w-.55,y+.3,.55,.5,lip); if(side) R(x,y+.3,.55,.5,lip); break;
    case 'up':    R(x+.4,y+.1,w-.8,.5,lip); if(!side) R(x,y-.3,.55,.5,lip); R(x+w-.55,y-.3,.55,.5,lip); if(side) R(x,y-.3,.55,.5,lip); break;
    case 'cry':   R(x+.2,y-.4,w-.4,1.1,INSIDE); R(x-.1,y+.4,.5,.5,lip); R(x+w-.4,y+.4,.5,.5,lip); break;
    case 'o':     R(x+w/2-.55,y-.45,1.1,1.1,INSIDE); break;
    default:      R(x+.1,y,w-.2,.55,lip);
  }
}
/* facing us */
function spriteFront(R,c,B,o,skin){
  const E=X[o.expr]||X.calm, bc=browCol(c), th=E.thick?.7:.55, y0=-21+B;
  spriteEye(R,-2.9,1.8,y0,E,skin,-2.5);        /* both looking ahead */
  spriteEye(R,1.1,1.8,y0,E,skin,1.5);
  if(E.tears){ R(-2.8,y0+1.7,.5,1.5,TEAR); R(2.4,y0+1.7,.5,1.5,TEAR); }
  const by=-22.25+B;
  R(-3.1,by+E.bo*.8,1.15,th,bc); R(-1.95,by+E.bi*.8,1.1,th,bc);    /* the left brow: outer, inner */
  R(0.85,by+E.bi*.8,1.1,th,bc);  R(1.95,by+E.bo*.8,1.15,th,bc);    /* the right brow: inner, outer */
  if(c.veil) return;
  const m=o.mouth;
  if(c.beard){ if((m!=null&&m>.02)||E.mouth==='cry'||E.mouth==='o') spriteMouth(R,-1,-16.2+B,2,E,m,shadeC(c.beard,-10),false); return; }
  spriteMouth(R,-1,-17.1+B,2,E,m,skin,false);
}
/* in profile, facing right (the game mirrors it for the left) */
function spriteSide(R,c,B,o,skin){
  const E=X[o.expr]||X.calm, bc=browCol(c), th=E.thick?.7:.55, y0=-21+B;
  spriteEye(R,2,1.5,y0,E,skin,2.62,.8);
  if(E.tears) R(2.4,y0+1.7,.5,1.5,TEAR);
  const by=-22.25+B;
  R(1.7,by+E.bo*.8,1.1,th,bc); R(2.8,by+E.bi*.8,1.2,th,bc);      /* back end, front (inner) end */
  if(c.veil) return;
  const m=o.mouth;
  if(c.beard){ if((m!=null&&m>.02)||E.mouth==='cry'||E.mouth==='o') spriteMouth(R,3,-16.3+B,1.6,E,m,shadeC(c.beard,-10),true); return; }
  spriteMouth(R,2.8,-17.1+B,1.8,E,m,skin,true);
}
/* what the figure of a character should show just now, in the world */
function samePerson(a,b){ const V=voice(); if(a===b) return true; if(!V||!V.person) return false; const A=V.person(a), P=V.person(b); return A.key===P.key; }
function spriteExpr(id,o){
  if(o.lying) return o.dead?'dead':'rest';
  const V=voice(), G=game();
  const said=(V&&V.saying&&V.saying(id))||(G&&G.dlgChar&&G.dlgText&&samePerson(G.dlgChar,id)?G.dlgText:null);
  if(said){ const e=ofText(said); if(e) return e; }
  if(G&&G.battle&&G.battle.phase!=='rally'){ const p=G.world&&G.world.player; return p&&p.char===id?'stern':'anger'; }
  const S=snd(); return ofMood(S&&S.mood)||'calm';
}

/* ------------------------------------------------------------ the staged figures */
/* the face drawn in profile, facing +x, in the head's own frame (radius hr) — for cinema.js */
function profile(g,hr,L,e,m,ow,skin,t,eyeOpen){
  const E=Object.assign({},X[e]||X.calm); if(!eyeOpen&&!E.closed) E.closed=1;
  const P=v=>v*hr, dark='#1a120a';
  const lidC=(typeof shd==='function'?shd:(c)=>c)(skin,-.24);
  /* the eye */
  const ex=P(.52), ey=P(-.12);
  if(E.closed){
    g.strokeStyle=dark; g.lineWidth=ow; g.lineCap='round'; g.beginPath(); g.moveTo(P(.38),ey+P(.02)); g.quadraticCurveTo(ex,ey+P(E.tears?.1:.07),P(.67),ey+P(.03)); g.stroke();
  } else {
    const rx=P(.15), ry=P(.095)*E.open;
    g.save(); g.beginPath(); g.ellipse(ex,ey,rx,ry,0,0,Math.PI*2); g.fillStyle='#ece3d6'; g.fill(); g.clip();
    g.fillStyle=dark; g.beginPath(); g.ellipse(ex+P(.07),ey+P(.045)*E.gaze,P(.068),P(.085),0,0,Math.PI*2); g.fill();
    g.fillStyle=lidC;
    if(E.lid>0) g.fillRect(ex-rx-2,ey-ry-2,rx*2+4,2+ry*2*E.lid);                     /* the upper lid, lowered */
    if(E.low>0) g.fillRect(ex-rx-2,ey+ry-ry*2*E.low,rx*2+4,ry*2*E.low+2);           /* the lower lid, raised */
    g.restore();
    g.strokeStyle=dark; g.lineWidth=ow*.9; g.beginPath(); g.moveTo(ex-rx,ey-ry*(1-2*E.lid)); g.quadraticCurveTo(ex,ey-ry*(1-2*E.lid)-P(.03),ex+rx,ey-ry*(1-2*E.lid)+P(.01)); g.stroke();
  }
  if(E.tears){ const k=((t||0)/1100)%1; g.fillStyle='rgba(170,215,255,.85)';
    g.beginPath(); g.ellipse(P(.5),ey+P(.12+k*.4),P(.035),P(.05),0,0,Math.PI*2); g.fill(); }
  /* the brow: its front (inner) end and its back (outer) end */
  g.strokeStyle=L.beard&&!L.hair?L.beard:(L.hair||'#2c1a0c');
  { const m9=/^#?([0-9a-f]{6})$/i.exec(g.strokeStyle); if(m9){ const n=parseInt(m9[1],16); if(((n>>16&255)+(n>>8&255)+(n&255))/765>.5) g.strokeStyle='rgba(78,66,54,.95)'; } }
  g.lineWidth=hr*(E.thick?.16:.12); g.lineCap='round';
  g.beginPath(); g.moveTo(P(.3),P(-.3+E.bo*.14)); g.quadraticCurveTo(P(.52),P(-.35+(E.bi+E.bo)*.07),P(.74),P(-.29+E.bi*.14)); g.stroke();
  /* the mouth */
  const lip='rgba(84,36,26,.9)', inside='#2a1410';
  const my=P(.52);
  if(m!=null&&m>.02){
    g.fillStyle=inside; g.beginPath(); g.ellipse(P(.75),my+P(.01),P(.085),P(.016+.085*m),0,0,Math.PI*2); g.fill();
    g.strokeStyle=lip; g.lineWidth=ow*.8; g.beginPath(); g.moveTo(P(.66),my-P(.01)); g.lineTo(P(.84),my-P(.015)); g.stroke();
    return;
  }
  if(L.beard&&!(E.mouth==='cry'||E.mouth==='o')) return;
  g.strokeStyle=E.mouth==='tight'?'rgba(60,24,16,.95)':lip; g.lineWidth=ow*(E.mouth==='tight'?1.1:.9); g.lineCap='round';
  g.beginPath();
  switch(E.mouth){
    case 'down':  g.moveTo(P(.6),my+P(.06)); g.quadraticCurveTo(P(.7),my-P(.005),P(.84),my); break;
    case 'up':    g.moveTo(P(.6),my-P(.05)); g.quadraticCurveTo(P(.7),my+P(.03),P(.84),my); break;
    case 'tight': g.moveTo(P(.63),my+P(.02)); g.lineTo(P(.84),my); break;
    case 'cry':   g.stroke(); g.fillStyle=inside; g.beginPath(); g.ellipse(P(.74),my+P(.03),P(.08),P(.05),0,0,Math.PI*2); g.fill(); return;
    case 'o':     g.stroke(); g.fillStyle=inside; g.beginPath(); g.ellipse(P(.76),my+P(.01),P(.045),P(.055),0,0,Math.PI*2); g.fill(); return;
    default:      g.moveTo(P(.61),my+P(.012)); g.lineTo(P(.84),my);          /* level: not a smile */
  }
  g.stroke();
}

const Face=W.Face={X,POSE,ofText,ofMood,spriteFront,spriteSide,spriteExpr,profile};

/* ------------------------------------------------------------ into the games */
function hook(){
  if(typeof W.drawChar!=='function'||W.drawChar._face) return;
  const _dc=W.drawChar;
  const dc=function(g,px,py,id,o){
    o=o||{};
    if(o.expr==null||o.mouth===undefined){ o=Object.assign({},o);
      const V=voice();
      if(o.mouth===undefined) o.mouth=V&&V.mouth?V.mouth(id):null;
      if(o.expr==null) try{ o.expr=spriteExpr(id,o); }catch(e){ o.expr='calm'; } }
    return _dc.call(this,g,px,py,id,o);
  };
  dc._face=true; W.drawChar=dc;
  /* the portrait in the dialogue box speaks with the voice */
  const G=game(); if(!G||typeof G.drawPortrait!=='function') return;
  let was=false, last=0;
  const tick=ts=>{
    requestAnimationFrame(tick);
    const V=voice(); const id=G.dlgChar;
    if(!id||!V||!V.mouth) { was=false; return; }
    const talking=V.mouth(id)!=null;
    if((talking&&ts-last>55)||(was&&!talking)){ last=ts; try{ G.drawPortrait(id); }catch(e){} }
    was=talking;
  };
  requestAnimationFrame(tick);
}
if(document.readyState==='loading') addEventListener('DOMContentLoaded',hook); else hook();
})();
