/**
 * Expo / SecureStore の実装を外側から渡せる HTTP クライアントの中核。
 * 本番では src/lib/api.ts から利用し、テストでは fetch / token store をモックする。
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function apiEndpoint(baseUrl, path) {
  if (!baseUrl || !/^https:\/\//.test(baseUrl) && !/^http:\/\/localhost(:\d+)?$/.test(baseUrl) && !/^http:\/\/10\.0\.2\.2(:\d+)?$/.test(baseUrl)) {
    throw new ApiError('API URLが未設定、またはHTTPSではありません。.envを確認してください。', 0);
  }
  if (!path.startsWith('/api/')) throw new ApiError('不正なAPIパスです。', 0);
  return baseUrl.replace(/\/+$/, '') + path;
}

async function throwResponseError(response) {
  let message = `APIエラー（HTTP ${response.status}）`;
  try {
    const body = await response.json();
    message = body?.message || body?.title || message;
  } catch { /* JSON以外のレスポンスも許容 */ }
  throw new ApiError(message, response.status);
}

export function createApiRequester({ baseUrl, fetchImpl, getToken, deleteToken }) {
  return async function request(path, init = {}, auth = false) {
    const url = apiEndpoint(baseUrl, path);
    const token = auth ? await getToken() : null;
    if (auth && !token) throw new ApiError('ログインが必要です。', 401);

    const response = await fetchImpl(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
        // 呼び出し側から認証用ヘッダーを上書きさせない。
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (response.status === 401 && token) await deleteToken();
    if (!response.ok) return throwResponseError(response);
    if (response.status === 204) return undefined;
    const data = await response.text();
    return data ? JSON.parse(data) : undefined;
  };
}
