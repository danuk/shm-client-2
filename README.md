# SHM Client

Клиентский личный кабинет для SHM (Service Hosting Manager).

- 🔐 Авторизация (логин/пароль, Telegram)
- 📦 Покупка услуг, возможность остановить и удалить услугу
- 🔗 Показ QR-кода и ссылки на подписку(Remnawave/marzban)
- 💳 Пополнение баланса, Удаление автоплатежа
- 💸 Прогноз оплаты в профиле
- 📊 История платежей и списаний
- 👤 Редактирование профиля
- 🌐 Мультиязычность (Русский / English)

### Docker Compose

- Вместе с контейнерами SHM

```yaml
services:
#   admin:
#     ...
  client:
    image: bkeenke/shm-client:latest
    pull_policy: always
    restart: always
    ports:
      - "8082:80"
    environment:
      - SHM_URL=http://api
      - APP_NAME=My Service
      - TELEGRAM_BOT_NAME=your_bot
      - TELEGRAM_BOT_AUTH_ENABLE=true
      - TELEGRAM_WEBAPP_AUTH_ENABLE=true
      - TELEGRAM_WEBAPP_PROFILE='telegram_bot'
      - SUPPORT_LINK=https://t.me/your_support_bot
      - OTP_ENABLE=true
      - PASSKEY_ENABLE=true
    depends_on:
      - api
#   mysql:
#     ....
```

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `SHM_URL` | URL API сервера SHM | `http://shm.local` |
| `SHM_HOST` | Альтернатива SHM_URL | - |
| `SHM_BASE_PATH` | Базовый путь (например `/cabinet`) | `/` |
| `APP_NAME` | Название приложения | `SHM Client` |
| `TELEGRAM_BOT_NAME` | Username Telegram бота (без @) s| - |
| `TELEGRAM_BOT_AUTH_ENABLE` | Включить авторизацию через Telegram виджет | `false` |
| `TELEGRAM_WEBAPP_AUTH_ENABLE` | Авторизация через телеграмм вебапп | `false` |
| `TELEGRAM_WEBAPP_PROFILE` | Название бота (профиля) в SHM | - |
| `SUPPORT_LINK` | Ссылка на поддержку | - |
| `RESOLVER` | DNS резолвер для nginx | `127.0.0.11` |
| `OTP_ENABLE` | Показать настройки OTP | `true` |
| `PASSKEY_ENABLE` | Показать настройки Passkey | `true` |

### Telegram Widget
Для работы с авторизацией через Telegram Widget нужно в астройках бота  который указан в `TELGRAM_BOT_NAME` указать домен на котором расположена ваше приложение `shm-client`

## Категории услуг для VPN/Proxy

Для отображения **QR-кода** и **ссылки подписки** в деталях услуги, категория услуги должна соответствовать одному из следующих паттернов:

### VPN (WireGuard конфигурация)

Категория должна **начинаться** с одного из значений:
- `vpn`
- `wg`
- `awg`

Примеры валидных категорий: `vpn`, `vpn-wg`, `vpn-awg-nl`, `awg-premium`, `wg-fast`

**Storage ключ:** `vpn{user_service_id}` (например: `vpn123`)

### Proxy (Marzban/Remnawave подписка)

Категория должна содержать одно из слов:
- `remna`
- `remnawave`
- `marzban`
- `marz`
- `mz`

Примеры валидных категорий: `marzban`, `remnawave`, `mz-premium`, `proxy-marz`

**Storage ключи:**
- `vpn_mrzb_{user_service_id}` (например: `vpn_mrzb_123`)
- `vpn_remna_{user_service_id}` (например: `vpn_remna_123`)

### Прочие категории

Следующие категории отображаются как есть (без QR/ссылки):
- `web_tariff` — Тарифы хостинга
- `web` — Web хостинг
- `mysql` — Базы данных
- `mail` — Почта
- `hosting` — Хостинг

Все остальные категории группируются как "Прочее".

## Лицензия

MIT
