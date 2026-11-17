const FILES=['app.js','style.css','pin.js','logic.js','api.js','icons.js'];

export async function fetchSignature(fetcher=fetch){
  const parts=await Promise.all(FILES.map(async f=>{
    const r=await fetcher(f,{method:'HEAD',cache:'no-store'});
    if(!r.ok) throw new Error('risposta '+r.status+' per '+f);
    const tag=r.headers.get('etag')||r.headers.get('last-modified')||r.headers.get('content-length');
    if(!tag) throw new Error('il server non indica la versione di '+f);
    return tag;
  }));
  return parts.join('|');
}

export function shortVersion(sig){
  let h=5381;
  for(let i=0;i<sig.length;i++) h=((h<<5)+h+sig.charCodeAt(i))>>>0;
  return h.toString(16).padStart(8,'0').slice(-6);
}
