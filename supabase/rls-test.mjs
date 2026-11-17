const URL_BASE=process.env.SB_URL;
const KEY=process.env.SB_KEY;
const need=['SB_URL','SB_KEY','A_EMAIL','A_PASS','C_EMAIL','C_PASS'];
for(const n of need){ if(!process.env[n]){ console.error('Manca la variabile '+n); process.exit(2); } }

async function login(email,password){
  const r=await fetch(URL_BASE+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  const j=await r.json();
  if(!r.ok) throw new Error('login fallito per '+email+': '+JSON.stringify(j));
  return j.access_token;
}
const h=t=>({apikey:KEY,Authorization:'Bearer '+t,'Content-Type':'application/json',Prefer:'return=representation'});
let fails=0;
function check(name,ok,extra){ console.log((ok?'OK   ':'FAIL ')+name+(extra?' '+extra:'')); if(!ok) fails++; }

const a=await login(process.env.A_EMAIL,process.env.A_PASS);
const c=await login(process.env.C_EMAIL,process.env.C_PASS);

const mem=await (await fetch(URL_BASE+'/rest/v1/members?select=couple_id,slot',{headers:h(a)})).json();
check('A vede 2 membri della sua coppia',Array.isArray(mem)&&mem.length===2);
const couple=mem[0]&&mem[0].couple_id;

const ins=await fetch(URL_BASE+'/rest/v1/events',{method:'POST',headers:h(a),body:JSON.stringify({couple_id:couple,event_date:'2026-01-01',type:'sesso',who:'both',note:'test-rls'})});
const insJ=await ins.json();
check('A può inserire un evento',ins.status===201&&insJ[0]&&insJ[0].id);
const evId=insJ[0]&&insJ[0].id;

const cRead=await (await fetch(URL_BASE+'/rest/v1/events?select=id',{headers:h(c)})).json();
check('C (fuori coppia) non vede eventi',Array.isArray(cRead)&&cRead.length===0);

const cMem=await (await fetch(URL_BASE+'/rest/v1/members?select=user_id',{headers:h(c)})).json();
check('C non vede membri',Array.isArray(cMem)&&cMem.length===0);

const cIns=await fetch(URL_BASE+'/rest/v1/events',{method:'POST',headers:h(c),body:JSON.stringify({couple_id:couple,event_date:'2026-01-01',type:'sesso',who:'both',note:'intruso'})});
check('C non può inserire nella coppia di A',cIns.status===401||cIns.status===403,'(status '+cIns.status+')');

const cDel=await fetch(URL_BASE+'/rest/v1/events?id=eq.'+evId,{method:'DELETE',headers:h(c)});
const cDelJ=await cDel.json().catch(()=>[]);
check('C non può cancellare eventi di A',Array.isArray(cDelJ)&&cDelJ.length===0);

const aDel=await fetch(URL_BASE+'/rest/v1/events?id=eq.'+evId,{method:'DELETE',headers:h(a)});
const aDelJ=await aDel.json();
check('A può cancellare il suo evento di prova',Array.isArray(aDelJ)&&aDelJ.length===1);

const badType=await fetch(URL_BASE+'/rest/v1/events',{method:'POST',headers:h(a),body:JSON.stringify({couple_id:couple,event_date:'2026-01-01',type:'altro',who:'both',note:''})});
check('Un tipo non valido viene rifiutato',badType.status===400||badType.status===409,'(status '+badType.status+')');

console.log(fails?fails+' controlli falliti':'Tutti i controlli superati');
process.exit(fails?1:0);
