#!/bin/sh

# Если задан VITE_HOST - заменяем статическую обслужку на проксирование к Vite
if [ ! -z "$VITE_HOST" ]; then
    echo "Development mode: proxying to Vite server at $VITE_HOST:5173"

    # Заменяем статическое обслуживание на проксирование к Vite
    sed -i "s|        alias /app/;|        proxy_pass http://$VITE_HOST:5173/;|" /etc/nginx/conf.d/default.conf
    sed -i "s|        try_files \$uri \$uri/ /index.html;|        proxy_http_version 1.1;\\
        proxy_set_header Upgrade \$http_upgrade;\\
        proxy_set_header Connection 'upgrade';\\
        proxy_set_header Host \$host;\\
        proxy_set_header X-Real-IP \$remote_addr;\\
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\\
        proxy_set_header X-Forwarded-Proto \$scheme;\\
        proxy_cache_bypass \$http_upgrade;|" /etc/nginx/conf.d/default.conf

    # Добавляем специальные locations для Vite ресурсов ПЕРЕД основным location /
    sed -i "/location \/ {/i\\
    # Vite special resources\\
    location ~ ^/@(vite|react-refresh) {\\
        proxy_pass http://$VITE_HOST:5173;\\
        proxy_http_version 1.1;\\
        proxy_set_header Upgrade \$http_upgrade;\\
        proxy_set_header Connection 'upgrade';\\
        proxy_set_header Host \$host;\\
        proxy_cache_bypass \$http_upgrade;\\
    }\\
\\
    location ~ ^/src/ {\\
        proxy_pass http://$VITE_HOST:5173;\\
        proxy_http_version 1.1;\\
        proxy_set_header Host \$host;\\
    }\\
" /etc/nginx/conf.d/default.conf
fi

PROXY_URL=""
if [ ! -z "$SHM_URL" ]; then
    PROXY_URL="$SHM_URL"
elif [ ! -z "$SHM_HOST" ]; then
    PROXY_URL="$SHM_HOST"
fi

if [ ! -z "$PROXY_URL" ]; then
    sed -i "s|#SHM_URL|$PROXY_URL|" /etc/nginx/conf.d/default.conf
fi

if [ ! -z "$SHM_BASE_PATH" ] && [ "$SHM_BASE_PATH" != "/" ]; then
    sed -i "s|#BASE_LOCATION|location $SHM_BASE_PATH/ {\n        alias /app/;\n        try_files \$uri \$uri/ /index.html;\n    }|" /etc/nginx/conf.d/default.conf
    sed -i "s|href=\"/\"|href=\"${SHM_BASE_PATH}/\"|" /app/index.html
    sed -i "s|#proxy_cookie_path;|proxy_cookie_path / $SHM_BASE_PATH;|" /etc/nginx/conf.d/default.conf
fi

if [ ! -z "$LOGO_URL" ]; then
    sed -i "s|<link rel=\"icon\" type=\"image/svg+xml\" href=\".*\" />|<link rel=\"icon\" type=\"image/svg+xml\" href=\"${LOGO_URL}\" />|" /app/index.html
    sed -i "s|<meta property=\"og:image\" content=\".*\" />|<meta property=\"og:image\" content=\"${LOGO_URL}\" />|" /app/index.html
fi

if [ ! -z "$APP_NAME" ]; then
    sed -i "s|<title>.*</title>|<title>${APP_NAME}</title>|" /app/index.html
    sed -i "s|<meta property=\"og:title\" content=\".*\" />|<meta property=\"og:title\" content=\"${APP_NAME}\" />|" /app/index.html
fi

if [ ! -z "$APP_DESCRIPTION" ]; then
    sed -i "s|<meta name=\"description\" content=\".*\" />|<meta name=\"description\" content=\"${APP_DESCRIPTION}\" />|" /app/index.html
    sed -i "s|<meta property=\"og:description\" content=\".*\" />|<meta property=\"og:description\" content=\"${APP_DESCRIPTION}\" />|" /app/index.html
fi

