// Amount handling shared across screens. The Java app (v4.6.7) moved every
// money field (amounts, prices, wages, tax/discount %) from int to double:
// inputs accept up to 3 decimal places and values are displayed with "%.3f".

export const AMOUNT_DECIMALS = 3;

// Keeps only digits and a single '.', and trims the fraction to `maxDecimals`.
// Use as a TextInput onChangeText filter for amount fields.
export const sanitizeDecimalInput = (
  text: string,
  maxDecimals: number = AMOUNT_DECIMALS,
): string => {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) {
    return cleaned;
  }
  const whole = cleaned.slice(0, dot);
  const fraction = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, maxDecimals);
  return `${whole}.${fraction}`;
};

// Decimals allowed after a whole part. With maxTotalDigits the decimal point counts too, so
// whole + '.' + decimals never exceeds maxTotalDigits characters (10 -> "1234567.89").
export const decimalsAfterWhole = (
  whole: string,
  maxTotalDigits?: number,
  decimals: number = AMOUNT_DECIMALS,
): number =>
  maxTotalDigits
    ? Math.max(0, Math.min(decimals, maxTotalDigits - whole.length - 1))
    : decimals;

// Filters amount typing: digits and one '.', whole part capped at maxIntDigits, and the
// total (point included) capped at maxTotalDigits. Use as the onChangeText filter.
export const limitDecimalInput = (
  text: string,
  opts: {maxTotalDigits?: number; maxIntDigits?: number; decimals?: number} = {},
): string => {
  const {maxTotalDigits, decimals = AMOUNT_DECIMALS} = opts;
  // Whole digits default to the total limit (10 digits with no point), else 9.
  const maxIntDigits = opts.maxIntDigits ?? maxTotalDigits ?? 9;
  const clean = sanitizeDecimalInput(text, decimals);
  const [whole, frac] = clean.split('.');
  const capped = whole.length > maxIntDigits ? whole.slice(0, maxIntDigits) : whole;
  const fracAllowed = decimalsAfterWhole(capped, maxTotalDigits, decimals);
  if (frac === undefined || fracAllowed === 0) return capped;
  return `${capped}.${frac.slice(0, fracAllowed)}`;
};

// Formats a numeric-ish value to a fixed number of decimals (default 3, same
// as Java's String.format("%.3f")). Non-numeric input renders as zero.
export const formatAmount = (
  value: unknown,
  decimals: number = AMOUNT_DECIMALS,
): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return (Number.isFinite(num) ? num : 0).toFixed(decimals);
};