import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, clearToken, getMe, signInRequest, storeToken, tokenExists } from './api';
import type { Member } from '../types';

type Auth = {
  user: Member | null;
  ready: boolean;
  refresh: () => Promise<void>;
  signIn: (email:string,password:string)=>Promise<void>;
  signOut: ()=>Promise<void>;
};
const AuthContext = createContext<Auth | undefined>(undefined);
export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser] = useState<Member | null>(null);
  const [ready,setReady] = useState(false);
  const refresh = useCallback(async () => {
    try {
      if (!await tokenExists()) { setUser(null); return; }
      const res = await getMe();
      setUser(res.isAuthenticated ? res.user ?? null : null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setUser(null);
      // 一時的な通信エラーではトークンを破棄しない
      else throw e;
    }
  },[]);
  useEffect(() => {
    let active = true;
    refresh().catch(()=>{ /* 起動時はオフラインでも検索画面を表示する */ })
      .finally(()=>{if(active)setReady(true);});
    return ()=>{active=false;};
  },[refresh]);
  const signIn=useCallback(async(email:string,password:string)=>{
    const result=await signInRequest(email.trim(),password);
    if(!result.token)throw new Error('サーバーからログイントークンを受信できませんでした。');
    await storeToken(result.token);
    try {
      const me=await getMe();
      if(!me.isAuthenticated || !me.user)throw new Error('会員情報を取得できませんでした。');
      setUser(me.user);
    } catch(e){await clearToken();setUser(null);throw e;}
  },[]);
  const signOut=useCallback(async()=>{await clearToken();setUser(null);},[]);
  const value=useMemo(()=>({user,ready,refresh,signIn,signOut}),[user,ready,refresh,signIn,signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value=useContext(AuthContext);
  if(!value)throw new Error('AuthProviderが必要です。');
  return value;
}
export function isGeneralUser(roles:string[]|undefined) { return Boolean(roles?.includes('GeneralUser')); }
