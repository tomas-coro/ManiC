export const TYPES=['sesso','pompino','leccata','anale','ditalini'];
export const TOGETHER_SINCE='2026-04-22';
export const MESI=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
export const GIORNI=['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
export const DOW=['L','M','M','G','V','S','D'];

export function pad(n){
  return String(n).padStart(2,'0');
}

export function isoDate(y,m,d){
  return y+'-'+pad(m+1)+'-'+pad(d);
}

export function monthGrid(y,m){
  const first=new Date(y,m,1);
  return {offset:(first.getDay()+6)%7,days:new Date(y,m+1,0).getDate()};
}

export function monthRange(y,m){
  const next=new Date(y,m+1,1);
  return {from:isoDate(y,m,1),to:isoDate(next.getFullYear(),next.getMonth(),1)};
}

export function typesOnDay(events,iso){
  const here=new Set(events.filter(e=>e.event_date===iso).map(e=>e.type));
  return TYPES.filter(t=>here.has(t));
}

export function countsOnDay(events,iso){
  const c={};
  events.filter(e=>e.event_date===iso).forEach(e=>{c[e.type]=(c[e.type]||0)+1});
  return c;
}

export function monthStats(events){
  const counts={};
  TYPES.forEach(t=>{counts[t]=0});
  events.forEach(e=>{if(e.type in counts) counts[e.type]++});
  return {total:events.length,activeDays:new Set(events.map(e=>e.event_date)).size,counts};
}

function toDate(iso){
  const [y,m,d]=iso.split('-').map(Number);
  return new Date(y,m-1,d);
}

export function daysSince(lastIso,todayIso){
  if(!lastIso) return null;
  return Math.round((toDate(todayIso)-toDate(lastIso))/86400000);
}

export function agoLabel(n){
  if(n===null) return 'mai';
  if(n===0) return 'oggi';
  if(n===1) return 'ieri';
  return n+' giorni fa';
}

export function whoLabel(who,mySlot,names){
  if(who==='both') return 'Insieme';
  const slot=who==='p1'?1:2;
  if(slot===mySlot) return 'Tu';
  return names[slot]||'L\'altro';
}

export function whoFromChoice(choice,mySlot){
  if(choice==='both') return 'both';
  const slot=choice==='me'?mySlot:(mySlot===1?2:1);
  return slot===1?'p1':'p2';
}

const FLOW_SLOT1={sesso:'insieme',anale:'insieme',pompino:'ricevuto',leccata:'dato',ditalini:'dato'};

export function flowOf(type,mySlot){
  const f=FLOW_SLOT1[type];
  if(f==='insieme'||mySlot===1) return f;
  return f==='dato'?'ricevuto':'dato';
}

export function balance(counts,mySlot){
  const b={dati:0,ricevuti:0,insieme:0};
  TYPES.forEach(t=>{
    const n=counts[t]||0;
    const f=flowOf(t,mySlot);
    if(f==='dato') b.dati+=n;
    else if(f==='ricevuto') b.ricevuti+=n;
    else b.insieme+=n;
  });
  b.diff=b.dati-b.ricevuti;
  return b;
}

export function monthKey(iso){
  return iso.slice(0,7);
}

export function monthsStats(events){
  const byKey={};
  events.forEach(e=>{
    const k=monthKey(e.event_date);
    (byKey[k]=byKey[k]||[]).push(e);
  });
  return Object.keys(byKey).sort().reverse().map(key=>{
    const [y,m]=key.split('-').map(Number);
    return {key,y,m:m-1,...monthStats(byKey[key])};
  });
}

export function prevMonthKey(y,m){
  const d=new Date(y,m-1,1);
  return d.getFullYear()+'-'+pad(d.getMonth()+1);
}

export function deltas(cur,prev){
  const d={};
  TYPES.forEach(t=>{d[t]=cur.counts[t]-prev.counts[t]});
  d.total=cur.total-prev.total;
  return d;
}

export function daysTogether(startIso,todayIso){
  return daysSince(startIso,todayIso);
}

export function togetherLabel(startIso,todayIso){
  const a=toDate(startIso);
  const b=toDate(todayIso);
  let months=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();
  let anchor=new Date(a.getFullYear(),a.getMonth()+months,a.getDate());
  if(anchor>b){
    months--;
    anchor=new Date(a.getFullYear(),a.getMonth()+months,a.getDate());
  }
  const days=Math.round((b-anchor)/86400000);
  const parts=[];
  if(months>=12){
    const y=Math.floor(months/12);
    parts.push(y+(y===1?' anno':' anni'));
    months%=12;
  }
  if(months) parts.push(months+(months===1?' mese':' mesi'));
  if(days||!parts.length) parts.push(days+(days===1?' giorno':' giorni'));
  return parts.join(parts.length>2?', ':' e ').replace(/, ([^,]*)$/,' e $1');
}

export function prevOf(list,i){
  const cur=list[i];
  const next=list[i+1];
  if(next&&next.key===prevMonthKey(cur.y,cur.m)) return next;
  return next?monthStats([]):null;
}
