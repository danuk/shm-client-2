import { config } from '../config';
import { isInsideTelegramWebApp } from '../hooks/useTelegramWebApp';

const isWebApp = isInsideTelegramWebApp();
export const isTelegramWebApp = isWebApp;
export const hasTelegramWebAppAuth = isWebApp && config.TELEGRAM_WEBAPP_AUTH_ENABLE === 'true';
export const hasTelegramWebAppAutoAuth = hasTelegramWebAppAuth && config.TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE === 'true';
export const hasTelegramOidcAuth = !isWebApp && config.TELEGRAM_OIDC_AUTH_ENABLE === 'true';
export const hasTelegramWidget = !isWebApp && !!config.TELEGRAM_BOT_NAME && config.TELEGRAM_BOT_AUTH_ENABLE === 'true';