# Деплой на Timeweb Cloud — пошаговая инструкция

Инструкция для владельца без глубоких знаний DevOps.
Перед деплоем необходимо: **купить домен** и **создать счётчик Яндекс Метрики**.

---

## Что потребуется заранее

- Домен (например, `raspechatka.ru`) — купить на reg.ru, nic.ru или у Timeweb
- Аккаунт на [timeweb.cloud](https://timeweb.cloud)
- SSH-клиент: Windows — [PuTTY](https://putty.org) или встроенный терминал (`Win + X → Терминал`)
- Репозиторий проекта на GitHub (или другом Git-хостинге)

---

## Шаг 1. Создание VPS

1. Войдите в [timeweb.cloud](https://timeweb.cloud) → **Облачные серверы** → **Создать сервер**.
2. Выберите параметры:
   - **Дата-центр:** Россия (Москва или Санкт-Петербург)
   - **ОС:** Ubuntu 24.04 LTS
   - **Конфигурация:** от 2 CPU / 2 GB RAM (достаточно для старта)
   - **Диск:** от 20 GB SSD
3. Задайте имя сервера, например `raspechatka-prod`.
4. Укажите SSH-ключ (рекомендуется) или пароль root.
5. Нажмите **Создать** — сервер будет готов через 1–2 минуты.
6. Запишите IP-адрес сервера.

---

## Шаг 2. Подключение по SSH

```bash
ssh root@[IP_СЕРВЕРА]
```

При первом подключении подтвердите fingerprint (введите `yes`).

Создайте непривилегированного пользователя (рекомендуется):

```bash
adduser deploy
usermod -aG sudo deploy
# Скопируйте SSH-ключ для нового пользователя
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Далее работайте от имени `deploy`:

```bash
ssh deploy@[IP_СЕРВЕРА]
```

---

## Шаг 3. Установка Node.js LTS, nginx и Git

```bash
sudo apt update && sudo apt upgrade -y

# Git
sudo apt install -y git

# Node.js LTS через NodeSource
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версий
node -v   # должно быть v22.x или выше
npm -v

# nginx
sudo apt install -y nginx

# Certbot для HTTPS
sudo apt install -y certbot python3-certbot-nginx
```

---

## Шаг 4. Клонирование репозитория

```bash
cd /var/www
sudo mkdir raspechatka
sudo chown deploy:deploy raspechatka
git clone https://github.com/[ВАШ_АККАУНТ]/raspechatka-site.git raspechatka
cd raspechatka
```

---

## Шаг 5. Создание `.env.production`

> **Важно:** этот файл никогда не коммитится в Git.

```bash
nano /var/www/raspechatka/.env.production
```

Вставьте содержимое (замените placeholders на реальные значения):

```env
NODE_ENV=production

# Public site
NEXT_PUBLIC_SITE_URL=https://[ДОМЕН]
NEXT_PUBLIC_YANDEX_METRIKA_ID=[ID_СЧЁТЧИКА]

# Telegram delivery
TELEGRAM_BOT_TOKEN=[ДОБАВИТЬ_НА_СЕРВЕРЕ]
TELEGRAM_CHAT_ID=[ДОБАВИТЬ_НА_СЕРВЕРЕ]

# Admin
ADMIN_PASSWORD=[СГЕНЕРИРОВАТЬ_НА_СЕРВЕРЕ]
ADMIN_SESSION_SECRET=[СЛУЧАЙНАЯ_СТРОКА_НЕ_МЕНЕЕ_32_СИМВОЛОВ]

# Storage — данные вне директории проекта
PRINTLAB_DATA_DIR=/var/lib/raspechatka

# Outbox cron — секрет для повторной доставки заявок
# Сгенерировать: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
OUTBOX_CRON_SECRET=[СГЕНЕРИРОВАТЬ_НА_СЕРВЕРЕ]
```

Сгенерируйте `ADMIN_SESSION_SECRET` прямо на сервере:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Сохраните файл (`Ctrl+O`, `Enter`, `Ctrl+X`). Установите права:

```bash
chmod 600 /var/www/raspechatka/.env.production
```

---

## Шаг 6. Директория для runtime-данных

```bash
sudo mkdir -p /var/lib/raspechatka
sudo chown deploy:deploy /var/lib/raspechatka
chmod 750 /var/lib/raspechatka
```

Здесь будут храниться заявки, загруженные файлы и аналитика. Директория находится **вне Git** и **вне папки проекта**.

---

## Шаг 7. Установка зависимостей и сборка

```bash
cd /var/www/raspechatka
npm ci --production=false
npm run build
```

Сборка займёт 1–3 минуты. Убедитесь, что она завершилась без ошибок.

---

## Шаг 8. Запуск приложения через PM2

PM2 — менеджер процессов, который автоматически перезапускает приложение при сбое и при перезагрузке сервера.

```bash
# Установка PM2 глобально
sudo npm install -g pm2
```

Создайте файл конфигурации PM2:

```bash
nano /var/www/raspechatka/ecosystem.config.js
```

Вставьте содержимое:

```js
module.exports = {
  apps: [{
    name: "raspechatka",
    script: "npm",
    args: "start",
    // Только один процесс — JSON storage не поддерживает конкурентные записи.
    // Не включать cluster mode до миграции заявок в PostgreSQL:
    // несколько Node.js-процессов приведут к lost update в orders.json.
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      // Привязка только к loopback — порт 3000 не должен быть доступен снаружи.
      HOSTNAME: "127.0.0.1",
    },
  }],
};
```

> **Важно:** не устанавливайте `instances > 1` и `exec_mode: "cluster"` до миграции
> заявок в PostgreSQL. Файловый storage (orders.json) не поддерживает параллельные записи.

> **Firewall:** Порт 3000 не открывать во внешнем firewall. Внешний трафик принимают
> только Nginx на портах 80/443. `HOSTNAME: "127.0.0.1"` — дополнительная линия защиты,
> но не замена firewall-правилам.

```bash
# Запуск приложения
pm2 start ecosystem.config.js

# Автозапуск при перезагрузке сервера
pm2 startup
# Скопируйте и выполните команду, которую выведет pm2 startup
pm2 save
```

Проверьте, что приложение запущено:

```bash
pm2 status
pm2 logs raspechatka --lines 30
```

На этом этапе приложение доступно на `http://[IP_СЕРВЕРА]:3000` — пока без домена и HTTPS.

---

## Шаг 9. Настройка nginx как reverse proxy

```bash
sudo nano /etc/nginx/sites-available/raspechatka
```

Сначала добавьте `limit_req_zone` в глобальный блок `http` файла `/etc/nginx/nginx.conf`
(внутри `http { ... }`, до строки `include /etc/nginx/sites-enabled/*`):

```bash
sudo nano /etc/nginx/nginx.conf
```

```nginx
# Rate limiting для публичных API-форм.
# TODO: заменить на Redis rate limiter после перехода к многопроцессной архитектуре.
limit_req_zone $binary_remote_addr zone=api_forms:10m rate=5r/m;
```

Теперь создайте конфигурацию сайта (домен замените на свой):

```nginx
server {
    listen 80;
    server_name [ДОМЕН] www.[ДОМЕН];

    # 50M покрывает multipart/form-data с изображением (~45 МБ пиковый запрос).
    client_max_body_size 50M;

    proxy_read_timeout 60s;
    proxy_send_timeout 60s;

    # Внутренние эндпоинты — только из localhost (cron, обслуживание).
    # Запросы снаружи получают 404, не 403 — не раскрываем структуру API.
    location ^~ /api/internal/ {
        deny all;
        return 404;
    }

    # Защита API форм от частых повторных запросов (в т.ч. multipart-upload).
    # burst=3: три быстрых запроса разрешены без задержки; nodelay — без очереди.
    location ~ ^/api/(lead|order|orders/constructor) {
        limit_req zone=api_forms burst=3 nodelay;
        limit_req_status 429;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # Single-proxy схема: передаём IP клиента напрямую, без append-цепочки.
        # Не использовать $proxy_add_x_forwarded_for до реализации trusted-proxy
        # parsing в приложении — клиент может подделать X-Forwarded-For.
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # Single-proxy схема: передаём IP клиента напрямую, без append-цепочки.
        # Не использовать $proxy_add_x_forwarded_for до реализации trusted-proxy
        # parsing в приложении — клиент может подделать X-Forwarded-For.
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/raspechatka /etc/nginx/sites-enabled/
sudo nginx -t          # проверка синтаксиса — должно быть "syntax is ok"
sudo systemctl reload nginx
```

---

## Шаг 10. Подключение домена

В панели управления доменом (reg.ru, nic.ru, Timeweb и т.д.) создайте DNS-записи:

| Тип | Имя | Значение |
|-----|-----|---------|
| A   | @   | [IP_СЕРВЕРА] |
| A   | www | [IP_СЕРВЕРА] |

DNS-изменения применяются в течение нескольких минут — нескольких часов.

Проверьте, что домен указывает на сервер:

```bash
nslookup [ДОМЕН]
```

---

## Шаг 11. HTTPS через Let's Encrypt

После того как DNS обновился:

```bash
sudo certbot --nginx -d [ДОМЕН] -d www.[ДОМЕН]
```

Certbot автоматически:
- Выпустит сертификат
- Обновит конфигурацию nginx (добавит listen 443, SSL)
- Настроит редирект с HTTP на HTTPS

Проверьте автообновление сертификата:

```bash
sudo certbot renew --dry-run
```

---

## Шаг 12. Финальная проверка

```bash
# Приложение запущено
pm2 status

# nginx работает
sudo systemctl status nginx

# Откройте в браузере
# https://[ДОМЕН]                — главная страница
# https://[ДОМЕН]/sitemap.xml    — должен содержать ваш домен
# https://[ДОМЕН]/robots.txt     — должен содержать ваш домен
# https://[ДОМЕН]/admin          — должна открыться форма входа
```

---

## Шаг 13. Настройка cron для повторной доставки заявок

Заявки сохраняются немедленно, а Telegram-уведомление отправляется в фоне (через `after()` в Next.js).
Если первая попытка не удалась (например, Telegram недоступен), cron повторит доставку.

```bash
sudo nano /etc/cron.d/raspechatka-outbox
```

```cron
* * * * * deploy flock -n /tmp/raspechatka-outbox.lock curl -s -X POST \
  -H "x-outbox-secret: [OUTBOX_CRON_SECRET]" \
  http://127.0.0.1:3000/api/internal/delivery-outbox/process \
  > /dev/null 2>&1
```

> **Важно:** замените `[OUTBOX_CRON_SECRET]` на значение из `.env.production`.
> `flock -n` предотвращает параллельный запуск cron-задачи: если предыдущий вызов ещё
> не завершился, следующая минута пропускается.
> Cron обращается к `127.0.0.1:3000` напрямую — nginx блокирует `/api/internal/` снаружи.

---

## Шаг 14. Резервное копирование runtime-данных

Все заявки и загруженные файлы хранятся в `/var/lib/raspechatka`. Настройте автоматическое резервное копирование.

Простой вариант — ежедневный cron-архив:

```bash
sudo nano /etc/cron.d/raspechatka-backup
```

```cron
0 3 * * * deploy tar -czf /var/backups/raspechatka-$(date +\%Y-\%m-\%d).tar.gz /var/lib/raspechatka 2>/dev/null
0 4 * * * deploy find /var/backups -name "raspechatka-*.tar.gz" -mtime +30 -delete 2>/dev/null
```

Это создаёт ежедневный архив в 3:00 и удаляет архивы старше 30 дней.

Дополнительно: настройте копирование архивов на внешнее хранилище (Timeweb S3, Яндекс Объектное хранилище или другой облачный сервис).

---

## Шаг 15. Обновление приложения

При выходе новой версии:

```bash
cd /var/www/raspechatka
git pull
npm ci --production=false
npm run build
pm2 restart raspechatka
```

---

## Быстрая шпаргалка команд

| Что сделать | Команда |
|------------|---------|
| Посмотреть логи | `pm2 logs raspechatka` |
| Перезапустить приложение | `pm2 restart raspechatka` |
| Остановить приложение | `pm2 stop raspechatka` |
| Перезапустить nginx | `sudo systemctl reload nginx` |
| Проверить nginx | `sudo nginx -t` |
| Продлить сертификат вручную | `sudo certbot renew` |
| Статус всех процессов | `pm2 status` |

---

## Важно

- **Никогда не коммитьте** `.env.production` в Git
- **`/var/lib/raspechatka`** содержит заявки клиентов — делайте резервные копии
- После каждого `git pull` + `npm run build` выполняйте `pm2 restart raspechatka`
- `PRINTLAB_DATA_DIR` должен указывать на `/var/lib/raspechatka`, а не на папку проекта

---

## Будущая production-инфраструктура (Этапы 4A–4F)

> **Статус:** Приложение сейчас работает на JSON-хранилище (TEXT-файлы).
> Разделы ниже — подготовка к PostgreSQL, Redis и S3. Не применять до завершения Этапа 4C.

### Managed PostgreSQL (Timeweb)

```
Сервис : Timeweb Cloud → Базы данных → PostgreSQL
Версия : PostgreSQL 16
Регион : Москва (ru-1) — для минимальной задержки до VPS
Тариф  : от 1 CPU / 1 GB RAM (достаточно для старта)
```

1. Создайте базу данных в панели Timeweb Cloud.
2. Сохраните строку подключения вида:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
   ```
3. Добавьте в `.env.production`:
   ```env
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...   # без пулера, для миграций
   DATA_BACKEND=postgres
   ```
4. Добавьте IP-адрес VPS в whitelist PostgreSQL.
5. Используйте **приватную сеть** Timeweb, если VPS и PostgreSQL в одном регионе.
6. Выполните миграции при деплое:
   ```bash
   npm run db:migrate:deploy
   pm2 restart raspechatka
   ```

**Резервное копирование:** Timeweb делает автоматические бэкапы PostgreSQL.
Дополнительно — `pg_dump` в cron и загрузка на S3.

### Managed Redis (Timeweb / Valkey)

```
Сервис : Timeweb Cloud → Базы данных → Redis / Valkey
Регион : тот же, что и VPS
```

Нужен для Этапа 4D (BullMQ очередь, rate limiting):
```env
REDIS_URL=redis://USER:PASSWORD@HOST:6379
```

### Private S3 Bucket (Timeweb Object Storage)

```
Сервис : Timeweb Cloud → Объектное хранилище
Регион : ru-1
```

Нужен для Этапа 4E (хранение файлов заявок):
```env
S3_ENDPOINT=https://s3.timeweb.cloud
S3_REGION=ru-1
S3_BUCKET=raspechatka-order-files
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=false
```

Требования к бакету:
- **Приватный** (Private, без публичного доступа)
- Versioning: опционально
- Lifecycle: автоудаление объектов старше `ORDER_FILE_RETENTION_DAYS` дней

### Приватная сеть

Настройте все сервисы (VPS, PostgreSQL, Redis, S3) в одной приватной сети Timeweb.
Порты PostgreSQL (5432) и Redis (6379) **не открывать** во внешнем firewall.

### Резервное копирование PostgreSQL

```cron
# Ежедневный pg_dump с загрузкой в S3
0 2 * * * deploy pg_dump "$DATABASE_URL" | gzip > /tmp/raspechatka-db-$(date +\%Y-\%m-\%d).sql.gz && \
  aws s3 cp /tmp/raspechatka-db-$(date +\%Y-\%m-\%d).sql.gz \
  s3://raspechatka-backups/ --endpoint-url https://s3.timeweb.cloud && \
  rm /tmp/raspechatka-db-$(date +\%Y-\%m-\%d).sql.gz
```

Детальная инструкция — `docs/POSTGRES_MIGRATION_PLAN.md`.
