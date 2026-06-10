# IMAGE_SOURCES — PRINTLAB

Главный экран, категории, каталог, сценарии использования и конфигуратор
используют локальные сгенерированные ассеты без реальных брендов, логотипов и
читаемого текста. Перед запуском их можно заменить собственными фото работ.

## Как заменить

Пути базовых изображений собраны в [`src/data/images.ts`](src/data/images.ts).
Файлы находятся в `/public`. Изображения товаров из админ-панели автоматически
сохраняются в `public/uploads/products`.

## Реестр

| Ключ (`images.*`) | Где используется              | Источник  | Ссылка                                  |
| ----------------- | ----------------------------- | --------- | --------------------------------------- |
| `catPrint`        | Категория «С готовым принтом» | generated | `public/categories/ready-print.webp`    |
| `catPhoto`        | Категория «С вашим фото»      | generated | `public/categories/photo-print.webp`    |
| `catText`         | Категория «С надписью»        | generated | `public/categories/text-print.webp`     |
| `catLogo`         | Категория «С логотипом»       | generated | `public/categories/logo-print.webp`     |
| `prodOversize`    | Товар «Oversize Premium»      | generated | `public/products/oversize-premium.webp` |
| `prodClassic`     | Товар «Classic Cotton»        | generated | `public/products/classic-cotton.webp`   |
| `prodBlack`       | Товар «Noir Heavy»            | generated | `public/products/noir-heavy.webp`       |
| `prodHanger`      | Товар «Pair Edition»          | generated | `public/products/pair-edition.webp`     |
| `prodRack`        | Товар «Corporate Line»        | generated | `public/products/corporate-line.webp`   |
| `prodFolded`      | Товар «Photo Art»             | generated | `public/products/photo-art.webp`        |
| `useGift`         | Сценарий «Подарок»            | generated | `public/use-cases/use-gift.webp`        |
| `useBusiness`     | Сценарий «Мерч и брендинг»    | generated | `public/use-cases/use-business.webp`    |
| `useEvent`        | Сценарий «Мероприятия»        | generated | `public/use-cases/use-event.webp`       |

## Прочая графика

- **Логотип** — текстовый («PRINTLAB»), без растровых файлов.
- **OG-картинка** — генерируется динамически в [`src/app/opengraph-image.tsx`](src/app/opengraph-image.tsx) (next/og), сторонних изображений не использует.
- **Иконки** — [lucide-react](https://lucide.dev) (ISC License).
- **Аватары отзывов** — инициалы на CSS-градиенте, внешних изображений нет.

## Сгенерированные mockup-ассеты

Файлы ниже созданы через встроенный `image_gen` для конфигуратора и сохранены в
[`public/mockups`](public/mockups). Это нейтральные студийные изображения без
логотипов и текста, поверх которых в UI отображается зона печати.

| Файл                                     | Где используется                    |
| ---------------------------------------- | ----------------------------------- |
| `public/mockups/tshirt-white-front.webp` | Конструктор: белая футболка, перед  |
| `public/mockups/tshirt-white-back.webp`  | Конструктор: белая футболка, спина  |
| `public/mockups/tshirt-black-front.webp` | Конструктор: чёрная футболка, перед |
| `public/mockups/tshirt-black-back.webp`  | Конструктор: чёрная футболка, спина |

## Сгенерированные hero-фото

Файлы ниже созданы через встроенный `image_gen` для первого экрана и сохранены в
[`public/home`](public/home). Они используются в `heroSlides` из
[`src/data/images.ts`](src/data/images.ts).

| Файл                             | Смысл кадра                                    |
| -------------------------------- | ---------------------------------------------- |
| `public/home/hero-print-01.webp` | Белая футболка с фронтальным принтом на модели |
| `public/home/hero-print-02.webp` | Чёрная оверсайз-футболка с контрастным принтом |
| `public/home/hero-print-03.webp` | Крупный принт на спине                         |
| `public/home/hero-print-04.webp` | Клиент держит готовую футболку                 |
| `public/home/hero-print-05.webp` | Деталь ткани и печати крупным планом           |
| `public/home/hero-print-06.webp` | Небольшой тираж футболок на вешалках           |

## Сгенерированные карточки и каталог

Файлы ниже созданы через встроенный `image_gen`, затем сжаты в WebP и сохранены
в проекте. Они заменяют прежние стоковые изображения, чтобы карточки совпадали с
описанием.

| Файл                                    | Где используется                 |
| --------------------------------------- | -------------------------------- |
| `public/use-cases/use-gift.webp`        | Сценарий «Подарок с характером»  |
| `public/use-cases/use-business.webp`    | Сценарий «Мерч и брендинг»       |
| `public/use-cases/use-event.webp`       | Сценарий «Мероприятия и команды» |
| `public/categories/ready-print.webp`    | Категория «С готовым принтом»    |
| `public/categories/photo-print.webp`    | Категория «С вашим фото»         |
| `public/categories/text-print.webp`     | Категория «С надписью»           |
| `public/categories/logo-print.webp`     | Категория «С логотипом»          |
| `public/products/oversize-premium.webp` | Товар «Oversize Premium»         |
| `public/products/classic-cotton.webp`   | Товар «Classic Cotton»           |
| `public/products/noir-heavy.webp`       | Товар «Noir Heavy»               |
| `public/products/pair-edition.webp`     | Товар «Pair Edition»             |
| `public/products/corporate-line.webp`   | Товар «Corporate Line»           |
| `public/products/photo-art.webp`        | Товар «Photo Art»                |
