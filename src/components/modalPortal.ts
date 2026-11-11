// src/components/modalPortal.ts
//
// iPhone cannot show a second modal on top of one that is already open. A dropdown opened
// from inside a form sheet is therefore drawn inside that open modal (see AppModal) instead
// of being presented as a second modal.
import type { ReactNode } from 'react';
import { useSyncExternalStore } from 'react';

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

let nextModalId = 1;
let openModals: number[] = [];                 // visible AppModals, in opening order
let portals: Map<string, ReactNode> = new Map(); // dropdowns to draw inside the top modal

export const newModalId = () => nextModalId++;

export const setModalOpen = (id: number, open: boolean) => {
  const isOpen = openModals.includes(id);
  if (open === isOpen) return;
  openModals = open ? [...openModals, id] : openModals.filter(m => m !== id);
  emit();
};

export const getOpenModals = () => openModals;

export const setPortalEntry = (key: string, node: ReactNode | null) => {
  if (node === null && !portals.has(key)) return;
  const next = new Map(portals);
  if (node === null) next.delete(key);
  else next.set(key, node);
  portals = next;
  emit();
};

export const useOpenModals = () => useSyncExternalStore(subscribe, () => openModals);
export const usePortalEntries = () => useSyncExternalStore(subscribe, () => portals);