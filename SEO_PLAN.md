# SEO_PLAN — PRINTLAB

Цель: органический трафик из **Google** и **Яндекса** + хорошая работа с рекламой.

## Технический SEO (реализовано)

- **Next.js App Router + SSR/SSG** — статически генерируем главную, каталог,
  посадочные и карточки товаров (`generateStaticParams`).
- **Metadata API** на каждой странице: `title`, `description`, `keywords`,
  canonical, Open Graph, Twitter Cards. Базовый шаблон в `src/lib/seo.ts`.
- **robots.txt** — `src/app/robots.ts` (разрешён обход пользовательских страниц,
  закрыт `/api/`; указан sitemap).
- **sitemap.xml** — `src/app/sitemap.ts` (главная + все посадочные + товары).
- **Schema.org JSON-LD** через `src/lib/jsonld.ts`:
  - `Organization` + `LocalBusiness` (в layout),
  - `WebSite` с `SearchAction`,
  - `Product` + `Offer` + `AggregateRating` (карточки),
  - `BreadcrumbList` (каталог/товар/посадочные),
  - `FAQPage` (блок FAQ),
  - `Review` (отзывы).
- **Семантическая разметка**: один `<h1>` на страницу, корректная иерархия
  заголовков, `<nav aria-label>`, alt у изображений, `lang="ru"`.
- **Производительность = ранжирование**: next/image (AVIF/WebP), next/font,
  ленивые тяжёлые блоки, минимум client-JS. Core Web Vitals — приоритет.

## Семантическое ядро → посадочные (`src/data/seoLandings.ts`)

Каждая посадочная — отдельный URL `/catalog/[slug]` с уникальными title/description,
H1, продающим текстом, подборкой товаров и FAQ под интент:

| URL slug               | Ключевой запрос        |
| ---------------------- | ---------------------- |
| futbolka-s-printom     | футболка с принтом     |
| pechat-na-futbolkah    | печать на футболках    |
| futbolka-s-foto        | футболка с фото        |
| futbolka-s-nadpisyu    | футболка с надписью    |
| futbolka-s-logotipom   | футболка с логотипом   |
| korporativnye-futbolki | корпоративные футболки |
| merch-na-zakaz         | мерч на заказ          |
| podarok-s-printom      | подарок с принтом      |
| parnye-futbolki        | парные футболки        |
| futbolki-dlya-biznesa  | футболки для бизнеса   |

## Контент-стратегия (Фаза 2+)

- Блог/гайды под информационные запросы («как выбрать футболку под печать»,
  «DTG vs шелкография», «размерная сетка») → перелинковка на посадочные.
- Программные страницы «город × услуга» для гео-трафика (LocalBusiness на город).
- Сбор отзывов с фото для расширенных сниппетов (Review/Rating).

## Чек-лист перед запуском

- [ ] Заменить `NEXT_PUBLIC_SITE_URL` на реальный домен (`src/data/site.ts`).
- [ ] Подтвердить домен в Google Search Console и Яндекс.Вебмастере.
- [ ] Подключить GA4 + Яндекс.Метрику, настроить цели (клик CTA, отправка заявки).
- [ ] Сгенерировать реальные OG-картинки (сейчас динамический `opengraph-image`).
- [ ] Проверить sitemap и robots на проде, отправить sitemap в обе панели.
