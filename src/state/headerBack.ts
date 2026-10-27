// src/state/headerBack.ts
//
// Lets a screen that swaps its own content in place (e.g. Item Inventory detail -> Issued details)
// turn the shared AppHeader's hamburger into a back arrow. Android has the hardware back button;
// iOS has nothing, so the header needs its own way back. The screen registers a handler while a
// sub-view is open and clears it when it closes / unmounts.

import { useSyncExternalStore } from 'react';

let handler: (() => void) | null = null;
const listeners = new Set<() => void>();

export const setHeaderBack = (next: (() => void) | null) => {
  if (next !== handler) {
    handler = next;
    listeners.forEach(l => l());
  }
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const useHeaderBack = () => useSyncExternalStore(subscribe, () => handler);
