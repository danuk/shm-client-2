import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { config } from '../config';

export const BUILT_IN_LANGS = ['en', 'ru', 'de', 'es', 'fr', 'uz', 'ar'];

export const CUSTOM_LANGS: string[] = config.CUSTOM_LANGS
  ? config.CUSTOM_LANGS.split(',').map(s => s.trim()).filter(Boolean)
  : [];

const allLangs = [...BUILT_IN_LANGS, ...CUSTOM_LANGS];

const isSingleLanguage = config.SINGLE_LANGUAGE === 'true';
const savedLanguage = localStorage.getItem('shm_language');

const activeLangs = isSingleLanguage
  ? [config.DEFAULT_LANGUAGE || 'en']
  : allLangs;

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}.json`,
    },
    lng: isSingleLanguage
      ? config.DEFAULT_LANGUAGE
      : (!savedLanguage && config.DEFAULT_LANGUAGE ? config.DEFAULT_LANGUAGE : undefined),
    fallbackLng: config.DEFAULT_LANGUAGE || 'en',
    supportedLngs: activeLangs,
    preload: activeLangs,

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'shm_language',
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
