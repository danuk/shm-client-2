interface AppConfig {
  APP_NAME: string;
  APP_DESCRIPTION: string;
  LOGO_URL: string;
  TELEGRAM_BOT_NAME: string;
  TELEGRAM_BOT_AUTH_ENABLE: string;
  TELEGRAM_OIDC_AUTH_ENABLE: string;
  TELEGRAM_BOT_AUTH_PROFILE: string;
  TELEGRAM_WEBAPP_AUTH_ENABLE: string;
  TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE: string;
  TELEGRAM_WEBAPP_PROFILE: string;
  SUPPORT_LINK: string;
  PRIVACY_POLICY_URL: string;
  RETURN_POLICY_URL: string;
  TERMS_OF_USE_URL: string;
  PUBLIC_OFFER_URL: string;
  USER_AGREEMENT_URL: string;
  DEFAULT_LANGUAGE: string;
  SINGLE_LANGUAGE: string;
  CUSTOM_LANGS: string;
  SHM_BASE_PATH: string;
  OTP_ENABLE: string;
  PASSKEY_ENABLE: string;
  PASSKEY_AUTH_DISABLED: string;
  BITRIX_WIDGET_SCRIPT_URL: string;
  PROXY_CATEGORY: string;
  PROXY_CATEGORY_TITLE: string;
  PROXY_STORAGE_PREFIX?: string;
  SHOW_PROXY_SUB_LINK: string;
  SHOW_HAPP_CRYPTOLINK: string;
  SHOW_PROXY_QR: string;
  VPN_CATEGORY: string;
  VPN_CATEGORY_TITLE: string;
  VPN_STORAGE_PREFIX?: string;
  VISIBLE_CATEGORIES: string;
  EMAIL_REQUIRED: string;
  EMAIL_VERIFY_REQUIRED: string;
  ALLOW_EMAIL_VERIFY: string;
  ALLOW_SERVICE_BLOCKED: string;
  ALLOW_SERVICE_DELETE: string;
  ALLOW_SERVICE_CHANGE: string;
  ALLOW_SERVICE_CHANGE_FORCE: string;
  SERVICE_CHANGE_ALL_CATEGORY: string;
  BLOCK_ORDER_IF_UNPAID: string;
  ALLOW_TELEGRAM_PIN: string;
  VPN_APP_WINDOWS_URL: string;
  VPN_APP_LINUX_URL: string;
  VPN_APP_MAC_URL: string;
  VPN_APP_IOS_URL: string;
  VPN_APP_ANDROID_URL: string;
  PROXY_APP_WINDOWS_URL: string;
  PROXY_APP_LINUX_URL: string;
  PROXY_APP_MAC_URL: string;
  PROXY_APP_IOS_URL: string;
  PROXY_APP_ANDROID_URL: string;
  VPN_WINDOWS_APP_NAME: string;
  VPN_LINUX_APP_NAME: string;
  VPN_MAC_APP_NAME: string;
  VPN_IOS_APP_NAME: string;
  VPN_ANDROID_APP_NAME: string;
  PROXY_WINDOWS_APP_NAME: string;
  PROXY_LINUX_APP_NAME: string;
  PROXY_MAC_APP_NAME: string;
  PROXY_IOS_APP_NAME: string;
  PROXY_ANDROID_APP_NAME: string;
  APPLE_TV_APP_NAME: string;
  ANDROID_TV_APP_NAME: string;
  WINDOWS_PROXY_URL_SCHEMA: string;
  LINUX_PROXY_URL_SCHEMA: string;
  MAC_PROXY_URL_SCHEMA: string;
  IOS_PROXY_URL_SCHEMA: string;
  ANDROID_PROXY_URL_SCHEMA: string;
  DEVICE_CONFIG_TEXT: string;
  CAPTCHA_ENABLED: string;
  ORDER_SORTING: string;
  CONTACT_EMAIL: string;
  CONTACT_PHONE: string;
  WEB_PUSH_ENABLE: string;
  VAPID_PUBLIC_KEY: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig;
  }
}

