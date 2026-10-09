// src/hooks/usePassbook.ts
//
// Java HomePassbookFragmentNew data + Today / Monthly / Yearly navigation, shared by the
// technician and admin Passbook screens. Today/Monthly/Yearly each hit a different endpoint;
// the field mapping mirrors the Java fragment including its quirks (e.g. Yearly's "Credit
// Given" and "Remaining Amount" both read TotalOpening). Monthly/Yearly open the month/year
// picker; the carets then step a month/year but never past the current one.

import {useCallback, useEffect, useState} from 'react';
import {
  getMonthlyPassbook,
  getTodayPassbook,
  getYearlyPassbook,
} from '../api/passbook/passbookService';
import type {PassbookFields, PassbookPeriod} from '../components/PassbookSummary';

// Java: DateUtils.getMonthName() — new DateFormatSymbols(ENGLISH).getShortMonths().
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EMPTY_FIELDS: PassbookFields = {
  estimated: 0,
  credit: 0,
  expenses: 0,
  received: 0,
  remaining: 0,
  earnings: 0,
};

export function usePassbook(userId: number | null | undefined) {
  const [period, setPeriod] = useState<PassbookPeriod>('today');
  const [refDate, setRefDate] = useState(() => new Date());
  const [fields, setFields] = useState<PassbookFields>(EMPTY_FIELDS);
  const [loading, setLoading] = useState(false);
  // Java (btnMonthYear/btnYear): switching to Monthly/Yearly always opens the
  // month/year dialog rather than assuming the current month/year.
  const [pickerFor, setPickerFor] = useState<'monthly' | 'yearly' | null>(null);

  const load = useCallback(
    async (p: PassbookPeriod, date: Date) => {
      if (!userId) {
        return;
      }
      setLoading(true);
      try {
        if (p === 'today') {
          const res = await getTodayPassbook({UserId: userId});
          const d = res?.ResultData;
          // Java: txtEstimatedEarning and txtEarnings both read EarningAmount here.
          setFields({
            estimated: d?.EarningAmount ?? 0,
            credit: d?.Credit ?? 0,
            expenses: d?.Expenses ?? 0,
            received: d?.Return ?? 0,
            remaining: d?.Balance ?? 0,
            earnings: d?.EarningAmount ?? 0,
          });
        } else if (p === 'monthly') {
          const month = date.getMonth();
          const year = date.getFullYear();
          const res = await getMonthlyPassbook({UserId: userId, PassbookMonth: month + 1, PassbookYear: year});
          const d = res?.ResultData;
          const monthName = MONTHS[month];
          // API scopes MonthlyALlDataList to the requested year via PassbookMonth/PassbookYear
          // already, and its per-row Year field comes back blank -- match on Month name alone.
          const row = d?.MonthlyALlDataList?.find(item => item.Month?.includes(monthName));
          setFields({
            estimated: row?.Estimated ?? 0,
            credit: d?.TotalCredit ?? 0,
            expenses: row?.Expenses ?? 0,
            received: d?.TotalDeduction ?? 0,
            remaining: d?.TotalOpening ?? 0,
            earnings: row?.Earning ?? 0,
          });
        } else {
          const year = date.getFullYear();
          const res = await getYearlyPassbook({UserId: userId, PassbookYear: year});
          const d = res?.ResultData;
          // Java: Credit Given and Remaining Amount both read TotalOpening for Yearly.
          setFields({
            estimated: d?.TotalEstimated ?? 0,
            credit: d?.TotalOpening ?? 0,
            expenses: d?.TotalExpenses ?? 0,
            received: d?.TotalDeduction ?? 0,
            remaining: d?.TotalOpening ?? 0,
            earnings: d?.TotalEarned ?? 0,
          });
        }
      } catch {
        setFields(EMPTY_FIELDS);
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  // Any change of period / month / year (or user) reloads the data.
  useEffect(() => {
    load(period, refDate);
  }, [load, period, refDate]);

  /** Reload whatever period/date is currently selected (focus, tab re-press). */
  const reload = useCallback(() => load(period, refDate), [load, period, refDate]);

  const selectPeriod = (p: PassbookPeriod) => {
    if (p === 'today') {
      setPeriod(p);
      const now = new Date();
      setRefDate(now);
      return;
    }
    setPickerFor(p);
  };

  const confirmPicker = (month: number, year: number) => {
    if (!pickerFor) {
      return;
    }
    const next = new Date(year, pickerFor === 'monthly' ? month : 0, 1);
    setPeriod(pickerFor);
    setRefDate(next);
    setPickerFor(null);
  };

  // The carets can't move past the current month (Monthly) or current year (Yearly).
  const now = new Date();
  const forwardBlocked =
    (period === 'yearly' && refDate.getFullYear() >= now.getFullYear()) ||
    (period === 'monthly' &&
      refDate.getFullYear() * 12 + refDate.getMonth() >= now.getFullYear() * 12 + now.getMonth());

  const shift = (delta: number) => {
    if (period === 'today') {
      return;
    }
    if (delta > 0 && forwardBlocked) {
      return;
    }
    const next = new Date(refDate);
    if (period === 'monthly') {
      next.setMonth(next.getMonth() + delta);
    } else {
      next.setFullYear(next.getFullYear() + delta);
    }
    setRefDate(next);
  };

  const title =
    period === 'today'
      ? "Today's Earnings"
      : period === 'monthly'
        ? `${MONTHS[refDate.getMonth()]} ${refDate.getFullYear()}'s Earnings`
        : `${refDate.getFullYear()}'s Earnings`;

  return {
    period,
    refDate,
    fields,
    loading,
    title,
    forwardBlocked,
    pickerFor,
    cancelPicker: () => setPickerFor(null),
    selectPeriod,
    confirmPicker,
    shift,
    reload,
  };
}
