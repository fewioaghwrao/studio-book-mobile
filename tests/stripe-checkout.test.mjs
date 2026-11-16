import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutAllowed, openCheckoutUrl } from '../src/lib/checkoutLogic.js';

const url = 'https://checkout.stripe.com/c/pay/cs_test_sample?prefilled_email=a%40example.com';

test('正規Stripe CheckoutのHTTPS URLを許可',()=>{
 assert.equal(checkoutAllowed(url),true);
 assert.equal(checkoutAllowed('https://checkout.stripe.com/'),true);
});

test('HTTP・偽サブドメイン・類似ドメイン・スキーム違いを拒否',()=>{
 for(const value of [
  'http://checkout.stripe.com/c/pay/cs_test',
  'https://checkout.stripe.com.evil.example/c/pay/x',
  'https://fakecheckout.stripe.com/c/pay/x',
  'javascript:alert(1)', 'not-a-url','',
 ]) assert.equal(checkoutAllowed(value),false,value);
});

test('userinfo付きの紛らわしいURLを拒否',()=>{
 assert.equal(checkoutAllowed('https://attacker@checkout.stripe.com/c/pay/x'),false);
 assert.equal(checkoutAllowed('https://checkout.stripe.com@evil.example/c/pay/x'),false);
});

test('独自ドメインは明示的な許可リストに一致するホストのみ',()=>{
 assert.equal(checkoutAllowed('https://pay.example.com/checkout','pay.example.com'),true);
 assert.equal(checkoutAllowed('https://other.example.com/checkout','pay.example.com'),false);
 assert.equal(checkoutAllowed('https://pay.example.com.evil.example/','pay.example.com'),false);
});

test('不正URLでは外部ブラウザを一度も開かない',async()=>{
 let called=0;
 await assert.rejects(openCheckoutUrl('http://checkout.stripe.com/c/pay/x',async()=>{called++;}),/安全なStripe/);
 assert.equal(called,0);
});

test('許可URLは同じURLでブラウザに渡し、戻り値を決済成功と解釈しない',async()=>{
 const opened=[];
 const browserReturn={type:'cancel'};
 const returned=await openCheckoutUrl(url,async u=>{opened.push(u);return browserReturn;});
 assert.deepEqual(opened,[url]);
 assert.deepEqual(returned,{type:'cancel'});
});

test('ブラウザ起動に失敗したときは失敗を上位へ渡す',async()=>{
 await assert.rejects(openCheckoutUrl(url,async()=>{throw new Error('Browser failure');}),/Browser failure/);
});
