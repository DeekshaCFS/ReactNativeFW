// src/context/AppStateContext.tsx
//
// SCAFFOLD — a home for cross-cutting app state that doesn't belong to any
// single screen (e.g. active task banner, offline/sync status, unread
// notification count). Currently empty; add fields as real cross-screen state
// needs come up rather than pre-building fields no screen uses yet.
import React, { createContext, useContext, useState } from 'react';

interface AppStateContextValue {
  isOffline: boolean;
  setIsOffline: (value: boolean) => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

  return (
    <AppStateContext.Provider value={{ isOffline, setIsOffline }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState() must be used within an <AppStateProvider>');
  return ctx;
}
