import { useState, useEffect } from 'react';
import i18n from '../i18n';

const STORAGE_KEY = 'isInsideTelegramWebApp';
const SUPPORTED_LANGUAGES = ['ru', 'en'];
const DEFAULT_LANGUAGE = 'ru';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            language_code?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
      };
    };
  }
}

function checkIsInsideTelegramWebApp(): boolean {
  const tgWebApp = window.Telegram?.WebApp;
  return !!(tgWebApp && (
    (tgWebApp.initData && tgWebApp.initData.length > 0) ||
    tgWebApp.initDataUnsafe?.user?.id
  ));
}

function getStoredValue(): boolean | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
  } catch {
  }
  return null;
}

function setStoredValue(value: boolean): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(value));
  } catch {
  }
}

function setLanguageFromTelegram(): void {
  const tgWebApp = window.Telegram?.WebApp;
  const languageCode = tgWebApp?.initDataUnsafe?.user?.language_code;

  if (languageCode) {
    const lang = SUPPORTED_LANGUAGES.includes(languageCode) ? languageCode : DEFAULT_LANGUAGE;

    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }
}

export function useTelegramWebApp() {
  const [isInsideTelegramWebApp, setIsInsideTelegramWebApp] = useState<boolean>(() => {
    const cached = getStoredValue();
    if (cached !== null) {
      return cached;
    }
    return checkIsInsideTelegramWebApp();
  });

  useEffect(() => {
    const checkAndStore = () => {
      const isInside = checkIsInsideTelegramWebApp();
      setIsInsideTelegramWebApp(isInside);
      setStoredValue(isInside);

      if (isInside) {
        setLanguageFromTelegram();
      }
    };
    checkAndStore();
    const timer = setTimeout(checkAndStore, 100);
    return () => clearTimeout(timer);
  }, []);

  return {
    isInsideTelegramWebApp,
    telegramWebApp: window.Telegram?.WebApp || null,
  };
}

export function isInsideTelegramWebApp(): boolean {
  const cached = getStoredValue();
  if (cached !== null) {
    return cached;
  }
  return checkIsInsideTelegramWebApp();
}