cat > "/app/config.js" << EOF
window.__APP_CONFIG__ = {
  APP_NAME: "${APP_NAME:-SHM Client}",
  APP_DESCRIPTION: "${APP_DESCRIPTION:-}",
  LOGO_URL: "${LOGO_URL:-}",
  TELEGRAM_BOT_NAME: "${TELEGRAM_BOT_NAME:-}",
  TELEGRAM_BOT_AUTH_ENABLE: "${TELEGRAM_BOT_AUTH_ENABLE:-false}",
  TELEGRAM_BOT_AUTH_PROFILE: "${TELEGRAM_BOT_AUTH_PROFILE:-}",
  TELEGRAM_WEBAPP_AUTH_ENABLE: "${TELEGRAM_WEBAPP_AUTH_ENABLE:-false}",
  TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE: "${TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE:-false}",
  TELEGRAM_WEBAPP_PROFILE: "${TELEGRAM_WEBAPP_PROFILE:-}",
  SUPPORT_LINK: "${SUPPORT_LINK:-}",
  PRIVACY_POLICY_URL: "${PRIVACY_POLICY_URL:-}",
  TERMS_OF_USE_URL: "${TERMS_OF_USE_URL:-}",
  PUBLIC_OFFER_URL: "${PUBLIC_OFFER_URL:-}",
  DEFAULT_LANGUAGE: "${DEFAULT_LANGUAGE:-ru}",
  SHM_BASE_PATH: "${SHM_BASE_PATH:-/}",
  OTP_ENABLE: "${OTP_ENABLE:-true}",
  PASSKEY_ENABLE: "${PASSKEY_ENABLE:-true}",
  PASSKEY_AUTH_DISABLED: "${PASSKEY_AUTH_DISABLED:-false}",
  BITRIX_WIDGET_SCRIPT_URL: "${BITRIX_WIDGET_SCRIPT_URL:-}",
  PROXY_CATEGORY: "${PROXY_CATEGORY:-}",
  PROXY_CATEGORY_TITLE: "${PROXY_CATEGORY_TITLE:-}",
  PROXY_STORAGE_PREFIX: "${PROXY_STORAGE_PREFIX:-}",
  SHOW_PROXY_SUB_LINK: "${SHOW_PROXY_SUB_LINK:-true}",
  SHOW_HAPP_CRYPTOLINK: "${SHOW_HAPP_CRYPTOLINK:-false}",
  SHOW_PROXY_QR: "${SHOW_PROXY_QR:-true}",
  VPN_CATEGORY: "${VPN_CATEGORY:-}",
  VPN_CATEGORY_TITLE: "${VPN_CATEGORY_TITLE:-}",
  VPN_STORAGE_PREFIX: "${VPN_STORAGE_PREFIX:-}",
  VISIBLE_CATEGORIES: "${VISIBLE_CATEGORIES:-}",
  EMAIL_REQUIRED: "${EMAIL_REQUIRED:-false}",
  EMAIL_VERIFY_REQUIRED: "${EMAIL_VERIFY_REQUIRED:-false}",
  ALLOW_EMAIL_VERIFY: "${ALLOW_EMAIL_VERIFY:-true}",
  ALLOW_SERVICE_BLOCKED: "${ALLOW_SERVICE_BLOCKED:-true}",
  ALLOW_SERVICE_DELETE: "${ALLOW_SERVICE_DELETE:-true}",
  ALLOW_SERVICE_CHANGE: "${ALLOW_SERVICE_CHANGE:-true}",
  ALLOW_SERVICE_CHANGE_FORCE: "${ALLOW_SERVICE_CHANGE_FORCE:-false}",
  SERVICE_CHANGE_ALL_CATEGORY: "${SERVICE_CHANGE_ALL_CATEGORY:-false}",
  ALLOW_TELEGRAM_PIN: "${ALLOW_TELEGRAM_PIN:-true}",
  VPN_APP_WINDOWS_URL: "${VPN_APP_WINDOWS_URL:-}",
  VPN_APP_LINUX_URL: "${VPN_APP_LINUX_URL:-}",
  VPN_APP_MAC_URL: "${VPN_APP_MAC_URL:-}",
  VPN_APP_IOS_URL: "${VPN_APP_IOS_URL:-}",
  VPN_APP_ANDROID_URL: "${VPN_APP_ANDROID_URL:-}",
  PROXY_APP_WINDOWS_URL: "${PROXY_APP_WINDOWS_URL:-}",
  PROXY_APP_LINUX_URL: "${PROXY_APP_LINUX_URL:-}",
  PROXY_APP_MAC_URL: "${PROXY_APP_MAC_URL:-}",
  PROXY_APP_IOS_URL: "${PROXY_APP_IOS_URL:-}",
  PROXY_APP_ANDROID_URL: "${PROXY_APP_ANDROID_URL:-}",
  VPN_WINDOWS_APP_NAME: "${VPN_WINDOWS_APP_NAME:-}",
  VPN_LINUX_APP_NAME: "${VPN_LINUX_APP_NAME:-}",
  VPN_MAC_APP_NAME: "${VPN_MAC_APP_NAME:-}",
  VPN_IOS_APP_NAME: "${VPN_IOS_APP_NAME:-}",
  VPN_ANDROID_APP_NAME: "${VPN_ANDROID_APP_NAME:-}",
  PROXY_WINDOWS_APP_NAME: "${PROXY_WINDOWS_APP_NAME:-}",
  PROXY_LINUX_APP_NAME: "${PROXY_LINUX_APP_NAME:-}",
  PROXY_MAC_APP_NAME: "${PROXY_MAC_APP_NAME:-}",
  PROXY_IOS_APP_NAME: "${PROXY_IOS_APP_NAME:-}",
  PROXY_ANDROID_APP_NAME: "${PROXY_ANDROID_APP_NAME:-}",
  APPLE_TV_APP_NAME: "${APPLE_TV_APP_NAME:-}",
  ANDROID_TV_APP_NAME: "${ANDROID_TV_APP_NAME:-}",
  WINDOWS_PROXY_URL_SCHEMA: "${WINDOWS_PROXY_URL_SCHEMA:-}",
  LINUX_PROXY_URL_SCHEMA: "${LINUX_PROXY_URL_SCHEMA:-}",
  MAC_PROXY_URL_SCHEMA: "${MAC_PROXY_URL_SCHEMA:-}",
  IOS_PROXY_URL_SCHEMA: "${IOS_PROXY_URL_SCHEMA:-}",
  ANDROID_PROXY_URL_SCHEMA: "${ANDROID_PROXY_URL_SCHEMA:-}",
  CAPTCHA_ENABLED: "${CAPTCHA_ENABLED:-false}",
  ORDER_SORTING: "${ORDER_SORTING:-cost_asc}"
};
EOF

nginx -g "daemon off;"
