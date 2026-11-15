/** APIと同様、端末のローカル日時をオフセット無しで送信する。時刻仕様を統一すること。 */
export function localDateTime(value) {
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const dd = String(value.getDate()).padStart(2, '0');
  const hh = String(value.getHours()).padStart(2, '0');
  const mi = String(value.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00`;
}
export function dateError(start, end, now = new Date()) {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return '日時の形式を確認してください。';
  if (start.getTime() <= now.getTime()) return '開始日時は現在時刻より後にしてください。';
  if (end.getTime() <= start.getTime()) return '終了日時は開始日時より後にしてください。';
  return null;
}
/**
 * 詳細APIのcalendarEventsを表示上の目安として利用。確定判定はバックエンド。
 * open は営業中の背景イベントであり、予約の衝突として扱ってはいけない。
 */
export function overlapsEvents(start, end, events) {
  return events.some((event) => {
    if (event.type === 'open' || !event.start || !event.end) return false;
    let s, e;
    if (event.allDay) {
      // FullCalendar と同じく終日は終了日が排他的。
      const getDate = (value) => {
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
        return m ? new Date(Number(m[1]),Number(m[2])-1,Number(m[3])).getTime() : NaN;
      };
      s = getDate(event.start);
      e = getDate(event.end);
    } else {
      s = new Date(event.start).getTime();
      e = new Date(event.end).getTime();
    }
    return Number.isFinite(s) && Number.isFinite(e) && start.getTime() < e && end.getTime() > s;
  });
}
export function yen(value) { return `${Number(value ?? 0).toLocaleString('ja-JP')}円`; }
export function displayDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('ja-JP', {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
}
export function statusLabel(status, isUsed) {
  if (status === 'paid') return isUsed ? '利用済み' : '決済済み';
  if (status === 'booked') return '予約済み';
  if (status === 'canceled') return 'キャンセル済み';
  return status || '不明';
}
