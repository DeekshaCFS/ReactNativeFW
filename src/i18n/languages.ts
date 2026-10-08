// Order and native-script names match Java's UserDialog.changeLanguageDialog
// language list exactly. These display names are never translated by locale
// (Java always shows each language in its own script regardless of the
// currently selected app language).
export type LanguageCode = 'en' | 'hi' | 'pa' | 'bn' | 'mr' | 'kn' | 'ta' | 'te' | 'ml' | 'ar';

export type Language = {
  code: LanguageCode;
  label: string;
  rtl?: boolean;
};

export const LANGUAGES: Language[] = [
  {code: 'en', label: 'English'},
  {code: 'hi', label: 'हिन्दी'},
  {code: 'pa', label: 'ਪੰਜਾਬੀ'},
  {code: 'bn', label: 'বাংলা'},
  {code: 'mr', label: 'मराठी'},
  {code: 'kn', label: 'ಕನ್ನಡ'},
  {code: 'ta', label: 'தமிழ்'},
  {code: 'te', label: 'తెలుగు'},
  {code: 'ml', label: 'മലയാളം'},
  {code: 'ar', label: 'عربي', rtl: true},
];
