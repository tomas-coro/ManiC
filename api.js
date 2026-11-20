import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import {SUPABASE_URL,SUPABASE_KEY} from './config.js';

const sb=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});

function fail(error,fallback){
  if(!error) return;
  const text=error.message||fallback;
  const e=new Error(text);
  e.cause=error;
  throw e;
}

export async function signIn(email,password){
  const {error}=await sb.auth.signInWithPassword({email,password});
  if(error){
    if(error.message&&error.message.toLowerCase().includes('invalid login')) throw new Error('Email o password non corrette');
    fail(error,'Accesso non riuscito');
  }
}

export async function signOut(){
  const {error}=await sb.auth.signOut();
  fail(error,'Uscita non riuscita');
}

export async function getSession(){
  const {data,error}=await sb.auth.getSession();
  fail(error,'Impossibile leggere la sessione');
  return data.session;
}

export function onAuthChange(cb){
  sb.auth.onAuthStateChange(()=>cb());
}

export async function loadMembers(){
  const {data,error}=await sb.from('members').select('user_id,couple_id,slot,display_name').order('slot');
  fail(error,'Impossibile caricare i membri');
  return data;
}

export async function loadEvents(from,to){
  const {data,error}=await sb.from('events').select('id,couple_id,event_date,type,who,note,moment').gte('event_date',from).lt('event_date',to).order('created_at');
  fail(error,'Impossibile caricare gli eventi');
  return data;
}

export async function loadAllEvents(){
  const page=1000;
  const all=[];
  for(let from=0;;from+=page){
    const {data,error}=await sb.from('events').select('id,couple_id,event_date,type,who,note,moment').order('event_date').order('id').range(from,from+page-1);
    fail(error,'Impossibile caricare le statistiche');
    all.push(...data);
    if(data.length<page) return all;
  }
}

export async function lastEventDate(todayIso){
  const {data,error}=await sb.from('events').select('event_date').lte('event_date',todayIso).order('event_date',{ascending:false}).limit(1);
  fail(error,'Impossibile leggere l\'ultimo evento');
  return data.length?data[0].event_date:null;
}

export async function addEvents(rows){
  const {data,error}=await sb.from('events').insert(rows).select('id,couple_id,event_date,type,who,note,moment');
  fail(error,'Salvataggio non riuscito');
  return data;
}

export async function setMoment(id,moment){
  const {data,error}=await sb.from('events').update({moment}).eq('id',id).select('id');
  fail(error,'Fascia non salvata');
  if(!data.length) throw new Error('Fascia non salvata: evento non trovato');
}

export async function updateEvent(id,patch){
  const {data,error}=await sb.from('events').update(patch).eq('id',id).select('id,couple_id,event_date,type,who,note,moment');
  fail(error,'Modifica non riuscita');
  if(!data.length) throw new Error('Modifica non riuscita: evento non trovato');
  return data[0];
}

export async function removeEvent(id){
  const {data,error}=await sb.from('events').delete().eq('id',id).select('id');
  fail(error,'Rimozione non riuscita');
  if(!data.length) throw new Error('Rimozione non riuscita: evento non trovato');
}

export async function renameMember(userId,displayName){
  const {data,error}=await sb.from('members').update({display_name:displayName}).eq('user_id',userId).select('user_id');
  fail(error,'Nome non salvato');
  if(!data.length) throw new Error('Nome non salvato');
}
