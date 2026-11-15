import * as SecureStore from 'expo-secure-store';
import type { AiRoomSearchResponse, EditMember, LoginResponse, MeResponse } from '../types';

const KEY = 'studio-book.jwt';
const BASE = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '') ?? '';
export const WEB_BASE = process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim().replace(/\/+$/, '') ?? '';

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = 'ApiError'; }
}

function apiEndpoint(path: string) {
  if (!BASE || !/^https:\/\//.test(BASE) && !/^http:\/\/localhost(:\d+)?$/.test(BASE) && !/^http:\/\/10\.0\.2\.2(:\d+)?$/.test(BASE)) {
    throw new ApiError('API URLが未設定、またはHTTPSではありません。.envを確認してください。', 0);
  }
  if (!path.startsWith('/api/')) throw new ApiError('不正なAPIパスです。', 0);
  return BASE + path;
}

async function responseError(response: Response): Promise<never> {
  let message = `APIエラー（HTTP ${response.status}）`;
  try {
    const body: { message?: string; title?: string } = await response.json();
    message = body.message || body.title || message;
  } catch { /* JSON以外のエラーを許容 */ }
  throw new ApiError(message, response.status);
}

export async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const token = auth ? await SecureStore.getItemAsync(KEY) : null;
  if (auth && !token) throw new ApiError('ログインが必要です。', 401);
  const response = await fetch(apiEndpoint(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (response.status === 401 && token) await SecureStore.deleteItemAsync(KEY);
  if (!response.ok) return responseError(response);
  if (response.status === 204) return undefined as T;
  const data = await response.text();
  return data ? JSON.parse(data) as T : undefined as T;
}

export async function signInRequest(email: string, password: string) {
  return request<LoginResponse>('/api/auth/login', {method:'POST',body:JSON.stringify({email,password})});
}
export async function storeToken(token: string) { await SecureStore.setItemAsync(KEY, token); }
export async function clearToken() { await SecureStore.deleteItemAsync(KEY); }
export async function tokenExists() { return Boolean(await SecureStore.getItemAsync(KEY)); }
export async function getMe() { return request<MeResponse>('/api/auth/me', {}, true); }
export async function updateMe(form: EditMember) { return request<unknown>('/api/auth/me', {method:'PUT',body:JSON.stringify(form)},true); }

export function checkoutAllowed(url: string) {
  try {
    const parsed = new URL(url);
    const extra = (process.env.EXPO_PUBLIC_CHECKOUT_ALLOWED_HOSTS || '').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
    return parsed.protocol === 'https:' && (parsed.hostname.toLowerCase() === 'checkout.stripe.com' || extra.includes(parsed.hostname.toLowerCase()));
  } catch { return false; }
}

/** Web版と共通の公開AI検索。AIの秘密鍵・推論処理はAPIサーバー側のみで管理。 */
export async function aiRoomSearch(query: string): Promise<AiRoomSearchResponse> {
  return request<AiRoomSearchResponse>('/api/ai/room-search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}
