/** Stripe Checkoutの外部URLへの遷移を許可リスト方式で制限。 */
export function checkoutAllowed(url, configuredHosts = '') {
  try {
    if (typeof url !== 'string') return false;
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return false;
    const hostname = parsed.hostname.toLowerCase();
    const additionalHosts = configuredHosts.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    return hostname === 'checkout.stripe.com' || additionalHosts.includes(hostname);
  } catch { return false; }
}

/** 外部ブラウザをモックできるようにしておき、決済成功は一切判定しない。 */
export async function openCheckoutUrl(url, browserOpen, configuredHosts = '') {
  if (!checkoutAllowed(url, configuredHosts)) {
    throw new Error('安全なStripe Checkout URLを確認できませんでした。決済を開始しません。');
  }
  // ブラウザの終了は「決済完了」ではない。確定状態は別途サーバーの予約履歴で確認。
  return browserOpen(url);
}
