// src/utils/safeMessage.ts
// Makes any message safe to show users: no server addresses, paths or raw network text.

export const GENERIC_ERROR = 'Something went wrong. Please try again.';
export const NETWORK_ERROR =
  'Unable to reach the server. Please check your internet connection and try again.';

// Network-level failures (from axios, RNFS or the OS) never reach the user as-is.
const NETWORK_PATTERN =
  /(failed to connect|could not connect|unable to connect|unable to resolve|network request failed|network error|time ?out|econnrefused|econnreset|enotfound|etimedout|no address associated|no route to host|socket)/i;

// Anything that reveals where the app talks to.
const ADDRESS_PATTERNS: RegExp[] = [
  /https?:\/\/\S+/gi,                               // full URLs
  /\/API\/?\S*/gi,                                  // API path fragments
  /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/\S*)?/g,  // IPv4 address, optional port/path
  /\blocalhost(?::\d+)?(?:\/\S*)?/gi,               // localhost, optional port/path
];

export const sanitizeForUser = (input: unknown, fallback = GENERIC_ERROR): string => {
  const raw = String(input ?? '').trim();
  if (!raw) {
    return fallback;
  }

  if (NETWORK_PATTERN.test(raw)) {
    return NETWORK_ERROR;
  }

  let cleaned = raw;
  ADDRESS_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,!?:;])/g, '$1')
    .trim();

  // Nothing readable is left (for example just "to /" or punctuation).
  if (!/[a-z]{2,}/i.test(cleaned)) {
    return fallback;
  }
  return cleaned;
};