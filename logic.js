export const TYPES=['sesso','pompino','leccata','anale'];
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
