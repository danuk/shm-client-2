import { useState } from 'react';
import { config } from '../config';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';

const { isInsideTelegramWebApp } = useTelegramWebApp();
export const [isTelegramWebApp] = useState(isInsideTelegramWebApp);
export const hasTelegramWebAppAuth = isInsideTelegramWebApp && config.TELEGRAM_WEBAPP_AUTH_ENABLE === 'true';
export const hasTelegramWebAppAutoAuth = hasTelegramWebAppAuth && config.TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE === 'true';
export const hasTelegramWidget = !isInsideTelegramWebApp && !!config.TELEGRAM_BOT_NAME && config.TELEGRAM_BOT_AUTH_ENABLE === 'true';