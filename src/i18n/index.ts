import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { config } from '../config';

import en from './locales/en.json';
import ru from './locales/ru.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import uz from './locales/uz.json';
import ar from './locales/ar.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  de: { translation: de },
  es: { translation: es },
  fr: { translation: fr },
  uz: { translation: uz },
  ar: { translation: ar },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: config.DEFAULT_LANGUAGE,
    supportedLngs: ['en', 'ru', 'de', 'es', 'fr', 'uz', 'ar'],

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