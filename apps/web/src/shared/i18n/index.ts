import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ko } from './locales/ko';
import { en } from './locales/en';

export type SupportedLocale = 'ko' | 'en';

export const LOCALE_STORAGE_KEY = 'my-space:locale';

export function getSavedLocale(): SupportedLocale {
  if (typeof window === 'undefined') {
    return 'ko';
  }
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'ko' || saved === 'en') {
      return saved;
    }
  } catch {
    // Ignore storage access errors
  }
  return 'ko';
}

export function syncDocumentLang(locale: SupportedLocale): void {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = locale;
  }
}

export async function setAppLanguage(locale: SupportedLocale): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Ignore storage write errors
    }
  }
  syncDocumentLang(locale);
  await i18n.changeLanguage(locale);
}

const initialLocale = getSavedLocale();
syncDocumentLang(initialLocale);

void i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
  },
  lng: initialLocale,
  fallbackLng: 'ko',
  interpolation: {
    escapeValue: false,
  },
});

export { i18n, ko, en };
export default i18n;
