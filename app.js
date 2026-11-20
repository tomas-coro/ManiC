import {TYPES,MESI,GIORNI,DOW,isoDate,monthGrid,monthRange,typesOnDay,countsOnDay,monthStats,daysSince,agoLabel,flowOf,MOMENTS,fasciaOf,whoOf,TOGETHER_SINCE,balance,monthKey,monthsStats,prevMonthKey,prevOf,daysTogether,togetherLabel,heatMap,weekdayCounts,records,momentCounts} from './logic.js';
import {SPRITE} from './icons.js';
import * as api from './api.js';
import {fetchSignature,shortVersion} from './update.js';
import {saveCache,loadCache,clearCache} from './cache.js';
import {validPin,hasPin,setPin,checkPin,pinLength,lockLeft,failsLeft,recordFail,clearFails} from './pin.js';

const root=document.getElementById('root');
const LOCK_KEY='manic-autolock';
const COVER_KEY='manic-cover';
const LOCK_OPTS=[['subito','Subito',0],['1','1 min',60000],['5','5 min',300000]];
let now=new Date();
let todayIso=isoDate(now.getFullYear(),now.getMonth(),now.getDate());

const since=()=>st.since||TOGETHER_SINCE;
const lockOpt=()=>{let v=null;try{v=localStorage.getItem(LOCK_KEY);}catch(e){console.warn('preferenza illeggibile',e);}return LOCK_OPTS.find(o=>o[0]===v)||LOCK_OPTS[1];};
const coverOn=()=>{try{return localStorage.getItem(COVER_KEY)!=='0';}catch(e){console.warn('preferenza illeggibile',e);return true;}};
function setPref(k,v){
  try{localStorage.setItem(k,v);}catch(e){
    console.warn('preferenza non salvata',e);
    throw new Error('Impossibile salvare la preferenza su questo telefono');
  }
}

function tick(){
  now=new Date();
  todayIso=isoDate(now.getFullYear(),now.getMonth(),now.getDate());
}

const st={
  screen:'boot',
  error:'',
  busy:false,
  session:null,
  members:[],
  me:null,
  events:[],
  all:null,
  allErr:'',
  allLoading:false,
  page:null,
  editName:null,
  since:null,
  editSince:false,
  pwOpen:false,
  statsView:'mese',
  statsMo:null,
  statsDay:null,
  heatF:null,
  heatMo:null,
  recapOff:false,
  lastDate:null,
  y:now.getFullYear(),
  m:now.getMonth(),
  sel:null,
  sheet:null,
  counts:{sesso:0,pompino:0,leccata:0,anale:0,ditalini:0},
  addDate:null,
  editId:null,
  addMom:null,
  addAuto:null,
  addClock:'',
  addTouched:false,
  open:null,
  undo:null,
  note:'',
  filter:null,
  pin:'',
  pinFirst:'',
  pinLen:4,
  pinBusy:false,
  forgot:false,
  gen:0,
  loading:false,
  loadErr:'',
  offline:false,
  fromCache:false,
  syncAt:null,
  updReady:false,
  updMsg:'',
  version:''
};

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
document.body.insertAdjacentHTML('afterbegin',SPRITE);
const icon=(t,cls)=>'<svg class="ic '+(cls||'')+'" aria-hidden="true"><use href="#i-'+t+'"/></svg>';
const wm=full=>'<img class="wmi" src="assets/wordmark-'+(full?'completo':'lettere')+'.png" alt="ManiC">';
const LOCK='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const GEAR='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

const BARS='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20V11M12 20V4M19 20v-6"/></svg>';
const CAL='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>';
const RECAP_KEY='manic-recap';

function names(){
  const n={1:'',2:''};
  st.members.forEach(m=>{n[m.slot]=m.display_name});
  return n;
}

let baseline=null;

async function checkUpdate(manual){
  try{
    const sig=await fetchSignature();
    if(baseline===null){baseline=sig;st.version=shortVersion(sig);}
    else if(sig!==baseline) st.updReady=true;
    if(manual) st.updMsg=st.updReady?'Nuova versione disponibile':'Sei aggiornato';
  }catch(e){
    console.warn('controllo aggiornamenti non riuscito',e);
    if(manual) st.updMsg='Controllo non riuscito: '+(e&&e.message?e.message:'errore di rete');
  }
  if(manual||st.page==='settings') render();
  else updateBar();
}

function updateBar(){
  const old=document.getElementById('upd');
  if(old) old.remove();
  if(!st.updReady||st.page==='settings') return;
  root.insertAdjacentHTML('beforeend','<div class="upd" id="upd" role="status"><span>C\'è una nuova versione</span><button data-act="upd-reload">Aggiorna</button></div>');
}

function banner(){
  return st.error?'<div class="banner" role="alert">'+esc(st.error)+'</div>':'';
}

function showError(e){
  st.error=e&&e.message?e.message:'Qualcosa è andato storto';
  st.busy=false;
  render();
}

function viewLogin(){
  return '<section class="screen">'+wm(true)+'<p>Accedi per continuare.</p>'+banner()
    +'<form id="f-login" class="screen-form">'
    +'<input class="field" type="email" name="email" placeholder="Email" autocomplete="username" required>'
    +'<input class="field" type="password" name="password" placeholder="Password" autocomplete="current-password" required>'
    +'<button class="cta" type="submit"'+(st.busy?' disabled':'')+'>'+(st.busy?'Accesso in corso':'Accedi')+'</button></form></section>';
}

const wait=ms=>new Promise(r=>setTimeout(r,ms));
const pinLen=()=>st.screen==='setpin'?st.pinLen:pinLength(localStorage);
const dotCount=()=>pinLen()||Math.min(6,Math.max(4,st.pin.length));
const dotsHtml=n=>'<i></i>'.repeat(n);
const pinLabel=()=>st.error||(st.screen==='setpin'?(st.pinFirst?'Ripeti lo stesso PIN':'Scegli un PIN'):'Inserisci il PIN');

function pinView(){
  const len=pinLen();
  const setup=st.screen==='setpin';
  let keys='';
  [1,2,3,4,5,6,7,8,9].forEach(n=>{keys+='<button data-act="pin-digit" data-v="'+n+'">'+n+'</button>'});
  keys+=len?'<button class="nil" tabindex="-1" aria-hidden="true"></button>':'<button class="ghost ok" data-act="pin-ok" aria-label="Conferma">OK</button>';
  keys+='<button data-act="pin-digit" data-v="0">0</button><button class="ghost" data-act="pin-back" aria-label="Cancella">&#9003;</button>';
  const seg=setup?'<div class="plen" id="plen" role="group" aria-label="Lunghezza del PIN"'+(st.pin||st.pinFirst?' hidden':'')+'>'
    +[4,6].map(n=>'<button data-act="pin-len" data-v="'+n+'" aria-pressed="'+(st.pinLen===n)+'">'+n+' cifre</button>').join('')+'</div>':'';
  const left=setup?0:lockLeft(localStorage,Date.now());
  const lock=setup?'':'<div class="plock" role="status"><span>Troppi tentativi</span><b id="pleft">'+pinLeftText(left||300000)+'</b><span id="pnote">'+esc(st.error||'Riprova tra qualche minuto')+'</span></div>';
  return '<section class="pinscr'+(left>0?' blk':'')+'">'+wm()+'<div class="prule"></div>'
    +'<p class="plab'+(st.error?' err':'')+'" id="plab" role="status">'+esc(pinLabel())+'</p>'
    +'<div class="pdots" id="pdots" aria-hidden="true">'+dotsHtml(dotCount())+'</div>'+seg+lock
    +'<div class="ppad">'+keys+'</div>'
    +'<div class="pfoot">'+(setup?'':'<button class="link" data-act="forgot">PIN dimenticato?</button>')+'</div></section>';
}

