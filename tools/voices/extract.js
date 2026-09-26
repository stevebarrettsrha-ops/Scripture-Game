/* extract.js — every line that can be heard in the games, with its speaker's part and its
   recording key, for build.py to record.

   It opens each page in a headless browser and asks voice.js itself (the same code the games
   run) who speaks each line and what its key is, so the recordings always match what the
   games look for. Serve the folder first, then:

     python3 -m http.server 8765 --bind 127.0.0.1          (from the game folder)
     node tools/voices/extract.js index.html book-of-*.html battle.html > /dev/null
       → lines.json (or OUT=path)                      needs: npm i playwright                */
const { chromium } = (()=>{ try{ return require('playwright'); }catch(e){ return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs=require('fs');
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const games=process.argv.slice(2);
(async()=>{
  const b=await chromium.launch({args:['--mute-audio']});
  const cx=await b.newContext();
  const out={};
  for(const g of games){
    const p=await cx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto(BASE+g); await p.waitForTimeout(700);
    const src=await (await fetch(BASE+g)).text();
    out[g]=await p.evaluate((src)=>{
      const items=new Map(); let silentChars=0;
      /* the words as the recording engine should read them: the reader's respellings, their
         syllables held together by hyphens so each name is one word, evenly stressed */
      const WORD_RE=/[A-Za-zÀ-ɏḀ-ỿ‘’‚‛ʻʼʹ׳'`´]+/g;
      const GLOSS=/\s*\((?:Most Set Apart Place|Set Apart Ones|Set Apart One|Set Apart Place|Set Apart|Faithful|Sheol)\)/gi;
      const kk=t=>String(t).replace(GLOSS,'').replace(/\(\s*(YAHU[ĂA]H)\s*\)\s*HWHY/g,'$1').replace(/\bO?HWHY\b/gi,m=>m.length===5?'O YAHUAH':'YAHUAH').replace(/[ʿʾ]/g,'’').replace(WORD_RE,w=>BesorahPron.wordFor(w))
        .replace(/\s*[—–―]+\s*/g,', ').replace(/…/g,', ').replace(/[;:]/g,',')
        .replace(/["`´“”‘’«»‹›„‚(){}\[\]<>|\\\/_~^*%#@$&+=§¶†‡•·✦]/g,' ')
        .replace(/\s+([,.!?])/g,'$1').replace(/([,.!?])(?:\s*[,.])+/g,'$1').replace(/^[\s,.]+/,'').replace(/\s{2,}/g,' ').trim();
      const add=(it,where)=>{ const t=String(it.text||'').replace(/\s+/g,' ').trim(); if(!t) return;
        const P=Voice.person(it.who); if(P.kind==='divine') silentChars+=t.length;
        const key=Voice.keyOf(it.who,t); if(items.has(key)) return;
        items.set(key,{key,part:P.kind+':'+P.key,kind:P.kind,name:P.key,text:t,say:Voice.speakable(t),kk:kk(t),where}); };
      const line=(id,t,where)=>{ if(typeof t!=='string'||!t.trim()) return; for(const it of Voice.lineItems(id,t)) add(it,where); };
      const hasStory=typeof STORY!=='undefined';
      if(hasStory){
        for(const a of STORY) for(const ch of (a.chapters||[])) for(const ph of ['intro','outro']){ const list=ch[ph]||[];
          for(let i=0;i<list.length;i++){ const P=Voice.slideItems(list,i); for(const it of (P.flat||[].concat(...P.byPart))) add(it,'slide:'+ch.id); } }
        const seen=new Set();
        const walk=(o,ch)=>{ if(!o||typeof o!=='object'||seen.has(o)) return; seen.add(o);
          if(Array.isArray(o)){ for(const x of o) walk(x,ch); return; }
          if(Array.isArray(o.say)&&typeof o.say[1]==='string') line(o.say[0],o.say[1],'say:'+ch);
          if(Array.isArray(o.sayList)) for(const d of o.sayList) if(Array.isArray(d)) line(d[0],d[1],'sayList:'+ch);
          if(Array.isArray(o.dlg)){ if(Array.isArray(o.dlg[0])){ for(const d of o.dlg) line(d[0],d[1],'dlg:'+ch); } else for(const t of o.dlg) line(o.id,t,'dlg:'+ch); }
          if(o.choice&&typeof o.choice.prompt==='string') line('narrator',o.choice.prompt,'choice:'+ch);
          if(typeof o.needText==='string') line('narrator',o.needText,'need:'+ch);
          if(typeof o.examine==='string') line('narrator',o.examine,'examine:'+ch);
          for(const k in o){ if(k==='intro'||k==='outro') continue; walk(o[k],ch); } };
        for(const a of STORY) for(const ch of (a.chapters||[])) walk(ch,ch.id);
        /* lines written straight into the code */
        const re=/\.say\(\s*(['"])([a-z_0-9]+)\1\s*,\s*(['"])((?:(?!\3)[^\\]|\\.)*)\3\s*[,)]/g; let m;
        while((m=re.exec(src))){ let t=m[4]; try{ t=JSON.parse('"'+t.replace(/\\'/g,"'").replace(/"/g,'\\"')+'"'); }catch(e){} line(m[2],t,'code'); }
        /* and lines handed out as the game runs: n.dlg=[['builder2','Velu shana kithra?!']] */
        const pair=/\[\s*(['"])([a-z_0-9]+)\1\s*,\s*(['"])((?:(?!\3)[^\\]|\\.)*)\3\s*\]/g;
        while((m=pair.exec(src))){ if(!CHARS[m[2]]||!/[A-Za-z]{2}/.test(m[4])||!/\s/.test(m[4])||m[4].length<10) continue; let t=m[4]; try{ t=JSON.parse('"'+t.replace(/\\'/g,"'").replace(/"/g,'\\"')+'"'); }catch(e){} line(m[2],t,'code'); }
      }
      /* the field of battle: the commander's cries, and each battle's end */
      if(typeof BATTLES!=='undefined'){
        for(const k in BATTLES){ const B=BATTLES[k];
          add({text:B.defeat?(B.overTitle||'Defeat'):'Victory',who:'narrator'},'battle:'+k);
          line('narrator',B.win,'battle:'+k); }
        if(typeof ORD!=='undefined') for(const k in ORD) add({text:ORD[k].call,who:{kind:'captain',key:'captain'}},'order:'+k);
      }
      if(typeof BOOK!=='undefined'&&BOOK.chapters){
        for(const k in BOOK.chapters) for(const v of BOOK.chapters[k]) line('narrator',v.t,'verse:'+k+':'+v.v);
      }
      return {items:[...items.values()],silentChars};
    },src);
    out[g].errs=errs;
    await p.close();
    const n=out[g].items.length, c=out[g].items.reduce((s,x)=>s+x.say.length,0);
    console.log(g.padEnd(34),String(n).padStart(6),'lines',String(c).padStart(8),'chars','yahuah',out[g].silentChars,errs.length?'ERR '+errs[0]:'');
  }
  fs.writeFileSync(process.env.OUT||'lines.json',JSON.stringify(out));
  await b.close();
})();
