/* voice.js — the spoken word.

   Everyone who speaks is heard, each in a natural voice of their own. Each line of dialogue is
   spoken by the one speaking; every verse of a telling is read aloud, the words inside its
   quotation marks by the one the Besorah says spoke them (a messenger, a sovereign, a mother, a
   child) and the rest by the narrator. On a staged telling each part of the verse waits on the
   voice, so what is seen keeps pace with what is heard. The reading books are read verse by
   verse; on the field of battle the commander's orders are cried aloud.

   YAHUAH speaks in a voice of His own: the deepest there is, slow and low, given to no one else.

   The voices are recordings made for every line (voices/, one bank per book, loaded by its own
   script so it works from the files on disk with no server). A line with no recording — one
   put together as the game runs — is spoken by the device's own voices (the Web Speech API, as
   the Besorah reader does), the most natural the device has. Every word is said in plain English —
   a name as its letters read, without the marks of the vowels — and His Name as Yah-oo-Wah.

   V or the 🗣 button turns the voices off and on; the ♪ button silences them with the rest. */
(function(){
'use strict';
const W=window, synth=W.speechSynthesis, Utt=W.SpeechSynthesisUtterance;
const store={ get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
              set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} } };
const KEY_ON='scripture:voices', KEY_RATE='besorah:tts:rate', KEY_NARR='besorah:tts:voice';
const now=()=>(W.performance&&performance.now)?performance.now():Date.now();
const cl=(v,a,b)=>v<a?a:v>b?b:v;
/* the games declare these with const, so they are reached by name rather than on window */
const game=()=>typeof Game!=='undefined'?Game:null;
const chars=()=>typeof CHARS!=='undefined'?CHARS:{};
const sound=()=>typeof Sound!=='undefined'?Sound:null;

const V={ supported:!!(synth&&Utt), on:store.get(KEY_ON)!=='0', rate:1, voices:[],
          busy:false, broken:false, blocked:false, fails:0, heard:[] };
W.Voice=V;
{ const r=parseFloat(store.get(KEY_RATE)); if(isFinite(r)&&r>=.5&&r<=2) V.rate=r; }
/* a page reached by following a link has no user gesture yet; the voice waits for the first one */
if(navigator.userActivation&&!navigator.userActivation.hasBeenActive) V.blocked=true;
const unblock=()=>{ V.blocked=false; };
for(const ev of ['pointerdown','keydown','touchstart']) addEventListener(ev,unblock,{capture:true,passive:true});

