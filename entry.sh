#!/bin/sh

[ -z "$SHM_URL" ] || sed -i "s|http://shm.local|$SHM_URL|" /etc/nginx/conf.d/default.conf
[ -z "$SHM_HOST" ] || sed -i "s|http://shm.local|$SHM_HOST|" /etc/nginx/conf.d/default.conf
[ -z "$RESOLVER" ] || sed -i "s|resolver 127.0.0.11|resolver $RESOLVER|" /etc/nginx/conf.d/default.conf

if [ ! -z "$SHM_BASE_PATH" ] && [ "$SHM_BASE_PATH" != "/" ]; then
    mkdir -p "/app${SHM_BASE_PATH}"
    mv /app/assets "/app${SHM_BASE_PATH}/" 2>/dev/null || true
    mv /app/index.html "/app${SHM_BASE_PATH}/" 2>/dev/null || true
    mv /app/favicon.* "/app${SHM_BASE_PATH}/" 2>/dev/null || true

    sed -i "s|location / {|location $SHM_BASE_PATH/ {\n        alias /app${SHM_BASE_PATH}/;\n        try_files \$uri \$uri/ ${SHM_BASE_PATH}/index.html;\n    }\n\n    location / {|" /etc/nginx/conf.d/default.conf
    sed -i "s|#proxy_cookie_path;|proxy_cookie_path / $SHM_BASE_PATH;|" /etc/nginx/conf.d/default.conf
fi

CONFIG_PATH="/app"
if [ ! -z "$SHM_BASE_PATH" ] && [ "$SHM_BASE_PATH" != "/" ]; then
    CONFIG_PATH="/app${SHM_BASE_PATH}"
fi

cat > "${CONFIG_PATH}/config.js" << EOF
window.__APP_CONFIG__ = {
  APP_NAME: "${APP_NAME:-SHM Client}",
  TELEGRAM_BOT_NAME: "${TELEGRAM_BOT_NAME:-}",
  TELEGRAM_BOT_AUTH_ENABLE: "${TELEGRAM_BOT_AUTH_ENABLE:-false}",
  TELEGRAM_WEBAPP_AUTH_ENABLE: "${TELEGRAM_WEBAPP_AUTH_ENABLE:-false}",
  TELEGRAM_WEBAPP_PROFILE: "${TELEGRAM_WEBAPP_PROFILE:-}",
  SUPPORT_LINK: "${SUPPORT_LINK:-}"
};
EOF

nginx -g "daemon off;"
