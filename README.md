# SHM Client

Клиентский личный кабинет для SHM (Service Hosting Manager).

- 🔐 Аутентификация:
  - `Логин/Пароль`
  - `Логин/Пароль + 2FA`
  - `Passkey`
  - `Telegram widget`
  - `Telegram MiniApp`
  - `Telegram OIDC`
- 📦 Покупка услуг, возможность сменить, остановить и удалить услугу
- 🔗 Показ QR-кода и ссылки на подписку(Remnawave/marzban), редирект в приложение по URL схеме
- 💳 Пополнение баланса, удаление автоплатежа
- 💸 Прогноз оплаты в профиле
- 📊 История платежей и списаний
- 👤 Редактирование профиля, привязка электронной почты, привязка аккаунта телеграмм через Telegram OIDC
- 🌐 Мультиязычность:
  - `Русский`
  - `English`
  - `Deutsch`
  - `Español`
  - `Français`
  - `Oʻzbekcha`
  - `العربية`

## Docker Compose

- Вместе с контейнерами SHM

```yaml
services:
  client:
    image: danuk/shm-client-2:latest
    ports:
      - "3001:80"
    environment:
      SHM_URL: "https://api.mydomain.com"
      APP_NAME: "My Company"
      APP_DESCRIPTION: "My Company Description"
    restart: unless-stopped
```

### Основные переменные окружения

| Переменная | Описание | По умолчанию |
| ------------ | ---------- | -------------- |
| `SHM_URL` | URL API сервера SHM | - |
| `SHM_HOST` | Альтернатива SHM_URL | - |
| `SHM_BASE_PATH` | Базовый путь (например `/cabinet`) | `/` |
| `APP_NAME` | Название приложения | `SHM Client` |
| `APP_DESCRIPTION` | Описание приложения | Powerful and flexible client for SHM |
| `LOGO_URL` | Ссылка на логитип приложения | локальный favicon.jpg |
| `DEFAULT_LANGUAGE` | Язык системы по умолчанию | `ru` |
| `SINGLE_LANGUAGE` | Используем только 1 язык системы (Язык системы используется из переменной `DEFAULT_LANGUAGE`) | - |

### Переменные для контактов и юр. документов

| Переменная | Описание | По умолчанию |
| ------------ | ---------- | -------------- |
| `SUPPORT_LINK` | Ссылка на поддержку | - |
| `CONTACT_EMAIL` | Почта для контакта | - |
| `CONTACT_PHONE` | Номер телефона для контакта | - |
| `BITRIX_WIDGET_SCRIPT_URL` | URL виждета Битрих-24 `https://cdn-ru.bitrix24.ru/b********/crm/site_button/loader_****.js` | - |
| `PRIVACY_POLICY_URL` | Ссылка на `Политика конфиденциальности` | - |
| `TERMS_OF_USE_URL` | Ссылка на `Условия использования` | - |
| `PUBLIC_OFFER_URL` | Ссылка на `Договор оферты` | - |

### Переменные окружения для работы с телеграмм

| Переменная | Описание | По умолчанию |
| ------------ | ---------- | -------------- |
| `TELEGRAM_BOT_NAME` | Username Telegram бота (без @) s | - |
| `TELEGRAM_BOT_AUTH_ENABLE` | Включить авторизацию через Telegram виджет | `false` |
| `TELEGRAM_OIDC_AUTH_ENABLE` | Включить авторизацию через Telegram OIDC | `false` |
| `TELEGRAM_BOT_AUTH_PROFILE` | Название бота (профиля) в SHM | `telegram_bot` |
| `TELEGRAM_WEBAPP_AUTH_ENABLE` | Авторизация через телеграмм вебапп | `false` |
| `TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE` | Автоматическая авторизация через телеграмм вебапп | `false` |
| `TELEGRAM_WEBAPP_PROFILE` | Название бота (профиля) в SHM | - |
| `ALLOW_TELEGRAM_PIN` | Разрешить привязку аккаунта Telegram | `true` |

### Переменные окружения для безопасности

| Переменная | Описание | По умолчанию |
| ------------ | ---------- | -------------- |
| `OTP_ENABLE` | Показать настройки OTP | `true` |
| `PASSKEY_ENABLE` | Показать настройки Passkey | `true` |
| `PASSKEY_AUTH_DISABLED` | Скрыть кнопку авторизации через Passkey | `false` |
| `CAPTCHA_ENABLED` | Включение/выключение капчи (надо включить в кабинете администратора) | `false` |

### Переменные окружения для работы с почтой

| Переменная | Описание | По умолчанию |
| ------------ | ---------- | -------------- |
| `EMAIL_REQUIRED` | Hе дает пользоваться ЛК пока клиент не введет email | `false` |
| `EMAIL_VERIFY_REQUIRED` | Hе дает заказать услугу пока email не будет подтвержден | `false` |
| `ALLOW_EMAIL_VERIFY` | Разрешить верифицировать email | `true` |

### Переменные окружения для работы с категориями Wireguard, Amnezia