const pinLeftText=ms=>{const s=Math.ceil(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
let pinTimer;

function pinWatch(){
  clearInterval(pinTimer);
  const tick=()=>{
    const sec=document.querySelector('.pinscr');
    if(!sec||st.screen!=='lock'){clearInterval(pinTimer);return;}
    const left=lockLeft(localStorage,Date.now());
    if(left>0){
      sec.classList.add('blk');
      const t=document.getElementById('pleft');
      if(t) t.textContent=pinLeftText(left);
      return;
    }
    clearInterval(pinTimer);
    if(sec.classList.contains('blk')){
      sec.classList.remove('blk');
      Object.assign(st,{pin:'',error:'',pinBusy:false,forgot:false});
      pinSay(pinLabel(),false);
      pinPaint();
    }
  };
  tick();
  if(lockLeft(localStorage,Date.now())>0) pinTimer=setInterval(tick,1000);
}

function viewSetPin(){return pinView();}
function viewLock(){return pinView();}

function pinPaint(){
  const d=document.getElementById('pdots');
  if(!d) return;
  const n=dotCount();
  if(d.children.length!==n) d.innerHTML=dotsHtml(n);
  [...d.children].forEach((el,i)=>el.classList.toggle('on',i<st.pin.length));
  const seg=document.getElementById('plen');
  if(seg) seg.hidden=!!(st.pin||st.pinFirst);
}

function pinSay(text,err){
  const l=document.getElementById('plab');
  if(!l) return;
  l.textContent=text;
  l.classList.toggle('err',!!err);
}

function pinFail(msg){
  const d=document.getElementById('pdots');
  st.error=msg;
  pinSay(msg,true);
  if(d){d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake');}
  setTimeout(()=>{st.pin='';st.pinBusy=false;if(d)d.classList.remove('shake');pinPaint();},450);
}

const MIC={
  mat:'<svg class="mi" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18M6 18a6 6 0 0 1 12 0M12 5v3M4.5 10.5l2 1.5M19.5 10.5l-2 1.5"/></svg>',
  pom:'<svg class="mi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>',
  ser:'<svg class="mi" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18M6 18a6 6 0 0 1 12 0M12 8V5M9 6.5l1.2 1.2M15 6.5l-1.2 1.2"/></svg>',
  not:'<svg class="mi" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  nd:'<svg class="mi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.01"/></svg>'
};

const dayEvents=iso=>(st.all||st.events).filter(e=>e.event_date===iso);
const findEvent=id=>(st.all||st.events).find(e=>e.id===id)||st.events.find(e=>e.id===id);
const momLabel=k=>MOMENTS.find(m=>m.k===k).label;

function dateTitle(iso){
  const [y,m,d]=iso.split('-').map(Number);
  return GIORNI[new Date(y,m-1,d).getDay()]+' '+d+' '+MESI[m-1].toLowerCase();
}

function addDays(iso,n){
  const [y,m,d]=iso.split('-').map(Number);
  const dt=new Date(y,m-1,d+n);
  return isoDate(dt.getFullYear(),dt.getMonth(),dt.getDate());
}

function stripDays(iso){
  const days=[];
  for(let i=6;i>=0;i--) days.push(addDays(todayIso,-i));
  if(!days.includes(iso)) days[0]=iso;
  return days;
}

function evItem(e){
  const open=st.open===e.id;
  const dis=st.offline?' disabled':'';
  const sub=flowOf(e.type,st.me.slot)+(e.note?' · '+esc(e.note):'');
  let h='<div class="di'+(open?' open':'')+'" style="--cc:var(--c-'+e.type+')"><button class="di-h" data-act="exp" data-id="'+e.id+'" aria-expanded="'+open+'">'+icon(e.type)+'<span class="di-t"><b>'+e.type+'</b><small>'+sub+'</small></span><span class="di-c" aria-hidden="true">&rsaquo;</span></button>';
  if(open){
    h+='<div class="di-x"><div class="mg">'+MOMENTS.map(m=>'<button class="chip" data-act="emom" data-id="'+e.id+'" data-k="'+m.k+'" aria-pressed="'+(e.moment===m.k)+'"'+dis+'>'+MIC[m.k]+'<span>'+m.label+'</span></button>').join('')+'</div>'
      +'<div class="di-r"><button class="lk" data-act="emom" data-id="'+e.id+'" data-k=""'+(e.moment?'':' aria-pressed="true"')+dis+'>Non ricordo</button><button class="lk" data-act="edit" data-id="'+e.id+'"'+dis+'>Modifica</button><button class="lk" data-act="del" data-id="'+e.id+'"'+dis+'>Rimuovi</button></div></div>';
  }
  return h+'</div>';
}

function detail(){
  const iso=st.sel;
  const list=dayEvents(iso);
  const lock=st.offline||iso>todayIso?' disabled':'';
  const sub=list.length?list.length+(list.length===1?' atto':' atti'):'Niente ancora';
  let h='<div class="sh-hd"><div class="sh-tt">'+dateTitle(iso)+'<small>'+sub+'</small></div><button class="sh-x" data-act="close" aria-label="Chiudi">×</button></div><div class="sh-bd">';
  MOMENTS.forEach(m=>{
    const li=list.filter(e=>e.moment===m.k);
    h+='<div class="fb'+(li.length?'':' empty')+'"><div class="fh"><span class="th">'+MIC[m.k]+'</span><b>'+m.label+'</b><small>'+m.range+'</small><span class="sp"></span>'+(li.length?'<span class="ct">'+li.length+'</span>':'')+'<button class="fp" data-act="addin" data-v="'+m.k+'" aria-label="Aggiungi in '+m.label.toLowerCase()+'"'+lock+'>+</button></div>'+li.map(evItem).join('')+'</div>';
  });
  const nd=list.filter(e=>!e.moment);
  if(nd.length) h+='<div class="fb"><div class="fh"><span class="th">'+MIC.nd+'</span><b>Senza momento</b><span class="sp"></span><span class="ct">'+nd.length+'</span></div>'+nd.map(evItem).join('')+'</div>';
  return h+'</div><div class="sh-ft"><button class="cta" data-act="goadd"'+lock+'>+ Aggiungi</button></div>';
}

function addPanel(){
  const iso=st.addDate;
  const past=iso!==todayIso;
  const editing=st.editId?findEvent(st.editId):null;
  const total=editing?1:TYPES.reduce((n,t)=>n+st.counts[t],0);
  const changed=!editing||iso!==editing.event_date||(st.addMom==='nd'?null:st.addMom)!==(editing.moment||null)||st.note.trim()!==(editing.note||'');
  const ok=total>0&&changed&&st.addMom!==null&&iso<=todayIso&&!st.busy&&!st.offline;
  const auto=!editing&&!past&&!st.addTouched&&st.addMom===st.addAuto;
  const hint=auto?'<i></i>Adesso sono le '+st.addClock+': scelta in automatico':st.addMom===null?'Scegli in che fascia è successo':st.addMom==='nd'?'Va in &ldquo;Senza momento&rdquo;':'Fascia scelta da te';
  let h='<div class="sh-hd"><div class="sh-tt">'+(editing?'Modifica':'Aggiungi')+'<small>'+dateTitle(iso)+'</small></div><button class="sh-x" data-act="cancel" aria-label="Torna al giorno">×</button></div><div class="sh-bd">';
  h+='<div class="wk" role="group" aria-label="Giorno">'+stripDays(iso).map(d=>{
    const [y,m,n]=d.split('-').map(Number);
    return '<button data-act="date" data-v="'+d+'" aria-pressed="'+(d===iso)+'"><span>'+GIORNI[new Date(y,m-1,n).getDay()].slice(0,3)+'</span><b>'+n+'</b></button>';
  }).join('')+'</div>';
  h+='<label class="mnd more">Altro giorno<input type="date" class="dpk" data-act="datepick" max="'+todayIso+'" value="'+iso+'" aria-label="Scegli un altro giorno"></label>';
  h+=editing?'<div class="ar-list"><div class="ar on" style="--cc:var(--c-'+editing.type+')">'+icon(editing.type)+'<span class="ar-n">'+editing.type+'<small>'+flowOf(editing.type,st.me.slot)+'</small></span></div></div>':'<div class="ar-list">'+TYPES.map(t=>{
    const n=st.counts[t];
    return '<div class="ar'+(n?' on':'')+'" style="--cc:var(--c-'+t+')">'+icon(t)+'<span class="ar-n">'+t+'<small>'+flowOf(t,st.me.slot)+'</small></span><button class="ar-b" data-act="dec" data-v="'+t+'" aria-label="Una volta in meno: '+t+'"'+(n?'':' disabled')+'>-</button><b class="ar-c">'+n+'</b><button class="ar-b p" data-act="inc" data-v="'+t+'" aria-label="Una volta in più: '+t+'">+</button></div>';
  }).join('')+'</div>';
  h+='<div class="sh-lab">Quando</div><div class="hint'+(st.addMom===null?' warn':'')+'" role="status">'+hint+'</div>';
  h+='<div class="mseg" role="group" aria-label="Fascia">'+MOMENTS.map(m=>'<button data-act="mom" data-v="'+m.k+'" aria-pressed="'+(st.addMom===m.k)+'">'+MIC[m.k]+m.label+'<small>'+m.range+'</small></button>').join('')+'</div>';
  h+='<button class="mnd" data-act="mom" data-v="nd" aria-pressed="'+(st.addMom==='nd')+'">Non ricordo</button>';
  h+='<div class="sh-lab">Nota (facoltativa)</div><input class="note" type="text" maxlength="80" placeholder="una riga, se vuoi" value="'+esc(st.note)+'" data-act="note" aria-label="Nota">';
  const label=st.busy?'Salvataggio':editing?(st.addMom===null?'Scegli la fascia':changed?'Salva modifica':'Nessuna modifica'):!total?'Scegli un atto':st.addMom===null?'Scegli la fascia':'Salva &middot; '+total;
  return h+'</div><div class="sh-ft"><button class="cta ghost" data-act="cancel">Annulla</button><button class="cta" data-act="save"'+(ok?'':' disabled')+'>'+label+'</button></div>';
}

const SET_ICO={
  lock:'<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>',
  sync:'<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>',
  timer:'<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 3h6"/></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/><path d="M4 4l16 16"/></svg>',
  key:'<svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3"/></svg>',
  down:'<svg viewBox="0 0 24 24"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>'
};

function setRow(act,ico,label,right,extra){
  return '<button class="s-r'+(extra||'')+'" data-act="'+act+'"><span class="s-ico">'+ico+'</span><span class="s-l">'+label+'</span>'+(right?'<span class="s-v">'+right+'</span>':'')+'<span class="s-c">&rsaquo;</span></button>';
}

function nameRow(who,label,name,slot){
  const ini=esc((name||'?').trim().charAt(0).toUpperCase()||'?');
  const av='<span class="s-av'+(slot===2?' two':'')+'">'+ini+'</span>';
  if(st.editName===who){
    return '<div class="s-edit">'+av+'<input class="note" type="text" maxlength="30" value="'+esc(name)+'" data-name="'+who+'" autofocus aria-label="'+label+'"><button class="s-sv" data-act="save-name" data-v="'+who+'">Salva</button><button class="s-cn" data-act="cancel-name" aria-label="Annulla">&times;</button></div>';
  }
  return '<button class="s-r" data-act="edit-name" data-v="'+who+'">'+av+'<span class="s-l">'+label+'</span><span class="s-v">'+esc(name)+'</span><span class="s-c">&rsaquo;</span></button>';
}

function sinceRow(){
  const [y,m,d]=since().split('-').map(Number);
  if(st.editSince){
    return '<div class="s-edit"><span class="s-ico">'+SET_ICO.heart+'</span><input class="note" type="date" max="'+todayIso+'" value="'+since()+'" data-since aria-label="Insieme da"><button class="s-sv" data-act="save-since">Salva</button><button class="s-cn" data-act="cancel-since" aria-label="Annulla">&times;</button></div>';
  }
  return setRow('edit-since',SET_ICO.heart,'Insieme da',d+' '+MESI_BREVI[m-1].toLowerCase()+' '+y);
}
function lockBlock(){
  const cur=lockOpt();
  return '<div class="s-r col"><div class="s-rr"><span class="s-ico">'+SET_ICO.timer+'</span><span class="s-l">Blocco automatico</span><span class="s-v">'+cur[1]+'</span></div>'
    +'<div class="s-sg" role="group" aria-label="Blocco automatico">'+LOCK_OPTS.map(o=>'<button data-act="autolock" data-v="'+o[0]+'" aria-pressed="'+(o[0]===cur[0])+'">'+o[1]+'</button>').join('')+'</div>'
    +'<small class="s-hint">Quanto tempo può stare in background prima di chiedere il PIN.</small></div>';
}
function coverRow(){
  return '<div class="s-r"><span class="s-ico">'+SET_ICO.eye+'</span><span class="s-l">Copri schermata<small class="s-sub">Nel selettore app dell\'iPhone non si vede il calendario</small></span><button class="s-tgl" role="switch" aria-checked="'+coverOn()+'" data-act="toggle-cover" aria-label="Copri schermata in background"><i></i></button></div>';
}
function pwBlock(){
  if(!st.pwOpen) return setRow('edit-pw',SET_ICO.key,'Cambia password','');
  const f=(k,ph,ac)=>'<input class="note" type="password" data-pw="'+k+'" placeholder="'+ph+'" autocomplete="'+ac+'" aria-label="'+ph+'">';
  return '<div class="s-pw">'+f('pw-cur','Password attuale','current-password')+f('pw-new','Nuova password (almeno 8 caratteri)','new-password')+f('pw-rep','Ripeti la nuova password','new-password')
    +'<div class="s-pwb"><button class="s-sv" data-act="save-pw">Cambia password</button><button class="s-cn" data-act="cancel-pw" aria-label="Annulla">&times;</button></div></div>';
}
function settings(){
  const n=names();
  const other=st.members.find(x=>x.user_id!==st.me.user_id);
  const mySlot=st.me.slot;
  const ini=v=>esc((v||'?').trim().charAt(0).toUpperCase()||'?');
  const [y,m,d]=since().split('-').map(Number);
  const hero='<div class="s-hero"><span class="s-avs"><span class="s-av big">'+ini(n[1])+'</span><span class="s-av big two">'+ini(n[2])+'</span></span><div class="s-ht"><b>'+esc(n[1])+' e '+esc(n[2])+'</b><small>insieme dal '+d+' '+MESI[m-1].toLowerCase()+' '+y+'</small></div><div class="s-hn"><b>'+daysTogether(since(),todayIso)+'</b><small>giorni</small></div></div>';
  const upd=st.updReady
    ?'<button class="s-r gold" data-act="upd-reload"><span class="s-ico">'+SET_ICO.sync+'</span><span class="s-l">Aggiorna ora</span><span class="s-v">'+esc(st.updMsg||'Nuova versione')+'</span></button>'
    :setRow('check-update',SET_ICO.sync,'Controlla aggiornamenti',esc(st.updMsg));
  return hero
    +'<div class="s-gl">Profilo</div><div class="s-grp">'+nameRow('me','Il tuo nome',n[mySlot],mySlot)+nameRow('other','Il suo nome',other?other.display_name:'',mySlot===1?2:1)+sinceRow()+'</div>'
    +'<div class="s-gl">Sicurezza</div><div class="s-grp">'+setRow('change-pin',SET_ICO.lock,'Cambia PIN',pinLength(localStorage)?pinLength(localStorage)+' cifre':'')+lockBlock()+coverRow()+pwBlock()+setRow('lock-now',SET_ICO.shield,'Blocca ora','')+'</div>'
    +'<div class="s-gl">Dati</div><div class="s-grp">'+setRow('export',SET_ICO.down,'Esporta backup','File JSON')+'</div>'
    +'<div class="s-gl">App</div><div class="s-grp"><div class="s-r static"><span class="s-ico">'+SET_ICO.clock+'</span><span class="s-l">Versione</span><span class="s-v">'+esc(st.version||'...')+'</span></div>'+upd+'</div>'
    +'<div class="s-gl">Account</div><div class="s-grp"><button class="s-r red" data-act="logout">Esci dall\'account</button></div>'
    +'<p class="s-ft">ManiC &middot; solo per voi due</p>';
}

function recapSeen(){
  if(st.recapOff) return true;
  try{return localStorage.getItem(RECAP_KEY)===monthKey(todayIso);}catch{return false;}
}

function dl(a,b){
  if(b===null) return '';
  if(a>b) return '<span class="dl up">&#9650; '+(a-b)+'</span>';
  if(a<b) return '<span class="dl dn">&#9660; '+(b-a)+'</span>';
  return '<span class="dl dn">=</span>';
}

function rowsHtml(c,p){
  return TYPES.map(t=>'<div class="row">'+icon(t)+'<span class="nm">'+t+'</span>'+(p?dl(c[t],p.counts[t]):'')+'<span class="n">'+c[t]+'</span></div>').join('');
}

function balHtml(c){
  const b=balance(c,st.me.slot);
  const s=b.dati+b.ricevuti;
  if(!s) return '';
  const txt=b.diff>0?'Hai dato <b>'+b.diff+' in più</b> di quanto hai ricevuto.':b.diff<0?'Hai ricevuto <b>'+(-b.diff)+' in più</b> di quanto hai dato.':'Ricevuto e dato <b>in pari</b>.';
  return '<div class="bal"><p>'+txt+'</p><div class="bb"><i class="r" style="width:'+(b.ricevuti/s*100)+'%"></i><i class="g" style="width:'+(b.dati/s*100)+'%"></i></div><div class="bl"><span>Ricevuti '+b.ricevuti+'</span><span>Dati '+b.dati+'</span></div></div>';
}

function stackHtml(s){
  return '<span class="stk">'+TYPES.filter(t=>s.counts[t]).map(t=>'<i style="width:'+(s.counts[t]/s.total*100)+'%;background:var(--c-'+t+')"></i>').join('')+'</span>';
}

function togetherHtml(){
  const [y,m,d]=since().split('-').map(Number);
  return '<div class="tg"><b>'+daysTogether(since(),todayIso)+'</b><span><i>giorni insieme</i>dal '+d+' '+MESI[m-1].toLowerCase()+' '+y+' · '+togetherLabel(since(),todayIso)+'</span></div>';
}

const MESI_BREVI=['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const DOW_FULL=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
const HEAT_WEEKS=53;
const HEAT_MONTHS=12;

function monthEntry(key,list){
  const f=list.find(x=>x.key===key);
  if(f) return f;
  const [y,m]=key.split('-').map(Number);
  const counts={};
  TYPES.forEach(t=>{counts[t]=0});
  return {key,y,m:m-1,total:0,activeDays:0,counts};
}

function monthKeysFrom(startIso,endIso){
  const out=[];
  let [y,m]=startIso.split('-').map(Number);
  const [ey,em]=endIso.split('-').map(Number);
  while(y<ey||(y===ey&&m<=em)){
    out.push(y+'-'+String(m).padStart(2,'0'));
    m++;
    if(m>12){m=1;y++;}
  }
  return out;
}

function gitMap(h,sel){
  const lv=n=>n>=3?'l3':n===2?'l2':n===1?'l1':'';
  const cells=h.cells.map((n,i)=>n===null?'<i class="n"></i>':'<i class="'+lv(n)+(sel&&monthKey(h.isos[i])===sel?' sel':'')+'"></i>').join('');
  const labels=h.labels.filter((l,i)=>!h.labels[i+1]||h.labels[i+1].col-l.col>=3).map(l=>'<span style="grid-column:'+(l.col+1)+'">'+MESI_BREVI[l.m]+'</span>').join('');
  const cols='repeat('+h.cols+',14px)';
  return '<div class="gm" role="img" aria-label="Mappa dei giorni con atti, ultime '+h.cols+' settimane"><div class="gm-d"><span>Lun</span><span>Mer</span><span>Ven</span></div><div class="gm-s"><div class="gm-m" style="grid-template-columns:'+cols+'">'+labels+'</div><div class="gm-g" style="grid-template-columns:'+cols+'">'+cells+'</div></div></div><div class="scale"><span>meno</span><i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>più</span></div>';
}

function recentMap(){
  const h=heatMap(st.all,since(),todayIso,HEAT_WEEKS);
  return '<div class="s-card"><div class="lab">Mappa dei giorni <span class="sub">ultime '+h.cols+' settimane</span></div>'+gitMap(h,null)+'</div>';
}

function heatHtml(){
  const f=st.heatF;
  const evs=f?st.all.filter(e=>e.type===f):st.all;
  const h=heatMap(evs,since(),todayIso,HEAT_WEEKS);
  const list=monthsStats(st.all);
  const keys=monthKeysFrom(since(),todayIso).slice(-HEAT_MONTHS);
  const sel=st.heatMo&&keys.includes(st.heatMo)?st.heatMo:keys[keys.length-1];
  const cur=monthEntry(sel,list);
  const pk=prevMonthKey(cur.y,cur.m);
  const prev=keys.includes(pk)?monthEntry(pk,list):null;
  const lv=n=>n>=3?'l3':n===2?'l2':n===1?'l1':'';
  const chips='<div class="hfl" role="group" aria-label="Filtra per tipo"><button data-act="hf" data-v="" aria-pressed="'+(f===null)+'">Tutti</button>'+TYPES.map(t=>'<button data-act="hf" data-v="'+t+'" aria-pressed="'+(f===t)+'">'+icon(t,'sm')+t+'</button>').join('')+'</div>';
  const strip='<div class="hms" role="group" aria-label="Mese">'+keys.map(k=>{const e=monthEntry(k,list);return '<button data-act="hmo" data-v="'+k+'" aria-pressed="'+(k===sel)+'"><span>'+MESI_BREVI[e.m]+'</span><b>'+(f?e.counts[f]:e.total)+'</b></button>';}).join('')+'</div>';
  const big=f?cur.counts[f]:cur.total;
  const pbig=prev?(f?prev.counts[f]:prev.total):null;
  const det='<div class="hdet"><div class="hdt">'+MESI[cur.m]+' '+cur.y+'</div><div class="hdn"><span class="hbig">'+big+'</span><span class="hsub">'+(f||'atti')+' '+dl(big,pbig)+'</span></div><div class="hsub" style="margin:2px 0 10px">'+cur.activeDays+(cur.activeDays===1?' giorno attivo':' giorni attivi')+'</div>'+(f||!cur.total?'':stackHtml(cur))+rowsHtml(cur.counts,prev)+'</div>';
  const wd=weekdayCounts(evs,sel);
  const mx=Math.max(...wd,1);
  const wdh='<div class="lab" style="margin-top:18px">Giorni della settimana, '+MESI[cur.m].toLowerCase()+'</div><div class="hwd">'+wd.map((v,i)=>'<div'+(v===mx&&v>0?' class="mx"':'')+'><b>'+v+'</b><i style="height:'+Math.round(v/mx*54)+'px"></i><span>'+DOW[i]+'</span></div>').join('')+'</div>';
  return '<div class="hmb"'+(f?' style="--c:var(--c-'+f+')"':'')+'>'+chips
    +gitMap(h,sel)+strip+det+wdh+'</div>';
}

function favMomentTile(){
  const c=momentCounts(st.all,null);
  return '<div class="wide"><small>MOMENTO PREFERITO</small><b>'+(c.fav?momLabel(c.fav):'-')+'</b><small>'+(c.fav?c[c.fav]+' atti':'nessun atto con momento')+'</small></div>';
}

function recHtml(){
  const r=records(st.all,since(),todayIso);
  const bd=r.bestDay.iso?Number(r.bestDay.iso.slice(8))+' '+MESI_BREVI[Number(r.bestDay.iso.slice(5,7))-1].toLowerCase():'-';
  return '<div class="hrec"><div><small>GIORNO RECORD</small><b>'+bd+'</b><small>'+r.bestDay.n+' atti</small></div><div><small>SERIE PIÙ LUNGA</small><b>'+r.longestStreak+(r.longestStreak===1?' giorno':' giorni')+'</b><small>di fila</small></div><div><small>GIORNO PREFERITO</small><b>'+(r.favWeekday===null?'-':DOW_FULL[r.favWeekday])+'</b><small>'+r.favCount+' atti</small></div><div><small>GIORNI CON ATTI</small><b>'+Math.round(r.activeDays/Math.max(r.totalDays,1)*100)+'%</b><small>'+r.activeDays+' su '+r.totalDays+'</small></div>'+favMomentTile()+'</div>';
}

function statsKeys(){
  return monthKeysFrom(since(),todayIso);
}

function statsSel(keys){
  return st.statsMo&&keys.includes(st.statsMo)?st.statsMo:keys[keys.length-1];
}

function typeDonut(c,size,th){
  const total=TYPES.reduce((a,t)=>a+c[t],0);
  const r=(size-th)/2;
  const C=2*Math.PI*r;
  const h=size/2;
  let off=0;
  let s='<svg class="dnut" width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" role="img" aria-label="Ripartizione per tipo, '+total+' atti"><circle class="bg" cx="'+h+'" cy="'+h+'" r="'+r+'" fill="none" stroke-width="'+th+'"/>';
  TYPES.forEach(t=>{
    const len=total?c[t]/total*C:0;
    if(len>0){
      const v=Math.max(len-2,1);
      s+='<circle cx="'+h+'" cy="'+h+'" r="'+r+'" fill="none" style="stroke:var(--c-'+t+')" stroke-width="'+th+'" stroke-dasharray="'+v+' '+(C-v)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 '+h+' '+h+')"/>';
      off+=len;
    }
  });
  return s+'<text x="'+h+'" y="'+(h+1)+'" text-anchor="middle" dominant-baseline="middle" font-size="'+Math.round(size*.26)+'">'+total+'</text></svg>';
}

function typeLegend(c){
  return TYPES.map(t=>'<div class="s-lg">'+icon(t,'sm')+'<span>'+t+'</span><b>'+c[t]+'</b></div>').join('');
}

function splitCard(title,c){
  return '<div class="s-card"><div class="lab">'+title+'</div><div class="s-split">'+typeDonut(c,116,16)+'<div class="s-lgs">'+typeLegend(c)+'</div></div></div>';
}

function weekdayHtml(wd,title){
  const mx=Math.max(...wd,1);
  return '<div class="s-card"><div class="lab">'+title+'</div><div class="hwd">'+wd.map((v,i)=>'<div'+(v===mx&&v>0?' class="mx"':'')+'><b>'+v+'</b><i style="height:'+Math.round(v/mx*54)+'px"></i><span>'+DOW[i]+'</span></div>').join('')+'</div></div>';
}

function momentHtml(c){
  const tot=MOMENTS.reduce((a,m)=>a+c[m.k],0);
  const mx=Math.max(...MOMENTS.map(m=>c[m.k]),1);
  let h='<div class="s-card"><div class="lab">Momento della giornata</div><div class="mom">'+MOMENTS.map(m=>{
    const n=c[m.k];
    return '<div class="mrow'+(c.fav===m.k?' mx':'')+'">'+MIC[m.k]+'<span class="mn">'+m.label+'<small>'+m.range+'</small></span><span class="mbar"><i style="width:'+Math.round(n/mx*100)+'%"></i></span><b>'+n+'</b><em>'+(tot?Math.round(n/tot*100):0)+'%</em></div>';
  }).join('')+'</div>';
  if(c.none) h+='<div class="mnone">'+MIC.nd+'<span>Senza momento</span><b>'+c.none+'</b></div>';
  return h+'</div>';
}

function dayCells(y,m,sel){
  const {offset,days}=monthGrid(y,m);
  const key=y+'-'+String(m+1).padStart(2,'0');
  const per={};
  st.all.forEach(e=>{
    if(monthKey(e.event_date)!==key) return;
    const c=per[e.event_date]=per[e.event_date]||{};
    c[e.type]=(c[e.type]||0)+1;
  });
  let h='<div class="s-hm">'+DOW.map(d=>'<span class="dw">'+d+'</span>').join('');
  for(let i=0;i<offset;i++) h+='<span class="e pad"></span>';
  for(let d=1;d<=days;d++){
    const iso=isoDate(y,m,d);
    if(iso>todayIso||iso<since()){h+='<span class="e nx">'+d+'</span>';continue;}
    const n=per[iso]?TYPES.reduce((a,t)=>a+(per[iso][t]||0),0):0;
    const lv=n>=3?'l3':n===2?'l2':n===1?'l1':'';
    h+='<button class="'+lv+(iso===todayIso?' td':'')+(iso===sel?' sl':'')+'" data-act="sd" data-v="'+iso+'" aria-pressed="'+(iso===sel)+'" aria-label="'+d+' '+MESI[m]+': '+n+' atti">'+d+'</button>';
  }
  h+='</div>';
  let info='<div class="s-day">Tocca un giorno per vedere cosa è successo.</div>';
  if(sel&&sel.slice(0,7)===key){
    const [sy,sm,sd]=sel.split('-').map(Number);
    const g=DOW_FULL[(new Date(sy,sm-1,sd).getDay()+6)%7];
    const c=per[sel];
    info='<div class="s-day"><b>'+g+' '+sd+'</b> · '+(c?TYPES.filter(t=>c[t]).map(t=>icon(t,'sm')+' '+t+(c[t]>1?' x'+c[t]:'')).join(' &nbsp; '):'niente in questo giorno.')+'</div>';
  }
  return h+info;
}

function monthView(list){
  const keys=statsKeys();
  const sel=statsSel(keys);
  const idx=keys.indexOf(sel);
  const cur=monthEntry(sel,list);
  const isNow=sel===monthKey(todayIso);
  const pk=prevMonthKey(cur.y,cur.m);
  const prev=!isNow&&keys.includes(pk)?monthEntry(pk,list):null;
  const per=cur.activeDays?(cur.total/cur.activeDays).toFixed(1).replace('.',','):'0';
  let h='<div class="s-mn"><button data-act="smp" aria-label="Mese precedente"'+(idx===0?' disabled':'')+'>&lsaquo;</button><div>'+MESI[cur.m]+'<i>'+cur.y+'</i></div><button data-act="smn" aria-label="Mese successivo"'+(idx===keys.length-1?' disabled':'')+'>&rsaquo;</button></div>';
  h+='<div class="s-card"><div class="s-kp"><div><b>'+cur.total+'</b><small>atti '+dl(cur.total,prev?prev.total:null)+'</small></div><div><b>'+cur.activeDays+'</b><small>giorni attivi '+dl(cur.activeDays,prev?prev.activeDays:null)+'</small></div><div><b>'+per+'</b><small>per giorno attivo</small></div></div></div>';
  h+=recentMap();
  h+=splitCard('Tipi',cur.counts);
  h+='<div class="s-card"><div class="lab">Giorni</div>'+dayCells(cur.y,cur.m,st.statsDay)+'</div>';
  const bal=balHtml(cur.counts);
  if(bal) h+='<div class="s-card"><div class="lab">Bilancio del mese</div>'+bal+'</div>';
  h+=weekdayHtml(weekdayCounts(st.all,sel),'Giorni della settimana');
  h+=momentHtml(momentCounts(st.all,sel));
  return h;
}

function monthBars(list,keys,sel){
  const es=keys.map(k=>monthEntry(k,list));
  const mx=Math.max(...es.map(x=>x.total),1);
  return '<div class="s-cols">'+es.map(x=>'<button class="s-col'+(x.key===sel?' on':'')+'" data-act="scol" data-v="'+x.key+'" aria-pressed="'+(x.key===sel)+'" aria-label="'+MESI[x.m]+': '+x.total+' atti"><span class="bar"><span class="cb" style="height:'+(x.total/mx*100)+'%">'+TYPES.slice().reverse().map(t=>x.counts[t]?'<i style="flex:'+x.counts[t]+';background:var(--c-'+t+')"></i>':'').join('')+'</span></span><span class="cl">'+MESI_BREVI[x.m]+'</span><span class="cv">'+x.total+'</span></button>').join('')+'</div>';
}

function allView(list){
  const keys=statsKeys().slice(-HEAT_MONTHS);
  const sel=statsSel(keys);
  const cur=monthEntry(sel,list);
  const tot=monthStats(st.all);
  let h='<div class="s-card">'+togetherHtml()+'</div>';
  h+='<div class="s-card"><div class="lab">Mappa dei giorni</div>'+heatHtml()+'</div>';
  h+='<div class="s-card"><div class="lab">Mese per mese <span class="sub">tocca una colonna</span></div>'+monthBars(list,keys,sel)+'<div class="s-day s-go"><span><b>'+MESI[cur.m]+'</b> · '+cur.total+' atti in '+cur.activeDays+(cur.activeDays===1?' giorno':' giorni')+'</span><button class="link" data-act="sgo" data-v="'+sel+'">Apri</button></div></div>';
  h+=splitCard('Totali',tot.counts);
  const bal=balHtml(tot.counts);
  if(bal) h+='<div class="s-card"><div class="lab">Bilancio da sempre</div>'+bal+'</div>';
  h+=momentHtml(momentCounts(st.all,null));
  h+='<div class="s-card"><div class="lab">Record e abitudini</div>'+recHtml()+'</div>';
  return h;
}

const skb=(h,w)=>'<i class="sk" style="height:'+h+'px'+(w?';width:'+w+'px':'')+'"></i>';
const skCard=(lab,inner)=>'<div class="s-card" aria-hidden="true">'+(lab?'<div class="lab">'+skb(10,70)+'</div>':'')+inner+'</div>';
const skSplit=()=>'<div class="s-split"><i class="sk sk-donut"></i><div class="s-lgs">'+[0,1,2,3,4].map(()=>skb(16)).join('')+'</div></div>';

function statsSkeleton(v){
  if(v==='mese'){
    return '<div class="s-mn" aria-hidden="true"><span></span>'+skb(44,130)+'<span></span></div>'
      +skCard(false,'<div class="s-kp">'+[0,1,2].map(()=>'<div>'+skb(32,46)+skb(10,64)+'</div>').join('')+'</div>')
      +skCard(true,skb(150))
      +skCard(true,skSplit())
      +skCard(true,skb(220))
      +skCard(true,skb(70))
      +skCard(true,skb(120))
      +skCard(true,skb(120));
  }
  return skCard(false,skb(38,150)+skb(12,200))
    +skCard(true,skb(130))
    +skCard(true,skb(178)+skb(44))
    +skCard(true,skSplit())
    +skCard(true,skb(60))
    +skCard(true,skb(120))
    +skCard(true,skb(90));
}

function statsSeg(v){
  return '<div class="s-seg" role="group" aria-label="Periodo"><button data-act="sv" data-v="mese" aria-pressed="'+(v==='mese')+'">Questo mese</button><button data-act="sv" data-v="sempre" aria-pressed="'+(v==='sempre')+'">Da sempre</button></div>';
}

function statsBody(){
  const v=st.statsView;
  if(!st.all){
    const err=st.allErr?'<div class="banner" role="alert">'+esc(st.allErr)+'<button class="link" data-act="retry-stats">Riprova</button></div>':'';
    return err+statsSeg(v)+statsSkeleton(v);
  }
  if(!st.all.length) return togetherHtml()+'<p class="empty">Ancora niente da contare: segna il primo giorno dal calendario.</p>';
  const list=monthsStats(st.all);
  return statsSeg(v)+(v==='mese'?monthView(list):allView(list));
}

function recapPending(){
  if(!st.all||!st.me||recapSeen()) return false;
  const pk=prevMonthKey(now.getFullYear(),now.getMonth());
  return st.all.some(e=>monthKey(e.event_date)===pk);
}

function tabs(){
  const cur=st.page==='settings'?'settings':st.page==='stats'?'stats':'cal';
  const b=(id,act,svg,label,dot)=>'<button class="tab" data-act="'+act+'" aria-current="'+(cur===id)+'">'+svg+(dot?'<i class="dot"></i>':'')+'<span>'+label+'</span></button>';
  const adding=st.sheet==='add';
  const plus='<button class="plus'+(adding?' x':'')+'" data-act="quick" aria-label="'+(adding?'Torna al giorno':'Segna l\'oggi')+'"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>';
  return '<nav class="tabs" aria-label="Sezioni">'+b('cal','tab-cal',CAL,'Calendario',false)+plus+b('stats','stats',BARS,'Statistiche',recapPending())+'</nav>';
}

const BACK=t=>'<div class="hd hd-back"><button class="gear" data-act="tab-cal" aria-label="Torna al calendario">&lsaquo;</button><h1 class="pg-t">'+t+'</h1><span></span></div>';
const body=h=>h?'<div class="sb">'+h+'</div>':'';

function statsParts(){
  return [['hd',BACK('Statistiche')],['banner',banner()],['offline',offlineBar()],['recap',st.statsView==='mese'?recapHtml():''],['body',body(statsBody())]];
}

function settingsParts(){
  return [['hd',BACK('Impostazioni')],['banner',banner()],['body',body(settings())]];
}

function recapHtml(){
  if(!st.all||!st.me||recapSeen()) return '';
  const list=monthsStats(st.all);
  const pk=prevMonthKey(now.getFullYear(),now.getMonth());
  const i=list.findIndex(x=>x.key===pk);
  if(i<0) return '';
  const c=list[i];
  const p=prevOf(list,i);
  return '<div class="rc sx"><button class="x" data-act="recap-x" aria-label="Chiudi riepilogo">&times;</button><div class="eb">Riepilogo di '+MESI[c.m].toLowerCase()+'</div>'
    +'<div class="rc-top"><span class="big">'+c.total+'</span><span class="rc-l">atti in '+c.activeDays+(c.activeDays===1?' giorno':' giorni')+'</span>'+dl(c.total,p?p.total:null)+'</div>'
    +'<button class="link rc-go" data-act="recap-open" data-v="'+c.key+'">Vedi i dettagli</button></div>';
}

function skFilters(){
  return '<div class="filters" aria-hidden="true">'+[64,92,86,84,74].map(w=>'<span class="fl"><i class="sk sk-p" style="width:'+w+'px"></i></span>').join('')+'</div>';
}

function retryBar(){
  return st.loadErr?'<div class="banner" role="alert">'+esc(st.loadErr)+'<button class="link" data-act="retry">Riprova</button></div>':'';
}

function calParts(){
  const sk=!st.fromCache&&(st.loading||!!st.loadErr);
  const stats=monthStats(sk?[]:st.events);
  const {offset,days}=monthGrid(st.y,st.m);
  const ago=agoLabel(daysSince(st.lastDate,todayIso));
  const away=st.y!==now.getFullYear()||st.m!==now.getMonth();
  const P=[['hd','<div class="hd">'+wm()+'<span class="hd-r"><span class="tgd" aria-label="'+daysTogether(since(),todayIso)+' giorni insieme"><b>'+daysTogether(since(),todayIso)+'</b><small>giorni insieme</small></span>'+(away?'<button class="today-btn" data-act="today">Oggi</button>':'')+'<button class="gear" data-act="settings" aria-label="Impostazioni">'+GEAR+'</button></span></div>'],['banner',banner()],['offline',offlineBar()],['retry',retryBar()]];
  P.push(['mnav','<div class="mnav"><button data-act="prev" aria-label="Mese precedente">‹</button><h1>'+MESI[st.m]+' <i>'+st.y+'</i></h1><button data-act="next" aria-label="Mese successivo">›</button></div>']);
  const [ty,tm,td]=todayIso.split('-').map(Number);
  const wdName=DOW_FULL[(new Date(ty,tm-1,td).getDay()+6)%7].toLowerCase();
  const todayN=st.events.filter(e=>e.event_date===todayIso).length;
  const line=away
    ?'<b>'+stats.total+'</b> atti<em>·</em><b>'+stats.activeDays+'</b> giorni attivi'
    :'<b class="g">Oggi</b> '+wdName+' '+td+'<em>·</em>'+(todayN?'segnato'+(todayN>1?' ('+todayN+')':''):'niente ancora')+'<em>·</em>ultima volta <b>'+ago+'</b>';
  P.push(['stats',(sk?'<p class="tl" aria-hidden="true"><i class="sk sk-tl"></i></p>':'<p class="tl">'+line+'</p>')]);
  P.push(['filters',(sk?skFilters():'<div class="filters" role="group" aria-label="Filtra per tipo"><button class="fl" data-act="filter" data-v="" aria-pressed="'+(st.filter===null)+'" aria-label="Tutti, '+stats.total+'">Tutti</button>'
    +TYPES.map(t=>'<button class="fl" style="--cc:var(--c-'+t+')" data-act="filter" data-v="'+t+'" aria-pressed="'+(st.filter===t)+'" aria-label="'+t+', '+stats.counts[t]+'">'+icon(t,'sm')+'</button>').join('')+'</div>')]);
  P.push(['dow','<div class="dow">'+DOW.map(d=>'<span>'+d+'</span>').join('')+'</div>']);
  let h='<div class="grid" style="--rows:'+Math.ceil((offset+days)/7)+'">';
  for(let i=0;i<offset;i++) h+='<span class="cell pad"></span>';
  for(let d=1;d<=days&&!sk;d++){
    const id=isoDate(st.y,st.m,d);
    const types=typesOnDay(st.events,id);
    const cnt=countsOnDay(st.events,id);
    const dim=st.filter&&types.length&&!types.includes(st.filter);
    const n=types.reduce((a,t)=>a+cnt[t],0);
    const cls=(types.length?' has':'')+(n>=5?' v3':n>=3?' v2':n>=1?' v1':'')+(id===todayIso?' today':'')+(id>todayIso?' fut':'')+(dim?' dim':'');
    h+='<button class="cell'+cls+'" data-act="day" data-iso="'+id+'" aria-label="'+d+' '+MESI[st.m]+(types.length?': '+types.map(t=>t+(cnt[t]>1?' x'+cnt[t]:'')).join(', '):'')+'"><span class="num">'+d+'</span><span class="ics">'+(types.length>4?types.slice(0,3):types).map(t=>'<span class="icn">'+icon(t,'sm')+(cnt[t]>1?'<i>'+cnt[t]+'</i>':'')+'</span>').join('')+(types.length>4?'<span class="more">+'+(types.length-3)+'</span>':'')+'</span></button>';
  }
  if(sk) for(let d=1;d<=days;d++) h+='<span class="cell sk-cell"><span class="num">'+d+'</span><span class="sk sk-ic"></span></span>';
  h+='</div>';
  P.push(['grid',h]);
  return P;
}

function mk(html){
  const t=document.createElement('template');
  t.innerHTML=html;
  return t.content.firstElementChild;
}

function sync(parent,parts,first){
  const have=new Map();
  for(const c of parent.children) if(c.dataset.r) have.set(c.dataset.r,c);
  const keep=new Set();
  let prev=first||null;
  for(const [key,html] of parts){
    if(!html) continue;
    keep.add(key);
    let el=have.get(key);
    if(!el||el._h!==html){
      const n=mk(html);
      n.dataset.r=key;
      n._h=html;
      if(el) el.replaceWith(n);
      el=n;
    }
    const want=prev?prev.nextSibling:parent.firstChild;
    if(want!==el) parent.insertBefore(el,want);
    prev=el;
  }
  have.forEach((el,key)=>{if(!keep.has(key)) el.remove();});
}

let toastTimer;
function toast(msg,undo){
  const ph=root.querySelector('.phone');
  if(!ph) return;
  ph.querySelector('.toast')?.remove();
  st.undo=undo||null;
  ph.insertAdjacentHTML('beforeend','<div class="toast'+(undo?' act':'')+'" role="status"><span>'+esc(msg)+'</span>'+(undo?'<button data-act="undo">Annulla</button>':'')+'</div>');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{
    st.undo=null;
    const el=ph.querySelector('.toast');
    if(!el) return;
    el.classList.add('out');
    setTimeout(()=>el.remove(),220);
  },undo?5000:2200);
}

function hideToast(){
  clearTimeout(toastTimer);
  st.undo=null;
  root.querySelector('.toast')?.remove();
}

let shellPage;
let shownMonth;
const EASE='cubic-bezier(.22,.8,.3,1)';
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

function anim(el,frames,ms,fill){
  if(!el||!el.animate||reduceMotion()) return Promise.resolve();
  return el.animate(frames,{duration:ms||250,easing:EASE,fill:fill||'backwards'}).finished.catch(()=>{});
}

const fadeIn=el=>anim(el,[{opacity:0},{opacity:1}],150);

function closeSheet(sheet){
  sheet.classList.add('closing');
  sheet.style.pointerEvents='none';
  const from=sheet.style.transform||'translateY(0)';
  anim(sheet,[{transform:from},{transform:'translateY(100%)'}],220,'forwards').then(()=>sheet.remove());
}

function appShell(){
  let phone=root.querySelector(':scope > .phone');
  if(!phone){
    root.innerHTML='<div class="phone"><div class="main"></div></div>';
    phone=root.firstElementChild;
    shellPage=undefined;
  }
  return phone;
}

function renderApp(){
  const phone=appShell();
  const main=phone.firstElementChild;
  const page=st.page==='stats'&&st.me?'stats':st.page==='settings'&&st.me?'settings':'cal';
  const changed=shellPage!==undefined&&page!==shellPage;
  if(page!==shellPage){
    main.replaceChildren();
    main.className=page==='cal'?'main':'main sx';
    main.scrollTop=0;
    shellPage=page;
  }
  phone.classList.toggle('locked',!!st.sheet&&page!=='settings');
  phone.classList.toggle('still',(page==='cal'&&!!st.loadErr)||(page==='stats'&&!st.all&&!!st.allErr));
  sync(main,page==='stats'?statsParts():page==='settings'?settingsParts():calParts());
  if(changed) fadeIn(main);
  const mKey=st.y+'-'+st.m;
  if(page==='cal'){
    if(shownMonth!==undefined&&shownMonth!==mKey){
      fadeIn(main.querySelector('.mnav h1'));
      fadeIn(main.querySelector('.grid'));
    }
    shownMonth=mKey;
  }
  root.querySelectorAll('.gm-s').forEach(e=>{if(!e._s){e._s=1;e.scrollLeft=e.scrollWidth;}});
  sync(phone,[['tabs',tabs()]],main);
  const tb=phone.querySelector(':scope > .tabs');
  if(tb) phone.style.setProperty('--tabh',tb.offsetHeight+'px');
  root.querySelectorAll('.cell.sel').forEach(c=>c.classList.remove('sel'));
  const open=page==='cal'&&(st.sheet==='day'||st.sheet==='add')&&st.sel;
  let sheet=phone.querySelector(':scope > .sheet:not(.closing)');
  if(open){
    if(!sheet){
      phone.querySelectorAll(':scope > .sheet.closing').forEach(x=>x.remove());
      phone.insertAdjacentHTML('beforeend','<div class="sheet"></div>');
      sheet=phone.lastElementChild;
    }
    const h=st.sheet==='add'?addPanel():detail();
    if(sheet._h!==h){
      const same=sheet._k===st.sheet;
      const act=document.activeElement;
      const typing=same&&!!act&&sheet.contains(act)&&act.classList.contains('note');
      const caret=typing?act.selectionStart:0;
      const old=sheet.querySelector('.sh-bd');
      const scroll=same&&old?old.scrollTop:0;
      sheet.innerHTML=h;
      sheet._h=h;
      const bd=sheet.querySelector('.sh-bd');
      if(bd&&scroll) bd.scrollTop=scroll;
      if(typing){
        const n=sheet.querySelector('.note');
        n.focus({preventScroll:true});
        n.setSelectionRange(caret,caret);
      }
      if(sheet._k!==undefined&&!same) anim(sheet,[{transform:'translateY(24px)',opacity:.5},{transform:'none',opacity:1}],220);
      sheet._k=st.sheet;
    }
    const c=main.querySelector('.cell[data-iso="'+st.sel+'"]');
    if(c) c.classList.add('sel');
  }else if(sheet) closeSheet(sheet);
}

function hideSplash(){
  const sp=document.getElementById('splash');
  if(!sp||sp.classList.contains('out')) return;
  sp.classList.add('out');
  setTimeout(()=>sp.remove(),300);
}

function render(){
  if(st.screen!=='boot') hideSplash();
  if(st.screen==='app'){
    renderApp();
  }else{
    const views={boot:'<p class="boot">Caricamento</p>',login:viewLogin,setpin:viewSetPin,lock:viewLock};
    const v=views[st.screen];
    root.innerHTML=typeof v==='function'?v():v;
    if(st.screen==='lock') pinWatch();
  }
  updateBar();
}

const isNetErr=e=>!navigator.onLine||/fetch|network|load failed/i.test(String(e&&e.message||e));

function monthFromAll(){
  const {from,to}=monthRange(st.y,st.m);
  return st.all.filter(e=>e.event_date>=from&&e.event_date<to);
}

function lastFromAll(){
  let best=null;
  for(const e of st.all) if(e.event_date<=todayIso&&(!best||e.event_date>best)) best=e.event_date;
  return best;
}

function persist(){
  if(st.me&&st.all&&st.session) saveCache(localStorage,{uid:st.session.user.id,me:st.me,members:st.members,all:st.all,since:st.since,at:st.syncAt});
}

function goOffline(){
  st.offline=true;st.loadErr='';
  if(st.all){st.events=monthFromAll();st.lastDate=lastFromAll();}
}

function syncLabel(ts){
  if(!ts) return 'ultimo accesso';
  const d=new Date(ts);
  const hm=d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
  return d.toDateString()===now.toDateString()?'oggi alle '+hm:d.getDate()+'/'+(d.getMonth()+1)+' alle '+hm;
}

function offlineBar(){
  return st.offline?'<div class="offbar" role="status">Sei offline · dati di '+esc(syncLabel(st.syncAt))+'</div>':'';
}

async function loadAll(){
  const gen=++st.gen;
  st.loading=true;st.loadErr='';
  if(!navigator.onLine&&st.all&&st.me){
    goOffline();
    st.loading=false;
    if(st.screen==='app') render();
    return;
  }
  try{
    if(!st.me||st.fromCache){
      const members=await api.loadMembers();
      const me=members.find(x=>x.user_id===st.session.user.id)||null;
      if(!me) throw new Error('Questo account non è collegato a nessuna coppia');
      if(gen!==st.gen) return;
      st.members=members;st.me=me;
      st.since=await api.loadSince();
    }
    const {from,to}=monthRange(st.y,st.m);
    const events=await api.loadEvents(from,to);
    const lastDate=await api.lastEventDate(todayIso);
    if(gen!==st.gen) return;
    st.events=events;st.lastDate=lastDate;
    st.offline=false;st.fromCache=false;st.syncAt=Date.now();
  }catch(e){
    console.warn('caricamento dati non riuscito',e);
    if(gen!==st.gen) return;
    if(st.all&&st.me&&isNetErr(e)) goOffline();
    else st.loadErr=e&&e.message?e.message:'Caricamento non riuscito';
  }
  st.loading=false;
  if(st.screen==='app') render();
}

let allGen=0;

async function loadStats(){
  if(!navigator.onLine&&st.all){st.offline=true;return;}
  const g=++allGen;
  st.allLoading=true;st.allErr='';
  try{
    const all=await api.loadAllEvents();
    if(g!==allGen) return;
    st.all=all;
    st.syncAt=Date.now();
    persist();
  }catch(e){
    console.warn('statistiche non caricate',e);
    if(g!==allGen) return;
    if(st.all&&isNetErr(e)) st.offline=true;
    else st.allErr=e&&e.message?e.message:'Statistiche non caricate';
  }
  st.allLoading=false;
  if(st.screen==='app') render();
}

async function enterApp(){
  st.screen=hasPin(localStorage)?'lock':'setpin';
  st.pinLen=pinLength(localStorage)||4;
  st.pin='';
  st.pinFirst='';
  st.error='';
  const c=loadCache(localStorage,st.session.user.id);
  if(c){
    Object.assign(st,{me:c.me,members:c.members,all:c.all,since:c.since||null,syncAt:c.at,fromCache:true});
    st.events=monthFromAll();
    st.lastDate=lastFromAll();
  }
  render();
  loadAll();
  loadStats();
}

async function boot(){
  let err=null;
  try{
    st.session=await api.getSession();
  }catch(e){
    err=e;
  }
  if(!st.session&&(!navigator.onLine||(err&&isNetErr(err)))){
    const c=loadCache(localStorage);
    if(c) st.session={user:{id:c.uid},offline:true};
    else{
      st.screen='login';
      st.error='Sei offline: serve la rete per accedere';
      render();
      return;
    }
  }
  if(!st.session){
    st.screen='login';
    if(err) showError(err); else render();
    return;
  }
  try{
    await enterApp();
  }catch(e){
    st.screen='login';
    showError(e);
  }
}

async function submitPin(){
  st.pinBusy=true;
  const d=document.getElementById('pdots');
  try{
    if(st.screen==='lock'){
      if(lockLeft(localStorage,Date.now())>0){
        Object.assign(st,{pin:'',pinBusy:false});
        pinPaint();
        pinWatch();
        return;
      }
      if(await checkPin(st.pin,localStorage)){
        clearFails(localStorage);
        if(d) d.classList.add('ok');
        await wait(260);
        Object.assign(st,{screen:'app',error:'',pin:'',pinBusy:false});
        render();
        return;
      }
      if(recordFail(localStorage,Date.now())>0){
        pinFail('Troppi tentativi');
        setTimeout(()=>{st.error='';pinWatch();},470);
        return;
      }
      const n=failsLeft(localStorage);
      pinFail('PIN sbagliato, ancora '+n+(n===1?' tentativo':' tentativi'));
      return;
    }
    if(!st.pinFirst){
      if(!validPin(st.pin)){pinFail('Il PIN deve avere da 4 a 6 cifre');return;}
      st.pinFirst=st.pin;st.pin='';st.error='';st.pinBusy=false;
      pinSay('Ripeti lo stesso PIN',false);
      pinPaint();
      return;
    }
    if(st.pin===st.pinFirst){
      await setPin(st.pin,localStorage);
      if(d) d.classList.add('ok');
      await wait(260);
      Object.assign(st,{screen:'app',error:'',pin:'',pinFirst:'',pinBusy:false});
      render();
      return;
    }
    st.pinFirst='';
    pinFail('I due PIN non coincidono, riparti');
  }catch(e){st.pinBusy=false;showError(e);}
}

async function signOutNow(){
  st.gen++;st.loading=false;st.loadErr='';
  await api.signOut();
  clearCache(localStorage);
  localStorage.removeItem('manic-pin');
  localStorage.removeItem('manic-pin-len');
  clearFails(localStorage);
  allGen++;
  Object.assign(st,{screen:'login',session:null,offline:false,fromCache:false,syncAt:null,members:[],me:null,events:[],all:null,allErr:'',allLoading:false,page:null,editName:null,since:null,editSince:false,pwOpen:false,statsView:'mese',statsMo:null,statsDay:null,heatF:null,heatMo:null,recapOff:false,sheet:null,pin:'',pinFirst:'',pinBusy:false,forgot:false,error:''});
}

function autoMom(){
  tick();
  st.addAuto=fasciaOf(now.getHours());
  st.addClock=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
}

function startAdd(iso,mom){
  autoMom();
  TYPES.forEach(ty=>{st.counts[ty]=0});
  st.note='';st.error='';st.open=null;st.editId=null;
  st.sheet='add';st.addDate=iso;
  st.addTouched=!!mom;
  st.addMom=mom||(iso===todayIso?st.addAuto:null);
}

function startEdit(ev){
  autoMom();
  st.editId=ev.id;
  st.note=ev.note||'';st.error='';st.open=null;
  st.sheet='add';st.addDate=ev.event_date;
  st.addTouched=true;
  st.addMom=ev.moment||'nd';
}

async function applyEdit(id,patch){
  const saved=await api.updateEvent(id,patch);
  patchEvent(id,saved);
  persist();
  st.sel=saved.event_date;st.sheet='day';st.open=null;st.editId=null;
  const {from,to}=monthRange(st.y,st.m);
  if(saved.event_date<from||saved.event_date>=to){
    const [yy,mm]=saved.event_date.split('-').map(Number);
    st.y=yy;st.m=mm-1;
    loadAll();
  }
  st.lastDate=await api.lastEventDate(todayIso);
}

function patchEvent(id,patch){
  [st.events,st.all].forEach(a=>{if(a) a.forEach(e=>{if(e.id===id) Object.assign(e,patch);});});
}

const OFFLINE_MSG='Sei offline: serve la rete per modificare';

async function exportBackup(){
  if(!st.all){
    await loadStats();
    if(!st.all) throw new Error(st.allErr||'Dati non ancora caricati');
  }
  const data={app:'ManiC',exportedAt:new Date().toISOString(),togetherSince:since(),members:st.members.map(m=>({slot:m.slot,name:m.display_name})),events:st.all.slice().sort((a,b)=>a.event_date<b.event_date?-1:a.event_date>b.event_date?1:0).map(e=>({date:e.event_date,type:e.type,who:e.who,moment:e.moment||null,note:e.note||''}))};
  const name='manic-backup-'+todayIso+'.json';
  const file=new File([JSON.stringify(data,null,2)],name,{type:'application/json'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{
      await navigator.share({files:[file],title:'Backup ManiC'});
      toast('Backup pronto');
      return;
    }catch(e){
      if(e&&e.name==='AbortError') return;
      console.warn('condivisione non riuscita, scarico il file',e);
    }
  }
  const url=URL.createObjectURL(file);
  const a=document.createElement('a');
  a.href=url;a.download=name;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
  toast('Backup scaricato');
}

async function handle(act,t){
  if(act==='pin-digit'){
    if(st.pinBusy||lockLeft(localStorage,Date.now())>0) return;
    const max=pinLen()||6;
    if(st.pin.length<max){
      st.pin+=t.dataset.v;st.error='';st.forgot=false;
      pinSay(pinLabel(),false);
      pinPaint();
      if(pinLen()&&st.pin.length===max) await submitPin();
    }
    return;
  }
  if(act==='pin-back'){
    if(st.pinBusy) return;
    st.pin=st.pin.slice(0,-1);st.error='';
    pinSay(pinLabel(),false);
    pinPaint();
    return;
  }
  if(act==='pin-ok'){if(!st.pinBusy&&st.pin.length>=4) await submitPin();return;}
  if(act==='pin-len'){st.pinLen=Number(t.dataset.v);st.pin='';st.error='';render();return;}
  if(act==='forgot'){
    if(!st.forgot){st.forgot=true;st.error='Tocca ancora per uscire: ti chiederò email e password';render();return;}
    await signOutNow();
    render();
    return;
  }
  if(act==='day'){st.sel=t.dataset.iso;st.sheet='day';st.open=null;st.error='';}
  else if(act==='close'){st.sheet=null;st.open=null;st.error='';}
  else if(act==='settings'){st.page='settings';st.sheet=null;st.error='';st.editName=null;}
  else if(act==='prev'||act==='next'){
    const dt=new Date(st.y,st.m+(act==='prev'?-1:1),1);
    st.y=dt.getFullYear();st.m=dt.getMonth();st.error='';
    loadAll();
  }
  else if(act==='today'){
    const cur=st.y*12+st.m;
    const tgt=now.getFullYear()*12+now.getMonth();
    if(cur===tgt) return;
    st.y=now.getFullYear();st.m=now.getMonth();st.error='';
    loadAll();
  }
  else if(act==='quick'){
    if(st.sheet==='add'){st.sheet='day';st.open=null;st.error='';}
    else{
      if(st.offline){showError(new Error(OFFLINE_MSG));return;}
      tick();
      const cur=st.y*12+st.m;
      const tgt=now.getFullYear()*12+now.getMonth();
      st.page=null;st.sel=todayIso;
      startAdd(todayIso,null);
      if(cur!==tgt){
        st.y=now.getFullYear();st.m=now.getMonth();
        loadAll();
      }
    }
  }
  else if(act==='retry'){loadAll();}
  else if(act==='stats'){
    if(!st.me) return;
    st.page='stats';st.sheet=null;st.error='';
    if(!st.all&&!st.allLoading) loadStats();
  }
  else if(act==='tab-cal'){st.page=null;st.sheet=null;st.error='';}
  else if(act==='retry-stats'){loadStats();}
  else if(act==='recap-open'){st.statsView='mese';st.statsMo=t.dataset.v;st.statsDay=null;}
  else if(act==='recap-x'){
    st.recapOff=true;
    try{localStorage.setItem(RECAP_KEY,monthKey(todayIso));}catch(err){console.warn('riepilogo non memorizzato',err);}
  }
  else if(act==='sv'){st.statsView=t.dataset.v;}
  else if(act==='smp'||act==='smn'){
    const keys=statsKeys();
    const i=keys.indexOf(statsSel(keys))+(act==='smp'?-1:1);
    if(i>=0&&i<keys.length){st.statsMo=keys[i];st.statsDay=null;}
  }
  else if(act==='sd'){st.statsDay=st.statsDay===t.dataset.v?null:t.dataset.v;}
  else if(act==='scol'){st.statsMo=t.dataset.v;}
  else if(act==='sgo'){st.statsView='mese';st.statsMo=t.dataset.v;st.statsDay=null;}
  else if(act==='hf'){st.heatF=t.dataset.v||null;}
  else if(act==='hmo'){st.heatMo=t.dataset.v;}
  else if(act==='filter'){st.filter=t.dataset.v||null;}
  else if(act==='goadd'||act==='addin'){
    if(st.offline){showError(new Error(OFFLINE_MSG));return;}
    tick();
    if(st.sel>todayIso) return;
    startAdd(st.sel,act==='addin'?t.dataset.v:null);
  }
  else if(act==='cancel'){st.sheet='day';st.open=null;st.editId=null;st.error='';}
  else if(act==='edit'){
    const ev=findEvent(t.dataset.id);
    if(ev) startEdit(ev);
  }
  else if(act==='exp'){st.open=st.open===t.dataset.id?null:t.dataset.id;}
  else if(act==='inc'){if(st.counts[t.dataset.v]<20) st.counts[t.dataset.v]++;}
  else if(act==='dec'){if(st.counts[t.dataset.v]>0) st.counts[t.dataset.v]--;}
  else if(act==='date'){
    st.addDate=t.dataset.v;
    if(!st.addTouched){autoMom();st.addMom=st.addDate===todayIso?st.addAuto:null;}
  }
  else if(act==='mom'){
    st.addTouched=true;
    st.addMom=st.addMom===t.dataset.v?null:t.dataset.v;
  }
  else if(st.offline&&(act==='save'||act==='del'||act==='save-name'||act==='save-since'||act==='save-pw'||act==='emom'||act==='undo')){
    showError(new Error(OFFLINE_MSG));
    return;
  }
  else if(act==='save'&&st.editId){
    const ev=findEvent(st.editId);
    if(!ev||st.addMom===null||st.addDate>todayIso) return;
    const before={id:ev.id,event_date:ev.event_date,moment:ev.moment||null,note:ev.note||''};
    st.busy=true;render();
    await applyEdit(ev.id,{event_date:st.addDate,moment:st.addMom==='nd'?null:st.addMom,note:st.note.trim()});
    st.busy=false;
    toast('Modificato',{revert:before});
  }
  else if(act==='save'){
    const list=[];
    TYPES.forEach(ty=>{for(let i=0;i<st.counts[ty];i++) list.push(ty)});
    if(!list.length||st.addMom===null||st.addDate>todayIso) return;
    const date=st.addDate;
    const mom=st.addMom==='nd'?null:st.addMom;
    const note=st.note.trim();
    st.busy=true;render();
    const saved=await api.addEvents(list.map(ty=>({couple_id:st.me.couple_id,event_date:date,type:ty,who:whoOf(ty),note,moment:mom})));
    if(st.all) st.all.push(...saved);
    persist();
    st.sel=date;st.sheet='day';st.open=null;st.busy=false;
    const {from,to}=monthRange(st.y,st.m);
    if(date>=from&&date<to) st.events.push(...saved);
    else{
      const [yy,mm]=date.split('-').map(Number);
      st.y=yy;st.m=mm-1;
      loadAll();
    }
    st.lastDate=await api.lastEventDate(todayIso);
    const when=date===todayIso?'oggi':date===addDays(todayIso,-1)?'ieri':Number(date.slice(8))+' '+MESI[Number(date.slice(5,7))-1].toLowerCase();
    toast((list.length===1?'Salvato':list.length+' salvati')+' · '+when+(mom?', '+momLabel(mom).toLowerCase():''));
  }
  else if(act==='emom'){
    const id=t.dataset.id;
    const k=t.dataset.k||null;
    const ev=findEvent(id);
    if(!ev||(ev.moment||null)===k) return;
    await api.setMoment(id,k);
    patchEvent(id,{moment:k});
    persist();
    st.open=null;
    toast(k?'Spostato in '+momLabel(k).toLowerCase():'Spostato in senza momento');
  }
  else if(act==='del'){
    const ev=findEvent(t.dataset.id);
    await api.removeEvent(t.dataset.id);
    st.events=st.events.filter(e=>e.id!==t.dataset.id);
    if(st.all) st.all=st.all.filter(e=>e.id!==t.dataset.id);
    persist();
    st.open=null;
    st.lastDate=await api.lastEventDate(todayIso);
    toast('Rimosso: '+ev.type,ev);
  }
  else if(act==='undo'){
    const ev=st.undo;
    if(!ev) return;
    hideToast();
    if(ev.revert){
      const r=ev.revert;
      await applyEdit(r.id,{event_date:r.event_date,moment:r.moment,note:r.note});
      toast('Modifica annullata');
    }else{
      const [back]=await api.addEvents([{couple_id:ev.couple_id,event_date:ev.event_date,type:ev.type,who:ev.who,note:ev.note,moment:ev.moment||null}]);
      const {from,to}=monthRange(st.y,st.m);
      if(back.event_date>=from&&back.event_date<to) st.events.push(back);
      if(st.all) st.all.push(back);
      persist();
      st.lastDate=await api.lastEventDate(todayIso);
      toast('Ripristinato');
    }
  }
  else if(act==='edit-name'){st.editName=t.dataset.v;st.editSince=false;st.pwOpen=false;}
  else if(act==='edit-since'){st.editSince=true;st.editName=null;st.pwOpen=false;}
  else if(act==='cancel-since'){st.editSince=false;}
  else if(act==='save-since'){
    const v=root.querySelector('[data-since]').value;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||v>todayIso){showError(new Error('Scegli una data valida, non nel futuro'));return;}
    if(!st.all){showError(new Error('Dati non ancora caricati, riprova tra un attimo'));return;}
    const first=st.all.reduce((mn,e)=>!mn||e.event_date<mn?e.event_date:mn,null);
    if(first&&first<v){showError(new Error('Hai già degli atti prima di questa data: il primo è del '+first.split('-').reverse().join('/')));return;}
    await api.setSince(st.me.couple_id,v);
    st.since=v;st.editSince=false;
    persist();
    toast('Data salvata');
  }
  else if(act==='edit-pw'){st.pwOpen=true;st.editName=null;st.editSince=false;}
  else if(act==='cancel-pw'){st.pwOpen=false;}
  else if(act==='save-pw'){
    const [cur,nw,rep]=['pw-cur','pw-new','pw-rep'].map(k=>root.querySelector('[data-pw="'+k+'"]').value);
    if(!cur){showError(new Error('Scrivi la password attuale'));return;}
    if(nw.length<8){showError(new Error('La nuova password deve avere almeno 8 caratteri'));return;}
    if(nw!==rep){showError(new Error('Le due password nuove non coincidono'));return;}
    if(nw===cur){showError(new Error('La nuova password deve essere diversa da quella attuale'));return;}
    await api.changePassword(st.session.user.email,cur,nw);
    st.pwOpen=false;
    toast('Password cambiata');
  }
  else if(act==='autolock'){setPref(LOCK_KEY,t.dataset.v);}
  else if(act==='toggle-cover'){setPref(COVER_KEY,coverOn()?'0':'1');}
  else if(act==='export'){await exportBackup();return;}
  else if(act==='cancel-name'){st.editName=null;}
  else if(act==='save-name'){
    const who=t.dataset.v;
    const val=root.querySelector('[data-name="'+who+'"]').value.trim();
    if(!val){showError(new Error('Scrivi un nome'));return;}
    const target=who==='me'?st.me:st.members.find(x=>x.user_id!==st.me.user_id);
    if(!target) return;
    await api.renameMember(target.user_id,val);
    st.members=await api.loadMembers();
    st.me=st.members.find(x=>x.user_id===st.session.user.id);
    st.editName=null;
    persist();
    toast('Nome salvato');
  }
  else if(act==='change-pin'){st.screen='setpin';st.pin='';st.pinFirst='';st.pinLen=pinLength(localStorage)||4;st.sheet=null;st.page=null;}
  else if(act==='lock-now'){st.screen='lock';st.pin='';st.sheet=null;st.page=null;}
  else if(act==='check-update'){st.updMsg='Controllo in corso';render();await checkUpdate(true);return;}
  else if(act==='upd-reload'){location.reload();return;}
  else if(act==='logout') await signOutNow();
  render();
}

root.addEventListener('click',async e=>{
  if(st.screen==='app'&&st.sheet&&!e.target.closest('.sheet')&&!e.target.closest('[data-act="close"]')&&!e.target.closest('.upd')&&!e.target.closest('.tabs')&&!e.target.closest('.toast')){
    e.preventDefault();e.stopPropagation();
    st.sheet=st.sheet==='add'?'day':null;st.open=null;render();return;
  }
  const t=e.target.closest('[data-act]');
  if(!t||t.dataset.act==='note'||t.dataset.act==='datepick') return;
  try{await handle(t.dataset.act,t);}catch(err){showError(err);}
},true);

let touch=null;
const SWIPE=60;
const CLOSE_DRAG=90;

function springBack(el){
  if(!el) return;
  const from=el.style.transform||'none';
  el.style.transform='';
  el.style.opacity='';
  anim(el,[{transform:from},{transform:'none'}],200);
}

root.addEventListener('touchstart',e=>{
  const p=e.touches[0];
  touch=e.touches.length===1&&!e.target.closest('input,.gm-s,.hfl,.hms,.s-cols')?{x:p.clientX,y:p.clientY,sheet:!!e.target.closest('.sheet'),top:(e.target.closest('.sh-bd')||{}).scrollTop||0,drag:null}:null;
},{passive:true});
root.addEventListener('touchmove',e=>{
  if(!touch||st.screen!=='app') return;
  const p=e.touches[0];
  const dx=p.clientX-touch.x;
  const dy=p.clientY-touch.y;
  if(!touch.drag&&touch.sheet&&touch.top===0&&dy>8&&dy>Math.abs(dx)) touch.drag='sheet';
  if(touch.drag==='sheet'){
    const sh=root.querySelector('.sheet:not(.closing)');
    if(sh) sh.style.transform='translateY('+Math.max(0,dy)+'px)';
  }
},{passive:true});
root.addEventListener('touchend',async e=>{
  if(!touch||st.screen!=='app') return;
  const p=e.changedTouches[0];
  const dx=p.clientX-touch.x;
  const dy=p.clientY-touch.y;
  const t0=touch;
  touch=null;
  let act=null;
  if(t0.sheet){
    if(dy>CLOSE_DRAG&&dy>Math.abs(dx)*1.5&&t0.top===0) act=st.sheet==='add'?'cancel':'close';
    else if(t0.drag==='sheet') springBack(root.querySelector('.sheet:not(.closing)'));
  }else if(st.page&&!st.sheet&&dx>SWIPE&&dx>Math.abs(dy)*1.5) act='tab-cal';
  if(!act) return;
  try{await handle(act,null);}catch(err){showError(err);}
},{passive:true});

root.addEventListener('change',async e=>{
  const t=e.target;
  if(!t.dataset||t.dataset.act!=='datepick'||!t.value||t.value>todayIso) return;
  try{await handle('date',{dataset:{v:t.value}});}catch(err){showError(err);}
});

root.addEventListener('input',e=>{
  if(e.target.dataset&&e.target.dataset.act==='note') st.note=e.target.value;
});

root.addEventListener('submit',async e=>{
  if(e.target.id!=='f-login') return;
  e.preventDefault();
  const f=new FormData(e.target);
  st.busy=true;st.error='';render();
  try{
    await api.signIn(String(f.get('email')).trim(),String(f.get('password')));
    st.session=await api.getSession();
    st.busy=false;
    await enterApp();
  }catch(err){showError(err);}
});

window.addEventListener('online',async()=>{
  if(!st.session) return;
  if(st.session.offline){
    const fresh=await api.getSession().catch(()=>null);
    if(!fresh){
      await signOutNow();
      st.error='Sessione scaduta: accedi di nuovo';
      render();
      return;
    }
    st.session=fresh;
  }
  loadAll();
  loadStats();
});

window.addEventListener('offline',()=>{
  if(!st.all||!st.me) return;
  goOffline();
  if(st.screen==='app') render();
});

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

setInterval(()=>{if(!document.hidden) checkUpdate(false);},120000);
let hiddenAt=0;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    hiddenAt=Date.now();
    if(coverOn()) document.documentElement.classList.add('covered');
    return;
  }
  document.documentElement.classList.remove('covered');
  const away=hiddenAt?Date.now()-hiddenAt:0;
  hiddenAt=0;
  const was=todayIso;
  tick();
  if(st.screen==='app'&&hasPin(localStorage)&&away>=lockOpt()[2]){
    st.screen='lock';st.pin='';st.sheet=null;st.page=null;
    render();
    return;
  }
  if(was!==todayIso&&st.screen==='app') render();
  checkUpdate(false);
});
checkUpdate(false);
boot();
