import test from 'node:test';
import assert from 'node:assert/strict';
import {TYPES,pad,isoDate,flowOf,balance,monthKey,monthsStats,prevMonthKey,deltas,prevOf,daysTogether,togetherLabel,monthGrid,monthRange,typesOnDay,countsOnDay,monthStats,daysSince,agoLabel,whoLabel,whoFromChoice,MOMENTS,fasciaOf,whoOf,heatMap,weekdayCounts,records} from './logic.js';

test('pad aggiunge lo zero',()=>{
  assert.equal(pad(3),'03');
  assert.equal(pad(12),'12');
});

test('isoDate usa il mese da 0 a 11',()=>{
  assert.equal(isoDate(2026,10,7),'2026-11-07');
});

test('monthGrid novembre 2026 inizia di domenica: 6 celle vuote, 30 giorni',()=>{
  assert.deepEqual(monthGrid(2026,10),{offset:6,days:30});
});

test('monthGrid marzo 2027 inizia di lunedì: 0 celle vuote',()=>{
  assert.deepEqual(monthGrid(2027,2),{offset:0,days:31});
});

test('monthRange chiude sul primo del mese dopo, anche a dicembre',()=>{
  assert.deepEqual(monthRange(2026,10),{from:'2026-11-01',to:'2026-12-01'});
  assert.deepEqual(monthRange(2026,11),{from:'2026-12-01',to:'2027-01-01'});
});

test('typesOnDay ordina secondo TYPES e toglie i doppioni',()=>{
  const ev=[
    {event_date:'2026-11-14',type:'leccata'},
    {event_date:'2026-11-14',type:'sesso'},
    {event_date:'2026-11-14',type:'sesso'},
    {event_date:'2026-11-15',type:'anale'}
  ];
  assert.deepEqual(typesOnDay(ev,'2026-11-14'),['sesso','leccata']);
  assert.deepEqual(typesOnDay(ev,'2026-11-20'),[]);
});

test('monthStats conta totale, giorni diversi e per tipo',()=>{
  const ev=[
    {event_date:'2026-11-02',type:'pompino'},
    {event_date:'2026-11-02',type:'sesso'},
    {event_date:'2026-11-08',type:'sesso'}
  ];
  const s=monthStats(ev);
  assert.equal(s.total,3);
  assert.equal(s.activeDays,2);
  assert.deepEqual(s.counts,{sesso:2,pompino:1,leccata:0,anale:0,ditalini:0});
});

test('monthStats su lista vuota',()=>{
  const s=monthStats([]);
  assert.equal(s.total,0);
  assert.equal(s.activeDays,0);
  assert.deepEqual(s.counts,{sesso:0,pompino:0,leccata:0,anale:0,ditalini:0});
});

test('daysSince e agoLabel',()=>{
  assert.equal(daysSince('2026-11-16','2026-11-17'),1);
  assert.equal(daysSince('2026-11-17','2026-11-17'),0);
  assert.equal(daysSince(null,'2026-11-17'),null);
  assert.equal(agoLabel(null),'mai');
  assert.equal(agoLabel(0),'oggi');
  assert.equal(agoLabel(1),'ieri');
  assert.equal(agoLabel(5),'5 giorni fa');
});

test('whoLabel è relativo a chi guarda',()=>{
  const names={1:'Tomas',2:'Giulia'};
  assert.equal(whoLabel('p1',1,names),'Tu');
  assert.equal(whoLabel('p2',1,names),'Giulia');
  assert.equal(whoLabel('p1',2,names),'Tomas');
  assert.equal(whoLabel('p2',2,names),'Tu');
  assert.equal(whoLabel('both',1,names),'Insieme');
});

test('whoLabel usa "Lei/Lui" se manca il nome',()=>{
  assert.equal(whoLabel('p2',1,{1:'Tomas',2:''}),'L\'altro');
});

test('whoFromChoice traduce la scelta in assoluto',()=>{
  assert.equal(whoFromChoice('me',1),'p1');
  assert.equal(whoFromChoice('me',2),'p2');
  assert.equal(whoFromChoice('other',1),'p2');
  assert.equal(whoFromChoice('other',2),'p1');
  assert.equal(whoFromChoice('both',1),'both');
});

