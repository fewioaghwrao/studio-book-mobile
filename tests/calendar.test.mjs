import test from 'node:test';
import assert from 'node:assert/strict';
import {parseClock,slotState,getDayTimeRange,plusDays,dayKey,calendarSlotRows} from '../src/lib/calendarLogic.js';

const d = new Date(2026,10,16); // Monday
const business = [{dayOfWeek:1,startTime:'09:00:00',endTime:'18:00:00',isHoliday:false}];
const ev = [
 {id:'o',type:'open',start:'2026-11-16T09:00:00',end:'2026-11-16T18:00:00',allDay:false},
 {id:'r',type:'reservation',start:'2026-11-16T13:00:00',end:'2026-11-16T14:30:00',allDay:false},
 {id:'c',type:'closure',start:'2026-11-16T16:00:00',end:'2026-11-16T17:00:00',allDay:false},
];
test('時間パースは24:00まで許可し、不正時刻を排除',()=>{
 assert.equal(parseClock('09:30:00'),570);assert.equal(parseClock('24:00'),1440);assert.equal(parseClock('25:30'),null);
});
test('営業時間・予約済み・休館・時間外を区別',()=>{
 assert.equal(slotState(d,9*60,business,ev),'open');
 assert.equal(slotState(d,13*60,business,ev),'reservation');
 assert.equal(slotState(d,16*60,business,ev),'closure');
 assert.equal(slotState(d,20*60,business,ev),'outside');
});
test('イベント競合時は予約済みを優先',()=>{
 assert.equal(slotState(d,13*60,business,[...ev,{type:'closure',start:'2026-11-16T12:00:00',end:'2026-11-16T14:00:00'}]),'reservation');
});
test('終日休館イベントは開始日以上、終了日未満',()=>{
 const closure = [{type:'closure',allDay:true,start:'2026-11-16',end:'2026-11-18'}];
 assert.equal(slotState(d,600,business,closure),'closure');
 assert.equal(slotState(plusDays(d,1),600,business,closure),'closure');
 assert.equal(slotState(plusDays(d,2),600,business,closure),'outside');
});
test('営業設定のみでも営業時間を表示できる',()=>{
 assert.equal(slotState(d,570,business,[]),'open');
 assert.equal(slotState(d,540,business,[]),'open');
 assert.equal(slotState(d,480,business,[]),'outside');
});
test('カレンダーの表示範囲は営業時間の前後1時間',()=>{
 assert.deepEqual(getDayTimeRange(business,[]),{startHour:8,endHour:19});
 assert.equal(calendarSlotRows(d,business,ev).length,22);
});
test('日付移動のローカルカレンダー演算',()=>{
 assert.equal(dayKey(plusDays(d,1)),'2026-11-17');
 assert.equal(dayKey(plusDays(d,-1)),'2026-11-15');
});
