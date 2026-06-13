# PostgreSQL Migration Plan — «Распечатка»

## 1. Текущая JSON-архитектура

```
data/ (PRINTLAB_DATA_DIR)
  orders.json           ← все заявки (leads + orders)
  delivery-outbox.json  ← очередь доставки в Telegram
  analytics.ndjson      ← аналитические события (append-only)
  analytics.json        ← legacy формат (читается при старте)
  managed-reviews.json  ← отзывы (редактируются через /admin)
  managed-faq.json      ← FAQ (редактируются через /admin)
  managed-settings.json ← контакты, часы работы (singleton)
  managed-categories.json ← категории товаров (/admin)
  managed-content.json  ← CMS-блоки главной страницы
  catalog-products.json ← управляемые товары (/admin)
  base-products.json    ← seed-товары (read-only в runtime)
  media-versions.json   ← версии медиа-файлов (cache-buster)
  order-files/          ← загруженные изображения заявок
```

### Ограничения JSON-хранилища
- Один Node.js-процесс (PM2 `instances: 1`) из-за file-lock семантики
- Атомарные записи через tmp-файл + rename (POSIX atomic)
- Очередь мутаций in-process через Promise-цепочку
- Нет транзакций между orders.json и delivery-outbox.json

### Что хорошо работает сейчас
- Нулевая инфраструктура (только VPS)
- Полный контроль над данными
- Быстрый отклик через `after()` + async outbox
- Cron-reconciliation для crash-recovery

---

## 2. Целевая PostgreSQL-архитектура

```
PostgreSQL (Managed, Timeweb)
  Submission            ← заявки + контактные данные
  SubmissionFile        ← метаданные файлов (сами файлы → S3)
  DeliveryOutboxJob     ← очередь доставки + статус шагов
  DeliveryAttempt       ← история попыток (audit log)
  AnalyticsEvent        ← аналитические события
  ManagedReview         ← отзывы
  FaqItem               ← FAQ
  SiteSettings          ← singleton контакты
  Category              ← категории
  Product               ← управляемые товары
  MediaAsset            ← медиа-метаданные
  ManagedContent        ← CMS-блоки
  AuditLog              ← история изменений
  WorkerHeartbeat       ← здоровье воркеров
  RetentionRun          ← журнал удаления старых данных

S3 / MinIO (Этап 4E)
  order-files/          ← загруженные изображения заявок
```

### Преимущества PostgreSQL
- Параллельные процессы (PM2 cluster), горизонтальное масштабирование
- ACID транзакции: Submission + Files + OutboxJob атомарно
- Индексированные запросы вместо scan всего JSON
- Row-level locking вместо in-process Promise-queue
- Встроенные типы: JSONB, UUID, timestamptz, enum
- Готовность к BullMQ (Этап 4D) и retention-jobs (Этап 4F)

---

## 3. Какие данные переносятся в PostgreSQL

| Источник | Модель PostgreSQL | Приоритет |
|---|---|---|
| `orders.json` | `Submission` + `SubmissionFile` | Этап 4B/4C |
| `delivery-outbox.json` | `DeliveryOutboxJob` + `DeliveryAttempt` | Этап 4B/4C |
| `analytics.ndjson` | `AnalyticsEvent` | Этап 4B/4C |
| `managed-reviews.json` | `ManagedReview` | Этап 4B/4C |
| `managed-faq.json` | `FaqItem` | Этап 4B/4C |
| `managed-settings.json` | `SiteSettings` | Этап 4B/4C |
| `managed-categories.json` | `Category` | Этап 4B/4C |
| `catalog-products.json` | `Product` | Этап 4B/4C |
| `managed-content.json` | `ManagedContent` | Этап 4B/4C |
| `media-versions.json` | `MediaAsset` | Этап 4B/4C |

---

## 4. Какие данные останутся seed (не переносятся)

| Источник | Причина |
|---|---|
| `data/base-products.json` | Read-only seed, не редактируется через /admin |
| `src/data/products.ts` | Статические TypeScript-данные, часть кодовой базы |
| `src/data/reviews.ts` | Seed-отзывы, уже вынесены в managed-reviews |
| `src/data/faq.ts` | Seed-FAQ, уже вынесены в managed-faq |
| `src/data/categories.ts` | Seed-категории, уже вынесены в managed-categories |
| `data/orders.example.json` | Документационный файл, 0 записей |

Seed-данные остаются в репозитории как fallback при старте.

---

## 5. Какие данные позже уйдут в S3 (Этап 4E)

| Источник | Цель |
|---|---|
| `data/order-files/**` | Private S3 bucket (Timeweb / MinIO) |
| Новые загрузки через configurator | Напрямую в S3 |
| `SubmissionFile.storageKey` | Object key в S3 |
| Presigned URL | Временные ссылки для скачивания из /admin |

