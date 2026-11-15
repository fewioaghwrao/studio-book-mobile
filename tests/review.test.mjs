import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewError,canSubmitReview,starText} from '../src/lib/reviewLogic.js';
test('投稿テキストを検証',()=>{
 assert.equal(reviewError(5,'よかった'),null);
 assert.match(reviewError(3,'   '),/コメント/);
 assert.match(reviewError(0,'コメント'),/1〜5/);
 assert.match(reviewError(5,'あ'.repeat(1001)),/1000文字/);
});
test('サーバーのcanReviewを尊重する',()=>{
 assert.equal(canSubmitReview({canReview:true}),true);
 assert.equal(canSubmitReview({canReview:false}),false);
 assert.equal(canSubmitReview({canReview:true},true,false),false);
});
test('星の数を正しく表示',()=>{
 assert.equal(starText(3),'★★★☆☆');assert.equal(starText(null),'☆☆☆☆☆');
});
