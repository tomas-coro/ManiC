import {TYPES,MESI,GIORNI,DOW,isoDate,monthGrid,monthRange,typesOnDay,countsOnDay,monthStats,daysSince,agoLabel,whoLabel,whoFromChoice,TOGETHER_SINCE,balance,monthKey,monthsStats,prevMonthKey,prevOf,daysTogether,togetherLabel,heatMap,weekdayCounts,records} from './logic.js';
import {SPRITE} from './icons.js';
import * as api from './api.js';
import {fetchSignature,shortVersion} from './update.js';
import {saveCache,loadCache,clearCache} from './cache.js';
import {validPin,hasPin,setPin,checkPin,pinLength} from './pin.js';

const root=document.getElementById('root');
const now=new Date();
const todayIso=isoDate(now.getFullYear(),now.getMonth(),now.getDate());

const st={
  screen:'boot',
  error:'',
  dir:0,
  busy:false,
  session:null,
  members:[],
  me:null,
  events:[],
  all:null,
  allErr:'',
  allLoading:false,
  page:null,
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
    h+='<ul class="evs">'+list.map(e=>'<li class="ev" style="--cc:var(--c-'+e.type+')"><span class="ev-ic">'+icon(e.type)+'</span><span><span class="ev-type">'+esc(e.type)+'</span><span class="ev-who">'+esc(whoLabel(e.who,st.me.slot,n))+'</span></span>'+(e.note?'<p class="ev-note">'+esc(e.note)+'</p>':'')+'<button class="ev-del" data-act="del" data-id="'+e.id+'"'+(st.offline?' disabled':'')+'>rimuovi</button></li>').join('')+'</ul>';
  } else h+='<p class="empty">Niente in questo giorno.</p>';
  if(st.adding){
    const otherName=n[st.me.slot===1?2:1]||'L\'altro';
    h+='<div class="f-lab">Cosa e quante volte</div><div class="steps">'+TYPES.map(t=>'<div class="stp'+(st.counts[t]?' on':'')+'" style="--cc:var(--c-'+t+')"><span class="stp-n">'+icon(t,'sm')+t+'</span><button class="stp-b" data-act="dec" data-v="'+t+'" aria-label="Una volta in meno: '+t+'"'+(st.counts[t]?'':' disabled')+'>-</button><b class="stp-c">'+st.counts[t]+'</b><button class="stp-b" data-act="inc" data-v="'+t+'" aria-label="Una volta in più: '+t+'">+</button></div>').join('')+'</div>';
    h+='<div class="f-lab">Chi (o chi riceve)</div><div class="chips">'+[['me','Tu'],['other',esc(otherName)],['both','Insieme']].map(p=>'<button class="ch" data-act="who" data-v="'+p[0]+'" aria-pressed="'+(st.whoChoice===p[0])+'">'+p[1]+'</button>').join('')+'</div>';
    h+='<div class="f-lab">Nota (facoltativa)</div><input class="note" type="text" maxlength="80" placeholder="una riga, se vuoi" value="'+esc(st.note)+'" data-act="note">';
    h+='<button class="cta" data-act="save"'+(st.busy||!total()?' disabled':'')+'>Salva</button><button class="cta ghost" data-act="cancel">Annulla</button>';
  } else h+='<button class="cta" data-act="add"'+(st.offline?' disabled':'')+'>+ Aggiungi</button>';
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

function togetherHtml(){
  const [y,m,d]=TOGETHER_SINCE.split('-').map(Number);
  return '<div class="tg"><b>'+daysTogether(TOGETHER_SINCE,todayIso)+'</b><span><i>giorni insieme</i>dal '+d+' '+MESI[m-1].toLowerCase()+' '+y+' · '+togetherLabel(TOGETHER_SINCE,todayIso)+'</span></div>';
}

