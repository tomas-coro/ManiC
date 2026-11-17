import {TYPES,MESI,GIORNI,DOW,isoDate,monthGrid,monthRange,typesOnDay,countsOnDay,monthStats,daysSince,agoLabel,whoLabel,whoFromChoice,TOGETHER_SINCE,balance,monthKey,monthsStats,prevMonthKey,prevOf,daysTogether,togetherLabel} from './logic.js';
import {FLAT} from './icons.js';
import * as api from './api.js';
import {fetchSignature,shortVersion} from './update.js';
import {validPin,hasPin,setPin,checkPin,pinLength} from './pin.js';

const root=document.getElementById('root');
const now=new Date();
const todayIso=isoDate(now.getFullYear(),now.getMonth(),now.getDate());

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
  openMonth:null,
  recapOff:false,
  lastDate:null,
  y:now.getFullYear(),
  m:now.getMonth(),
  sel:null,
  sheet:null,
  adding:false,
  counts:{sesso:0,pompino:0,leccata:0,anale:0,ditalini:0},
  whoChoice:'both',
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
  updReady:false,
  updMsg:'',
  version:''
};

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const icon=(t,cls)=>'<svg class="ic '+(cls||'')+'" viewBox="0 0 32 32" aria-hidden="true">'+FLAT[t]+'</svg>';
const wm=full=>'<img class="wmi" src="assets/wordmark-'+(full?'completo':'lettere')+'.png" alt="ManiC">';
const LOCK='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const GEAR='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

const BARS='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20V11M12 20V4M19 20v-6"/></svg>';
const CAL='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>';
const RECAP_KEY='manic-recap';

const total=()=>TYPES.reduce((n,t)=>n+st.counts[t],0);

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
  return '<section class="pinscr">'+wm()
    +'<p class="plab'+(st.error?' err':'')+'" id="plab" role="status">'+esc(pinLabel())+'</p>'
    +'<div class="pdots" id="pdots" aria-hidden="true">'+dotsHtml(dotCount())+'</div>'+seg
    +'<div class="ppad">'+keys+'</div>'
    +'<div class="pfoot">'+(setup?'':'<button class="link" data-act="forgot">PIN dimenticato?</button>')+'</div></section>';
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

function detail(){
  const [y,m,d]=st.sel.split('-').map(Number);
  const dt=new Date(y,m-1,d);
  const list=st.events.filter(e=>e.event_date===st.sel);
  const n=names();
  let h='<div class="d-head"><div class="d-title">'+GIORNI[dt.getDay()]+' '+d+' '+MESI[m-1].toLowerCase()+'</div><button class="x" data-act="close" aria-label="Chiudi">×</button></div>';
  if(list.length){
    h+='<ul class="evs">'+list.map(e=>'<li class="ev" style="--cc:var(--c-'+e.type+')"><span class="ev-ic">'+icon(e.type)+'</span><span><span class="ev-type">'+esc(e.type)+'</span><span class="ev-who">'+esc(whoLabel(e.who,st.me.slot,n))+'</span></span>'+(e.note?'<p class="ev-note">'+esc(e.note)+'</p>':'')+'<button class="ev-del" data-act="del" data-id="'+e.id+'">rimuovi</button></li>').join('')+'</ul>';
  } else h+='<p class="empty">Niente in questo giorno.</p>';
  if(st.adding){
    const otherName=n[st.me.slot===1?2:1]||'L\'altro';
    h+='<div class="f-lab">Cosa e quante volte</div><div class="steps">'+TYPES.map(t=>'<div class="stp'+(st.counts[t]?' on':'')+'" style="--cc:var(--c-'+t+')"><span class="stp-n">'+icon(t,'sm')+t+'</span><button class="stp-b" data-act="dec" data-v="'+t+'" aria-label="Una volta in meno: '+t+'"'+(st.counts[t]?'':' disabled')+'>-</button><b class="stp-c">'+st.counts[t]+'</b><button class="stp-b" data-act="inc" data-v="'+t+'" aria-label="Una volta in più: '+t+'">+</button></div>').join('')+'</div>';
    h+='<div class="f-lab">Chi (o chi riceve)</div><div class="chips">'+[['me','Tu'],['other',esc(otherName)],['both','Insieme']].map(p=>'<button class="ch" data-act="who" data-v="'+p[0]+'" aria-pressed="'+(st.whoChoice===p[0])+'">'+p[1]+'</button>').join('')+'</div>';
    h+='<div class="f-lab">Nota (facoltativa)</div><input class="note" type="text" maxlength="80" placeholder="una riga, se vuoi" value="'+esc(st.note)+'" data-act="note">';
    h+='<button class="cta" data-act="save"'+(st.busy||!total()?' disabled':'')+'>Salva</button><button class="cta ghost" data-act="cancel">Annulla</button>';
  } else h+='<button class="cta" data-act="add">+ Aggiungi</button>';
  return h;
}