test('TYPES ha i 5 tipi nell\'ordine previsto',()=>{
  assert.deepEqual(TYPES,['sesso','pompino','leccata','anale','ditalini']);
});

test('countsOnDay conta le ripetizioni dello stesso tipo nel giorno',()=>{
  const ev=[
    {event_date:'2026-11-14',type:'sesso'},{event_date:'2026-11-14',type:'sesso'},
    {event_date:'2026-11-14',type:'sesso'},{event_date:'2026-11-14',type:'pompino'},
    {event_date:'2026-11-15',type:'sesso'}
  ];
  assert.deepEqual(countsOnDay(ev,'2026-11-14'),{sesso:3,pompino:1});
  assert.deepEqual(countsOnDay(ev,'2026-11-20'),{});
});

test('flowOf: per Tomas pompino ricevuto, leccata e ditalini dati, sesso e anale insieme',()=>{
  assert.equal(flowOf('pompino',1),'ricevuto');
  assert.equal(flowOf('leccata',1),'dato');
  assert.equal(flowOf('ditalini',1),'dato');
  assert.equal(flowOf('sesso',1),'insieme');
  assert.equal(flowOf('anale',1),'insieme');
});

test('flowOf: per lei dato e ricevuto si invertono, insieme resta',()=>{
  assert.equal(flowOf('pompino',2),'dato');
  assert.equal(flowOf('leccata',2),'ricevuto');
  assert.equal(flowOf('ditalini',2),'ricevuto');
  assert.equal(flowOf('sesso',2),'insieme');
});

test('balance somma dati, ricevuti, insieme e la differenza',()=>{
  const counts={sesso:4,pompino:2,leccata:3,anale:1,ditalini:2};
  assert.deepEqual(balance(counts,1),{dati:5,ricevuti:2,insieme:5,diff:3});
  assert.deepEqual(balance(counts,2),{dati:2,ricevuti:5,insieme:5,diff:-3});
  assert.deepEqual(balance({},1),{dati:0,ricevuti:0,insieme:0,diff:0});
});

test('monthKey e prevMonthKey, anche a gennaio',()=>{
  assert.equal(monthKey('2026-11-17'),'2026-11');
  assert.equal(prevMonthKey(2026,10),'2026-10');
  assert.equal(prevMonthKey(2027,0),'2026-12');
});

test('monthsStats raggruppa per mese, dal più recente, con conteggi',()=>{
  const ev=[
    {event_date:'2026-10-30',type:'sesso'},
    {event_date:'2026-11-02',type:'pompino'},
    {event_date:'2026-11-02',type:'ditalini'},
    {event_date:'2026-11-08',type:'sesso'}
  ];
  const r=monthsStats(ev);
  assert.deepEqual(r.map(x=>x.key),['2026-11','2026-10']);
  assert.equal(r[0].y,2026);
  assert.equal(r[0].m,10);
  assert.equal(r[0].total,3);
  assert.equal(r[0].activeDays,2);
  assert.equal(r[0].counts.ditalini,1);
  assert.equal(r[1].total,1);
  assert.deepEqual(monthsStats([]),[]);
});

test('deltas confronta mese e mese prima',()=>{
  const cur={total:5,counts:{sesso:3,pompino:1,leccata:0,anale:0,ditalini:1}};
  const prev={total:6,counts:{sesso:1,pompino:2,leccata:2,anale:0,ditalini:1}};
  assert.deepEqual(deltas(cur,prev),{sesso:2,pompino:-1,leccata:-2,anale:0,ditalini:0,total:-1});
});

test('daysTogether dal 22 aprile 2026',()=>{
  assert.equal(daysTogether('2026-04-22','2026-11-17'),209);
  assert.equal(daysTogether('2026-04-22','2026-04-22'),0);
});

test('togetherLabel in mesi e giorni',()=>{
  assert.equal(togetherLabel('2026-04-22','2026-11-17'),'6 mesi e 26 giorni');
  assert.equal(togetherLabel('2026-04-22','2026-11-22'),'7 mesi');
  assert.equal(togetherLabel('2026-04-22','2026-05-23'),'1 mese e 1 giorno');
  assert.equal(togetherLabel('2026-04-22','2026-04-30'),'8 giorni');
  assert.equal(togetherLabel('2026-04-22','2027-04-22'),'1 anno');
  assert.equal(togetherLabel('2026-04-22','2027-07-25'),'1 anno, 3 mesi e 3 giorni');
});

