/**
 * Web版 aiSearchSlot.ts と同じルールで日本時間の壁時計日時を扱う。
 * JS Date に変換すると端末のTZで日時がずれるため文字列で処理する。
 */
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function parseWallTime(value) {
  if (typeof value !== 'string') return null;
  const match = DATE_TIME.exec(value);
  if (!match) return null;
  const [, yy, mm, dd, hh, min, sec = '00'] = match;
  const year = Number(yy), month = Number(mm), day = Number(dd);
  const hour = Number(hh), minute = Number(min), second = Number(sec);
  if (year < 2000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
  const timestamp = Date.UTC(year, month - 1, day, hour, minute, second);
  const d = new Date(timestamp);
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return { timestamp, year, month, day, hour, minute, date: `${yy}-${mm}-${dd}`, time: `${hh}:${min}`, normalized: `${yy}-${mm}-${dd}T${hh}:${min}:00` };
}

export function formatAiSlotLabel(slot) {
  const start = parseWallTime(slot?.startAt);
  const end = parseWallTime(slot?.endAt);
  if (!start || !end || start.timestamp >= end.timestamp) return '日時を確認できません';
  const weekday = WEEKDAYS[new Date(Date.UTC(start.year, start.month - 1, start.day)).getUTCDay()];
  const endDate = start.date === end.date ? '' : `${end.month}/${end.day} `;
  return `${start.month}/${start.day}（${weekday}）${start.time}〜${endDate}${end.time}`;
}

/** AI空き状況が利用可能と判定した場合に限り、予約確認画面へ日時を引き継ぐ。 */
export function getAiReservationParams(roomId, slot, availability) {
  if (availability?.isAvailable !== true || !Number.isSafeInteger(roomId) || roomId <= 0) return null;
  const start = parseWallTime(slot?.startAt);
  const end = parseWallTime(slot?.endAt);
  if (!start || !end || start.timestamp >= end.timestamp) return null;
  return { id: String(roomId), startAt: start.normalized, endAt: end.normalized };
}

export function formatAiCapacity(capacity, condition) {
  if (capacity == null || capacity <= 0) return '指定なし';
  if (condition === 'max') return `${capacity}人以下`;
  if (condition === 'exact') return `${capacity}人`;
  return `${capacity}人以上`;
}
