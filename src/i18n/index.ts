import AsyncStorage from '@react-native-async-storage/async-storage';
import {I18nManager} from 'react-native';
import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import pa from './locales/pa.json';
import bn from './locales/bn.json';
import mr from './locales/mr.json';
import kn from './locales/kn.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import ml from './locales/ml.json';
import ar from './locales/ar.json';
import {LANGUAGES, type LanguageCode} from './languages';

export type {LanguageCode} from './languages';

// Mirrors Java's SharedPrefManager preferred-language key.
const STORAGE_KEY = 'preferredLanguage';

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {translation: en},
    hi: {translation: hi},
    pa: {translation: pa},
    bn: {translation: bn},
    mr: {translation: mr},
    kn: {translation: kn},
    ta: {translation: ta},
    te: {translation: te},
    ml: {translation: ml},
    ar: {translation: ar},
  },
  interpolation: {escapeValue: false},
});

export async function loadStoredLanguage(): Promise<void> {
  const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as LanguageCode | null;
  const code = stored && LANGUAGES.some(l => l.code === stored) ? stored : 'en';
  await i18n.changeLanguage(code);
  applyRTL(code);
}

// Java's LocaleUtils.setLocale flips layout direction for Arabic via
// Configuration.setLayoutDirection, which Android applies by recreating the
// activity. RN's equivalent (I18nManager.forceRTL) only takes effect after
// the next full app launch -- there's no JS-level restart wired up here, so
// the mirrored layout applies on next cold start rather than immediately.
function applyRTL(code: LanguageCode) {
  const isRTL = LANGUAGES.find(l => l.code === code)?.rtl ?? false;
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }
}

export async function setAppLanguage(code: LanguageCode): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, code);
  await i18n.changeLanguage(code);
  applyRTL(code);
}

export default i18n;
