import * as SecureStore from 'expo-secure-store';
import type { AiRoomSearchResponse, EditMember, LoginResponse, MeResponse } from '../types';
import { ApiError, createApiRequester } from './apiRequestCore.js';
import { checkoutAllowed as checkCheckoutUrl } from './checkoutLogic.js';
export { ApiError };

const KEY = 'studio-book.jwt';
const BASE = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '') ?? '';
export const WEB_BASE = process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim().replace(/\/+$/, '') ?? '';

const requestImpl = createApiRequester({
  baseUrl: BASE,
  fetchImpl: (url: string, init: RequestInit) => fetch(url, init),
  getToken: () => SecureStore.getItemAsync(KEY),
  deleteToken: () => SecureStore.deleteItemAsync(KEY),
});

export async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  return requestImpl(path, init, auth) as Promise<T>;
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
  return checkCheckoutUrl(url, process.env.EXPO_PUBLIC_CHECKOUT_ALLOWED_HOSTS || '');
}

/** Web版と共通の公開AI検索。AIの秘密鍵・推論処理はAPIサーバー側のみで管理。 */
export async function aiRoomSearch(query: string): Promise<AiRoomSearchResponse> {
  return request<AiRoomSearchResponse>('/api/ai/room-search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}
