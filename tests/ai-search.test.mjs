import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAiCapacity, formatAiSlotLabel, getAiReservationParams } from '../src/lib/aiSearchLogic.js';

const slot = { startAt: '2026-11-14T18:00:00', endAt: '2026-11-14T20:00:00', durationAssumed:false };
const available = { status:'available', label:'空きあり', isAvailable:true };

test('Web版のAI日時ラベルに相当する文字列を表示', () => {
  assert.equal(formatAiSlotLabel(slot), '11/14（土）18:00〜20:00');
});
test('AIが返した日時を予約確認へ引き継ぐ', () => {
  assert.deepEqual(getAiReservationParams(8,slot,available),{id:'8',startAt:'2026-11-14T18:00:00',endAt:'2026-11-14T20:00:00'});
});
test('翌日までの時間帯も日付を表示',()=>{
  assert.equal(formatAiSlotLabel({startAt:'2026-11-14T23:00:00',endAt:'2026-11-15T01:00:00'}),'11/14（土）23:00〜11/15 01:00');
});
test('空いていない部屋・日時指定なしは直接予約できない',()=>{
  assert.equal(getAiReservationParams(8,slot,{isAvailable:false}),null);
  assert.equal(getAiReservationParams(8,null,available),null);
  assert.equal(getAiReservationParams(0,slot,available),null);
});
test('不正な日時やタイムゾーン付き日時を拒否',()=>{
  assert.equal(getAiReservationParams(8,{startAt:'2026-02-30T10:00:00',endAt:'2026-02-30T11:00:00'},available),null);
  assert.equal(getAiReservationParams(8,{startAt:'2026-11-14T10:00:00Z',endAt:'2026-11-14T11:00:00Z'},available),null);
  assert.equal(getAiReservationParams(8,{startAt:'2026-11-14T12:00:00',endAt:'2026-11-14T11:00:00'},available),null);
});
test('人数条件の min / max / exact / 未指定',()=>{
  assert.equal(formatAiCapacity(10,'min'),'10人以上');
  assert.equal(formatAiCapacity(10,'max'),'10人以下');
  assert.equal(formatAiCapacity(10,'exact'),'10人');
  assert.equal(formatAiCapacity(null,'min'),'指定なし');
});
