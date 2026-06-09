# IMAGE_SOURCES — PRINTLAB

Большая часть демонстрационных изображений — со стока **Unsplash** по
[лицензии Unsplash](https://unsplash.com/license) (бесплатное коммерческое
использование, без обязательной атрибуции).

Главный экран и конфигуратор используют локальные сгенерированные ассеты без
реальных брендов, логотипов и текста. Это временный демонстрационный контент:
перед запуском замените его на собственные фото готовых работ, если они есть.

## Как заменить

Все ссылки собраны в одном месте — [`src/data/images.ts`](src/data/images.ts).
Поменяйте URL у нужного ключа (или подставьте локальный файл из `/public`).
Разрешённые домены для `next/image` заданы в [`next.config.ts`](next.config.ts)
(`images.remotePatterns`). Размер и качество настраиваются хелпером `unsplash()`.

## Реестр

| Ключ (`images.*`) | Где используется                   | Unsplash photo ID                | Ссылка                                   |
| ----------------- | ---------------------------------- | -------------------------------- | ---------------------------------------- |
| `hero`            | Главный экран (Hero), первый слайд | generated                        | `public/home/hero-print-01.webp`         |
| `heroSecondary`   | Резерв для Hero                    | photo-1620799140408-edc6dcb6d633 | https://unsplash.com/photos/edc6dcb6d633 |
| `catPrint`        | Категория «С готовым принтом»      | photo-1576566588028-4147f3842f27 | https://unsplash.com/photos/4147f3842f27 |
| `catPhoto`        | Категория «С вашим фото»           | photo-1622445275576-721325763afe | https://unsplash.com/photos/721325763afe |
| `catText`         | Категория «С надписью»             | photo-1618354691373-d851c5c3a990 | https://unsplash.com/photos/d851c5c3a990 |
| `catLogo`         | Категория «С логотипом»            | photo-1556905055-8f358a7a47b2    | https://unsplash.com/photos/8f358a7a47b2 |
| `prodOversize`    | Товар «Oversize Premium»           | photo-1521572163474-6864f9cf17ab | https://unsplash.com/photos/6864f9cf17ab |
| `prodClassic`     | Товар «Classic Cotton»             | photo-1583743814966-8936f5b7be1a | https://unsplash.com/photos/8936f5b7be1a |
| `prodBlack`       | Товар «Noir Heavy»                 | photo-1593030761757-71fae45fa0e7 | https://unsplash.com/photos/71fae45fa0e7 |
| `prodHanger`      | Товар «Pair Edition»               | photo-1571945153237-4929e783af4a | https://unsplash.com/photos/4929e783af4a |
| `prodRack`        | Товар «Corporate Line»             | photo-1562157873-818bc0726f68    | https://unsplash.com/photos/818bc0726f68 |
| `prodFolded`      | Товар «Photo Art»                  | photo-1523381210434-271e8be1f52b | https://unsplash.com/photos/271e8be1f52b |
| `useGift`         | Сценарий «Подарок»                 | photo-1434389677669-e08b4cac3105 | https://unsplash.com/photos/e08b4cac3105 |
| `useBusiness`     | Сценарий «Мерч и брендинг»         | photo-1503454537195-1dcabb73ffb9 | https://unsplash.com/photos/1dcabb73ffb9 |
| `useEvent`        | Сценарий «Мероприятия»             | photo-1551232864-3f0890e580d9    | https://unsplash.com/photos/3f0890e580d9 |
| `workshop`        | Резерв (процесс/производство)      | photo-1487222477894-8943e31ef7b2 | https://unsplash.com/photos/8943e31ef7b2 |
| `fabric`          | Резерв (ткань)                     | photo-1581655353564-df123a1eb820 | https://unsplash.com/photos/df123a1eb820 |

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