function settings(){
  const n=names();
  const other=st.members.find(x=>x.user_id!==st.me.user_id);
  return '<div class="f-lab">Il tuo nome</div><input class="note" type="text" maxlength="30" value="'+esc(n[st.me.slot])+'" data-name="me">'
    +'<div class="f-lab">Il suo nome</div><input class="note" type="text" maxlength="30" value="'+esc(other?other.display_name:'')+'" data-name="other">'
    +'<button class="cta" data-act="save-names">Salva i nomi</button>'
    +'<button class="cta ghost" data-act="change-pin">Cambia PIN</button>'
    +'<button class="cta ghost" data-act="lock-now">Blocca ora</button>'
    +'<div class="f-lab">App</div><p class="ver">Versione '+esc(st.version||'...')+(st.updMsg?' · '+esc(st.updMsg):'')+'</p>'
    +(st.updReady?'<button class="cta" data-act="upd-reload">Aggiorna ora</button>':'<button class="cta ghost" data-act="check-update">Controlla aggiornamenti</button>')
    +'<button class="cta ghost" data-act="logout">Esci dall\'account</button>';
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

function monthItem(m,i,list){
  const open=st.openMonth===m.key;
  const cur=m.key===monthKey(todayIso);
  const p=cur?null:prevOf(list,i);
  return '<div class="mo'+(open?' open':'')+'"><button class="mh" data-act="mo" data-v="'+m.key+'" aria-expanded="'+open+'"><span class="mn">'+MESI[m.m]+' '+m.y+'<small>'+(cur?'in corso':m.activeDays+' giorni attivi')+'</small>'+stackHtml(m)+'</span>'+dl(m.total,p?p.total:null)+'<span class="tt">'+m.total+'</span><span class="chv">&rsaquo;</span></button><div class="mb">'+rowsHtml(m.counts,p)+balHtml(m.counts)+'</div></div>';
}

function togetherHtml(){
  const [y,m,d]=TOGETHER_SINCE.split('-').map(Number);
  return '<div class="tg"><b>'+daysTogether(TOGETHER_SINCE,todayIso)+'</b><span><i>giorni insieme</i>dal '+d+' '+MESI[m-1].toLowerCase()+' '+y+' · '+togetherLabel(TOGETHER_SINCE,todayIso)+'</span></div>';
}

function statsBody(){
  if(st.allErr) return '<div class="banner" role="alert">'+esc(st.allErr)+'<button class="link" data-act="retry-stats">Riprova</button></div>';
  if(!st.all) return '<div class="tg" aria-hidden="true"><i class="sk sk-big"></i></div><i class="sk sk-line"></i><i class="sk sk-line"></i><i class="sk sk-line"></i><i class="sk sk-line"></i><i class="sk sk-line"></i>';
  let h=togetherHtml();
  if(!st.all.length) return h+'<p class="empty">Ancora niente da contare: segna il primo giorno dal calendario.</p>';
  const tot=monthStats(st.all);
  const list=monthsStats(st.all);
  h+='<div class="lab">Da sempre</div><div class="row"><span class="nm tot">Atti in totale</span><span class="n">'+tot.total+'</span></div>'+rowsHtml(tot.counts,null)+balHtml(tot.counts);
  h+='<div class="lab">Storico</div>'+list.map((m,i)=>monthItem(m,i,list)).join('');
  return h;
}

function recapPending(){
  if(!st.all||!st.me||recapSeen()) return false;
  const pk=prevMonthKey(now.getFullYear(),now.getMonth());
  return st.all.some(e=>monthKey(e.event_date)===pk);
}

function tabs(){
  const cur=st.page==='settings'?'settings':st.page==='stats'?'stats':'cal';
  const b=(id,act,svg,label,dot)=>'<button class="tab" data-act="'+act+'" aria-current="'+(cur===id)+'">'+svg+(dot?'<i class="dot"></i>':'')+'<span>'+label+'</span></button>';
  return '<nav class="tabs" aria-label="Sezioni">'+b('cal','tab-cal',CAL,'Calendario',false)+b('stats','stats',BARS,'Statistiche',recapPending())+b('settings','settings',GEAR,'Impostazioni',false)+'</nav>';
}

function viewStats(){
  return '<div class="phone'+(st.sheet?' locked':'')+'"><div class="main sx"><div class="hd hd-back"><h1 class="pg-t">Statistiche</h1></div>'+banner()+recapHtml()+statsBody()+'</div>'+tabs()+'</div>';
}

function viewSettings(){
  return '<div class="phone"><div class="main sx"><div class="hd hd-back"><h1 class="pg-t">Impostazioni</h1></div>'+banner()+settings()+'</div>'+tabs()+'</div>';
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

function skStats(){
  return '<div class="stats" aria-hidden="true"><span><i class="sk sk-n"></i><i class="sk sk-l"></i></span><span class="sep"></span><span><i class="sk sk-n"></i><i class="sk sk-l"></i></span><span class="sep"></span><span><i class="sk sk-n"></i><i class="sk sk-l"></i></span><span class="sep"></span><span><i class="sk sk-n w2"></i><i class="sk sk-l"></i></span></div>';
}

function skFilters(){
  return '<div class="filters" aria-hidden="true">'+[64,92,86,84,74].map(w=>'<span class="fl"><i class="sk sk-p" style="width:'+w+'px"></i></span>').join('')+'</div>';
}

function retryBar(){
  return st.loadErr?'<div class="banner" role="alert">'+esc(st.loadErr)+'<button class="link" data-act="retry">Riprova</button></div>':'';
}

function viewCalendar(){
  const sk=st.loading||!!st.loadErr;
  const stats=monthStats(sk?[]:st.events);
  const {offset,days}=monthGrid(st.y,st.m);
  const ago=agoLabel(daysSince(st.lastDate,todayIso));
  let h='<div class="phone'+(st.sheet?' locked':'')+(st.loadErr?' still':'')+'"><div class="main">'
    +'<div class="hd">'+wm()+'</div>'
    +banner()+retryBar()
    +'<div class="mnav"><button data-act="prev" aria-label="Mese precedente">‹</button><h1>'+MESI[st.m]+' <i>'+st.y+'</i></h1><button data-act="next" aria-label="Mese successivo">›</button></div>'
    +(sk?skStats():'<div class="stats"><span><b>'+stats.total+'</b>atti nel mese</span><span class="sep"></span><span><b>'+stats.activeDays+'</b>giorni attivi</span><span class="sep"></span><span><b class="g">'+daysTogether(TOGETHER_SINCE,todayIso)+'</b>giorni insieme</span><span class="sep"></span><span><b class="t">'+ago+'</b>ultima volta</span></div>')
    +(sk?skFilters():'<div class="filters" role="group" aria-label="Filtra per tipo"><button class="fl" data-act="filter" data-v="" aria-pressed="'+(st.filter===null)+'">Tutti <span class="n">'+stats.total+'</span></button>'
    +TYPES.map(t=>'<button class="fl" style="--cc:var(--c-'+t+')" data-act="filter" data-v="'+t+'" aria-pressed="'+(st.filter===t)+'">'+icon(t,'sm')+t+' <span class="n">'+stats.counts[t]+'</span></button>').join('')+'</div>')
    +'<div class="dow">'+DOW.map(d=>'<span>'+d+'</span>').join('')+'</div><div class="grid" style="--rows:'+Math.ceil((offset+days)/7)+'">';
  for(let i=0;i<offset;i++) h+='<span class="cell pad"></span>';
  for(let d=1;d<=days&&!sk;d++){
    const id=isoDate(st.y,st.m,d);
    const types=typesOnDay(st.events,id);
    const cnt=countsOnDay(st.events,id);
    const dim=st.filter&&types.length&&!types.includes(st.filter);
    const cls=(types.length?' has':'')+(id===todayIso?' today':'')+(id===st.sel?' sel':'')+(id>todayIso?' fut':'')+(dim?' dim':'');
    h+='<button class="cell'+cls+'" data-act="day" data-iso="'+id+'" aria-label="'+d+' '+MESI[st.m]+(types.length?': '+types.map(t=>t+(cnt[t]>1?' x'+cnt[t]:'')).join(', '):'')+'"><span class="num">'+d+'</span><span class="ics">'+types.slice(0,5).map(t=>'<span class="icn">'+icon(t,'sm')+(cnt[t]>1?'<i>'+cnt[t]+'</i>':'')+'</span>').join('')+'</span></button>';
  }
  if(sk) for(let d=1;d<=days;d++) h+='<span class="cell sk-cell"><span class="num">'+d+'</span><span class="sk sk-ic"></span></span>';
  h+='</div></div>'+tabs();
  if(st.sheet==='day'&&st.sel) h+='<div class="sheet">'+detail()+'</div>';
  return h+'</div>';
}

let lastPage=null;

function render(){
  const keep=root.querySelector('.main');
  const top=keep&&st.page===lastPage?keep.scrollTop:0;
  lastPage=st.page;
  const views={boot:'<p class="boot">Caricamento</p>',login:viewLogin,setpin:viewSetPin,lock:viewLock,app:()=>st.page==='stats'&&st.me?viewStats():st.page==='settings'&&st.me?viewSettings():viewCalendar()};
  const v=views[st.screen];
  root.innerHTML=typeof v==='function'?v():v;
  const main=root.querySelector('.main');
  if(main) main.scrollTop=top;
  updateBar();
}

async function loadAll(){
  const gen=++st.gen;
  st.loading=true;st.loadErr='';
  try{
    if(!st.me){
      const members=await api.loadMembers();
      const me=members.find(x=>x.user_id===st.session.user.id)||null;
      if(!me) throw new Error('Questo account non è collegato a nessuna coppia');
      if(gen!==st.gen) return;
      st.members=members;st.me=me;
    }
    const {from,to}=monthRange(st.y,st.m);
    const events=await api.loadEvents(from,to);
    const lastDate=await api.lastEventDate(todayIso);
    if(gen!==st.gen) return;
    st.events=events;st.lastDate=lastDate;
  }catch(e){
    console.warn('caricamento dati non riuscito',e);
    if(gen!==st.gen) return;
    st.loadErr=e&&e.message?e.message:'Caricamento non riuscito';
  }
  st.loading=false;
  if(st.screen==='app') render();
}

let allGen=0;

async function loadStats(){
  const g=++allGen;
  st.allLoading=true;st.allErr='';
  try{
    const all=await api.loadAllEvents();
    if(g!==allGen) return;
    st.all=all;
  }catch(e){
    console.warn('statistiche non caricate',e);
    if(g!==allGen) return;
    st.allErr=e&&e.message?e.message:'Statistiche non caricate';
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
  render();
  loadAll();
  loadStats();
}

async function boot(){
  try{
    st.session=await api.getSession();
    if(!st.session){st.screen='login';render();return;}
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
      if(await checkPin(st.pin,localStorage)){
        if(d) d.classList.add('ok');
        await wait(260);
        Object.assign(st,{screen:'app',error:'',pin:'',pinBusy:false});
        render();
        return;
      }
      pinFail('PIN sbagliato');
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
  localStorage.removeItem('manic-pin');
  localStorage.removeItem('manic-pin-len');
  allGen++;
  Object.assign(st,{screen:'login',session:null,members:[],me:null,events:[],all:null,allErr:'',allLoading:false,page:null,openMonth:null,recapOff:false,sheet:null,pin:'',pinFirst:'',pinBusy:false,forgot:false,error:''});
}

async function handle(act,t){
  if(act==='pin-digit'){
    if(st.pinBusy) return;
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
  if(act==='day'){st.sel=t.dataset.iso;st.sheet='day';st.adding=false;st.error='';}
  else if(act==='close'){st.sheet=null;st.adding=false;st.error='';}
  else if(act==='settings'){st.page='settings';st.sheet=null;st.error='';}
  else if(act==='prev'||act==='next'){
    const dt=new Date(st.y,st.m+(act==='prev'?-1:1),1);
    st.y=dt.getFullYear();st.m=dt.getMonth();st.error='';
    loadAll();
  }
  else if(act==='retry'){loadAll();}
  else if(act==='stats'){
    if(!st.me) return;
    st.page='stats';st.sheet=null;st.error='';
    if(!st.all&&!st.allLoading) loadStats();
  }
  else if(act==='tab-cal'){st.page=null;st.sheet=null;st.error='';}
  else if(act==='retry-stats'){loadStats();}
  else if(act==='mo'){st.openMonth=st.openMonth===t.dataset.v?null:t.dataset.v;}
  else if(act==='recap-open'){
    st.recapOff=true;
    try{localStorage.setItem(RECAP_KEY,monthKey(todayIso));}catch(err){console.warn('riepilogo non memorizzato',err);}
    st.page='stats';st.openMonth=t.dataset.v;st.sheet=null;
  }
  else if(act==='recap-x'){
    st.recapOff=true;
    try{localStorage.setItem(RECAP_KEY,monthKey(todayIso));}catch(err){console.warn('riepilogo non memorizzato',err);}
  }
  else if(act==='filter'){st.filter=t.dataset.v||null;}
  else if(act==='add'){st.adding=true;TYPES.forEach(t=>{st.counts[t]=0});st.note='';st.error='';}
  else if(act==='cancel'){st.adding=false;}
  else if(act==='inc'){if(st.counts[t.dataset.v]<20) st.counts[t.dataset.v]++;}
  else if(act==='dec'){if(st.counts[t.dataset.v]>0) st.counts[t.dataset.v]--;}
  else if(act==='who'){st.whoChoice=t.dataset.v;}
  else if(act==='save'){
    const list=[];
    TYPES.forEach(ty=>{for(let i=0;i<st.counts[ty];i++) list.push(ty)});
    if(!list.length) return;
    st.busy=true;render();
    const who=whoFromChoice(st.whoChoice,st.me.slot);
    const saved=await Promise.all(list.map(ty=>api.addEvent({couple_id:st.me.couple_id,event_date:st.sel,type:ty,who,note:st.note.trim()})));
    st.events.push(...saved);
    if(st.all) st.all.push(...saved);
    st.lastDate=await api.lastEventDate(todayIso);
    st.adding=false;st.busy=false;
  }
  else if(act==='del'){
    await api.removeEvent(t.dataset.id);
    st.events=st.events.filter(e=>e.id!==t.dataset.id);
    if(st.all) st.all=st.all.filter(e=>e.id!==t.dataset.id);
    st.lastDate=await api.lastEventDate(todayIso);
  }
  else if(act==='save-names'){
    const me=root.querySelector('[data-name="me"]').value.trim();
    const other=root.querySelector('[data-name="other"]').value.trim();
    const o=st.members.find(x=>x.user_id!==st.me.user_id);
    await api.renameMember(st.me.user_id,me);
    if(o) await api.renameMember(o.user_id,other);
    st.members=await api.loadMembers();
    st.me=st.members.find(x=>x.user_id===st.session.user.id);
  }
  else if(act==='change-pin'){st.screen='setpin';st.pin='';st.pinFirst='';st.pinLen=pinLength(localStorage)||4;st.sheet=null;st.page=null;}
  else if(act==='lock-now'){st.screen='lock';st.pin='';st.sheet=null;st.page=null;}
  else if(act==='check-update'){st.updMsg='Controllo in corso';render();await checkUpdate(true);return;}
  else if(act==='upd-reload'){location.reload();return;}
  else if(act==='logout') await signOutNow();
  render();
}

root.addEventListener('click',async e=>{
  if(st.screen==='app'&&st.sheet&&!e.target.closest('.sheet')&&!e.target.closest('[data-act="close"]')&&!e.target.closest('.upd')){
    e.preventDefault();e.stopPropagation();
    st.sheet=null;st.adding=false;render();return;
  }
  const t=e.target.closest('[data-act]');
  if(!t||t.dataset.act==='note') return;
  try{await handle(t.dataset.act,t);}catch(err){showError(err);}
},true);

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

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

setInterval(()=>{if(!document.hidden) checkUpdate(false);},120000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden) checkUpdate(false);});
checkUpdate(false);
boot();
