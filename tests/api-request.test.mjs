import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, createApiRequester } from '../src/lib/apiRequestCore.js';

function setup(status = 200, body = { ok: true }, token = 'jwt-for-tests') {
  const calls = { fetch: [], getToken: 0, deleteToken: 0 };
  const request = createApiRequester({
    baseUrl: 'https://api.example.test/',
    fetchImpl: async (url, init) => {
      calls.fetch.push({ url, init });
      return status === 204 ? new Response(null, { status }) : new Response(
        typeof body === 'string' ? body : JSON.stringify(body), { status },
      );
    },
    getToken: async () => { calls.getToken++; return token; },
    deleteToken: async () => { calls.deleteToken++; },
  });
  return { request, calls };
}

test('認証付きAPIにはJWT Bearerを渡し、要求元の偽Authorizationは採用しない', async () => {
  const { request, calls } = setup();
  assert.deepEqual(await request('/api/auth/me', { headers: { Authorization: 'Bearer attacker' } }, true), {ok:true});
  assert.equal(calls.fetch[0].url, 'https://api.example.test/api/auth/me');
  assert.equal(calls.fetch[0].init.headers.Authorization, 'Bearer jwt-for-tests');
  assert.equal(calls.getToken, 1);
});

test('未認証で要ログインAPIを呼ぶとHTTP通信せず401エラー', async () => {
  const { request, calls } = setup(200, {}, null);
  await assert.rejects(request('/api/reservations/confirm', {}, true), e => e instanceof ApiError && e.status === 401);
  assert.equal(calls.fetch.length, 0);
});

test('401応答時は端末のJWTを削除する', async () => {
  const { request, calls } = setup(401, {message:'有効期限切れ'});
  await assert.rejects(request('/api/auth/me', {}, true), e => e.status === 401 && e.message === '有効期限切れ');
  assert.equal(calls.deleteToken, 1);
});

test('403権限不足ではJWTを削除せず理由を上位に伝える', async () => {
  const { request, calls } = setup(403, { title: '閲覧権限がありません' });
  await assert.rejects(request('/api/reservations', {}, true), e => e.status === 403 && e.message === '閲覧権限がありません');
  assert.equal(calls.deleteToken, 0);
});

test('未認証公開APIはJWTを参照・付与しない', async () => {
  const { request, calls } = setup();
  await request('/api/rooms');
  assert.equal(calls.getToken, 0);
  assert.equal(calls.fetch[0].init.headers.Authorization, undefined);
});

test('JSON本文付きPOSTはContent-Typeを付与し、204は空として扱う', async () => {
  const {request,calls} = setup(204);
  const result = await request('/api/reservations/confirm', {method:'POST', body:'{}'}, true);
  assert.equal(result, undefined);
  assert.equal(calls.fetch[0].init.headers['Content-Type'], 'application/json');
});

test('JSONでないエラーでもHTTPコードを維持', async () => {
  const { request } = setup(500, 'server failure');
  await assert.rejects(request('/api/auth/login'), e => e instanceof ApiError && e.status === 500 && /HTTP 500/.test(e.message));
});

test('不正なAPI URL・パスはネットワーク送信前に拒否する', async () => {
  let count=0;
  const request = createApiRequester({baseUrl:'http://example.test', fetchImpl:async()=>{count++;}, getToken:async()=>null, deleteToken:async()=>{}});
  await assert.rejects(request('/api/rooms'), e => e.status === 0);
  const { request: safe, calls } = setup();
  await assert.rejects(safe('/admin/secret'), e => e.status === 0);
  assert.equal(count,0);
  assert.equal(calls.fetch.length,0);
});
