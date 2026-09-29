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

// Formats a numeric-ish value to a fixed number of decimals (default 3, same
// as Java's String.format("%.3f")). Non-numeric input renders as zero.
export const formatAmount = (
  value: unknown,
  decimals: number = AMOUNT_DECIMALS,
): string => {
  const num = typeof value === 'number' ? value : Number(value);
  return (Number.isFinite(num) ? num : 0).toFixed(decimals);
};
