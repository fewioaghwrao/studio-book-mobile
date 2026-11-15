/**
 * Web版の calendarEvents と businessHours を、スマホの30分刻みの日表示に投影する。
 * 見た目の空き状況は参考情報であり、予約確定は必ずバックエンドで再検証する。
 */
const MIN = 60;

export function parseClock(value) {
  if (typeof value !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!m) return null;
  const hour = Number(m[1]), minute = Number(m[2]);
  if (hour > 24 || minute > 59 || (hour === 24 && minute !== 0)) return null;
  return hour * MIN + minute;
}

export function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function plusDays(date, days) {
  // 24*60*60ms を足すとDST越えで日付がずれるため日付演算を使う
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** API仕様：営業時間の曜日は月曜=1、日曜=7 */
export function businessHoursForDate(date, hours = []) {
  const weekday = date.getDay() === 0 ? 7 : date.getDay();
  return hours.find(h => h.dayOfWeek === weekday) ?? null;
}

function crosses(event, start, end) {
  if (!event || !event.start || !event.end) return false;
  if (event.allDay) {
    // FullCalendar の allDay.end は排他的。ISO の日付部分を文字列で比較する。
    const from = String(event.start).slice(0,10);
    const to = String(event.end).slice(0,10);
    const key = dayKey(start);
    return from <= key && key < to;
  }
  const a = new Date(event.start).getTime();
  const b = new Date(event.end).getTime();
  return Number.isFinite(a) && Number.isFinite(b) && a < end.getTime() && b > start.getTime();
}

export function slotState(date, minuteOfDay, hours = [], events = [], slotMinutes = 30) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, minuteOfDay);
  const end = new Date(start.getTime() + slotMinutes * MIN * 1000);
  const overlapping = events.filter(e => crosses(e, start, end));
  // 予約済み > 休館 > 営業時間 の優先順位。曖昧な種別は勝手に予約済み扱いしない。
  if (overlapping.some(e => e.type === 'reservation')) return 'reservation';
  if (overlapping.some(e => e.type === 'closure')) return 'closure';
  if (overlapping.some(e => e.type === 'open')) return 'open';

  const business = businessHoursForDate(date, hours);
  if (!business || business.isHoliday) return 'outside';
  const begin = parseClock(business.startTime), finish0 = parseClock(business.endTime);
  if (begin == null || finish0 == null) return 'outside';
  const finish = finish0 === 0 && begin > 0 ? 1440 : finish0;
  if (finish <= begin) {
    // 翌日へまたぐ営業時間（例 22:00 - 02:00）。当日分を表示。
    return minuteOfDay + slotMinutes > begin ? 'open' : 'outside';
  }
  return minuteOfDay + slotMinutes > begin && minuteOfDay < finish ? 'open' : 'outside';
}

/** Web版 calendarTimeRange.ts に合わせ、営業時間・予定の前後1時間を表示。 */
export function getDayTimeRange(hours = [], events = []) {
  let min = Infinity, max = -Infinity;
  for (const row of hours) {
    if (row.isHoliday) continue;
    const a = parseClock(row.startTime), b0 = parseClock(row.endTime);
    if (a == null || b0 == null) continue;
    const b = b0 === 0 && a > 0 ? 1440 : b0;
    if (b <= a) return {startHour:0,endHour:24};
    min = Math.min(min,a);max = Math.max(max,b);
  }
  for (const e of events) {
    if (e.allDay) continue;
    const a = new Date(e.start), b = new Date(e.end);
    if (!Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime())) continue;
    let stop = b.getHours()*60+b.getMinutes();
    if (dayKey(a) !== dayKey(b)) {
      if (stop !== 0 || b.getTime()-a.getTime() > 86400000) return {startHour:0,endHour:24};
      stop = 1440;
    }
    min = Math.min(min,a.getHours()*60+a.getMinutes()); max = Math.max(max,stop);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return {startHour:8,endHour:22};
  return { startHour:Math.max(0,Math.floor(min/60)-1), endHour:Math.min(24,Math.ceil(max/60)+1) };
}

export function calendarSlotRows(date, hours = [], events = []) {
  const {startHour,endHour} = getDayTimeRange(hours,events);
  return Array.from({length:Math.max(0,(endHour-startHour)*2)},(_,i)=>{
    const minute = startHour*60+i*30;
    return {
      key: `${dayKey(date)}-${minute}`,
      minute,
      time: `${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`,
      state: slotState(date,minute,hours,events),
    };
  });
}