const MESI_BREVI=['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const DOW_FULL=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
const HEAT_WEEKS=26;
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

function heatHtml(){
  const f=st.heatF;
  const evs=f?st.all.filter(e=>e.type===f):st.all;
  const h=heatMap(evs,TOGETHER_SINCE,todayIso,HEAT_WEEKS);
  const list=monthsStats(st.all);
  const keys=monthKeysFrom(TOGETHER_SINCE,todayIso).slice(-HEAT_MONTHS);
  const sel=st.heatMo&&keys.includes(st.heatMo)?st.heatMo:keys[keys.length-1];
  const cur=monthEntry(sel,list);
  const pk=prevMonthKey(cur.y,cur.m);
  const prev=keys.includes(pk)?monthEntry(pk,list):null;
  const lv=n=>n>=3?'l3':n===2?'l2':n===1?'l1':'';
  const cells=h.cells.map((n,i)=>n===null?'<i class="n"></i>':'<i class="'+lv(n)+(monthKey(h.isos[i])===sel?' sel':'')+'"></i>').join('');
  const labels=h.labels.filter((l,i)=>!h.labels[i+1]||h.labels[i+1].col-l.col>=3).map(l=>'<span style="grid-column:'+(l.col+1)+'">'+MESI_BREVI[l.m]+'</span>').join('');
  const chips='<div class="hfl" role="group" aria-label="Filtra per tipo"><button data-act="hf" data-v="" aria-pressed="'+(f===null)+'">Tutti</button>'+TYPES.map(t=>'<button data-act="hf" data-v="'+t+'" aria-pressed="'+(f===t)+'">'+icon(t,'sm')+t+'</button>').join('')+'</div>';
  const strip='<div class="hms" role="group" aria-label="Mese">'+keys.map(k=>{const e=monthEntry(k,list);return '<button data-act="hmo" data-v="'+k+'" aria-pressed="'+(k===sel)+'"><span>'+MESI_BREVI[e.m]+'</span><b>'+(f?e.counts[f]:e.total)+'</b></button>';}).join('')+'</div>';
  const big=f?cur.counts[f]:cur.total;
  const pbig=prev?(f?prev.counts[f]:prev.total):null;
  const det='<div class="hdet"><div class="hdt">'+MESI[cur.m]+' '+cur.y+'</div><div class="hdn"><span class="hbig">'+big+'</span><span class="hsub">'+(f||'atti')+' '+dl(big,pbig)+'</span></div><div class="hsub" style="margin:2px 0 10px">'+cur.activeDays+(cur.activeDays===1?' giorno attivo':' giorni attivi')+'</div>'+(f||!cur.total?'':stackHtml(cur))+rowsHtml(cur.counts,prev)+'</div>';
  const wd=weekdayCounts(evs,sel);
  const mx=Math.max(...wd,1);
  const wdh='<div class="lab" style="margin-top:18px">Giorni della settimana, '+MESI[cur.m].toLowerCase()+'</div><div class="hwd">'+wd.map((v,i)=>'<div'+(v===mx&&v>0?' class="mx"':'')+'><b>'+v+'</b><i style="height:'+Math.round(v/mx*54)+'px"></i><span>'+DOW[i]+'</span></div>').join('')+'</div>';
  return '<div class="hmb"'+(f?' style="--c:var(--c-'+f+')"':'')+'>'+chips
    +'<div class="hmap" role="img" aria-label="Mappa dei giorni con atti, ultime '+h.cols+' settimane"><div class="yl" style="grid-template-columns:repeat('+h.cols+',1fr)">'+labels+'</div><div class="yr has" style="grid-template-columns:repeat('+h.cols+',1fr)">'+cells+'</div><div class="scale"><span>meno</span><i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>più</span></div></div>'
    +strip+det+wdh+'</div>';
}

function recHtml(){
  const r=records(st.all,TOGETHER_SINCE,todayIso);
  const bd=r.bestDay.iso?Number(r.bestDay.iso.slice(8))+' '+MESI_BREVI[Number(r.bestDay.iso.slice(5,7))-1].toLowerCase():'-';
  return '<div class="hrec"><div><small>GIORNO RECORD</small><b>'+bd+'</b><small>'+r.bestDay.n+' atti</small></div><div><small>SERIE PIÙ LUNGA</small><b>'+r.longestStreak+(r.longestStreak===1?' giorno':' giorni')+'</b><small>di fila</small></div><div><small>GIORNO PREFERITO</small><b>'+(r.favWeekday===null?'-':DOW_FULL[r.favWeekday])+'</b><small>'+r.favCount+' atti</small></div><div><small>GIORNI CON ATTI</small><b>'+Math.round(r.activeDays/Math.max(r.totalDays,1)*100)+'%</b><small>'+r.activeDays+' su '+r.totalDays+'</small></div></div>';
}

function statsKeys(){
  return monthKeysFrom(TOGETHER_SINCE,todayIso);
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
    if(iso>todayIso||iso<TOGETHER_SINCE){h+='<span class="e nx">'+d+'</span>';continue;}
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
  h+=splitCard('Tipi',cur.counts);
  h+='<div class="s-card"><div class="lab">Giorni</div>'+dayCells(cur.y,cur.m,st.statsDay)+'</div>';
  const bal=balHtml(cur.counts);
  if(bal) h+='<div class="s-card"><div class="lab">Bilancio del mese</div>'+bal+'</div>';
  h+=weekdayHtml(weekdayCounts(st.all,sel),'Giorni della settimana');
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
  h+='<div class="s-card"><div class="lab">Mese per mese <span class="sub">tocca una colonna</span></div>'+monthBars(list,keys,sel)+'<div class="s-day s-go"><span><b>'+MESI[cur.m]+'</b> · '+cur.total+' atti in '+cur.activeDays+(cur.activeDays===1?' giorno':' giorni')+'</span><button class="link" data-act="sgo" data-v="'+sel+'">Apri</button></div></div>';
  h+=splitCard('Totali',tot.counts);
  const bal=balHtml(tot.counts);
  if(bal) h+='<div class="s-card"><div class="lab">Bilancio da sempre</div>'+bal+'</div>';
  h+='<div class="s-card"><div class="lab">Mappa dei giorni</div>'+heatHtml()+'</div>';
  h+='<div class="s-card"><div class="lab">Record e abitudini</div>'+recHtml()+'</div>';
  return h;
}

function statsBody(){
  if(st.allErr) return '<div class="banner" role="alert">'+esc(st.allErr)+'<button class="link" data-act="retry-stats">Riprova</button></div>';
  if(!st.all) return '<div class="tg" aria-hidden="true"><i class="sk sk-big"></i></div><i class="sk sk-line"></i><i class="sk sk-line"></i><i class="sk sk-line"></i><i class="sk sk-line"></i><i class="sk sk-line"></i>';
  if(!st.all.length) return togetherHtml()+'<p class="empty">Ancora niente da contare: segna il primo giorno dal calendario.</p>';
  const list=monthsStats(st.all);
  const v=st.statsView;
  return '<div class="s-seg" role="group" aria-label="Periodo"><button data-act="sv" data-v="mese" aria-pressed="'+(v==='mese')+'">Questo mese</button><button data-act="sv" data-v="sempre" aria-pressed="'+(v==='sempre')+'">Da sempre</button></div>'+(v==='mese'?monthView(list):allView(list));
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

function skStats(){
  return '<div class="stats" aria-hidden="true"><span><i class="sk sk-n"></i><i class="sk sk-l"></i></span><span class="sep"></span><span><i class="sk sk-n"></i><i class="sk sk-l"></i></span><span class="sep"></span><span><i class="sk sk-n"></i><i class="sk sk-l"></i></span><span class="sep"></span><span><i class="sk sk-n w2"></i><i class="sk sk-l"></i></span></div>';
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
  const P=[['hd','<div class="hd">'+wm()+(away?'<button class="today-btn" data-act="today">Oggi</button>':'')+'</div>'],['banner',banner()],['offline',offlineBar()],['retry',retryBar()]];
  P.push(['mnav','<div class="mnav"><button data-act="prev" aria-label="Mese precedente">‹</button><h1>'+MESI[st.m]+' <i>'+st.y+'</i></h1><button data-act="next" aria-label="Mese successivo">›</button></div>']);
  P.push(['stats',(sk?skStats():'<div class="stats"><span><b>'+stats.total+'</b>atti nel mese</span><span class="sep"></span><span><b>'+stats.activeDays+'</b>giorni attivi</span><span class="sep"></span><span><b class="g">'+daysTogether(TOGETHER_SINCE,todayIso)+'</b>giorni insieme</span><span class="sep"></span><span><b class="t">'+ago+'</b>ultima volta</span></div>')]);
  P.push(['filters',(sk?skFilters():'<div class="filters" role="group" aria-label="Filtra per tipo"><button class="fl" data-act="filter" data-v="" aria-pressed="'+(st.filter===null)+'">Tutti <span class="n">'+stats.total+'</span></button>'
    +TYPES.map(t=>'<button class="fl" style="--cc:var(--c-'+t+')" data-act="filter" data-v="'+t+'" aria-pressed="'+(st.filter===t)+'">'+icon(t,'sm')+t+' <span class="n">'+stats.counts[t]+'</span></button>').join('')+'</div>')]);
  P.push(['dow','<div class="dow">'+DOW.map(d=>'<span>'+d+'</span>').join('')+'</div>']);
  let h='<div class="grid" style="--rows:'+Math.ceil((offset+days)/7)+'">';
  for(let i=0;i<offset;i++) h+='<span class="cell pad"></span>';
  for(let d=1;d<=days&&!sk;d++){
    const id=isoDate(st.y,st.m,d);
    const types=typesOnDay(st.events,id);
    const cnt=countsOnDay(st.events,id);
    const dim=st.filter&&types.length&&!types.includes(st.filter);
    const cls=(types.length?' has':'')+(id===todayIso?' today':'')+(id>todayIso?' fut':'')+(dim?' dim':'');
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
function toast(msg){
  const ph=root.querySelector('.phone');
  if(!ph) return;
  ph.querySelector('.toast')?.remove();
  ph.insertAdjacentHTML('beforeend','<div class="toast" role="status">'+esc(msg)+'</div>');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{
    const el=ph.querySelector('.toast');
    if(!el) return;
    el.classList.add('out');
    setTimeout(()=>el.remove(),220);
  },2200);
}

let shellPage;
let shownMonth;
const ORDER={cal:0,stats:1,settings:2};
const EASE='cubic-bezier(.22,.8,.3,1)';
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

function anim(el,frames,ms,fill){
  if(!el||!el.animate||reduceMotion()) return Promise.resolve();
  return el.animate(frames,{duration:ms||250,easing:EASE,fill:fill||'backwards'}).finished.catch(()=>{});
}

function slideIn(el,dir,px){
  return anim(el,[{transform:'translateX('+dir*px+'px)',opacity:0},{transform:'none',opacity:1}]);
}

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
  const pageDir=shellPage===undefined||page===shellPage?0:Math.sign(ORDER[page]-ORDER[shellPage]);
  if(page!==shellPage){
    main.replaceChildren();
    main.className=page==='cal'?'main':'main sx';
    main.scrollTop=0;
    shellPage=page;
  }
  phone.classList.toggle('locked',!!st.sheet&&page!=='settings');
  phone.classList.toggle('still',page==='cal'&&!!st.loadErr);
  sync(main,page==='stats'?statsParts():page==='settings'?settingsParts():calParts());
  if(pageDir) slideIn(main,pageDir,28);
  const mKey=st.y+'-'+st.m;
  if(page==='cal'){
    if(shownMonth!==undefined&&shownMonth!==mKey&&st.dir){
      slideIn(main.querySelector('.mnav h1'),st.dir,40);
      slideIn(main.querySelector('.grid'),st.dir,40);
    }
    shownMonth=mKey;
  }
  sync(phone,[['tabs',tabs()]],main);
  const tb=phone.querySelector(':scope > .tabs');
  if(tb) phone.style.setProperty('--tabh',tb.offsetHeight+'px');
  root.querySelectorAll('.cell.sel').forEach(c=>c.classList.remove('sel'));
  const open=page==='cal'&&st.sheet==='day'&&st.sel;
  let sheet=phone.querySelector(':scope > .sheet:not(.closing)');
  if(open){
    if(!sheet){
      phone.querySelectorAll(':scope > .sheet.closing').forEach(x=>x.remove());
      phone.insertAdjacentHTML('beforeend','<div class="sheet"></div>');
      sheet=phone.lastElementChild;
    }
    const h=detail();
    if(sheet._h!==h){sheet.innerHTML=h;sheet._h=h;}
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
  if(st.me&&st.all&&st.session) saveCache(localStorage,{uid:st.session.user.id,me:st.me,members:st.members,all:st.all,at:st.syncAt});
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
    Object.assign(st,{me:c.me,members:c.members,all:c.all,syncAt:c.at,fromCache:true});
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
  clearCache(localStorage);
  localStorage.removeItem('manic-pin');
  localStorage.removeItem('manic-pin-len');
  allGen++;
  Object.assign(st,{screen:'login',session:null,offline:false,fromCache:false,syncAt:null,members:[],me:null,events:[],all:null,allErr:'',allLoading:false,page:null,statsView:'mese',statsMo:null,statsDay:null,heatF:null,heatMo:null,recapOff:false,sheet:null,pin:'',pinFirst:'',pinBusy:false,forgot:false,error:''});
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
    st.y=dt.getFullYear();st.m=dt.getMonth();st.error='';st.dir=act==='prev'?-1:1;
    loadAll();
  }
  else if(act==='today'){
    const cur=st.y*12+st.m;
    const tgt=now.getFullYear()*12+now.getMonth();
    if(cur===tgt) return;
    st.dir=tgt<cur?-1:1;
    st.y=now.getFullYear();st.m=now.getMonth();st.error='';
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
  else if(act==='add'){st.adding=true;TYPES.forEach(t=>{st.counts[t]=0});st.note='';st.error='';}
  else if(act==='cancel'){st.adding=false;}
  else if(act==='inc'){if(st.counts[t.dataset.v]<20) st.counts[t.dataset.v]++;}
  else if(act==='dec'){if(st.counts[t.dataset.v]>0) st.counts[t.dataset.v]--;}
  else if(act==='who'){st.whoChoice=t.dataset.v;}
  else if(st.offline&&(act==='save'||act==='del'||act==='save-names')){
    showError(new Error('Sei offline: serve la rete per modificare'));
    return;
  }
  else if(act==='save'){
    const list=[];
    TYPES.forEach(ty=>{for(let i=0;i<st.counts[ty];i++) list.push(ty)});
    if(!list.length) return;
    st.busy=true;render();
    const who=whoFromChoice(st.whoChoice,st.me.slot);
    const saved=await Promise.all(list.map(ty=>api.addEvent({couple_id:st.me.couple_id,event_date:st.sel,type:ty,who,note:st.note.trim()})));
    st.events.push(...saved);
    if(st.all) st.all.push(...saved);
    persist();
    st.lastDate=await api.lastEventDate(todayIso);
    st.adding=false;st.busy=false;
    toast(list.length===1?'Salvato':'Salvati: '+list.length);
  }
  else if(act==='del'){
    await api.removeEvent(t.dataset.id);
    st.events=st.events.filter(e=>e.id!==t.dataset.id);
    if(st.all) st.all=st.all.filter(e=>e.id!==t.dataset.id);
    persist();
    st.lastDate=await api.lastEventDate(todayIso);
    toast('Eliminato');
  }
  else if(act==='save-names'){
    const me=root.querySelector('[data-name="me"]').value.trim();
    const other=root.querySelector('[data-name="other"]').value.trim();
    const o=st.members.find(x=>x.user_id!==st.me.user_id);
    await api.renameMember(st.me.user_id,me);
    if(o) await api.renameMember(o.user_id,other);
    st.members=await api.loadMembers();
    st.me=st.members.find(x=>x.user_id===st.session.user.id);
    persist();
    toast('Nomi salvati');
  }
  else if(act==='change-pin'){st.screen='setpin';st.pin='';st.pinFirst='';st.pinLen=pinLength(localStorage)||4;st.sheet=null;st.page=null;}
  else if(act==='lock-now'){st.screen='lock';st.pin='';st.sheet=null;st.page=null;}
  else if(act==='check-update'){st.updMsg='Controllo in corso';render();await checkUpdate(true);return;}
  else if(act==='upd-reload'){location.reload();return;}
  else if(act==='logout') await signOutNow();
  render();
}

root.addEventListener('click',async e=>{
  if(st.screen==='app'&&st.sheet&&!e.target.closest('.sheet')&&!e.target.closest('[data-act="close"]')&&!e.target.closest('.upd')&&!e.target.closest('.tabs')){
    e.preventDefault();e.stopPropagation();
    st.sheet=null;st.adding=false;render();return;
  }
  const t=e.target.closest('[data-act]');
  if(!t||t.dataset.act==='note') return;
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
  touch=e.touches.length===1&&!e.target.closest('.filters,input,.pad')?{x:p.clientX,y:p.clientY,sheet:!!e.target.closest('.sheet'),top:(e.target.closest('.sheet')||{}).scrollTop||0,drag:null}:null;
},{passive:true});
root.addEventListener('touchmove',e=>{
  if(!touch||st.screen!=='app') return;
  const p=e.touches[0];
  const dx=p.clientX-touch.x;
  const dy=p.clientY-touch.y;
  if(!touch.drag){
    if(touch.sheet&&touch.top===0&&dy>8&&dy>Math.abs(dx)) touch.drag='sheet';
    else if(!touch.sheet&&!st.sheet&&!st.page&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)) touch.drag='month';
  }
  if(touch.drag==='sheet'){
    const sh=root.querySelector('.sheet:not(.closing)');
    if(sh) sh.style.transform='translateY('+Math.max(0,dy)+'px)';
  }else if(touch.drag==='month'){
    const g=root.querySelector('.grid');
    if(g){g.style.transform='translateX('+dx*0.5+'px)';g.style.opacity=String(1-Math.min(Math.abs(dx),200)/400);}
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
    if(dy>CLOSE_DRAG&&dy>Math.abs(dx)*1.5&&t0.top===0) act='close';
    else if(t0.drag==='sheet') springBack(root.querySelector('.sheet:not(.closing)'));
  }else if(!st.sheet&&Math.abs(dx)>SWIPE&&Math.abs(dx)>Math.abs(dy)*1.5){
    if(st.page) act=dx>0?'tab-cal':null;
    else act=dx>0?'prev':'next';
  }
  if(t0.drag==='month'&&!act) springBack(root.querySelector('.grid'));
  if(!act) return;
  try{await handle(act,null);}catch(err){showError(err);}
},{passive:true});

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
document.addEventListener('visibilitychange',()=>{if(!document.hidden) checkUpdate(false);});
checkUpdate(false);
boot();
