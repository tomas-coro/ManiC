import test from 'node:test';
import assert from 'node:assert/strict';
import {validPin,hasPin,setPin,checkPin,LOCK_AFTER_MS} from './pin.js';

function fakeStorage(){
  const m=new Map();
  return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{m.set(k,String(v))}};
}

test('LOCK_AFTER_MS è un minuto',()=>{
  assert.equal(LOCK_AFTER_MS,60000);
});

test('validPin accetta 4-6 cifre e nient\'altro',()=>{
  assert.equal(validPin('1234'),true);
  assert.equal(validPin('123456'),true);
  assert.equal(validPin('123'),false);
  assert.equal(validPin('1234567'),false);
  assert.equal(validPin('12a4'),false);
  assert.equal(validPin(''),false);
});

test('hasPin è falso finché non si imposta',async()=>{
  const st=fakeStorage();
  assert.equal(hasPin(st),false);
  await setPin('4821',st);
  assert.equal(hasPin(st),true);
});

test('checkPin accetta il PIN giusto e rifiuta quello sbagliato',async()=>{
  const st=fakeStorage();
  await setPin('4821',st);
  assert.equal(await checkPin('4821',st),true);
  assert.equal(await checkPin('4822',st),false);
});

test('il PIN non viene salvato in chiaro',async()=>{
  const st=fakeStorage();
  await setPin('4821',st);
  assert.equal(st.getItem('manic-pin').includes('4821'),false);
});

test('due PIN uguali producono salvataggi diversi (sale casuale)',async()=>{
  const a=fakeStorage();
  const b=fakeStorage();
  await setPin('4821',a);
  await setPin('4821',b);
  assert.notEqual(a.getItem('manic-pin'),b.getItem('manic-pin'));
});

test('setPin rifiuta un PIN non valido',async()=>{
  const st=fakeStorage();
  await assert.rejects(()=>setPin('12',st),/PIN/);
  assert.equal(hasPin(st),false);
});

test('checkPin senza PIN impostato rifiuta',async()=>{
  assert.equal(await checkPin('4821',fakeStorage()),false);
});
