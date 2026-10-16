import i18n from 'i18next';
import EN_KEYS from './enKeys.json';

// Translates a hardcoded English UI label (tab names, screen titles) using the
// Java string it came from. Unknown text passes through unchanged. Callers must
// re-render on language change (useTranslation()).
export function tr(text: string): string {
  const key = (EN_KEYS as Record<string, string>)[text];
  return key ? i18n.t(key) : text;
}
