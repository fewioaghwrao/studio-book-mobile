export function reviewError(score, content) {
  if (!Number.isInteger(score) || score < 1 || score > 5) return '評価は1〜5で選択してください。';
  if (!content.trim()) return 'コメントを入力してください。';
  if (content.length > 1000) return 'コメントは1000文字以内で入力してください。';
  return null;
}
export function canSubmitReview(data, submitting=false, assisting=false) {
  return Boolean(data?.canReview && !submitting && !assisting);
}
export function starText(score) {
  if (score == null || !Number.isFinite(score)) return '☆☆☆☆☆';
  const n = Math.max(0,Math.min(5,Math.round(score)));
  return '★'.repeat(n)+'☆'.repeat(5-n);
}
