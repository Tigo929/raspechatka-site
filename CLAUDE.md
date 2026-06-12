# CLAUDE.md — «Распечатка»

Контекст проекта для Claude Code и любого инженера, который продолжит работу.

## Что это

**«Распечатка»** — премиальный коммерческий сайт студии печати на футболках.
Цель не «лендинг», а фундамент e-commerce-бизнеса: SEO-трафик из Google и
Яндекса, работа с рекламным трафиком, удержание, доверие и конверсия в заявку/заказ.

Язык интерфейса — **русский** (целевой рынок — РФ/СНГ).

## Стек

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first конфиг через `@theme` в `globals.css`)
- **motion** (Framer Motion 11) — основная анимационная библиотека
- **lucide-react** — иконки
- `clsx` + `tailwind-merge` — утилита `cn()`

### Почему Framer Motion, а не GSAP

GSAP ScrollTrigger мощнее, но тяжелее и избыточен для текущих сценариев.
Framer Motion (`whileInView`, `useScroll`, layout-анимации) закрывает scroll-reveal,
micro-interactions и переходы при меньшем бандле — это прямой выигрыш в Core Web
Vitals, а значит в SEO и конверсии. GSAP остаётся документированной опцией для
сложных timeline-сцен (см. `PROJECT_ROADMAP.md`). Анимации уважают
`prefers-reduced-motion`.

## Архитектура

Feature-based структура внутри `src/`:

```
src/
  app/                 # роуты App Router, layout, metadata, robots, sitemap
    (страницы)/page.tsx
    catalog/[slug]/    # SEO-посадочные под ключевые запросы
    product/[slug]/    # карточки товаров
    configurator/      # конструктор футболки
  components/
    ui/                # примитивы: Button, Container, Section, Badge, Reveal...
    layout/            # Header, Footer, MobileStickyCTA
    sections/          # секции главной: Hero, Benefits, Reviews, FAQ...
  features/
    configurator/      # логика конструктора (state, превью, контролы)
    products/          # ProductCard и связанное
  data/                # ЕДИНЫЙ источник контента: products, reviews, faq,
                       # categories, seoLandings, benefits, steps, site
  lib/                 # seo (metadata helpers), jsonld (Schema.org), utils
  types/               # общие типы
```

### Принципы

- **Контент в `src/data`**, не в JSX. Базовые товары лежат в data-слое, а
  управляемые товары создаются через `/admin` и сохраняются в
  `data/catalog-products.json`.
- **Server Components по умолчанию.** `"use client"` только там, где нужна
  интерактивность (конфигуратор, анимации, мобильное меню).
- **SEO как первый класс.** Каждая страница экспортирует `metadata`/`generateMetadata`,
  JSON-LD рендерится через хелперы из `lib/jsonld.ts`.
- **Mobile-first.** Базовые стили — мобильные, `md:`/`lg:` — это апгрейд.
- **Изображения** — `next/image`, базовые источники в `src/data`, загрузки
  админки в `public/uploads/products`.

## Конфигуратор

`src/features/configurator`. Пользователь выбирает белую/чёрную футболку,
сторону печати (перед/спина), загружает изображение, двигает/масштабирует его
в видимой зоне печати, видит превью на реалистичном mockup-фото и оформляет
заказ **только по явной кнопке**. Загруженное изображение обрабатывается
локально (object URL) — на сервер ничего не уходит. Это основа: расширяется до
бэкенда/корзины.

## Конверсия (правила)

Каждый блок отвечает на вопрос: «приближает ли это к заказу?». Sticky CTA на
мобильных, быстрый контакт (Telegram/MAX), отзывы, гарантии, отработка
возражений. Подробно — `CONVERSION_NOTES.md`.

## Команды

```bash
npm run dev        # дев-сервер
npm run build      # прод-сборка
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run format     # Prettier
```

## Замена контента под реальный бизнес

1. Реквизиты, контакты, домен, соцсети — `src/data/site.ts`.
2. Базовые товары — `src/data/products.ts`; новые готовые принты — `/admin`.
   Категории — `src/data/categories.ts`.
3. Изображения — заменить URL в data-файлах (см. `IMAGE_SOURCES.md`).
4. Отзывы/FAQ — `src/data/reviews.ts`, `src/data/faq.ts`.
5. Telegram-приём заявок настраивается через `TELEGRAM_BOT_TOKEN` и
   `TELEGRAM_CHAT_ID`; CRM остаётся точкой расширения в `src/features/order`.