---

## 6. DATA_BACKEND feature flag

```bash
# .env.local / .env.production
DATA_BACKEND=json      # default — JSON-хранилище, production сейчас
DATA_BACKEND=postgres  # PostgreSQL через Prisma (Этап 4C+)
```

Логика переключения (`src/lib/storage/storage-config.ts`):

```typescript
getDataBackend()      // "json" | "postgres"
isJsonBackend()       // true если DATA_BACKEND=json или не задан
isPostgresBackend()   // true если DATA_BACKEND=postgres
```

Production **не переключается** автоматически. Cutover требует:
1. Запущенный Этап 4B (import в локальный PostgreSQL)
2. Parity-check (сравнение JSON ↔ PostgreSQL)
3. Запущенный Этап 4C (PostgreSQL repositories)
4. Явного `DATA_BACKEND=postgres` в `.env.production`
5. Деплоя и повторного smoke-теста

---

## 7. Локальный запуск PostgreSQL

```bash
# Запустить все dev-сервисы
docker compose -f docker-compose.dev.yml up -d

# Проверить здоровье
docker compose -f docker-compose.dev.yml ps

# Подключиться к PostgreSQL
docker compose -f docker-compose.dev.yml exec postgres \
  psql -U raspechatka_dev -d raspechatka_dev

# MinIO Console
open http://localhost:9001
# Login: raspechatka_dev / dev_minio_password_change_in_production
```

Добавить в `.env.local`:
```env
DATABASE_URL=postgresql://raspechatka_dev:dev_password_change_in_production@localhost:5432/raspechatka_dev
DIRECT_URL=postgresql://raspechatka_dev:dev_password_change_in_production@localhost:5432/raspechatka_dev
```

---

## 8. Prisma migrate dev (локальная разработка)

```bash
# Сгенерировать клиент из schema
npm run db:generate

# Создать и применить миграции
npm run db:migrate:dev

# Валидация schema
npm run db:validate

# Форматирование schema
npm run db:format

# Prisma Studio (GUI для данных)
npm run db:studio
```

**Важно:** `DATABASE_URL` должен быть задан в `.env.local` или `DATABASE_URL=... npm run db:migrate:dev`.

---

## 9. Prisma migrate deploy (production)

```bash
# На production-сервере после деплоя нового кода
npx prisma migrate deploy
```

`migrate deploy` применяет уже существующие SQL-миграции из `prisma/migrations/`.
Не создаёт новые миграции — только применяет.

---

## 10. Dry-run importer

```bash
# Анализ без изменений БД (безопасно, всегда доступно)
npm run db:import-json:dry

# Реальный import (только Этап 4B, только по явной команде)
npm run db:import-json
```

Dry-run выводит:
- Количество записей по категориям
- Распределение по статусам и видам
- Дубликаты idempotencyKey и ID
- Orphaned files на диске
- Ссылки на отсутствующие файлы
- Оценку количества inserts в PostgreSQL

Гарантии:
- Не изменяет исходные JSON/NDJSON файлы
- Не пишет в PostgreSQL
- Не раскрывает PII (только агрегаты и reference)

---

## 11. Rollback

Стратегия отката:
1. **До cutover**: `DATA_BACKEND=json` — просто не меняем flag
2. **После cutover**: переключить `DATA_BACKEND=json` → рестарт процесса
3. JSON-файлы **не удаляются** до Этапа 4F+
4. Последняя запись в JSON сохраняется параллельно (Этап 4C) до полного подтверждения

---

## 12. Следующие этапы

```
Этап 4B: Import + Parity
  - реальный import в локальный PostgreSQL
  - parity-report: JSON vs PostgreSQL record counts
  - повторный import (идемпотентность)
  - rollback rehearsal

Этап 4C: PostgreSQL repositories
  - Реализация ISubmissionRepository для Postgres
  - Реализация IOutboxRepository для Postgres
  - Транзакция: Submission + Files + OutboxJob атомарно
  - Переключение DATA_BACKEND=postgres в dev
  - Smoke-тест через HTTP

Этап 4D: Redis + BullMQ
  - BullMQ queue вместо JSON-outbox
  - Отдельный worker-процесс
  - Redis rate limiter
  - Убираем in-process mutation queue

Этап 4E: S3
  - @aws-sdk/client-s3 адаптер
  - Приватный bucket
  - Миграция существующих order-files
  - Presigned URL для /admin
  - Lifecycle rules для retention

Этап 4F: Observability
  - Retention job (deletedFiles, failedFiles → RetentionRun)
  - Sentry error tracking
  - Health endpoints (/api/health, /api/health/db)
  - WorkerHeartbeat
  - Мониторинг (Grafana / Yandex Cloud Monitoring)
```
