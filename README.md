# PRINTLAB

Премиальный коммерческий сайт студии печати на футболках на заказ.
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Motion.

> Не лендинг и не MVP — фундамент e-commerce-бизнеса с прицелом на SEO-трафик
> (Google + Яндекс), доверие и конверсию. Подробности — в [CLAUDE.md](CLAUDE.md).

## Быстрый старт

```bash
npm install
npm run dev      # http://localhost:3000
```

Прод-сборка:

```bash
npm run build
npm run start
```

Качество кода:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint (next/core-web-vitals)
npm run format      # Prettier
```

## Что внутри

- **Главная** — Hero, бегущая строка доверия, преимущества, категории,
  популярные товары, конструктор, сценарии, «как работаем», цены, отзывы,
  гарантии, FAQ, SEO-текст, финальный CTA.
- **Каталог** (`/catalog`) — товары по категориям.
- **SEO-посадочные** (`/catalog/[slug]`) — 10 страниц под ключевые запросы.
- **Карточка товара** (`/product/[slug]`) — описание, характеристики, заказ.
- **Админ-панель** (`/admin`) — создание, редактирование, публикация и удаление
  карточек готовых принтов с загрузкой изображения.
- **Конструктор** (`/configurator`) — белая/чёрная футболка, вид спереди/сзади,
  загрузка изображения, позиция, масштаб, видимая зона печати и оформление заказа.
- **SEO** — Metadata API, canonical, OG/Twitter, robots, sitemap, JSON-LD
  (Organization, LocalBusiness, WebSite, Product, FAQPage, Breadcrumb, Review).

## Структура

```
src/
  app/          # роуты, layout, robots, sitemap, og-image
  components/   # ui/ · layout/ · sections/ · seo/
  features/     # configurator/ · products/
  data/         # весь контент: site, products, categories, reviews, faq, seoLandings…
  lib/          # seo, jsonld, utils
  types/        # доменные типы
```

## Настройка под себя

1. **Бренд и контакты** — [`src/data/site.ts`](src/data/site.ts) (домен через
   `NEXT_PUBLIC_SITE_URL`, телефон, мессенджеры, реквизиты).
2. **Базовые товары / категории** — [`src/data/products.ts`](src/data/products.ts),
   [`src/data/categories.ts`](src/data/categories.ts). Управляемые товары
   сохраняются в [`data/catalog-products.json`](data/catalog-products.json).
3. **Изображения** — [`src/data/images.ts`](src/data/images.ts)
   (см. [IMAGE_SOURCES.md](IMAGE_SOURCES.md)).
4. **Отзывы / FAQ / посадочные** — соответствующие файлы в `src/data`.
5. **Приём заявок** — сейчас заказ ведёт в WhatsApp/Telegram; точка расширения
   до формы/CRM описана в [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) (Фаза 2).

## Админ-панель

1. Скопируйте переменные из [`.env.example`](.env.example) в `.env.local`.
2. Задайте уникальные `ADMIN_PASSWORD` и `ADMIN_SESSION_SECRET` длиной от 12
   символов.
3. Перезапустите сервер и откройте `http://localhost:3000/admin`.

Админка принимает JPG, PNG и WebP до 8 МБ. Изображения сохраняются в
`public/uploads/products`, данные карточек — в `data/catalog-products.json`.
Запись выполняется атомарно, а изменения сразу видны в каталоге, поиске,
карточке товара, SEO-посадочной готовых принтов и sitemap.

Файловое хранилище рассчитано на обычный Node.js-сервер с постоянным диском.
При деплое на serverless-платформу с эфемерной файловой системой подключите
постоянный диск или замените адаптер `src/lib/product-repository.ts` на БД и
объектное хранилище.

## Документация

- [CLAUDE.md](CLAUDE.md) — архитектура и решения.
- [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) — фазы развития.
- [SEO_PLAN.md](SEO_PLAN.md) — техническое SEO и семантика.
- [CONVERSION_NOTES.md](CONVERSION_NOTES.md) — логика конверсии по блокам.
- [IMAGE_SOURCES.md](IMAGE_SOURCES.md) — источники изображений и замена.

> Демо-контент (тексты, цены, изображения, отзывы) — заглушки для наполнения.
> Замените на реальные данные бизнеса перед запуском.
