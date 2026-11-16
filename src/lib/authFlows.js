import { isMobileGeneralUser } from './accessPolicy.js';

/** 認証のユースケース。API・SecureStore処理は注入して単体テスト可能にする。 */
export function createAuthFlows({ signInRequest, storeToken, getMe, clearToken, tokenExists }) {
  return {
    async signIn(email, password) {
      const result = await signInRequest(email.trim(), password);
      if (!result?.token) throw new Error('サーバーからログイントークンを受信できませんでした。');
      await storeToken(result.token);
      try {
        const me = await getMe();
        if (!me?.isAuthenticated || !me.user) throw new Error('会員情報を取得できませんでした。');
        if (!isMobileGeneralUser(me.user.roles)) throw new Error('このアプリは一般会員専用です。ホスト・管理者はWeb版をご利用ください。');
        return me.user;
      } catch (e) {
        await clearToken();
        throw e;
      }
    },
    async restore() {
      if (!await tokenExists()) return null;
      try {
        const me = await getMe();
        if (me?.isAuthenticated && me.user && isMobileGeneralUser(me.user.roles)) return me.user;
        await clearToken();
        return null;
      } catch (e) {
        if (e?.status === 401) {
          await clearToken();
          return null;
        }
        // オフライン等の一時エラーでは保存済みトークンを維持する。
        throw e;
      }
    },
    async signOut() { await clearToken(); },
  };
}
