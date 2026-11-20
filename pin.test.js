import test from 'node:test';
import assert from 'node:assert/strict';
import {validPin,hasPin,setPin,checkPin,pinLength,lockLeft,failsLeft,recordFail,clearFails,MAX_FAILS,LOCK_MS} from './pin.js';

function fakeStorage(){
  const m=new Map();
  return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{m.set(k,String(v))},removeItem:k=>{m.delete(k)}};
}


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

test('pinLength salva la lunghezza alla creazione, null per i PIN vecchi',async()=>{
  const s=fakeStorage();
  assert.equal(pinLength(s),null);
  await setPin('123456',s);
  assert.equal(pinLength(s),6);
  await setPin('4821',s);
  assert.equal(pinLength(s),4);
  const old=fakeStorage();
  old.setItem('manic-pin','x:y');
  assert.equal(pinLength(old),null);
});

test('dopo 3 errori scatta il blocco di 5 minuti',()=>{
  const st=fakeStorage();
  assert.equal(failsLeft(st),MAX_FAILS);
  assert.equal(recordFail(st,1000),0);
  assert.equal(failsLeft(st),2);
  assert.equal(recordFail(st,2000),0);
  assert.equal(lockLeft(st,2000),0);
  assert.equal(recordFail(st,3000),LOCK_MS);
  assert.equal(lockLeft(st,3000),LOCK_MS);
});

test('il blocco passa col tempo e poi si hanno di nuovo 3 tentativi',()=>{
  const st=fakeStorage();
  [1000,2000,3000].forEach(t=>recordFail(st,t));
  assert.equal(lockLeft(st,3000+LOCK_MS-1),1);
  assert.equal(lockLeft(st,3000+LOCK_MS),0);
  assert.equal(failsLeft(st),MAX_FAILS);
});

test('durante il blocco un altro errore non allunga l\'attesa',()=>{
  const st=fakeStorage();
  [1000,2000,3000].forEach(t=>recordFail(st,t));
  assert.equal(recordFail(st,60000),LOCK_MS-57000);
  assert.equal(lockLeft(st,3000+LOCK_MS),0);
});

test('orologio spostato indietro: il blocco non supera mai 5 minuti',()=>{
  const st=fakeStorage();
  [1000,2000,3000].forEach(t=>recordFail(st,t));
  assert.equal(lockLeft(st,-9999999),LOCK_MS);
});

test('clearFails azzera errori e blocco',()=>{
  const st=fakeStorage();
  [1000,2000,3000].forEach(t=>recordFail(st,t));
  clearFails(st);
  assert.equal(lockLeft(st,3000),0);
  assert.equal(failsLeft(st),MAX_FAILS);
});
