// src/utils/timeFormat.ts
//
// Shared time formatting for add / edit sheets and modals. Java and the API
// send times in several shapes ("14:20:17.0000000", "14:20", "2:20 PM",
// "2026-11-05T14:20:17"); the app always shows and submits "HH:MM:SS".

const pad2 = (value: number) => String(value).padStart(2, '0');

/**
 * Converts a time value to "HH:MM:SS". Fractional seconds (".0000000") are
 * dropped, a missing seconds part becomes "00", and 12-hour values with
 * AM/PM are converted to 24-hour. A leading date part is ignored.
 * Values that can't be read as a time are returned trimmed, unchanged.
 */
export const formatTimeHHMMSS = (value: unknown): string => {
  const text = String(value ?? '')
    .trim()
    .replace(/^\d{4}-\d{2}-\d{2}[T\s]/, '');
  if (!text) {
    return '';
  }

  const match = text.match(
    /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(?:\.\d+)?\s*([AaPp][Mm])?$/,
  );
  if (!match) {
    return text;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] !== undefined ? Number(match[3]) : 0;
  const period = match[4]?.toUpperCase();

  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  if (hours > 23 || minutes > 59 || seconds > 59) {
    return text;
  }

  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
};