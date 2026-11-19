import test from 'node:test';
import assert from 'node:assert/strict';
import {saveCache,loadCache,clearCache} from './cache.js';

const mem=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
const data={uid:'u1',me:{user_id:'u1',slot:1},members:[],all:[{id:'1',event_date:'2026-11-01',type:'sesso',who:'both'}],at:123};

test('salva e rilegge',()=>{
  const ls=mem();
  assert.equal(saveCache(ls,data),true);
  const c=loadCache(ls,'u1');
  assert.equal(c.all.length,1);
  assert.equal(c.at,123);
});

test('senza uid rilegge quella che c\'è (avvio offline)',()=>{
  const ls=mem();
  saveCache(ls,data);
  assert.equal(loadCache(ls).uid,'u1');
});

test('un altro utente non vede la cache e la trova cancellata',()=>{
  const ls=mem();
  saveCache(ls,data);
  assert.equal(loadCache(ls,'u2'),null);
  assert.equal(loadCache(ls,'u1'),null);
});

test('cache rovinata o di altra versione: null',()=>{
  const ls=mem();
  ls.setItem('manic-cache','{rotto');
  assert.equal(loadCache(ls,'u1'),null);
  ls.setItem('manic-cache',JSON.stringify({v:99,...data}));
  assert.equal(loadCache(ls,'u1'),null);
});

test('clearCache cancella',()=>{
  const ls=mem();
  saveCache(ls,data);
  clearCache(ls);
  assert.equal(loadCache(ls,'u1'),null);
});

test('storage pieno: salvataggio fallito dichiarato, non nascosto',()=>{
  const ls={setItem(){throw new Error('quota');}};
  assert.equal(saveCache(ls,data),false);
});
