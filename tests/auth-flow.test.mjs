import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthFlows } from '../src/lib/authFlows.js';

const generalUser = { id: 12, name: 'テスト会員', roles:['GeneralUser'] };
function setup({ login={token:'mock-jwt'}, me={isAuthenticated:true,user:generalUser}, exists=true }={}) {
  const calls={ login:[], store:[], clear:0, me:0, exists:0 };
  const flow=createAuthFlows({
    signInRequest:async(email,password)=>{calls.login.push({email,password});return login;},
    storeToken:async token=>{calls.store.push(token);},
    getMe:async()=>{calls.me++;return me;},
    clearToken:async()=>{calls.clear++;},
    tokenExists:async()=>{calls.exists++;return exists;},
  });
  return {flow,calls};
}

test('一般会員のログインはメールの空白を除きJWTを保存・本人情報を返す',async()=>{
 const {flow,calls}=setup();
 assert.deepEqual(await flow.signIn('  person@example.com  ','secret'),generalUser);
 assert.deepEqual(calls.login,[{email:'person@example.com',password:'secret'}]);
 assert.deepEqual(calls.store,['mock-jwt']);
 assert.equal(calls.me,1);
 assert.equal(calls.clear,0);
});

test('ログイン応答にJWTが無い場合は保存しない',async()=>{
 const {flow,calls}=setup({login:{}});
 await assert.rejects(flow.signIn('person@example.com','pw'),/トークン/);
 assert.equal(calls.store.length,0);
 assert.equal(calls.me,0);
});

test('管理者ログインは拒否して保存したJWTを削除する',async()=>{
 const {flow,calls}=setup({me:{isAuthenticated:true,user:{roles:['Admin']}}});
 await assert.rejects(flow.signIn('admin@example.com','pw'),/一般会員専用/);
 assert.equal(calls.store.length,1);
 assert.equal(calls.clear,1);
});

test('GeneralUser＋Hostの複数ロールもログイン拒否して削除する',async()=>{
 const {flow,calls}=setup({me:{isAuthenticated:true,user:{roles:['GeneralUser','Host']}}});
 await assert.rejects(flow.signIn('host@example.com','pw'),/一般会員専用/);
 assert.equal(calls.clear,1);
});

test('会員情報未取得・通信失敗時はログイントークンを削除する',async()=>{
 const {flow,calls}=setup({me:{isAuthenticated:false}});
 await assert.rejects(flow.signIn('user@example.com','pw'),/会員情報/);
 assert.equal(calls.clear,1);
});

test('起動時は一般会員だけ保存済みJWTを復元',async()=>{
 const {flow,calls}=setup();
 assert.deepEqual(await flow.restore(),generalUser);
 assert.equal(calls.clear,0);
 assert.equal(calls.me,1);
});

test('保存済みトークンがなければ会員APIを呼ばない',async()=>{
 const {flow,calls}=setup({exists:false});
 assert.equal(await flow.restore(),null);
 assert.equal(calls.me,0);
});

test('起動時に不適切なロールを検知したら保存済みJWTを削除する',async()=>{
 const {flow,calls}=setup({me:{isAuthenticated:true,user:{roles:['GeneralUser','Admin']}}});
 assert.equal(await flow.restore(),null);
 assert.equal(calls.clear,1);
});

test('復元時の401は再ログイン扱いとしJWTを削除する',async()=>{
 const {flow,calls}=setup();
 // getMe を401に差し替えてJWTの期限切れを再現
 const expired=createAuthFlows({
  signInRequest:async()=>({}),storeToken:async()=>{},
  getMe:async()=>{throw Object.assign(new Error('認証切れ'),{status:401});},
  clearToken:async()=>{calls.clear++;},tokenExists:async()=>true,
 });
 assert.equal(await expired.restore(),null);
 assert.equal(calls.clear,1);
});

test('復元時に一時ネットワークエラーならJWTを削除せず例外を通知する',async()=>{
 let clears=0;
 const flow=createAuthFlows({
  signInRequest:async()=>({}),storeToken:async()=>{},
  getMe:async()=>{throw new TypeError('network unreachable');},
  clearToken:async()=>{clears++;},tokenExists:async()=>true,
 });
 await assert.rejects(flow.restore(),/network unreachable/);
 assert.equal(clears,0);
});

test('ログアウトはJWT削除を実行する',async()=>{
 const {flow,calls}=setup();
 await flow.signOut();
 assert.equal(calls.clear,1);
});
