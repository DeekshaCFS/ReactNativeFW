// Hides raw network errors (which can include server addresses) from users.
const RAW_ERROR_PATTERN =
  /(https?:\/\/|\b\d{1,3}(\.\d{1,3}){3}\b|:\d{2,5}\b|failed to connect|unable to resolve|network request failed|timeout|econnrefused|enotfound)/i;

export const toUserMessage = (error: unknown, fallback: string): string => {
  const raw =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';

  if (__DEV__ && raw) {
    console.warn('[UserError]', raw);
  }

  if (!raw.trim()) {
    return fallback;
  }

  return RAW_ERROR_PATTERN.test(raw) ? fallback : raw;
};