function getConfig(): AppConfig {
  const runtimeConfig = window.__APP_CONFIG__;

  return {
    APP_NAME: runtimeConfig?.APP_NAME || import.meta.env.VITE_APP_NAME || 'SHM Client',
    APP_DESCRIPTION: runtimeConfig?.APP_DESCRIPTION || import.meta.env.VITE_APP_DESCRIPTION || undefined,
    LOGO_URL: runtimeConfig?.LOGO_URL || import.meta.env.VITE_LOGO_URL || `${import.meta.env.BASE_URL}favicon.jpg`,
    TELEGRAM_BOT_NAME: runtimeConfig?.TELEGRAM_BOT_NAME || import.meta.env.VITE_TELEGRAM_BOT_NAME || undefined,
    TELEGRAM_BOT_AUTH_ENABLE: runtimeConfig?.TELEGRAM_BOT_AUTH_ENABLE || import.meta.env.VITE_TELEGRAM_BOT_AUTH_ENABLE || 'false',
    TELEGRAM_OIDC_AUTH_ENABLE: runtimeConfig?.TELEGRAM_OIDC_AUTH_ENABLE || import.meta.env.VITE_TELEGRAM_OIDC_AUTH_ENABLE || 'false',
    TELEGRAM_BOT_AUTH_PROFILE: runtimeConfig?.TELEGRAM_BOT_AUTH_PROFILE || import.meta.env.VITE_TELEGRAM_BOT_AUTH_PROFILE || 'telegram_bot',
    TELEGRAM_WEBAPP_AUTH_ENABLE: runtimeConfig?.TELEGRAM_WEBAPP_AUTH_ENABLE || import.meta.env.VITE_TELEGRAM_WEBAPP_AUTH_ENABLE || 'false',
    TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE: runtimeConfig?.TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE || import.meta.env.VITE_TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE || 'false',
    TELEGRAM_WEBAPP_PROFILE: runtimeConfig?.TELEGRAM_WEBAPP_PROFILE || import.meta.env.VITE_TELEGRAM_WEBAPP_PROFILE || undefined,
    SUPPORT_LINK: runtimeConfig?.SUPPORT_LINK || import.meta.env.VITE_SUPPORT_LINK || undefined,
    PRIVACY_POLICY_URL: runtimeConfig?.PRIVACY_POLICY_URL || import.meta.env.VITE_PRIVACY_POLICY_URL || undefined,
    RETURN_POLICY_URL: runtimeConfig?.RETURN_POLICY_URL || import.meta.env.VITE_RETURN_POLICY_URL || undefined,
    TERMS_OF_USE_URL: runtimeConfig?.TERMS_OF_USE_URL || import.meta.env.VITE_TERMS_OF_USE_URL || undefined,
    PUBLIC_OFFER_URL: runtimeConfig?.PUBLIC_OFFER_URL || import.meta.env.VITE_PUBLIC_OFFER_URL || undefined,
    USER_AGREEMENT_URL: runtimeConfig?.USER_AGREEMENT_URL || import.meta.env.VITE_USER_AGREEMENT_URL || undefined,
    DEFAULT_LANGUAGE: runtimeConfig?.DEFAULT_LANGUAGE || import.meta.env.VITE_DEFAULT_LANGUAGE || 'ru',
    SINGLE_LANGUAGE: runtimeConfig?.SINGLE_LANGUAGE || import.meta.env.VITE_SINGLE_LANGUAGE || undefined,
    CUSTOM_LANGS: runtimeConfig?.CUSTOM_LANGS || import.meta.env.VITE_CUSTOM_LANGS || '',
    SHM_BASE_PATH: runtimeConfig?.SHM_BASE_PATH || import.meta.env.VITE_SHM_BASE_PATH || '/',
    OTP_ENABLE: runtimeConfig?.OTP_ENABLE || import.meta.env.VITE_OTP_ENABLE || 'true',
    PASSKEY_ENABLE: runtimeConfig?.PASSKEY_ENABLE || import.meta.env.VITE_PASSKEY_ENABLE || 'true',
    PASSKEY_AUTH_DISABLED: runtimeConfig?.PASSKEY_AUTH_DISABLED || import.meta.env.VITE_PASSKEY_AUTH_DISABLED || 'false',
    BITRIX_WIDGET_SCRIPT_URL: runtimeConfig?.BITRIX_WIDGET_SCRIPT_URL || import.meta.env.VITE_BITRIX_WIDGET_SCRIPT_URL || undefined,
    PROXY_CATEGORY: runtimeConfig?.PROXY_CATEGORY || import.meta.env.VITE_PROXY_CATEGORY || undefined,
    PROXY_CATEGORY_TITLE: runtimeConfig?.PROXY_CATEGORY_TITLE || import.meta.env.VITE_PROXY_CATEGORY_TITLE || undefined,
    PROXY_STORAGE_PREFIX: runtimeConfig?.PROXY_STORAGE_PREFIX || import.meta.env.VITE_PROXY_STORAGE_PREFIX || undefined,
    SHOW_PROXY_SUB_LINK: runtimeConfig?.SHOW_PROXY_SUB_LINK || import.meta.env.VITE_SHOW_PROXY_SUB_LINK || 'true',
    SHOW_HAPP_CRYPTOLINK: runtimeConfig?.SHOW_HAPP_CRYPTOLINK || import.meta.env.VITE_SHOW_HAPP_CRYPTOLINK || 'false',
    SHOW_PROXY_QR: runtimeConfig?.SHOW_PROXY_QR || import.meta.env.VITE_SHOW_PROXY_QR || 'true',
    VPN_CATEGORY: runtimeConfig?.VPN_CATEGORY || import.meta.env.VITE_VPN_CATEGORY || undefined,
    VPN_CATEGORY_TITLE: runtimeConfig?.VPN_CATEGORY_TITLE || import.meta.env.VITE_VPN_CATEGORY_TITLE|| undefined,
    VPN_STORAGE_PREFIX: runtimeConfig?.VPN_STORAGE_PREFIX || import.meta.env.VITE_VPN_STORAGE_PREFIX || undefined,
    VISIBLE_CATEGORIES: runtimeConfig?.VISIBLE_CATEGORIES || import.meta.env.VITE_VISIBLE_CATEGORIES || undefined,
    ORDER_SORTING: runtimeConfig?.ORDER_SORTING || import.meta.env.VITE_ORDER_SORTING || 'cost_asc',
    EMAIL_REQUIRED: runtimeConfig?.EMAIL_REQUIRED || import.meta.env.VITE_EMAIL_REQUIRED || 'false',
    EMAIL_VERIFY_REQUIRED: runtimeConfig?.EMAIL_VERIFY_REQUIRED || import.meta.env.VITE_EMAIL_VERIFY_REQUIRED || 'false',
    ALLOW_EMAIL_VERIFY: runtimeConfig?.ALLOW_EMAIL_VERIFY || import.meta.env.VITE_ALLOW_EMAIL_VERIFY || 'false',
    ALLOW_SERVICE_BLOCKED: runtimeConfig?.ALLOW_SERVICE_BLOCKED || import.meta.env.VITE_ALLOW_SERVICE_BLOCKED || 'true',
    ALLOW_SERVICE_DELETE: runtimeConfig?.ALLOW_SERVICE_DELETE || import.meta.env.VITE_ALLOW_SERVICE_DELETE || 'true',
    ALLOW_SERVICE_CHANGE: runtimeConfig?.ALLOW_SERVICE_CHANGE || import.meta.env.VITE_ALLOW_SERVICE_CHANGE || 'true',
    ALLOW_SERVICE_CHANGE_FORCE: runtimeConfig?.ALLOW_SERVICE_CHANGE_FORCE || import.meta.env.VITE_ALLOW_SERVICE_CHANGE_FORCE || 'false',
    SERVICE_CHANGE_ALL_CATEGORY: runtimeConfig?.SERVICE_CHANGE_ALL_CATEGORY || import.meta.env.VITE_SERVICE_CHANGE_ALL_CATEGORY || 'true',
    BLOCK_ORDER_IF_UNPAID: runtimeConfig?.BLOCK_ORDER_IF_UNPAID || import.meta.env.VITE_BLOCK_ORDER_IF_UNPAID || 'false',
    ALLOW_TELEGRAM_PIN: runtimeConfig?.ALLOW_TELEGRAM_PIN || import.meta.env.VITE_ALLOW_TELEGRAM_PIN || 'false',
    VPN_APP_WINDOWS_URL: runtimeConfig?.VPN_APP_WINDOWS_URL || import.meta.env.VITE_VPN_APP_WINDOWS_URL || undefined,
    VPN_APP_LINUX_URL: runtimeConfig?.VPN_APP_LINUX_URL || import.meta.env.VITE_VPN_APP_LINUX_URL || undefined,
    VPN_APP_MAC_URL: runtimeConfig?.VPN_APP_MAC_URL || import.meta.env.VITE_VPN_APP_MAC_URL || undefined,
    VPN_APP_IOS_URL: runtimeConfig?.VPN_APP_IOS_URL || import.meta.env.VITE_VPN_APP_IOS_URL || undefined,
    VPN_APP_ANDROID_URL: runtimeConfig?.VPN_APP_ANDROID_URL || import.meta.env.VITE_VPN_APP_ANDROID_URL || undefined,
    PROXY_APP_WINDOWS_URL: runtimeConfig?.PROXY_APP_WINDOWS_URL || import.meta.env.VITE_PROXY_APP_WINDOWS_URL || undefined,
    PROXY_APP_LINUX_URL: runtimeConfig?.PROXY_APP_LINUX_URL || import.meta.env.VITE_PROXY_APP_LINUX_URL || undefined,
    PROXY_APP_MAC_URL: runtimeConfig?.PROXY_APP_MAC_URL || import.meta.env.VITE_PROXY_APP_MAC_URL || undefined,
    PROXY_APP_IOS_URL: runtimeConfig?.PROXY_APP_IOS_URL || import.meta.env.VITE_PROXY_APP_IOS_URL || undefined,
    PROXY_APP_ANDROID_URL: runtimeConfig?.PROXY_APP_ANDROID_URL || import.meta.env.VITE_PROXY_APP_ANDROID_URL || undefined,
    VPN_WINDOWS_APP_NAME: runtimeConfig?.VPN_WINDOWS_APP_NAME || import.meta.env.VITE_VPN_WINDOWS_APP_NAME || 'Скачать',
    VPN_LINUX_APP_NAME: runtimeConfig?.VPN_LINUX_APP_NAME || import.meta.env.VITE_VPN_LINUX_APP_NAME || 'Скачать',
    VPN_MAC_APP_NAME: runtimeConfig?.VPN_MAC_APP_NAME || import.meta.env.VITE_VPN_MAC_APP_NAME || 'Скачать',
    VPN_IOS_APP_NAME: runtimeConfig?.VPN_IOS_APP_NAME || import.meta.env.VITE_VPN_IOS_APP_NAME || 'Скачать',
    VPN_ANDROID_APP_NAME: runtimeConfig?.VPN_ANDROID_APP_NAME || import.meta.env.VITE_VPN_ANDROID_APP_NAME || 'Скачать',
    PROXY_WINDOWS_APP_NAME: runtimeConfig?.PROXY_WINDOWS_APP_NAME || import.meta.env.VITE_PROXY_WINDOWS_APP_NAME || 'Скачать',
    PROXY_LINUX_APP_NAME: runtimeConfig?.PROXY_LINUX_APP_NAME || import.meta.env.VITE_PROXY_LINUX_APP_NAME || 'Скачать',
    PROXY_MAC_APP_NAME: runtimeConfig?.PROXY_MAC_APP_NAME || import.meta.env.VITE_PROXY_MAC_APP_NAME || 'Скачать',
    PROXY_IOS_APP_NAME: runtimeConfig?.PROXY_IOS_APP_NAME || import.meta.env.VITE_PROXY_IOS_APP_NAME || 'Скачать',
    PROXY_ANDROID_APP_NAME: runtimeConfig?.PROXY_ANDROID_APP_NAME || import.meta.env.VITE_PROXY_ANDROID_APP_NAME || 'Скачать',
    APPLE_TV_APP_NAME: runtimeConfig?.APPLE_TV_APP_NAME || import.meta.env.VITE_APPLE_TV_APP_NAME || 'Скачать',
    ANDROID_TV_APP_NAME: runtimeConfig?.ANDROID_TV_APP_NAME || import.meta.env.VITE_ANDROID_TV_APP_NAME || 'Скачать',
    WINDOWS_PROXY_URL_SCHEMA: runtimeConfig?.WINDOWS_PROXY_URL_SCHEMA || import.meta.env.VITE_WINDOWS_PROXY_URL_SCHEMA || undefined,
    LINUX_PROXY_URL_SCHEMA: runtimeConfig?.LINUX_PROXY_URL_SCHEMA || import.meta.env.VITE_LINUX_PROXY_URL_SCHEMA || undefined,
    MAC_PROXY_URL_SCHEMA: runtimeConfig?.MAC_PROXY_URL_SCHEMA || import.meta.env.VITE_MAC_PROXY_URL_SCHEMA || undefined,
    IOS_PROXY_URL_SCHEMA: runtimeConfig?.IOS_PROXY_URL_SCHEMA || import.meta.env.VITE_IOS_PROXY_URL_SCHEMA || undefined,
    ANDROID_PROXY_URL_SCHEMA: runtimeConfig?.ANDROID_PROXY_URL_SCHEMA || import.meta.env.VITE_ANDROID_PROXY_URL_SCHEMA || undefined,
    DEVICE_CONFIG_TEXT: runtimeConfig?.DEVICE_CONFIG_TEXT || import.meta.env.VITE_DEVICE_CONFIG_TEXT || undefined,
    CAPTCHA_ENABLED: runtimeConfig?.CAPTCHA_ENABLED || import.meta.env.VITE_CAPTCHA_ENABLED || 'false',
    CONTACT_EMAIL: runtimeConfig?.CONTACT_EMAIL || import.meta.env.VITE_CONTACT_EMAIL || undefined,
    CONTACT_PHONE: runtimeConfig?.CONTACT_PHONE || import.meta.env.VITE_CONTACT_PHONE || undefined,
    WEB_PUSH_ENABLE: runtimeConfig?.WEB_PUSH_ENABLE || import.meta.env.VITE_WEB_PUSH_ENABLE || 'false',
    VAPID_PUBLIC_KEY: runtimeConfig?.VAPID_PUBLIC_KEY || import.meta.env.VITE_VAPID_PUBLIC_KEY || undefined,
  };
}

export const config = getConfig();
