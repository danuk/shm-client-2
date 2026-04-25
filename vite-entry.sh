#!/bin/sh

# Обрабатываем index.html для Vite в dev режиме
if [ ! -z "$VITE_BASE_PATH" ] && [ "$VITE_BASE_PATH" != "/" ]; then
    echo "Processing index.html for VITE_BASE_PATH: $VITE_BASE_PATH"
    sed -i "s|<base href=\"/\" />|<base href=\"$VITE_BASE_PATH/\" />|" /app/index.html
    sed -i "s|href=\"/favicon.jpg\"|href=\"$VITE_BASE_PATH/favicon.jpg\"|" /app/index.html
fi

# Запускаем Vite
exec npm run dev -- --host 0.0.0.0
