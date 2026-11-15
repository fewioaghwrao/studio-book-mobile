import test from 'node:test';
import assert from 'node:assert/strict';
import { isMobileGeneralUser } from '../src/lib/accessPolicy.js';

test('一般会員だけがモバイルにログインできる', () => {
  assert.equal(isMobileGeneralUser(['GeneralUser']), true);
  assert.equal(isMobileGeneralUser(['Host']), false);
  assert.equal(isMobileGeneralUser(['Admin']), false);
  assert.equal(isMobileGeneralUser([]), false);
  assert.equal(isMobileGeneralUser(undefined), false);
});

test('管理権限を兼ねるアカウントはスマホ版ログイン不可', () => {
  assert.equal(isMobileGeneralUser(['GeneralUser','Admin']), false);
  assert.equal(isMobileGeneralUser(['GeneralUser','Host']), false);
});
