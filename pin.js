const KEY='manic-pin';
const LEN_KEY='manic-pin-len';
const ITERATIONS=150000;

export function validPin(pin){
  return /^[0-9]{4,6}$/.test(pin);
}

function toB64(buf){
  let s='';
  new Uint8Array(buf).forEach(b=>{s+=String.fromCharCode(b)});
  return btoa(s);
}

function fromB64(str){
  return Uint8Array.from(atob(str),c=>c.charCodeAt(0));
}

async function derive(pin,salt){
  const keyMaterial=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
  return crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},keyMaterial,256);
}

export function pinLength(storage){
  const n=Number(storage.getItem(LEN_KEY));
  return n>=4&&n<=6?n:null;
}

export function hasPin(storage){
  return storage.getItem(KEY)!==null;
}

export async function setPin(pin,storage){
  if(!validPin(pin)) throw new Error('Il PIN deve avere da 4 a 6 cifre');
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const hash=await derive(pin,salt);
  storage.setItem(KEY,toB64(salt)+':'+toB64(hash));
  storage.setItem(LEN_KEY,String(pin.length));
}

export async function checkPin(pin,storage){
  const saved=storage.getItem(KEY);
  if(!saved||!validPin(pin)) return false;
  const [saltB64,hashB64]=saved.split(':');
  const hash=new Uint8Array(await derive(pin,fromB64(saltB64)));
  const expected=fromB64(hashB64);
  if(hash.length!==expected.length) return false;
  let diff=0;
  for(let i=0;i<hash.length;i++) diff|=hash[i]^expected[i];
  return diff===0;
}
