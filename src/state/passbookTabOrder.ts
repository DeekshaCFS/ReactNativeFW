// src/state/passbookTabOrder.ts
//
// Java's PassbookExpenditureTabHost orders its two tabs by how it was opened:
//  - Passbook bottom tab  -> [Passbook | Expenditure]  (HomeActivityNew sets fromPassbook = "Tech_Passbook")
//  - drawer "Expenditure" -> [Expenditure | Passbook]
// and the order stays fixed while the user switches between the two (it's one ViewPager).
// Here Passbook and Expenditure are separate screens, so the entry point records the order
// and both screens render their tab row from it.

import { useSyncExternalStore } from 'react';

export type PassbookTabOrder = 'passbookFirst' | 'expenditureFirst';

let order: PassbookTabOrder = 'passbookFirst';
const listeners = new Set<() => void>();

export const setPassbookTabOrder = (next: PassbookTabOrder) => {
  if (next !== order) {
    order = next;
    listeners.forEach(l => l());
  }
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export const usePassbookTabOrder = (): PassbookTabOrder =>
  useSyncExternalStore(subscribe, () => order);
