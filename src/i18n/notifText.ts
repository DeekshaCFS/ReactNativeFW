import i18n from 'i18next';
import EN_KEYS from './enKeys.json';
import type {NotificationSegment} from '../components/NotificationCard';

// Translates an English notification template such as
// "Task {{b_task}} is assign to you." and splits it into card segments.
// A "{{b_name}}" placeholder renders bold, "{{name}}" renders plain; the order of the
// placeholders comes from the translation, so languages with a different word order work.
export function nseg(english: string, vars: Record<string, string> = {}): NotificationSegment[] {
  const key = (EN_KEYS as Record<string, string>)[english];
  const raw =
    (key &&
      ((i18n.getResource(i18n.language, 'translation', key) as string | undefined) ??
        (i18n.getResource('en', 'translation', key) as string | undefined))) ||
    english;
  const out: NotificationSegment[] = [];
  raw.split(/(\{\{\w+\}\})/g).forEach(part => {
    if (!part) {
      return;
    }
    const m = /^\{\{(\w+)\}\}$/.exec(part);
    if (!m) {
      out.push({text: part});
      return;
    }
    const name = m[1];
    out.push({text: vars[name] ?? vars[name.replace(/^b_/, '')] ?? '', bold: name.startsWith('b_')});
  });
  return out;
}
