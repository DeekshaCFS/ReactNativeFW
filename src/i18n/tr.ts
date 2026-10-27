import i18n from 'i18next';
import EN_KEYS from './enKeys.json';

// Translates a hardcoded English UI label (tab names, screen titles) using the
// Java string it came from. Unknown text passes through unchanged. Callers must
// re-render on language change (useTranslation()).
export function tr(text: string): string {
  const key = (EN_KEYS as Record<string, string>)[text];
  return key ? i18n.t(key) : text;
}

// Same as tr() for templates with {{placeholders}} (see the rn_* keys in the locale files).
export function trf(text: string, vars: Record<string, string | number | undefined | null>): string {
  const key = (EN_KEYS as Record<string, string>)[text];
  if (key) {
    return i18n.t(key, vars as Record<string, string | number>);
  }
  return text.replace(/\{\{(\w+)\}\}/g, (_m, name) => String(vars[name] ?? ''));
}
