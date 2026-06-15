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
  - Поддержка кастомных языков через `CUSTOM_LANGS`

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
| `CUSTOM_LANGS` | Коды кастомных языков через запятую (например `cn,kk`) | - |

### Переменные для контактов и юр. документов

| Переменная | Описание | По умолчанию |
| ------------ | ---------- | -------------- |
| `SUPPORT_LINK` | Ссылка на поддержку | - |
| `CONTACT_EMAIL` | Почта для контакта | - |
| `CONTACT_PHONE` | Номер телефона для контакта | - |
| `BITRIX_WIDGET_SCRIPT_URL` | URL виждета Битрих-24 `https://cdn-ru.bitrix24.ru/b********/crm/site_button/loader_****.js` | - |
| `SUPPORT_WIDGET_URL` | URL скрипта виджета чата поддержки (например `https://widget.your-domain.com/widget.js`). Виджет загружается только после авторизации пользователя | - |
| `SUPPORT_WIDGET_API` | API-ключ для виджета поддержки (передаётся в атрибут `data-api`) | - |
| `PRIVACY_POLICY_URL` | Ссылка или путь на `Политика конфиденциальности` | - |
| `TERMS_OF_USE_URL` | Ссылка или путь на `Условия использования` | - |
| `PUBLIC_OFFER_URL` | Ссылка или путь на `Договор оферты` | - |
| `USER_AGREEMENT_URL` | Ссылка или путь на `Пользовательское соглашение"` | - |

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

## Виджет поддержки [Support Bot](https://github.com/bkeenke/support-bot)

Приложение поддерживает встраивание виджета чата поддержки. Скрипт виджета загружается только после авторизации пользователя — `data-user-id` подставляется автоматически из текущей сессии.

### Переменные окружения

| Переменная | Описание | По умолчанию |
| ---------- | -------- | ------------ |
| `SUPPORT_WIDGET_URL` | URL скрипта виджета | - |
| `SUPPORT_WIDGET_API` | API-ключ виджета (передаётся в `data-api`) | - |

### Пример конфигурации

```yaml
services:
  client:
    image: danuk/shm-client-2:latest
    environment:
      SUPPORT_WIDGET_URL: "https://widget.your-domain.com/widget.js"
      SUPPORT_WIDGET_API: "your-api-key"
```

Виджет инициализируется как:

```html
<script src="https://widget.your-domain.com/widget.js"
        data-api="your-api-key"
        data-user-id="123">
</script>
```

где `data-user-id` — это ID авторизованного пользователя в SHM.

## Push-уведомления (Тестовый)

Приложение поддерживает Web Push уведомления через Service Worker (браузерные push без PWA).

### Переменные для Push

| Переменная | Описание | По умолчанию |
| ---------- | -------- | ------------ |
| `WEB_PUSH_ENABLE` | Включить поддержку Web Push уведомлений | `false` |
| `VAPID_PUBLIC_KEY` | Публичный VAPID-ключ для Web Push | - |

### Настройка

1. Сгенерируйте VAPID-ключи (например через `npx web-push generate-vapid-keys`)
2. Укажите публичный ключ в `VAPID_PUBLIC_KEY`, приватный — в shm
3. Установите `WEB_PUSH_ENABLE=true`

в SHM нет прямой поддержки Push уведомлений, для этого нужны отдельные шаблоны, например сейчас для подписки используется POST запрос на `/shm/v1/template/subscribe` и `/shm/v1/template/unsubscribe` для отписки

После авторизации в шапке приложения появится кнопка 🔔 — пользователь сам управляет подпиской.

### Открытие уведомления из URL

При клике на push-уведомление браузер открывает приложение. Если в URL присутствуют параметры `_nt` (заголовок) и `_nb` (текст), приложение автоматически показывает всплывающее уведомление внутри интерфейса:

```text
https://your-domain.com/?_nt=Заголовок&_nb=Текст+уведомления
```

### iOS

На iOS Web Push работает только в **Safari 16.4+** при условии, что приложение добавлено на главный экран (режим PWA / Home Screen). В обычном браузере на iOS push-уведомления недоступны.

## Добавления как PWA ( Прогрессивные веб-приложения )

Приложение поддерживает установку как PWA на мобильные и десктопные устройства.

### Название и описание

Берутся из переменных окружения:

| Переменная | Поле манифеста | Описание |
| ---------- | -------------- | -------- |
| `APP_NAME` | `name`, `short_name` | Название приложения, отображается при установке и на главном экране |
| `APP_DESCRIPTION` | `description` | Описание в магазинах и при установке |

### Иконки

Обязательные файлы для замены, чтобы при установке отображалась ваша иконка:

| Файл | Размер | Назначение |
| ---- | ------ | ---------- |
| `icon-192.png` | 192×192 | Иконка на главном экране Android / desktop |
| `icon-512.png` | 512×512 | Иконка в splash-screen и магазинах |

Опциональные скриншоты для витрины при установке:

| Файл | Размер по умолчанию | Минимальный рекомендуемый | Назначение |
| ---- | ------------------- | ------------------------- | ---------- |
| `screenshot-desktop.png` | 3410×1872 | 1280×800 | Превью для десктопных устройств (`form_factor: wide`) |
| `screenshot-mobile.png` | 1154×1868 | 640×1136 | Превью для мобильных устройств (`form_factor: narrow`) |

> Соотношение сторон важнее точных размеров: desktop — горизонтальный (16:9), mobile — вертикальный (9:16 или близко к нему).

Замена файлов через volumes:

```yaml
volumes:
  - "./icon-192.png:/app/icon-192.png"
  - "./icon-512.png:/app/icon-512.png"
  - "./screenshot-desktop.png:/app/screenshot-desktop.png"
  - "./screenshot-mobile.png:/app/screenshot-mobile.png"
```

## Добавление кастомного языка

Можно подключить любой язык, не входящий в список встроенных, без пересборки образа.

### 1. Создать файл перевода

Скопируйте один из встроенных файлов (`public/locales/en.json`) как шаблон и переведите все значения.
Обязательно укажите блок `config` в корне файла:

```json
{
  "config": {
    "code": "cn",
    "label": "简体中文",
    "flag": "🇨🇳"
  },
  "common": {
    ...
  }
}
```

| Поле | Описание |
| ---- | -------- |
| `code` | Код языка (должен совпадать с именем файла, например `cn` → `cn.json`) |
| `label` | Название языка в переключателе |
| `flag` | Флаг-эмодзи |

### 2. Подключить файл через volume

```yaml
services:
  client:
    image: danuk/shm-client-2:latest
    environment:
      CUSTOM_LANGS: "cn"
    volumes:
      - "./cn.json:/app/locales/cn.json"
```

Несколько языков указываются через запятую:

```yaml
CUSTOM_LANGS: "cn,kk"
```

### 3. Валидация

При загрузке приложение проверяет каждый кастомный язык:

- наличие `config.label` и `config.flag` — файл появится в переключателе
- количество переведённых ключей — если переведено **менее 50%** ключей относительно `en.json`, язык игнорируется с предупреждением в консоли

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