test('prevOf dà il mese prima, uno vuoto se c\'è un buco, niente per il primo mese',()=>{
  const ev=[
    {event_date:'2026-09-03',type:'sesso'},
    {event_date:'2026-10-03',type:'sesso'},
    {event_date:'2026-11-03',type:'sesso'},
    {event_date:'2026-07-03',type:'sesso'}
  ];
  const list=monthsStats(ev.filter(e=>e.event_date!=='2026-10-03'));
  assert.deepEqual(list.map(x=>x.key),['2026-11','2026-09','2026-07']);
  assert.equal(prevOf(list,1).total,0);
  assert.equal(prevOf(list,1).key,undefined);
  assert.equal(prevOf(list,0).total,0);
  assert.equal(prevOf(list,2),null);
  const full=monthsStats(ev);
  assert.equal(prevOf(full,0).key,'2026-10');
});

test('heatMap: una settimana, giorni futuri vuoti',()=>{
  const h=heatMap([{event_date:'2026-11-17'},{event_date:'2026-11-17'},{event_date:'2026-11-19'}],'2026-11-16','2026-11-19',26);
  assert.equal(h.cols,1);
  assert.deepEqual(h.cells,[0,2,0,1,null,null,null]);
  assert.deepEqual(h.labels,[{col:0,m:10}]);
});

test('heatMap: non supera maxWeeks e ignora i giorni prima dell inizio',()=>{
  const h=heatMap([],'2026-04-22','2026-11-19',26);
  assert.equal(h.cols,26);
  assert.equal(h.cells.length,26*7);
  const h2=heatMap([],'2026-11-18','2026-11-19',26);
  assert.deepEqual(h2.cells,[null,null,0,0,null,null,null]);
});

test('heatMap: isos allineati alle celle',()=>{
  const h=heatMap([],'2026-11-18','2026-11-19',26);
  assert.deepEqual(h.isos,[null,null,'2026-11-18','2026-11-19',null,null,null]);
});

test('weekdayCounts conta per giorno della settimana, anche solo di un mese',()=>{
  const ev=[{event_date:'2026-11-16'},{event_date:'2026-11-16'},{event_date:'2026-11-22'},{event_date:'2026-10-05'}];
  assert.deepEqual(weekdayCounts(ev,'2026-11'),[2,0,0,0,0,0,1]);
  assert.deepEqual(weekdayCounts(ev,null),[3,0,0,0,0,0,1]);
});

test('records: giorno top, serie piu lunga, giorno preferito',()=>{
  const ev=[{event_date:'2026-11-10'},{event_date:'2026-11-11'},{event_date:'2026-11-11'},{event_date:'2026-11-12'},{event_date:'2026-11-15'}];
  const r=records(ev,'2026-11-01','2026-11-19');
  assert.deepEqual(r.bestDay,{iso:'2026-11-11',n:2});
  assert.equal(r.longestStreak,3);
  assert.equal(r.activeDays,4);
  assert.equal(r.totalDays,19);
  assert.equal(r.favWeekday,2);
});

test('records senza eventi',()=>{
  const r=records([],'2026-11-01','2026-11-19');
  assert.equal(r.favWeekday,null);
  assert.equal(r.longestStreak,0);
  assert.equal(r.bestDay.n,0);
});

test('fasciaOf rispetta i confini 6-12, 12-18, 18-23, 23-6',()=>{
  const at=h=>fasciaOf(h);
  assert.deepEqual([5,6,11,12,17,18,22,23,0].map(at),['not','mat','mat','pom','pom','ser','ser','not','not']);
});

test('MOMENTS ha le 4 fasce in ordine',()=>{
  assert.deepEqual(MOMENTS.map(m=>m.k),['mat','pom','ser','not']);
});

test('whoOf: pompino a p1, leccata e ditalini a p2, sesso e anale both',()=>{
  assert.deepEqual(TYPES.map(whoOf),['both','p1','p2','both','p2']);
});
