import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearToken, getMe, signInRequest, storeToken, tokenExists } from './api';
import { createAuthFlows } from './authFlows.js';
import type { Member } from '../types';
import { isMobileGeneralUser } from './accessPolicy.js';

type Auth = {
  user: Member | null;
  ready: boolean;
  refresh: () => Promise<void>;
  signIn: (email:string,password:string)=>Promise<void>;
  signOut: ()=>Promise<void>;
};
const AuthContext = createContext<Auth | undefined>(undefined);
const authFlows = createAuthFlows({ signInRequest, storeToken, getMe, clearToken, tokenExists });
export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser] = useState<Member | null>(null);
  const [ready,setReady] = useState(false);
  const refresh = useCallback(async () => {
    const restored = await authFlows.restore();
    setUser(restored);
  }, []);
  useEffect(() => {
    let active = true;
    refresh().catch(() => { /* 起動時はオフラインでも検索画面を表示する */ })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [refresh]);
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const signedInUser = await authFlows.signIn(email, password);
      setUser(signedInUser);
    } catch (error) {
      setUser(null);
      throw error;
    }
  }, []);
  const signOut = useCallback(async () => {
    await authFlows.signOut();
    setUser(null);
  }, []);
  const value=useMemo(()=>({user,ready,refresh,signIn,signOut}),[user,ready,refresh,signIn,signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value=useContext(AuthContext);
  if(!value)throw new Error('AuthProviderが必要です。');
  return value;
}
export function isGeneralUser(roles:string[]|undefined) { return isMobileGeneralUser(roles); }