/* ------------------------------------------------------------ the recorded voices */
/* each book's bank: VOICE_BANK = {base:'voices/<book>/', ext:'webm', k:{<key>:<ms>}} */
const bank=()=>W.VOICE_BANK||null;
let canClip=null;
function clipsOK(){
  if(canClip===null){ try{ const a=document.createElement('audio'); canClip=!!(a.canPlayType&&a.canPlayType('audio/webm; codecs="opus"')); }catch(e){ canClip=false; } }
  return canClip;
}
function fnv(s,seed){ let h=seed>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
const norm=t=>String(t||'').replace(/\s+/g,' ').trim();
/* one line, one speaker, one recording: the key is the speaker's part and the words */
function keyOf(who,text){
  const p=person(who), s=p.kind+':'+p.key+'|'+norm(text);
  return fnv(s,2166136261).toString(16).padStart(8,'0')+(fnv(s,0x811c9dc5^0x5bd1e995)&0xffff).toString(16).padStart(4,'0');
}
function clipFor(who,text){
  const B=bank(); if(!B||!B.k||!clipsOK()) return null;
  const k=keyOf(who,text), ms=B.k[k]; if(!ms) return null;
  return {url:(B.base||'')+(B.shard?k.slice(0,B.shard)+'/':'')+k+'.'+(B.ext||'webm'),ms};
}
V.keyOf=keyOf;

/* ------------------------------------------------------------ the device's own voices */
const NOVELTY=/\b(bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|albert)\b/i;
const OLDMAC=/\b(junior|ralph|kathy|princess|agnes|bruce|vicki|fred)\b/i;
const FEMALE=/\b(zira|aria|jenny|michelle|ana|emma|ava|sonia|libby|hazel|susan|samantha|karen|moira|tessa|victoria|fiona|serena|allison|zoe|nicky|kate|catherine|heera|linda|natasha|clara|salli|joanna|kendra|kimberly|ivy|amy|olivia|nicole|raveena|aditi|elizabeth|jane|nancy|sara|ashley|cora|elsa|isabella|jessica|monica|paulina|kylie|stacy|shelley|sandy|flo|grandma|maisie|neerja|molly|leah|luna|nova|ruby|rosie|sophie|abbi|bella|emily|grace|heather|lisa|lily|mia|nora|penny|rachel|sally|tracy|aurora|evelyn|harper|abigail|amber|anna|ellie|holly|veena|kathy|princess|agnes|vicki)\b/i;
const MALE=/\b(david|mark|guy|andrew|brian|christopher|eric|roger|steffan|ryan|thomas|william|george|james|liam|alex|daniel|fred|tom|aaron|arthur|gordon|oliver|rishi|lee|rocko|reed|eddy|grandpa|ralph|bruce|junior|evan|nathan|matthew|justin|joey|russell|geraint|prabhat|ravi|mitchell|connor|duncan|elliot|noah|ethan|jason|tony|davis|jacob|kai|mike|sam|luke|conrad|alfie|hugo|jack|harry|john|richard|paul|peter|stephen|steven|kevin|gregory)\b/i;
function sexOf(v){
  const n=(v.name||'')+' '+(v.voiceURI||'');
  if(/\bfemale\b/i.test(n)) return 'f';
  if(/\bmale\b/i.test(n)) return 'm';
  if(/google us english/i.test(n)) return 'f';
  const f=FEMALE.test(n), m=MALE.test(n);
  return f&&!m?'f':m&&!f?'m':'n';
}
/* the natural (neural) voices first: they are the ones that sound like people */
function quality(v){
  const n=(v.name||'').toLowerCase();
  if(NOVELTY.test(n)) return 9;
  if(/natural|neural|enhanced|premium|siri/.test(n)) return 0;
  if(/online|google/.test(n)) return 1;
  if(OLDMAC.test(n)) return 5;
  if(v.localService===false) return 2;
  return 3;
}
const home=v=>/^en[-_](us|gb)/i.test(v.lang||'')?0:1;
let pools={m:[],f:[],n:[]}, all=[];
function loadVoices(){
  const raw=(synth&&synth.getVoices&&synth.getVoices())||[], seen=new Set();
  const list=raw.filter(v=>{ const k=v.name+'|'+v.lang; if(seen.has(k)) return false; seen.add(k); return quality(v)<9; });
  let en=list.filter(v=>/^en/i.test(v.lang||'')); if(!en.length) en=list;
  const by=(a,b)=>quality(a)-quality(b)||home(a)-home(b)||String(a.name).localeCompare(String(b.name));
  all=en.slice().sort(by); V.voices=all;
  const P={m:[],f:[],n:[]}; for(const v of all) P[sexOf(v)].push(v);
  /* everyone is cast from the best voices there are, when there are at least two of them */
  for(const k in P){ const p=P[k]; if(p.length>2){ const q0=quality(p[0]); const top=p.filter(v=>quality(v)<=q0+1); P[k]=top.length>=2?top:p; } }
  pools=P; roles.clear();
}
function narratorVoice(){
  const uri=store.get(KEY_NARR);
  if(uri){ const v=all.find(x=>x.voiceURI===uri); if(v) return v; }
  return all[0]||null;
}

/* ------------------------------------------------------------ who is speaking */
function nameKey(s){
  return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[‘’‚‛ʻʼʹ׳'`´]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
}
function hash(s){ return fnv(String(s),2166136261); }
function grey(hex){
  const m=/^#?([0-9a-f]{6})$/i.exec(hex||''); if(!m) return false;
  const n=parseInt(m[1],16), r=n>>16&255, g=n>>8&255, b=n&255, mx=Math.max(r,g,b), mn=Math.min(r,g,b);
  return mx-mn<46&&(mx+mn)/510>=.45;
}
const F_WORD=/\b(wife|wives|daughters?|woman|women|mother|queen|sovereigness|maid|maiden|widow|sister|girl|lady|harlot|virgin|bride|midwife|prophetess|nabiah|nurse|handmaid|damsel|concubine|princess)\b/;
const M_WORD=/\b(son|sons|man|men|king|sovereign|father|brother|husband|boy|guardian|lord|master|prince|servant|kohen|priest|elder|chief|captain|officer|soldier|shepherd|watchman|shimshon)\b/;
const GIANT=/\b(giant|nephil\w*|golyath|goliath|anaq\w*|rapha\w*)\b/;
/* the part a character plays: what sort of voice, and the key that keeps one person one voice
   through every costume and every chapter (Aḏam in the garden, Aḏam in skins) */
/* the name a person is known by, whatever they are called in a scene: Dawiḏ, Dawiḏ the
   Sovereign and Dawiḏ son of Yahshai are one man with one voice; Aḇram is Aḇraham, and in
   Berĕshith the old man called Yasharal is Ya‘aqoḇ (in the books after it, Yasharal is his people) */
const PAGE=((location.pathname||'').split('/').pop()||'index.html').replace(/\.html$/,'');
const TITLE=new Set(['sovereign','sovereigness','king','queen','prince','princess','prophet','nabi','kohen','priest','lord','captain','commander','general','chief','high']);
const ALIAS=Object.assign({abram:'abraham',sarai:'sarah'},PAGE==='index'?{yasharal:'yaaqob'}:{});
const GENERIC=new Set(['his','her','their','my','our','your','one','some','certain','another','young','old','first','second','third','fourth','fifth','sixth','seventh','all','many','shining','voice']);
function canon(name,id){
  let k=nameKey(String(name||'').replace(/(\S+)[’']s\s+(\S+)/,'$2 of $1'));
  if(!k) return String(id||'');
  k=k.replace(/^(the|a|an)\s+/,'');
  const w=k.split(/[\s,—]+/).filter(Boolean);
  while(w.length>1&&TITLE.has(w[0])&&w[1]!=='of') w.shift();
  const first=w[0]||k;
  if(ROLE_NOUN[first]||GENERIC.has(first)||TITLE.has(first)||F_WORD.test(first)||M_WORD.test(first)) return k;
  return ALIAS[first]||first;
}
const people=new Map();
function person(id){
  if(id&&typeof id==='object') return id;
  let r=people.get(id); if(r) return r;
  r=person0(id); if(chars()[id]) people.set(id,r); return r;
}
function person0(id){
  const C=chars(), c=C[id]||{}, name=c.name||'';
  if(!id||id==='narrator'||c.narrator) return {kind:'narrator',key:'narrator'};
  if(c.divine||id==='voice') return {kind:'divine',key:'divine'};
  const key=canon(name,id);
  if(c.darkAngel||c.dragon) return {kind:'dark',key};
  if(c.serpent) return {kind:'serpent',key:'serpent'};
  if(c.angel||/\b(malak|messenger|gabrial|gabriel|raphael|raphal|mikael|urial)\b/.test(nameKey(name))) return {kind:'angel',key};
  const head=nameKey(name.replace(/\S+[’']s\b/g,'')).split(/\s+of\s+/)[0];
  const sex=F_WORD.test(head)?'f':M_WORD.test(head)?'m':c.beard?'m':c.hairStyle==='long'?'f':'m';
  if(c.child) return {kind:sex==='f'?'girl':'boy',key};
  if(GIANT.test(nameKey(name))) return {kind:'giant',key};
  const old=c.old||c.elder||grey(c.hair)||grey(c.beard);
  return {kind:sex==='f'?(old?'oldwoman':'woman'):(old?'oldman':'man'),key};
}
/* for the device's voices: a natural voice of the right sort, only lightly shaded — a voice
   pushed far from its own pitch no longer sounds like a person */
const KIND={
  narrator:{sex:'*',pitch:1,   rate:.96},
  divine:  {sex:'m',pitch:.8,  rate:.86},
  angel:   {sex:'m',pitch:.97, rate:.93},
  dark:    {sex:'m',pitch:.88, rate:.92},
  serpent: {sex:'m',pitch:.92, rate:.9},
  giant:   {sex:'m',pitch:.86, rate:.9},
  man:     {sex:'m',pitch:1,   rate:1},
  woman:   {sex:'f',pitch:1,   rate:1},
  oldman:  {sex:'m',pitch:.93, rate:.93},
  oldwoman:{sex:'f',pitch:.95, rate:.94},
  boy:     {sex:'f',pitch:1.14,rate:1.04},
  girl:    {sex:'f',pitch:1.2, rate:1.04},
  crowd:   {sex:'m',pitch:.97, rate:1},
  captain: {sex:'m',pitch:.96, rate:1.06}
};
const JIT=[-.04,-.02,0,.02,.04];
const roles=new Map();
function role(who){
  const P=person(who), cacheKey=P.kind+'|'+P.key;
  let r=roles.get(cacheKey); if(r) return r;
  const K=KIND[P.kind]||KIND.man, h=hash(P.key);
  let voice=null, pitch=K.pitch;
  if(P.kind==='narrator') voice=narratorVoice();
  else {
    const want=K.sex, other=want==='f'?'m':'f';
    let pool=pools[want];
    if(!pool.length) pool=pools.n;
    if(!pool.length){ pool=pools[other]; pitch*=want==='m'?.9:1.1; }
    if(pool.length){
      /* people are dealt a voice by name, and never the narrator's while another is to be had;
         YAHUAH is given the deepest there is */
      const nv=narratorVoice(), opts=pool.length>1?pool.filter(v=>v!==nv):pool;
      voice=P.kind==='divine'?(opts.find(v=>/onyx|david|guy|george|daniel|christopher|roger/i.test(v.name))||opts[0]):opts[h%opts.length];
      if(P.kind!=='captain'&&P.kind!=='divine') pitch+=JIT[(h>>>8)%JIT.length];
    }
  }
  r={voice,pitch:cl(pitch,.5,1.6),rate:K.rate,kind:P.kind,key:P.key};
  roles.set(cacheKey,r); return r;
}
V.role=role; V.person=person;

/* ------------------------------------------------------------ what is said */
/* how the words are said: in plain English. A name is read as its letters, the marks of the Hebrew
   vowels and the ayin and aleph left unsaid (Ĕḏen is Eden, Ya‘aqoḇ is Yaaqob, Aḇraham is Abraham);
   only His Name has its own sounds — Yah-oo-Wah, the h of its spelling breathed between "Yah" and
   "oo" — so that no voice runs "Yah" into "oo" with an r, or stops it into a t */
const WORD_RE=/[A-Za-zÀ-ɏḀ-ỿ‘’‚‛ʻʼʹ׳'`´ʿʾ]+/g;
const GLOSS=/\s*\((?:Most Set Apart Place|Set Apart Ones|Set Apart One|Set Apart Place|Set Apart|Faithful|Sheol)\)/gi;
/* "(YAHUAH) HWHY": the Name is said once; the glyph beside it is for the eye, as in the reader */
const HWHY=/\(\s*(YAHU[ĂA]H)\s*\)\s*HWHY/g;
const MARKS=/[‘’‚‛ʻʼʹ׳'`´ʿʾ]/g;
function sayWord(w,device){
  const key=nameKey(w.replace(/[’'`´]s$/,''));
  if(key==='yahuah'){ const s=/[’'`´]s$/.test(w); return device?(s?"Yah-hoo-wah's":'Yah-hoo-wah'):(s?'YAHUAHS':'YAHUAH'); }
  /* don't, it's, the man’s: English, the apostrophe kept */
  if(/^[A-Za-z]+[’'](s|t|re|ll|ve|d|m)$/i.test(w)) return w.replace(/[’`´]/,"'");
  let o=w.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(MARKS,'');
  if(o.length>1&&o===o.toUpperCase()&&/[A-Z]/.test(o)) o=o.toLowerCase();          /* NOT, ONE HUNDRED: words, not letters */
  return o||w;
}
/* the words English spells alike and says two ways, as these verses mean them: "live forever",
   "as YAHUAH lives", "and he read in the book", "let it separate the waters" — and "a live coal",
   "their lives", "a separate place" */
const LIVING=/^(coals?|goats?|birds?|animals?|beasts?|creatures?|ox|oxen|sheep|lambs?|ones?|sacrifice)$/i;
const OWNER=/^(my|your|his|her|its|our|their|whose|the|for|of|thy|men's|our)$/i;
function twoWays(s){
  return s.replace(/\b(live|lives|read|separate)\b(?=(\s+([A-Za-z]+))?)/gi,(m,w,_,next,off,all)=>{
    const pm=all.slice(Math.max(0,off-24),off).match(/([A-Za-z']+)[^A-Za-z']*$/), prev=pm?pm[1]:'', lp=prev.toLowerCase(), lw=w.toLowerCase();
    const as=(t)=>w[0]===w[0].toUpperCase()?t[0].toUpperCase()+t.slice(1):t;
    if(lw==='live') return (lp==='a'||lp==='the'||(next&&LIVING.test(next)))?w:as('liv');
    if(lw==='lives') return OWNER.test(lp)?w:as('livs');
    if(lw==='separate') return /^(a|an|the|each|every|in|into|two|three|seven)$/.test(lp)?w:as('seperate');    /* "let it separate the waters" */
    if(/^(he|she|they|it|had|has|have|was|were|been)$/.test(lp)||(/^[A-Z][a-z]/.test(prev)&&!/[.!?]\s*$/.test(all.slice(0,off).replace(/[A-Za-z']+[^A-Za-z']*$/,'')))) return as('red');
    return w; });
}
/* the words as a voice should read them: device — for the speech the device makes itself;
   otherwise for the recordings, where the Name is left as YAHUAH for its own sounds */
function readable(text,device){
  let s=String(text||'').replace(GLOSS,'').replace(HWHY,'$1').replace(/\bO?HWHY\b/gi,m=>m.length===5?'O YAHUAH':'YAHUAH');
  s=s.replace(WORD_RE,w=>sayWord(w,device));
  return twoWays(s);
}
V.readable=readable;
function speakable(text){
  return readable(text,true).replace(/[-‐‑‒–—―−]+/g,' ').replace(/…/g,', ').replace(/[;:]/g,',')
          .replace(/(^|[^A-Za-z])'|'(?![A-Za-z])/g,'$1 ')
          .replace(/["`´“”‘’«»‹›„‚(){}\[\]<>|\\\/_~^*%#@$&+=§¶†‡•·✦]/g,' ')
          .replace(/\s+([,.!?])/g,'$1').replace(/([,.!?])(?:\s*[,.])+/g,'$1').replace(/^[\s,.]+/,'')
          .replace(/\s{2,}/g,' ').trim();
}
V.speakable=speakable;
/* sentence-sized utterances for the device: some engines stop a long one after fifteen seconds */
function chunks(text,rate){
  const max=Math.round(170*cl(rate,.6,1.4));
  const t=norm(text); if(!t) return [];
  const parts=t.match(/[^.!?;…]+(?:[.!?;…]+[”’"')\]]*|$)\s*/g)||[t];
  const out=[]; let cur='';
  const push=p=>{ if(cur&&cur.length+p.length>max){ out.push(cur); cur=''; } cur+=p; };
  for(const p of parts){
    if(p.length<=max){ push(p); continue; }
    for(const q of (p.match(/[^,]+(?:,\s*|$)/g)||[p])) push(q);
  }
  if(cur.trim()) out.push(cur);
  return out.map(s=>s.trim()).filter(s=>/[A-Za-zÀ-ɏḀ-ỿ]/.test(s));
}

/* ------------------------------------------------------------ whose words: the quotation marks */
function quoteSpans(text){
  const out=[]; let depth=0, start=0;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='“'||(ch==='"'&&depth===0)){ if(depth===0){ if(i>start) out.push({a:start,b:i,q:false}); start=i; } depth++; }
    else if(ch==='”'||(ch==='"'&&depth>0)){ if(depth>0&&--depth===0){ out.push({a:start,b:i+1,q:true}); start=i+1; } }
  }
  if(start<text.length) out.push({a:start,b:text.length,q:depth>0});
  return out;
}
/* YAHUAH speaking, where the verse names no one else: the Besorah writes His Me and My with a
   capital; "declares YAHUAH", "thus said YAHUAH". A quotation carried inside another (‘…’)
   belongs to the one quoted there. */
function yahuahSpeaks(t){
  const s=String(t||'').replace(/(^|[\s“—(])‘[^’]*’(?![A-Za-z])/g,'$1');
  return /[a-z,;…—]\s+(?:Me|My|Mine|Myself)\b/.test(s)
      || /\b(?:declares|says|said|saith|declared|spoke)\s+(?:the\s+Master\s+)?YAHUAH\b/.test(s)
      || /\bI am YAHUAH\b|\bI, YAHUAH\b|\bI am Al Shaddai\b/i.test(s);
}
V.yahuahSpeaks=yahuahSpeaks;
const DIVINE=new Set(['yahuah','aluahim','yah','adonai','shaddai','elyon','voice']);
const ANGEL=new Set(['malak','malakim','messenger','messengers','gabriel','gabrial','gavrial','mikael','mikhael','raphael','raphal','urial','uriel','cherub','keruvim','kerubim']);
const DARK=new Set(['watcher','watchers','azazel','shemyaza','semyaza','satan','devil']);
const ROLE_NOUN={ woman:'woman', women:'woman', wife:'woman', mother:'woman', daughter:'woman', daughters:'woman', queen:'woman',
  sovereigness:'woman', maid:'woman', widow:'woman', sister:'woman', harlot:'woman', midwife:'woman', midwives:'woman', prophetess:'woman',
  man:'man', servant:'man', servants:'man', king:'man', sovereign:'man', prophet:'man', kohen:'man', priest:'man', shepherd:'man',
  watchman:'man', captain:'man', officer:'man', officers:'man', soldier:'man', steward:'man', elder:'oldman', elders:'crowd',
  men:'crowd', people:'crowd', sons:'crowd', children:'crowd', tribes:'crowd', leaders:'crowd', rulers:'crowd', princes:'crowd',
  house:'crowd', chiefs:'crowd', nobles:'crowd', commanders:'crowd', kohanim:'crowd', priests:'crowd', nabiim:'crowd', qahal:'crowd',
  commander:'man', herald:'man', nabi:'man', brothers:'crowd', crowd:'crowd', multitude:'crowd', assembly:'crowd', congregation:'crowd',
  serpent:'serpent', boy:'boy', lad:'boy', youth:'boy', girl:'girl', child:'boy' };
const NOT_NAME=new Set(['at','ease','fair','the','a','an','and','then','now','so','but','when','after','o','i','my','his','her','their','your','our','one','all','this','that','these','those','there','thus','for','yet','behold','see','come','go','let','in','on','to','of','from','he','she','they','it','we','you','who','what','if','as','because','therefore','also','again','not','no','with','by','before','who','which']);
const SPEECH_V=/^(said|says|say|wept|inquired|enquired|spoke|speaks|speak|spake|answered|answers|answer|called|calls|cried|cries|cry|asked|asks|replied|replies|declares|declared|commanded|commands|shouted|shouts|prayed|prays|sang|sings|sing|wrote|writes|told|tells|swore|proclaimed|proclaims|lamented|blessed|charged|vowed|exclaimed|whispered|besought|pleaded|saying)$/i;
let nameIndex=null;
function names(){
  if(nameIndex) return nameIndex;
  nameIndex=new Map(); const C=chars();
  for(const id in C){ const c=C[id]; if(!c||!c.name||c.narrator) continue;
    const full=nameKey(c.name); if(!nameIndex.has(full)) nameIndex.set(full,id);
    const head=nameKey(c.name.replace(/\S+[’']s\b/g,'')).split(/\s+(?:of|in|from)\s+/)[0];
    for(const w of head.split(/[\s,—-]+/)){
      if(w.length<2||NOT_NAME.has(w)||ROLE_NOUN[w]||DIVINE.has(w)||ANGEL.has(w)||F_WORD.test(w)||M_WORD.test(w)) continue;
      if(!nameIndex.has(w)) nameIndex.set(w,id);
    } }
  return nameIndex;
}
function toks(s){
  const out=[], re=/[A-Za-zÀ-ɏḀ-ỿ‘’‚‛ʻʼʹ׳'`´]+|[,;:—–(…]/g; let m;
  while((m=re.exec(s))){ const raw=m[0];
    /* "the visions of the night… And Aluahim spoke": the ellipsis ends a clause where a new
       sentence follows it, but not where it only leaves words out ("bowed … on the pavement") */
    if(raw==='…'){ const nx=(s.slice(re.lastIndex).match(/[A-Za-zÀ-ɏḀ-ỿ]/)||[''])[0]; if(!nx||nx===nx.toLowerCase()) continue; }
    out.push({raw,k:nameKey(raw),p:/^[,;:—–(…]$/.test(raw),poss:/[a-z][’']s$/i.test(raw)}); }
  return out;
}
function castPick(cast,pred){
  const C=chars();
  for(const c of (cast||[])){ if(!c||!c.id||!C[c.id]) continue; try{ if(pred(C[c.id])) return c.id; }catch(e){} }
  return null;
}
const SUBJ_PRON={he:'m',she:'f',they:'crowd'};
/* the one a word names: YAHUAH, a messenger, a person of the story, a woman, the people */
function whoOf(T,i,cast){
  const t=T[i]; if(!t||t.p||t.poss) return null;
  const raw=t.raw.replace(/^[‘’‚‛ʻʼʹ׳'`´]+/,''), k=t.k, C=chars(), pk=i>0?T[i-1].k:'';
  if(!raw) return null;
  const cap=raw[0]!==raw[0].toLowerCase();
  if(DIVINE.has(k)){ if(k==='yah'&&raw!=='Yah') return null; if(k==='voice'&&pk!=='a'&&pk!=='the') return null; return 'voice'; }
  if(ANGEL.has(k)) return castPick(cast,c=>c.angel&&!c.darkAngel)||(C.malak?'malak':{kind:'angel',key:'malak'});
  if(DARK.has(k)) return castPick(cast,c=>c.darkAngel)||{kind:'dark',key:k};
  if(SUBJ_PRON[k]){ if(raw==='He'&&i>0&&!T[i-1].p) return 'voice'; return {pron:SUBJ_PRON[k],lower:raw===k}; }
  /* in the books of the naḇi’im, "you shall say" is the naḇi sent to say it */
  if(k==='you'&&ORACLES.test(PAGE)&&T[i+1]){
    if(/^(shall|are)$/.test(T[i+1].k)) return names().get(PAGE.replace(/^book-of-/,''))||null;
    if(SPEECH_V.test(T[i+1].raw)) return {kind:'crowd',key:'people'};                 /* "yet you say, “Why?”" — the people */
  }
  /* "And I said, “O Master YAHUAH …”" — the naḇi telling it */
  if(raw==='I'&&ORACLES.test(PAGE)&&T[i+1]&&SPEECH_V.test(T[i+1].raw)) return names().get(PAGE.replace(/^book-of-/,''))||null;
  /* the books told by the one they are about: "I shook out my garment and said" is Neḥemyah */
  if((raw==='I'||k==='we')&&MEMOIR.test(PAGE)) return names().get(PAGE.replace(/^book-of-/,''))||null;
  if(cap&&!NOT_NAME.has(k)){
    const id=names().get(k);
    if(id&&k==='yasharal'&&PAGE!=='index') return {kind:'crowd',key:'yasharal'};
    if(id){ const nk=nameKey((C[id]||{}).name); return castPick(cast,c=>nameKey(c.name)===nk)||id; }
    /* a name the story gives no figure: a voice of its own all the same */
    if(/(ites|ians)$/.test(k)) return {kind:'crowd',key:k};        /* the Ziphites, the Amorites */
    if(/[^\x00-\x7f]/.test(raw)||(T[i+1]&&/^(son|daughter)$/.test(T[i+1].k))) return {kind:'man',key:k};
  }
  const r=ROLE_NOUN[k];
  if(r){
    const nx=T[i+1]&&!T[i+1].p?whoOf(T,i+1,cast):null;     /* a title before a name: Sovereign Dawiḏ */
    if(nx&&typeof nx==='string'&&nx!=='voice') return nx;
    return castPick(cast,c=>nameKey(c.name).split(/\s+of\s+/)[0].split(/[\s,]+/).includes(k))||(r==='serpent'&&C.serpent_c?'serpent_c':{kind:r,key:k});
  }
  return null;
}
/* a name that follows "to", "of", "against" … or is called on ("O children of Yasharal") is not the one speaking: "Mosheh spoke these words
   to all Yasharal, and he said" — he is Mosheh; "the sovereign of Yasharal … he said" — the
   sovereign; "after summoning Hermon he said" — not Hermon. His Name after "of" still speaks:
   "the word of YAHUAH came to Yonah, saying" */
const MEMOIR=/^book-of-(nehemyah|ezra|yehezqel|zekaryah|daniyal|tobit)$/;
const PREP=new Set(['o','between','to','unto','of','over','against','from','with','before','upon','into','toward','towards','among','at','in','on','behind','through']);
const DET=new Set(['all','the','a','an','his','her','their','its','my','our','your','whole','entire','every','this','that']);
const DEED=new Set(['summoned','summoning','sent','sending','saw','seeing','heard','hearing','took','taking','brought','bringing','told','telling',
  'blessed','blessing','met','meeting','found','finding','struck','smote','killed','anointed','gathered','gathering','commanded','commanding','charged',
  'called','name','named']);
const capT=t=>t.raw[0]!==t.raw[0].toLowerCase();
const STARTS=new Set(['and','then','so','but','now','when','thus','o','in','the','a','an','after','before','therefore']);
/* the word that governs the one at i: "to all Yasharal", "summoning Hermon", "against Mosheh and
   Aharon", "called its name Eḇen Ezer" — or none */
function govBy(T,i,noAnd){
  const p=T[i-1];
  if(p&&!p.p&&capT(p)&&capT(T[i])&&!STARTS.has(p.k)) return govBy(T,i-1,noAnd);      /* the rest of a name */
  const pro=/^(you|we|i)$/.test(T[i].k);                                               /* "In that you say": no "the" before a "you" */
  let j=i-1; while(j>=0&&(T[j].raw==='('||(!pro&&!T[j].p&&DET.has(T[j].k)))) j--;     /* O (YAHUAH) HWHY */
  if(j<0||T[j].p) return null;
  const g=T[j].k;
  if(g==='and') return !noAnd&&j>0&&!T[j-1].p&&capT(T[j-1])?govBy(T,j-1):null;
  return PREP.has(g)||DEED.has(g)?g:null;
}
function governed(T,i,w,noAnd){ const g=govBy(T,i,noAnd); return !!g&&!(w==='voice'&&g==='of'); }
const sexOfWho=w=>{ if(w==='voice') return 'm'; const k=person(w).kind; return /woman|girl/.test(k)?'f':k==='crowd'?'crowd':'m'; };
/* whom "he" means: the last one named who is doing, not done to — and failing that, the last one
   named ("the Ruach came upon Sha’ul when he heard"); a small "he" is never YAHUAH, whose "He" is
   written large */
function antecedent(T,i,sex,cast,lower,loose){
  for(let j=i-1;j>=0;j--){
    let w=whoOf(T,j,cast);
    if(!w&&loose&&T[j].poss){ const raw=T[j].raw.replace(/[’']s$/,''); w=whoOf([{raw,k:nameKey(raw),p:false,poss:false}],0,cast); }   /* "Yonah’s head … he" */
    if(!w||w.pron||(lower&&w==='voice')||(!loose&&governed(T,j,w))) continue;
    if(sexOfWho(w)===sex) return w; }
  return null;
}
/* the speaker a stretch of narration names: the subject of its verb of speaking — "And Mosheh
   said to YAHUAH", "Then YAHUAH said to Mosheh", "the Mal’ak of YAHUAH said", "Thus said
   YAHUAH", "that he called Mosheh" (he: the one named before) */
function subjectOf(lead,cast){
  const T=toks(lead); if(!T.length) return null;
  /* the verb of speaking nearest the words: "Thus said YAHUAH … and a mal’ak has been sent
     among the nations, saying" — the messenger speaks */
  let v=-1; for(let i=T.length-1;i>=0;i--) if(SPEECH_V.test(T[i].raw)){ v=i; break; }
  if(v<0) return null;
  const after=()=>{ for(let i=v+1;i<Math.min(T.length,v+4);i++){
    if(T[i].p||T[i].k==='to'||T[i].k==='unto') break;
    const w=whoOf(T,i,cast); if(w&&!w.pron) return w; } return null; };
  if(v>0&&/^(thus|so)$/.test(T[v-1].k)){ const w=after(); if(w) return w; }          /* thus said YAHUAH */
  /* "Then YAHUAH commanded the mal’ak and he returned his sword … “This is the House”": something
     was done after the command, so the words that follow are not it */
  const cap=t=>t.raw[0]!==t.raw[0].toLowerCase();
  for(let m=v+1;m+2<T.length&&!T[m].p;m++) if(T[m].k==='and'&&!T[m+1].p&&(SUBJ_PRON[T[m+1].k]||cap(T[m+1]))&&!T[m+2].p&&!cap(T[m+2])&&!PREP.has(T[m+2].k)&&!DET.has(T[m+2].k)&&!/^(and|son|daughter|the)$/.test(T[m+2].k)) return null;
  /* "the rock-holds of Eḏom, who said in his heart" — the one before "who" */
  if(v>0&&T[v-1].k==='who'){
    let first=null;
    for(let j=v-2,n=0;j>=0&&n<6;j--,n++){
      if(T[j].p&&T[j].raw!=='—'&&T[j].raw!==',') break;
      const w=whoOf(T,j,cast); if(!w||w.pron) continue;
      if(first) return w;                                   /* "the sovereign of Baḇel, who": the sovereign */
      first=w; if(!governed(T,j,w)) return w;
    }
    if(first) return first;
  }
  let end=v;
  const pick=(a,b,noAnd)=>{ for(let i=a;i<b;i++){ const w=whoOf(T,i,cast); if(!w||(!w.pron&&governed(T,i,w,noAnd))) continue;
      if(w.pron) return antecedent(T,i,w.pron,cast,w.lower)||Object.assign({T,at:i},w);
      return w; } return null; };
  for(let hop=0;hop<5&&end>0;hop++){
    let st=end-1; while(st>=0&&!T[st].p) st--;
    /* "the children of Yahuḏah came to Yahusha and Kalĕḇ … said" — the last one to start doing */
    if(hop===0) for(let m=end-1;m>st+1;m--) if(T[m].k==='and'&&T[m+1]&&!T[m+1].p&&cap(T[m+1])){
      if(cap(T[m-1])&&!govBy(T,m-1)) break;                     /* "Aḏam and Ḥawwah said": both of them */
      const w=pick(m+1,end,true); if(w) return w; break; }
    const w=pick(st+1,end); if(w) return w;
    end=st;
  }
  return after();
}
const TO_HIM=/^[“‘"\s…]*O (Master )?YAHUAH\b|\bmy Aluahim does\b|\bI look to YAHUAH\b/;
/* the one spoken to: "he said to Ĕlisha" */
function addressee(lead,cast){
  const T=toks(lead); let v=-1; for(let i=T.length-1;i>=0;i--) if(SPEECH_V.test(T[i].raw)){ v=i; break; }
  if(v<0||!T[v+1]||!/^(to|unto)$/.test(T[v+1].k)) return null;
  let i=v+2; while(T[i]&&DET.has(T[i].k)) i++;
  const w=whoOf(T,i,cast); return w&&!w.pron?w:null;
}
/* whose words a quotation holds when nothing names the speaker: in Wayyiqra and the books of the
   prophets, the words of YAHUAH; in Deḇarim, the words of Mosheh */
const ORACLES=/^book-of-(vayiqra|yashayahu|yirmeyahu|yehezqel|hoshea|yoal|amos|obadyah|mikah|nahum|habaqquq|tsephanyah|haggai|zekaryah|malaki)$/;
function bookSpeaker(){ if(ORACLES.test(PAGE)) return 'voice'; if(PAGE==='book-of-devarim') return chars().mosheh_o?'mosheh_o':(chars().mosheh?'mosheh':null); return null; }
/* a passage cut into what the narrator reads and what each speaker says.
   opts.cast / opts.partOf: on a staged telling, who the stage has speaking in which part;
   opts.prev: the one speaking when the verse before it ended */
function passage(text,opts){
  text=String(text||''); opts=opts||{};
  const spans=quoteSpans(text), out=[], spoke=[];
  let lastQ=null;
  for(const sp of spans){
    if(!sp.q){ out.push({a:sp.a,b:sp.b,who:'narrator'}); continue; }
    const q=text.slice(sp.a,sp.b);
    const back=text.slice(Math.max(0,sp.a-240),sp.a);
    const cut=Math.max(back.lastIndexOf('. '),back.lastIndexOf('! '),back.lastIndexOf('? '),back.lastIndexOf('”'));
    const lead=cut>=0?back.slice(cut+1):back;
    let who=null, s=null;
    /* “Come,” he said, “let us go” — the same voice goes on; but “Should I smite?” But he said,
       “Do not smite” — another answers */
    if(lastQ){ const between=text.slice(lastQ.b,sp.a);
      if(between.length<48&&/\b(said|says|saying|answered|replied|cried|called|declares)\b/i.test(between)&&!/^[\s”’"…]*(but|and|then|so|now)\b/i.test(between)){ const b=subjectOf(between,opts.cast); if(!b||(b.pron&&b.pron===sexOfWho(lastQ.who))) who=lastQ.who; } }
    /* a name given, not words spoken: it shall be called “The Way of Set-apartness” */
    if(!who&&q.length<48&&!/^[“"‘\s]*(for|because)\b/i.test(q)&&/\b(called|named|name|call|names|written|inscribed|inscription)\b[^.!?]*$/i.test(lead)&&!/\b(said|saying|answered)\b[^.!?]*$/i.test(lead)) who='narrator';
    if(!who){ s=subjectOf(lead,opts.cast); if(s&&!s.pron) who=s; }
    /* “I have loved you,” said YAHUAH */
    if(!who&&!s&&/^[\s”’",]*[a-z]/.test(text.slice(sp.b,sp.b+12))){ const tail=text.slice(sp.b,sp.b+70).split(/[.!?“…]/)[0];
      if(/\b(said|says|answered|replied|declares|declared)\b/i.test(tail)){ const t=subjectOf(tail,opts.cast); if(t&&!t.pron) who=t; } }
    /* His own words, as the Besorah writes them, though the stage shows His naḇi */
    if(!who&&yahuahSpeaks(q)) who='voice';
    if(!who&&opts.cast&&opts.partOf){
      const i=opts.partOf(sp.a), j=opts.partOf(sp.b-1);
      const sayers=opts.cast.filter(c=>c&&c.id&&c.say!=null&&c.say>=i&&c.say<=j);
      if(sayers.length) who=(sayers.find(c=>!lastQ||c.id!==lastQ.who)||sayers[0]).id;
    }
    if(!who&&s&&s.pron){
      const sex=s.pron, prev=lastQ&&lastQ.who;
      if(sex==='crowd') who={kind:'crowd',key:'they'};
      else {
        const same=(a,b)=>!!(a&&b)&&person(a).key===person(b).key, fits=w=>!!w&&w!=='narrator'&&sexOfWho(w)===sex&&!(s.lower&&w==='voice');
        /* “…” And he said — the same one goes on, and "he said to them" is one speaking to many;
           but “…?” But he said, And he answered, So she said to her — the other one speaks: the
           one just spoken to, if the words were said to someone */
        const L=toks(lead), done=w=>{ for(let j=0;j<L.length;j++){ const x=whoOf(L,j,opts.cast); if(x&&!x.pron&&governed(L,j,x)&&same(x,w)) return true; } return false; };
        /* "said to her" answers only where no one else is named for "her" to be */
        const named0=L.some((t,j)=>{ const x=whoOf(L,j,opts.cast); return !!x&&!x.pron; });
        const reply=/\b(but|answered|answers|replied|replies)\b/i.test(lead)||(!named0&&new RegExp('\\b(to|unto)\\s+'+(sex==='f'?'her':'him')+'\\b','i').test(lead))||done(prev);
        const near=!!lastQ&&text.slice(lastQ.b,sp.a).length<80;
        if(fits(prev)&&(/\b(to|unto)\s+them\b/i.test(lead)||(near&&!reply))) who=prev;
        else {
          const to=lastQ&&lastQ.to;
          const cand=(fits(to)&&to!=='voice'&&!same(to,prev)?to:null)||spoke.slice().reverse().find(w=>fits(w)&&w!=='voice'&&!same(w,prev));
          const castCand=(opts.cast||[]).map(c=>c&&c.id).find(id=>id&&id!=='voice'&&!same(id,prev)&&chars()[id]&&fits(id));
          /* and failing all, the one the telling last named, though something was done to him */
          const named=s.T?antecedent(s.T,s.at,sex,opts.cast,s.lower,true):null;
          who=cand||castCand||named||(fits(prev)?prev:{kind:sex==='f'?'woman':'man',key:'someone'});
        }
      }
    }
    const bare=!/[A-Za-z]{2}/.test(lead);
    if(!who&&bare&&lastQ) who=lastQ.who;
    /* His presence stands on the stage of the verse: the words are His */
    if(!who&&(opts.cast||[]).some(c=>c&&c.id==='voice')) who='voice';
    if(!who&&bare&&opts.prev) who=opts.prev;
    /* and where nothing tells, the narrator reads them rather than a stranger */
    if(!who) who=lastQ?lastQ.who:(bookSpeaker()||'narrator');
    /* words said to Him are never His: “O Master YAHUAH, please stop!”, “my Aluahim does hear me” */
    if(who==='voice'&&TO_HIM.test(q)){ const c=(opts.cast||[]).map(c=>c&&c.id).find(id=>id&&id!=='voice'&&chars()[id]);
      who=c||(ORACLES.test(PAGE)&&names().get(PAGE.replace(/^book-of-/,'')))||'narrator'; }
    out.push({a:sp.a,b:sp.b,who}); lastQ={b:sp.b,who,to:addressee(lead,opts.cast)}; spoke.push(who);
  }
  return out.map(s=>({text:text.slice(s.a,s.b),who:s.who,a:s.a,b:s.b}));
}
V.passage=passage;
/* a line of dialogue: the one speaking says it all — a naḇi's "Thus said YAHUAH" is the naḇi
   speaking; the narrator's lines are read like a verse. The telling written in brackets before
   a person's words — "(a voice in the dark)", "(Longing —)" — is the narrator's to say. */
const ASIDE=/^\s*\([^)]*\)\s*/;
function lineItems(id,text){
  text=String(text||''); const p=person(id);
  if(p.kind==='narrator') return passage(text).map(s=>({text:s.text,who:s.who}));
  const m=ASIDE.exec(text);
  if(m){ const rest=text.slice(m[0].length); return [{text:m[0],who:'narrator'}].concat(rest.trim()?[{text:rest,who:p.kind==='divine'?'voice':id}]:[]); }
  if(p.kind==='divine') return [{text,who:'voice'}];
  return [{text,who:id}];
}
V.lineItems=lineItems;
/* the parts of a slide, each with what is said in it and by whom */
const lastSpeaker=segs=>{ for(let j=segs.length-1;j>=0;j--) if(segs[j].who!=='narrator') return segs[j].who; return null; };
function partsOf(s){ return (s&&s.stage&&W.Stage&&W.Stage.parts)?W.Stage.parts(String(s.text||'')):null; }
function slideSegs(list,i,depth){
  const s=list&&list[i]; if(!s) return [];
  const text=String(s.text||''), parts=partsOf(s);
  let partOf=null;
  if(parts){ const st=[]; let o=0; for(const p of parts){ st.push(o); o+=p.length; } partOf=x=>{ let k=0; while(k+1<st.length&&st[k+1]<=x) k++; return k; }; }
  let prev=null;
  if(depth<2) for(let j=i-1;j>=Math.max(0,i-2)&&!prev;j--) prev=lastSpeaker(slideSegs(list,j,depth+1));
  return passage(text,{cast:s.stage&&s.stage.cast,partOf,prev});
}
function slideItems(list,i){
  const s=list[i], text=String(s.text||''), segs=slideSegs(list,i,0), parts=partsOf(s);
  if(!parts) return {flat:segs.map(g=>({text:g.text,who:g.who}))};
  const starts=[]; let off=0; for(const p of parts){ starts.push(off); off+=p.length; }
  const byPart=parts.map(()=>[]);
  for(const g of segs){
    for(let k=0;k<parts.length;k++){
      const a=Math.max(g.a,starts[k]), b=Math.min(g.b,starts[k]+parts[k].length);
      if(b>a) byPart[k].push({text:text.slice(a,b),who:g.who});
    }
  }
  return {byPart};
}
V.slideItems=slideItems;

/* ------------------------------------------------------------ the voice itself */
let gen=0, queue=[], onDone=null, dog=0, lastCancel=-1e9, lastRole=null, unduckT=0;
const soundOn=()=>{ const S=sound(); return !(S&&S.enabled===false); };
const hasBank=()=>!!(bank()&&clipsOK());
V.canSpeak=()=>V.on&&!V.blocked&&soundOn()&&(hasBank()||(V.supported&&!V.broken));
function duck(on){
  clearTimeout(unduckT);
  const S=sound(); if(!S||!S.master||!S.ctx||S.enabled===false) return;
  const apply=lvl=>{ try{ const g=S.master.gain, t=S.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value,t); g.linearRampToValueAtTime(lvl,t+(lvl<.5?.25:.9)); }catch(e){} };
  if(on) apply(.3); else unduckT=setTimeout(()=>{ if(!V.talking&&S.enabled!==false) apply(.55); },450);
}
function talking(b){ if(V.talking===b) return; V.talking=b; duck(b); }
const clips=new Map();
function clipEl(url){
  let a=clips.get(url);
  if(!a){ a=new Audio(); a.preload='auto'; a.src=url; clips.set(url,a); if(clips.size>8) clips.delete(clips.keys().next().value); }
  return a;
}
let playing=null;
/* who is speaking this moment, and how far into the words: the mouths move with it, and a
   line's text comes up in step with it */
V.talk=null; V.prog=null;
function stop(){
  gen++; queue=[]; onDone=null; clearTimeout(dog); V.talk=null; V.prog=null;
  if(playing){ try{ playing.pause(); playing.onended=playing.onerror=null; }catch(e){} playing=null; }
  if(V.supported&&(synth.speaking||synth.pending)){ try{ synth.cancel(); }catch(e){} lastCancel=now(); }
  V.busy=false; talking(false);
}
/* items: [{text, who}] heard one after another; done() when the last is over. tag: what the
   words belong to (a line of dialogue), so its text can keep pace with them */
function play(items,done,tag){
  stop();
  if(!V.canSpeak()) return false;
  const my=gen;
  for(const it of (items||[])){
    if(!it||!norm(it.text)) continue;
    const clip=clipFor(it.who,it.text);
    if(clip){ queue.push({clip,text:it.text,who:it.who,ms:clip.ms/V.rate}); continue; }
    if(!V.supported||V.broken) continue;
    const r=role(it.who); for(const c of chunks(it.text,r.rate*V.rate)) queue.push({text:c,who:it.who,ms:speakable(c).length/(13.5*cl(r.rate*V.rate,.5,2))*1000});
  }
  if(!queue.length) return false;
  V.prog={tag:tag||null,total:queue.reduce((a,q)=>a+q.ms,0)||1,done:0,cur:null};
  onDone=done||null; V.busy=true;
  for(const q of queue) if(q.clip){ clipEl(q.clip.url); break; }
  next(my);
  return true;
}
function record(q,kind,voice){
  V.heard.push({text:q.text||'',who:typeof q.who==='object'?q.who.kind+':'+q.who.key:(q.who||''),kind,voice:voice||''});
  if(V.heard.length>600) V.heard.splice(0,200);
}
/* how far through the words now playing, 0 to 1 */
V.progress=function(){ const P=V.prog; if(!P) return null;
  const c=P.cur?Math.min(P.cur.ms,Math.max(0,now()-P.cur.t0)):0; return cl((P.done+c)/P.total,0,1); };
function begin(q,delay,ms){
  const p=person(q.who);
  V.talk={key:p.key,kind:p.kind,text:q.text,said:speakable(q.text),t0:now()+delay,dur:Math.max(250,ms)};
}
function next(my){
  if(my!==gen) return;
  V.talk=null;
  if(V.prog&&V.prog.cur){ V.prog.done+=V.prog.cur.ms; V.prog.cur=null; }
  const q=queue.shift();
  if(!q){ V.busy=false; talking(false); const d=onDone; onDone=null; V.prog=null; if(d) d(); return; }
  if(V.prog) V.prog.cur={ms:q.ms,t0:now()};
  if(q.clip) return playClip(q,my);
  speak(q,my);
}
function playClip(q,my){
  const a=clipEl(q.clip.url); playing=a;
  let done=false;
  const fin=ok=>{ if(done) return; done=true; clearTimeout(dog); a.onended=a.onerror=null; clips.delete(q.clip.url);
    if(my!==gen) return; playing=null;
    if(ok) next(my);
    else { if(V.supported&&!V.broken){ const r=role(q.who); queue.unshift(...chunks(q.text,r.rate*V.rate).map(c=>({text:c,who:q.who}))); } next(my); } };
  a.onended=()=>fin(true); a.onerror=()=>fin(false);
  try{ a.playbackRate=V.rate; a.currentTime=0; }catch(e){}
  talking(true); record(q,'clip',q.clip.url);
  begin(q,60/V.rate,(q.clip.ms-220)/V.rate);                     /* the recording's words lie between its short silences */
  for(const n of queue) if(n.clip){ clipEl(n.clip.url); break; }     /* the next one, ready */
  dog=setTimeout(()=>fin(true),q.clip.ms/V.rate+4000);
  let p; try{ p=a.play(); }catch(e){ fin(false); return; }
  if(p&&p.catch) p.catch(err=>{ if(err&&err.name==='NotAllowedError'){ V.blocked=true; stop(); } else fin(false); });
}
function speak(q,my){
  const s=speakable(q.text); if(!s){ next(my); return; }
  const r=role(q.who); let pitch=r.pitch;
  /* two people talking with one voice are told apart by a shade of pitch */
  if(lastRole&&lastRole.key!==r.key&&lastRole.voice===r.voice&&Math.abs(lastRole.pitch-pitch)<.05&&r.kind!=='narrator'&&lastRole.kind!=='narrator')
    pitch=cl(pitch+(pitch>=1?-.07:.07),.5,1.6);
  lastRole={key:r.key,voice:r.voice,pitch,kind:r.kind};
  const u=new Utt(s);
  if(r.voice){ u.voice=r.voice; u.lang=r.voice.lang; }
  u.pitch=pitch; u.rate=cl(r.rate*V.rate,.5,2); u.volume=1;
  let started=false, ended=false;
  const est=s.length/(13.5*u.rate)*1000;
  const fin=()=>{ if(ended) return; ended=true; clearTimeout(dog); if(my===gen) next(my); };
  u.onstart=()=>{ started=true; V.fails=0; clearTimeout(dog); dog=setTimeout(fin,est*1.8+2500); begin(q,0,est);
    if(V.prog&&V.prog.cur) V.prog.cur.t0=now(); };
  u.onend=fin;
  u.onerror=e=>{ const er=e&&e.error;
    if(er==='interrupted'||er==='canceled') return;
    if(er==='not-allowed'){ V.blocked=true; stop(); return; }
    if(!started&&++V.fails>=3){ V.broken=true; V.onBroken&&V.onBroken(); }
    fin(); };
  talking(true); record(q,'speech',r.voice?r.voice.name:'');
  const go=()=>{
    if(my!==gen) return;
    try{ synth.speak(u); }catch(e){ fin(); return; }
    /* an engine that never begins is not waited on for long */
    dog=setTimeout(()=>{ if(started||ended) return; try{ synth.cancel(); }catch(e){}
      if(++V.fails>=3){ V.broken=true; V.onBroken&&V.onBroken(); } fin(); },Math.max(3000,est*.5));
  };
  if(now()-lastCancel<90) setTimeout(go,90); else go();
}
/* Chrome's online voices fall silent after fifteen seconds unless nudged */
setInterval(()=>{ if(!V.busy||!V.supported||!synth.speaking) return;
  const r=lastRole&&lastRole.voice; if(r&&r.localService===false&&/google/i.test(r.name)){ try{ synth.pause(); synth.resume(); }catch(e){} } },9000);
addEventListener('visibilitychange',()=>{ if(document.hidden) stop(); });
addEventListener('pagehide',()=>stop());

V.play=play; V.stop=stop;
V.line=function(id,text){ return play(lineItems(id,text),null,text); };
/* how open the mouth of one who is speaking is, this moment (0 shut … 1 wide), or null if that
   one is not speaking: the vowels of the words being said, laid over the time they take */
V.mouth=function(id){
  const T=V.talk; if(!T||id==null) return null;
  const P=person(id); if(P.key!==T.key||P.kind==='narrator') return null;
  const f=(now()-T.t0)/T.dur; if(f<0||f>1) return 0;
  const s=T.said, pos=f*s.length, i=Math.floor(pos), ch=s[i]||' ', fr=pos-i;
  const v=/[aoAO]/.test(ch)?1:/[eE]/.test(ch)?.78:/[iIyY]/.test(ch)?.58:/[uUwW]/.test(ch)?.46:/[mbpMBP]/.test(ch)?0:/[fvFV]/.test(ch)?.16:/[a-zA-Z]/.test(ch)?.32:0;
  return v*(.45+.55*Math.sin(Math.PI*fr));
};
/* the words a person is saying now, for the face to fit them */
V.saying=function(id){ const T=V.talk; if(!T||id==null) return null; return person(id).key===T.key?T.text:null; };
V.setOn=function(on){
  V.on=!!on; store.set(KEY_ON,V.on?'1':'0'); if(!V.on) stop(); driver=null;
  if(V.on){ V.broken=false; V.fails=0; }
  const b=document.getElementById('btn-voice'); if(b) b.style.opacity=V.on?'1':'.4';
  try{ if(typeof toast==='function') toast(V.on?'🗣  Voices on':'Voices off'); }catch(e){}
  if(V.on&&V.again) V.again();
};
V.toggle=()=>V.setOn(!V.on);

/* ------------------------------------------------------------ in the games */
let driver=null;
/* a staged telling: each part of the verse is heard when it comes, and the next part (and all
   the stage's beats after it) waits until the voice has finished the one before */
function hold(c,j,st){
  const n=c.parts.length; if(j>n) return;
  if(c.times[j]<=st) return;                 /* already come: what has been seen stays seen */
  const need=st+120; if(c.times[j]>=need) return;
  const d=need-c.times[j]; for(let m=j;m<=n;m++) c.times[m]+=d;
}
function pull(c,j,at){
  const n=c.parts.length; if(j>n||c.times[j]<=at) return;
  const d=c.times[j]-at; for(let m=j;m<=n;m++) c.times[m]-=d;
}
function tickDriver(G){
  const d=driver; if(!d) return;
  if(G.state!=='slides'){ driver=null; return; }
  const c=W.Stage&&W.Stage.cur; if(!c||c.slide!==d.s||!V.canSpeak()) return;
  const st=G.slideT||0, n=c.parts.length;
  if(d.speaking&&!V.busy) d.speaking=false;
  if(d.speaking){ hold(c,d.k+1,st); return; }
  /* the part has been heard: the next comes on after a breath, not the whole reading time */
  if(d.heard){ d.heard=false; pull(c,d.k+1,st+380); }
  const k=d.k+1; if(k>=n) return;
  if(c.allAt!=null||st>=c.times[k]){
    d.k=k; hold(c,k+1,st);
    d.speaking=play(d.byPart[k]||[],()=>{ if(driver===d){ d.speaking=false; d.heard=true; } });
  }
}
V.slide=function(list,i){
  stop(); driver=null;
  const s=list&&list[i]; if(!s) return;
  const P=slideItems(list,i), c=W.Stage&&W.Stage.cur;
  if(P.byPart&&c&&c.slide===s&&c.parts.length===P.byPart.length){
    /* voices turned on part-way through a verse take it up from the part now showing */
    const G=game(), st=(G&&G.slideT)||0; let k0=0;
    for(let k=0;k<c.parts.length;k++) if(c.times[k]<=st) k0=k;
    driver={s,byPart:P.byPart,k:k0-1,speaking:false}; if(G) tickDriver(G);
  } else play(P.flat||[].concat(...(P.byPart||[])));
};
function gameHooks(){
  const G=game(); if(!G||typeof G.nextDlg!=='function') return false;
  const _next=G.nextDlg;
  G.nextDlg=function(){ const r=_next.apply(this,arguments);
    if(this.dlgChar&&this.dlgText){ const id=this.dlgChar, t=this.dlgText; V.again=()=>{ if(G.dlgChar===id&&G.dlgText===t) V.line(id,t); }; V.line(id,t); }
    return r; };
  const _ask=G.askChoice;
  if(_ask) G.askChoice=function(prompt){ const r=_ask.apply(this,arguments); V.again=null; V.line('narrator',prompt); return r; };
  if(G.updateDlg){ const _ud=G.updateDlg;
    G.updateDlg=function(dt){
      const f=this.dlgChar&&!this.dlgDone&&V.prog&&V.prog.tag===this.dlgText?V.progress():null;
      /* never behind the voice (the words keep up with what is heard); a tap still shows all */
      if(f!=null){ const L=this.dlgText.length, want=Math.min(L,f*L*1.06+1); if(want>this.dlgShown) this.dlgShown=want-(dt||0)*.026; }
      return _ud.apply(this,arguments); }; }
  const _close=G.closeDlg;
  G.closeDlg=function(){ if(this.dlgChar) stop(); return _close.apply(this,arguments); };
  const _show=G.showSlide;
  G.showSlide=function(){ const r=_show.apply(this,arguments);
    const list=this.slideList, i=this.slideIdx, s=list&&list[i];
    V.again=()=>{ if(G.state==='slides'&&G.slideList===list&&G.slideIdx===i) V.slide(list,i); };
    try{ V.slide(list,i); }catch(e){ console.warn('voice',e); }
    return r; };
  const _adv=G.advanceSlide;
  G.advanceSlide=function(){ const r=_adv.apply(this,arguments); if(this.state!=='slides'||this._slideEnding){ driver=null; stop(); } return r; };
  const _upd=G.update;
  G.update=function(){ const r=_upd.apply(this,arguments); if(driver) try{ tickDriver(this); }catch(e){ driver=null; } return r; };
  /* the button, beside the sound */
  const snd=document.getElementById('btn-sound');
  if(snd&&!document.getElementById('btn-voice')){
    const b=document.createElement('div'); b.className=snd.className; b.id='btn-voice'; b.title='Voices (V)'; b.textContent='🗣';
    b.style.opacity=V.on?'1':'.4';
    b.addEventListener('click',e=>{ e.stopPropagation(); V.toggle(); });
    snd.parentNode.insertBefore(b,snd);
  }
  addEventListener('keydown',e=>{ if(e.repeat||e.ctrlKey||e.metaKey||e.altKey) return; if(e.code==='KeyV'&&!/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||'')) V.toggle(); });
  V.onBroken=()=>{ try{ if(typeof toast==='function') toast('This device offers no voices to speak with'); }catch(e){} };
  return true;
}

/* ------------------------------------------------------------ the reading books */
function readerHooks(){
  const box=document.getElementById('verses'), home=document.getElementById('btn-home');
  if(!box||!home||game()) return false;
  const btn=document.createElement('div'); btn.className=home.className; btn.id='btn-listen';
  btn.title='Listen — read aloud (V)'; btn.textContent='🔊';
  home.parentNode.insertBefore(btn,home);
  const css=document.createElement('style');
  css.textContent='.verse.speaking{background:rgba(232,198,106,.12);border-radius:6px;box-shadow:0 0 0 6px rgba(232,198,106,.12)}#btn-listen.on{border-color:#e8c66a;box-shadow:0 0 10px rgba(232,198,106,.45)}.verse{cursor:pointer}';
  document.head.appendChild(css);
  let reading=false, ours=false;
  const verses=()=>[...box.querySelectorAll('.verse')];
  const mark=el=>{ for(const v of verses()) v.classList.toggle('speaking',v===el);
    if(el){ const r=el.getBoundingClientRect(); if(r.top<80||r.bottom>innerHeight-80) el.scrollIntoView({behavior:'smooth',block:'center'}); } };
  const textOf=el=>{ const c=el.cloneNode(true); c.querySelectorAll('.vn').forEach(n=>n.remove()); return norm(c.textContent); };
  function end(){ reading=false; btn.classList.remove('on'); btn.textContent='🔊'; mark(null); stop(); }
  function readFrom(k){
    if(!reading) return;
    const vs=verses();
    if(k>=vs.length){
      /* on into the next chapter, as the reader does */
      try{ if(typeof idx!=='undefined'&&typeof CH_KEYS!=='undefined'&&idx<CH_KEYS.length-1&&typeof go==='function'){ ours=true; go(idx+1); ours=false; setTimeout(()=>readFrom(0),700); return; } }catch(e){}
      end(); return;
    }
    mark(vs[k]);
    if(!play(lineItems('narrator',textOf(vs[k])),()=>readFrom(k+1))) readFrom(k+1);
  }
  function start(k){ unblock(); V.on=true; reading=true; btn.classList.add('on'); btn.textContent='⏸'; readFrom(k||0); }
  btn.addEventListener('click',()=>{ reading?end():start(0); });
  box.addEventListener('click',e=>{ const el=e.target.closest&&e.target.closest('.verse'); if(!el) return; start(verses().indexOf(el)); });
  if(typeof W.renderChapter==='function'){ const _r=W.renderChapter; W.renderChapter=function(){ if(!ours&&reading) end(); return _r.apply(this,arguments); }; }
  addEventListener('keydown',e=>{ if(e.code==='KeyV'&&!e.repeat) btn.click(); });
  return true;
}

/* ------------------------------------------------------------ the field of battle */
function battleHooks(){
  if(typeof W.giveOrder!=='function'||typeof W.endBattle!=='function') return false;
  const _give=W.giveOrder;
  const ord=()=>typeof ORD!=='undefined'?ORD:{};
  W.giveOrder=function(k){
    const o=ord()[k], before=o&&o.t;
    const r=_give.apply(this,arguments);
    if(o&&o.t!==before&&o.call) play([{text:o.call,who:{kind:'captain',key:'captain'}}]);
    return r; };
  const _end=W.endBattle;
  W.endBattle=function(){ const r=_end.apply(this,arguments);
    const t=document.getElementById('o-title'), s=document.getElementById('o-sub');
    play([{text:(t&&t.textContent)||'',who:'narrator'}].concat(lineItems('narrator',(s&&s.textContent)||''))); return r; };
  const begin=document.getElementById('t-begin');
  if(begin) begin.addEventListener('click',()=>stop());
  addEventListener('keydown',e=>{ if(e.code==='KeyV'&&!e.repeat) V.toggle(); });
  return true;
}

if(V.supported){ loadVoices(); try{ synth.addEventListener('voiceschanged',loadVoices); }catch(e){ synth.onvoiceschanged=loadVoices; } }
let booted=false;
function boot(){ if(booted) return; booted=gameHooks()||readerHooks()||battleHooks(); }
boot(); if(!booted) addEventListener('DOMContentLoaded',boot);
})();