| Переменная | Описание | По умолчанию |
| ------------ | ---------- | -------------- |
| `VPN_CATEGORY` | Категория VPN чтобы показать QR или возможность скачать файл конфигурации (vpn-wg,vpn-awg) | - |
| `VPN_CATEGORY_TITLE` | Название категории | VPN |
| `VPN_STORAGE_PREFIX` | Префикс для категории vpn в хранилище например `wg_key_` | `vpn` |
| `VPN_APP_WINDOWS_URL` | Ссылка на скачивание приложения для категории VPN для Windows | - |
| `VPN_APP_LINUX_URL` | Ссылка на скачивание приложения для категории VPN для Linux | - |
| `VPN_APP_MAC_URL` | Ссылка на скачивание приложения для категории VPN для macOS | - |
| `VPN_APP_IOS_URL` | Ссылка на скачивание приложения для категории VPN для iOS | - |
| `VPN_APP_ANDROID_URL` | Ссылка на скачивание приложения для категории VPN для Android | - |
| `VPN_WINDOWS_APP_NAME` | Название кнопки для категории VPN для Windows | `Скачать` |
| `VPN_LINUX_APP_NAME` | Название кнопки для категории VPN для Linux | `Скачать` |
| `VPN_MAC_APP_NAME` | Название кнопки для категории VPN для macOS | `Скачать` |
| `VPN_IOS_APP_NAME` | Название кнопки для категории VPN для iOS | `Скачать` |
| `VPN_ANDROID_APP_NAME` | Название кнопки для категории VPN для Android | `Скачать` |

### Переменные окружения для работы с категориями Прокси Remnawave, Marzban

| Переменная | Описание | По умолчанию |
| ------------ | ---------- | -------------- |
| `PROXY_CATEGORY` | Категория прокси чтобы показать ссылку на подписку (vpn-remna,vpn-trial) | - |
| `PROXY_CATEGORY_TITLE` | Название категории | VPN Подписка |
| `PROXY_STORAGE_PREFIX` | префикс для категории proxy в хранилище, например 'vpm_remna_' | `vpm_mrzb_` |
| `PROXY_APP_WINDOWS_URL` | Ссылка на скачивание приложения для категории PROXY для Windows | - |
| `PROXY_APP_LINUX_URL` | Ссылка на скачивание приложения для категории PROXY для Linux | - |
| `PROXY_APP_MAC_URL` | Ссылка на скачивание приложения для категории PROXY для macOS | - |
| `PROXY_APP_IOS_URL` | Ссылка на скачивание приложения для категории PROXY для iOS | - |
| `PROXY_APP_ANDROID_URL` | Ссылка на скачивание приложения для категории PROXY для Android | - |
| `PROXY_WINDOWS_APP_NAME` | Название кнопки для категории PROXY для Windows | `Скачать` |
| `PROXY_LINUX_APP_NAME` | Название кнопки для категории PROXY для Linux | `Скачать` |
| `PROXY_MAC_APP_NAME` | Название кнопки для категории PROXY для macOS | `Скачать` |
| `PROXY_IOS_APP_NAME` | Название кнопки для категории PROXY для iOS | `Скачать` |
| `PROXY_ANDROID_APP_NAME` | Название кнопки для категории PROXY для Android | `Скачать` |
| `APPLE_TV_APP_NAME` | Название кнопки для категории PROXY для Apple TV | `Скачать` |
| `ANDROID_TV_APP_NAME` | Название кнопки для категории PROXY для Android TV | `Скачать` |
| `WINDOWS_PROXY_URL_SCHEMA` | URL-схема для открытия подписки на Windows (`happ://add/`) | `` |
| `LINUX_PROXY_URL_SCHEMA` | URL-схема для открытия подписки на Linux (`happ://add/`) | `` |
| `MAC_PROXY_URL_SCHEMA` | URL-схема для открытия подписки на macOS (`happ://add/`) | `` |
| `IOS_PROXY_URL_SCHEMA` | URL-схема для открытия подписки на iOS (`happ://add/`) | `` |
| `ANDROID_PROXY_URL_SCHEMA` | URL-схема для открытия подписки на Android (`happ://add/`) | `` |
| `SHOW_PROXY_SUB_LINK` | Показывать ссылку на подписку для категории proxy | `true` |
| `SHOW_HAPP_CRYPTOLINK` | Показать крипто ссылку на подписку для категории proxy | `false` |
| `SHOW_PROXY_QR` | Показывать кнопку `QR` на ссылку подписки для категории proxy | `true` |

### Переменные окружения для работы с услугами

| Переменная | Описание | По умолчанию |
| ------------ | ---------- | -------------- |
| `VISIBLE_CATEGORIES` | Категории для отображения при покупке и уже купленных услуг (vpn-mz,vpm-mz-trial) | - |
| `BLOCK_ORDER_IF_UNPAID` | Блокировать покупку услуг если есть не оплаченная услуга | `false` |
| `ALLOW_SERVICE_BLOCKED` | Разрешить пользователю блокировать услугу | `true` |
| `ALLOW_SERVICE_DELETE` | Разрешить пользователю удалять услугу | `true` |
| `ALLOW_SERVICE_CHANGE` | Разрешить пользователю сменить услугу | `true` |
| `ALLOW_SERVICE_CHANGE_FORCE` | Разрешить сменить услугу сразу (не спрашивая пользователя) | `false` |
| `SERVICE_CHANGE_ALL_CATEGORY` | Разрешить сменить услугу на все доступные категории ( если `false` то можно сменить только на такую же категорию как и в текущей услуге) | `true` |
| `ORDER_SORTING` | Сортировка услуг при покупке (`cost_asc`, `cost_desc`, `name_asc`, `name_desc`, `descr_asc`, `descr_desc`) | `cost_asc` |
| `DEVICE_CONFIG_TEXT` | Замена текста `Добавить в приложение` только в 1 языке | `` |

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
