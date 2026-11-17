import test from 'node:test';
import assert from 'node:assert/strict';
import {TYPES,pad,isoDate,monthGrid,monthRange,typesOnDay,countsOnDay,monthStats,daysSince,agoLabel,whoLabel,whoFromChoice} from './logic.js';

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
  assert.deepEqual(s.counts,{sesso:2,pompino:1,leccata:0,anale:0});
});

test('monthStats su lista vuota',()=>{
  const s=monthStats([]);
  assert.equal(s.total,0);
  assert.equal(s.activeDays,0);
  assert.deepEqual(s.counts,{sesso:0,pompino:0,leccata:0,anale:0});
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

test('TYPES ha i 4 tipi nell\'ordine previsto',()=>{
  assert.deepEqual(TYPES,['sesso','pompino','leccata','anale']);
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
