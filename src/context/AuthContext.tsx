// src/context/AuthContext.tsx
//
// SCAFFOLD — not yet wired into RootNavigator/DrawerNavigator.
//
// Today, `token` and `role` are each re-read from AsyncStorage independently in
// RootNavigator.tsx and DrawerNavigator.tsx, kept in sync via the `authEvents`
// emitter (see utils/authEvents.ts). This context centralizes that same pattern
// behind a single `useAuth()` hook so new screens don't have to duplicate the
// AsyncStorage + authEvents wiring.
//
// To adopt: wrap <RootNavigator /> in <AuthProvider> from App.tsx, then replace
// the local `token`/`role` state in RootNavigator.tsx and DrawerNavigator.tsx
// with `useAuth()`. Left as an opt-in migration to avoid changing existing
// navigation behavior in this pass.
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authEvents, AUTH_CHANGED } from '../utils/authEvents';

export type UserRole = 'technician' | 'admin' | 'owner' | null;

interface AuthContextValue {
  token: string | null;
  role: UserRole;
  isOwnerOrAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [storedToken, storedRole] = await Promise.all([
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('role'),
    ]);
    setToken(storedToken);
    setRole((storedRole?.toLowerCase() as UserRole) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    authEvents.on(AUTH_CHANGED, handler);
    return () => {
      authEvents.off(AUTH_CHANGED, handler);
    };
  }, [refresh]);

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  return (
    <AuthContext.Provider value={{ token, role, isOwnerOrAdmin, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used within an <AuthProvider>');
  return ctx;
}
