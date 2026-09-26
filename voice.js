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
   the Besorah reader does), the most natural the device has. Names are said as the reader says
   them (pron.js, the reader's own lexicon); the speed is the reader's speed.

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
   Sovereign and Dawiḏ son of Yahshai are one man with one voice; Aḇram is Aḇraham */
const TITLE=new Set(['sovereign','sovereigness','king','queen','prince','princess','prophet','nabi','kohen','priest','lord','captain','commander','general','chief','high']);
const ALIAS={abram:'abraham',sarai:'sarah'};
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
function person(id){
  if(id&&typeof id==='object') return id;
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
/* the reader's pronunciation, with the pauses and the rise of a question kept for the ear */
const WORD_RE=/[A-Za-zÀ-ɏḀ-ỿ‘’‚‛ʻʼʹ׳'`´]+/g;
const GLOSS=/\s*\((?:Most Set Apart Place|Set Apart Ones|Set Apart One|Set Apart Place|Set Apart|Faithful|Sheol)\)/gi;
/* "(YAHUAH) HWHY": the Name is said once; the glyph beside it is for the eye, as in the reader */
const HWHY=/\(\s*(YAHU[ĂA]H)\s*\)\s*HWHY/g;
function speakable(text){
  const P=W.BesorahPron;
  /* ʿ and ʾ are the ayin and aleph the lexicon knows as ’ */
  let s=String(text||'').replace(GLOSS,'').replace(HWHY,'$1').replace(/\bO?HWHY\b/gi,m=>m.length===5?'O YAHUAH':'YAHUAH').replace(/[ʿʾ]/g,'’');
  if(P&&P.wordFor) s=s.replace(WORD_RE,w=>P.wordFor(w));
  return s.replace(/[-‐‑‒–—―−]+/g,' ').replace(/…/g,', ').replace(/[;:]/g,',')
          .replace(/["'`´“”‘’«»‹›„‚(){}\[\]<>|\\\/_~^*%#@$&+=§¶†‡•·✦]/g,' ')
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
  men:'crowd', people:'crowd', sons:'crowd', brothers:'crowd', crowd:'crowd', multitude:'crowd', assembly:'crowd', congregation:'crowd',
  serpent:'serpent', boy:'boy', lad:'boy', youth:'boy', girl:'girl', child:'boy' };
const NOT_NAME=new Set(['at','ease','fair','the','a','an','and','then','now','so','but','when','after','o','i','my','his','her','their','your','our','one','all','this','that','these','those','there','thus','for','yet','behold','see','come','go','let','in','on','to','of','from','he','she','they','it','we','you','who','what','if','as','because','therefore','also','again','not','no','with','by','before','who','which']);
const SPEECH_V=/^(said|says|say|spoke|speaks|speak|spake|answered|answers|answer|called|calls|cried|cries|cry|asked|asks|replied|replies|declares|declared|commanded|commands|shouted|shouts|prayed|prays|sang|sings|sing|wrote|writes|told|tells|swore|proclaimed|proclaims|lamented|blessed|charged|vowed|exclaimed|whispered|besought|pleaded|saying)$/i;
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
  const out=[], re=/[A-Za-zÀ-ɏḀ-ỿ‘’‚‛ʻʼʹ׳'`´]+|[,;:—–(]/g; let m;
  while((m=re.exec(s))){ const raw=m[0]; out.push({raw,k:nameKey(raw),p:/^[,;:—–(]$/.test(raw),poss:/[a-z][’']s$/i.test(raw)}); }
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
  if(SUBJ_PRON[k]){ if(raw==='He'&&i>0&&!T[i-1].p) return 'voice'; return {pron:SUBJ_PRON[k]}; }
  if(cap&&!NOT_NAME.has(k)){
    const id=names().get(k);
    if(id){ const nk=nameKey((C[id]||{}).name); return castPick(cast,c=>nameKey(c.name)===nk)||id; }
    /* a name the story gives no figure: a voice of its own all the same */
    if(/[^\x00-\x7f]/.test(raw)||(T[i+1]&&/^(son|daughter)$/.test(T[i+1].k))) return {kind:'man',key:k};
  }
  const r=ROLE_NOUN[k];
  if(r){
    const nx=T[i+1]&&!T[i+1].p?whoOf(T,i+1,cast):null;     /* a title before a name: Sovereign Dawiḏ */
    if(nx&&typeof nx==='string'&&nx!=='voice') return nx;
    return castPick(cast,c=>nameKey(c.name).split(/[\s,]+/).includes(k))||(r==='serpent'&&C.serpent_c?'serpent_c':{kind:r,key:k});
  }
  return null;
}
const sexOfWho=w=>{ if(w==='voice') return 'm'; const k=person(w).kind; return /woman|girl/.test(k)?'f':k==='crowd'?'crowd':'m'; };
function antecedent(T,i,sex,cast){
  for(let j=i-1;j>=0;j--){ const w=whoOf(T,j,cast); if(!w||w.pron) continue; if(sexOfWho(w)===sex) return w; }
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
  let end=v;
  for(let hop=0;hop<3&&end>0;hop++){
    let st=end-1; while(st>=0&&!T[st].p) st--;
    for(let i=st+1;i<end;i++){ const w=whoOf(T,i,cast); if(!w) continue;
      if(w.pron) return antecedent(T,i,w.pron,cast)||w;
      return w; }
    end=st;
  }
  for(let i=v+1;i<Math.min(T.length,v+4);i++){
    if(T[i].p||T[i].k==='to'||T[i].k==='unto') break;
    const w=whoOf(T,i,cast); if(w&&!w.pron) return w;
  }
  return null;
}
/* whose words a quotation holds when nothing names the speaker: in Wayyiqra and the books of the
   prophets, the words of YAHUAH; in Deḇarim, the words of Mosheh */
const PAGE=((location.pathname||'').split('/').pop()||'index.html').replace(/\.html$/,'');
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
    /* “Come,” he said, “let us go” — the same voice goes on */
    if(lastQ){ const between=text.slice(lastQ.b,sp.a);
      if(between.length<48&&/\b(said|says|saying|answered|replied|cried|called|declares)\b/i.test(between)){ const b=subjectOf(between,opts.cast); if(!b||b.pron) who=lastQ.who; } }
    /* a name given, not words spoken: it shall be called “The Way of Set-apartness” */
    if(!who&&q.length<48&&/\b(called|named|name|call|names|written|inscribed|inscription)\b[^.!?]*$/i.test(lead)&&!/\b(said|saying|answered)\b[^.!?]*$/i.test(lead)) who='narrator';
    if(!who){ s=subjectOf(lead,opts.cast); if(s&&!s.pron) who=s; }
    /* “I have loved you,” said YAHUAH */
    if(!who&&!s){ const tail=text.slice(sp.b,sp.b+70).split(/[.!?“]/)[0];
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
        const cand=spoke.slice().reverse().find(w=>w!==prev&&w!=='voice'&&sexOfWho(w)===sex);
        const castCand=(opts.cast||[]).map(c=>c&&c.id).find(id=>id&&id!=='voice'&&id!==prev&&chars()[id]&&sexOfWho(id)===sex);
        who=cand||castCand||(prev&&sexOfWho(prev)===sex?prev:{kind:sex==='f'?'woman':'man',key:'someone'});
      }
    }
    const bare=!/[A-Za-z]{2}/.test(lead);
    if(!who&&bare&&lastQ) who=lastQ.who;
    /* His presence stands on the stage of the verse: the words are His */
    if(!who&&(opts.cast||[]).some(c=>c&&c.id==='voice')) who='voice';
    if(!who&&bare&&opts.prev) who=opts.prev;
    /* and where nothing tells, the narrator reads them rather than a stranger */
    if(!who) who=lastQ?lastQ.who:(bookSpeaker()||'narrator');
    out.push({a:sp.a,b:sp.b,who}); lastQ={b:sp.b,who}; spoke.push(who);
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
function stop(){
  gen++; queue=[]; onDone=null; clearTimeout(dog);
  if(playing){ try{ playing.pause(); playing.onended=playing.onerror=null; }catch(e){} playing=null; }
  if(V.supported&&(synth.speaking||synth.pending)){ try{ synth.cancel(); }catch(e){} lastCancel=now(); }
  V.busy=false; talking(false);
}
/* items: [{text, who}] heard one after another; done() when the last is over */
function play(items,done){
  stop();
  if(!V.canSpeak()) return false;
  const my=gen;
  for(const it of (items||[])){
    if(!it||!norm(it.text)) continue;
    const clip=clipFor(it.who,it.text);
    if(clip){ queue.push({clip,text:it.text,who:it.who}); continue; }
    if(!V.supported||V.broken) continue;
    const r=role(it.who); for(const c of chunks(it.text,r.rate*V.rate)) queue.push({text:c,who:it.who});
  }
  if(!queue.length) return false;
  onDone=done||null; V.busy=true;
  for(const q of queue) if(q.clip){ clipEl(q.clip.url); break; }
  next(my);
  return true;
}
function record(q,kind,voice){
  V.heard.push({text:q.text||'',who:typeof q.who==='object'?q.who.kind+':'+q.who.key:(q.who||''),kind,voice:voice||''});
  if(V.heard.length>600) V.heard.splice(0,200);
}
function next(my){
  if(my!==gen) return;
  const q=queue.shift();
  if(!q){ V.busy=false; talking(false); const d=onDone; onDone=null; if(d) d(); return; }
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
  u.onstart=()=>{ started=true; V.fails=0; clearTimeout(dog); dog=setTimeout(fin,est*1.8+2500); };
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
V.line=function(id,text){ return play(lineItems(id,text)); };
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
function tickDriver(G){
  const d=driver; if(!d) return;
  if(G.state!=='slides'){ driver=null; return; }
  const c=W.Stage&&W.Stage.cur; if(!c||c.slide!==d.s||!V.canSpeak()) return;
  const st=G.slideT||0, n=c.parts.length;
  if(d.speaking&&!V.busy) d.speaking=false;
  if(d.speaking){ hold(c,d.k+1,st); return; }
  const k=d.k+1; if(k>=n) return;
  if(c.allAt!=null||st>=c.times[k]){
    d.k=k; hold(c,k+1,st);
    d.speaking=play(d.byPart[k]||[],()=>{ if(driver===d) d.speaking=false; });
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
