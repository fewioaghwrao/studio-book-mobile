import { isMobileGeneralUser } from './accessPolicy.js';

/** URLパラメータから来るタイムゾーン無しの日時を厳密に検証。 */
export function validLocalDateTime(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  if (year < 1 || hour > 23 || minute > 59 || second > 59) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month
    && parsed.getUTCDate() === day && parsed.getUTCHours() === hour
    && parsed.getUTCMinutes() === minute && parsed.getUTCSeconds() === second;
}

export function validConfirmationParams(roomId, startAt, endAt) {
  return Number.isSafeInteger(roomId) && roomId > 0
    && validLocalDateTime(startAt) && validLocalDateTime(endAt) && startAt < endAt;
}

/** 既存 /api/reservations/confirm を呼び出す。重複/料金は必ずサーバー側で判定。 */
export async function confirmReservation({ roomId, startAt, endAt, roles }, request) {
  if (!isMobileGeneralUser(roles)) throw new Error('予約は一般会員（GeneralUser）に限られます。');
  if (!validConfirmationParams(roomId, startAt, endAt)) throw new Error('予約日時の指定が正しくありません。');
  return request('/api/reservations/confirm', {
    method: 'POST',
    body: JSON.stringify({ roomId, startAt, endAt }),
  }, true);
}
