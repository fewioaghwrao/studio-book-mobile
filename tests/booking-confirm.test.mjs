import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmReservation, validConfirmationParams } from '../src/lib/bookingConfirm.js';

const input={roomId:8,startAt:'2026-11-19T10:00:00',endAt:'2026-11-19T12:00:00',roles:['GeneralUser']};
const serverResult={roomId:8,hours:2,amount:22000,checkoutUrl:'https://checkout.stripe.com/c/pay/test-session'};

function mockApi(result=serverResult) {
 const calls=[];
 const request=async(...args)=>{calls.push(args);return result;};
 return {request,calls};
}

test('正しい予約日時で一般会員のみPOST /api/reservations/confirmに送信する',async()=>{
 const {request,calls}=mockApi();
 assert.deepEqual(await confirmReservation(input,request),serverResult);
 assert.equal(calls.length,1);
 assert.equal(calls[0][0],'/api/reservations/confirm');
 assert.equal(calls[0][1].method,'POST');
 assert.equal(calls[0][2],true);
 assert.deepEqual(JSON.parse(calls[0][1].body),{roomId:8,startAt:input.startAt,endAt:input.endAt});
});

test('料金・空き状況はサーバー結果をそのまま扱い、端末では再計算しない',async()=>{
 const response={...serverResult,amount:24780,subtotal:21000};
 const {request}=mockApi(response);
 assert.equal((await confirmReservation(input,request)).amount,24780);
});

test('不正なスタジオIDをネットワーク送信前に拒否',async()=>{
 const {request,calls}=mockApi();
 for(const roomId of [0,-2,2.5,Number.NaN,Number.MAX_SAFE_INTEGER+1]) {
  await assert.rejects(confirmReservation({...input,roomId},request),/日時/);
 }
 assert.equal(calls.length,0);
});

test('実在しない日付・TZ付き日時・不正時刻を拒否',async()=>{
 const {request,calls}=mockApi();
 for(const startAt of ['2026-02-30T10:00:00','2026-11-19T25:00:00','2026-11-19T10:00:00Z','2026-11-19 10:00:00']) {
  await assert.rejects(confirmReservation({...input,startAt},request),/日時/);
 }
 assert.equal(calls.length,0);
});

test('開始＝終了、開始＞終了を拒否',async()=>{
 assert.equal(validConfirmationParams(8,input.startAt,input.startAt),false);
 assert.equal(validConfirmationParams(8,input.endAt,input.startAt),false);
 const {request,calls}=mockApi();
 await assert.rejects(confirmReservation({...input,endAt:input.startAt},request),/日時/);
 assert.equal(calls.length,0);
});

test('Host・Admin・非ログインでは予約確認APIを呼ばない',async()=>{
 const {request,calls}=mockApi();
 for(const roles of [undefined,[],['Host'],['Admin'],['GeneralUser','Host']]) {
  await assert.rejects(confirmReservation({...input,roles},request),/一般会員/);
 }
 assert.equal(calls.length,0);
});

test('予約重複（409）や権限不足（403）のAPIエラーは握りつぶさず通知',async()=>{
 for(const status of [409,403]) {
  const error=Object.assign(new Error(`HTTP ${status}`),{status});
  await assert.rejects(confirmReservation(input,async()=>{throw error;}),e=>e.status===status);
 }
});

test('ネットワーク障害は上位へ通知し、勝手に予約を確定しない',async()=>{
 let calls=0;
 await assert.rejects(confirmReservation(input,async()=>{calls++;throw new TypeError('offline');}),/offline/);
 assert.equal(calls,1);
});
