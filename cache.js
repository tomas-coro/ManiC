const KEY='manic-cache';
const VERSION=1;

export function saveCache(ls,data){
  try{
    ls.setItem(KEY,JSON.stringify({v:VERSION,...data}));
    return true;
  }catch(e){
    console.warn('cache non salvata',e);
    return false;
  }
}

export function loadCache(ls,uid){
  let c=null;
  try{
    c=JSON.parse(ls.getItem(KEY)||'null');
  }catch(e){
    console.warn('cache illeggibile, la cancello',e);
    ls.removeItem(KEY);
    return null;
  }
  if(!c||c.v!==VERSION||!c.uid||!Array.isArray(c.all)||!c.me) return null;
  if(uid&&c.uid!==uid){
    ls.removeItem(KEY);
    return null;
  }
  return c;
}

export function clearCache(ls){
  ls.removeItem(KEY);
}
