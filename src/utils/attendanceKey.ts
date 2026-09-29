// src/utils/attendanceKey.ts
//
// AsyncStorage key that remembers "already checked in today" so Home doesn't hit the
// attendance API on every open. Must use the device's LOCAL date: the previous
// `new Date().toISOString().split('T')[0]` is the UTC date, which is still "yesterday"
// between local midnight and the UTC offset (00:00-05:30 in India), so a check-in from
// the previous evening suppressed the next morning's check-in prompt.

export const checkedInTodayKey = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `checked_in_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
