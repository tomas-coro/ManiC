import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchSignature,shortVersion} from './update.js';

const fakeFetch=tags=>async f=>({ok:true,status:200,headers:{get:k=>k==='etag'?tags[f]??'"x"':null}});

test('la firma cambia quando cambia un file',async()=>{
  const a=await fetchSignature(fakeFetch({}));
  const b=await fetchSignature(fakeFetch({}));
  const c=await fetchSignature(fakeFetch({'app.js':'"nuovo"'}));
  assert.equal(a,b);
  assert.notEqual(a,c);
});

test('un errore del server non passa per "aggiornato"',async()=>{
  await assert.rejects(fetchSignature(async()=>({ok:false,status:500,headers:{get:()=>null}})),/risposta 500/);
  await assert.rejects(fetchSignature(async()=>({ok:true,status:200,headers:{get:()=>null}})),/non indica la versione/);
});

test('shortVersion è stabile e di 6 caratteri',()=>{
  assert.equal(shortVersion('abc'),shortVersion('abc'));
  assert.notEqual(shortVersion('abc'),shortVersion('abd'));
  assert.equal(shortVersion('abc').length,6);
});
