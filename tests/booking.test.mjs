import test from 'node:test';
import assert from 'node:assert/strict';
import { dateError, localDateTime, overlapsEvents, statusLabel } from '../src/lib/bookingLogic.js';
test('ローカル時刻をAPI形式で送る', () => {
 const local = new Date(2026, 10, 14, 13, 5);
 assert.equal(localDateTime(local), '2026-11-14T13:05:00');
});
test('過去時刻・開始以後の終了を拒否', () => {
 const now = new Date(2026,10,14,12,0);
 assert.match(dateError(new Date(2026,10,14,11),new Date(2026,10,14,13),now),/現在時刻/);
 assert.match(dateError(new Date(2026,10,14,14),new Date(2026,10,14,14),now),/終了日時/);
 assert.equal(dateError(new Date(2026,10,14,13),new Date(2026,10,14,14),now),null);
});
test('カレンダー重なりは境界一致なら重複しない', () => {
 const events=[{start:'2026-11-14T15:00:00',end:'2026-11-14T16:00:00'}];
 assert.equal(overlapsEvents(new Date(2026,10,14,14),new Date(2026,10,14,15),events),false);
 assert.equal(overlapsEvents(new Date(2026,10,14,14),new Date(2026,10,14,15,30),events),true);
});
test('予約ステータス名',()=>{
 assert.equal(statusLabel('paid',true),'利用済み');
 assert.equal(statusLabel('paid',false),'決済済み');
 assert.equal(statusLabel('canceled',false),'キャンセル済み');
});
