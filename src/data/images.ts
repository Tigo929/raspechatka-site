/**
 * Централизованный реестр изображений.
 *
 * Все картинки — легальные стоки (см. IMAGE_SOURCES.md). Чтобы заменить
 * изображение на сайте, поменяйте URL здесь в одном месте. Домены источников
 * перечислены в next.config.ts (remotePatterns).
 *
 * Помощник `unsplash()` строит оптимизированный URL; next/image затем
 * пережимает в AVIF/WebP под нужный размер.
 */

function unsplash(id: string, w = 1200, q = 70): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;
}

export interface HeroSlide {
  src: string;
  alt: string;
  label: string;
  title: string;
}

export const heroSlides: HeroSlide[] = [
  {
    src: "/home/hero-print-01.webp",
    alt: "Белая футболка с ярким абстрактным принтом на модели",
    label: "Фронт",
    title: "Принт выглядит как часть ткани",
  },
  {
    src: "/home/hero-print-02.webp",
    alt: "Чёрная оверсайз-футболка с цветным принтом на груди",
    label: "Чёрная",
    title: "Контрастные цвета на тёмном хлопке",
  },
  {
    src: "/home/hero-print-03.webp",
    alt: "Белая футболка со спины с крупным принтом",
    label: "Спина",
    title: "Отдельная зона для крупного принта",
  },
  {
    src: "/home/hero-print-04.webp",
    alt: "Клиент держит белую футболку с готовым принтом",
    label: "Выдача",
    title: "Показываем результат до передачи",
  },
  {
    src: "/home/hero-print-05.webp",
    alt: "Крупный план чёрной футболки с деталью цветного принта",
    label: "Деталь",
    title: "Фактура ткани и стойкая печать",
  },
  {
    src: "/home/hero-print-06.webp",
    alt: "Несколько футболок с разными принтами на вешалках",
    label: "Тираж",
    title: "Один стиль для всей команды",
  },
];

export const images = {
  hero: heroSlides[0].src,
  heroSecondary: unsplash("photo-1620799140408-edc6dcb6d633", 900),

  // Категории
  catPrint: unsplash("photo-1576566588028-4147f3842f27", 900),
  catPhoto: unsplash("photo-1622445275576-721325763afe", 900),
  catText: unsplash("photo-1618354691373-d851c5c3a990", 900),
  catLogo: unsplash("photo-1556905055-8f358a7a47b2", 900),

  // Товары
  prodOversize: unsplash("photo-1521572163474-6864f9cf17ab", 900),
  prodClassic: unsplash("photo-1583743814966-8936f5b7be1a", 900),
  prodBlack: unsplash("photo-1593030761757-71fae45fa0e7", 900),
  prodHanger: unsplash("photo-1571945153237-4929e783af4a", 900),
  prodRack: unsplash("photo-1562157873-818bc0726f68", 900),
  prodFolded: unsplash("photo-1523381210434-271e8be1f52b", 900),

  // Сценарии использования
  useGift: unsplash("photo-1434389677669-e08b4cac3105", 900),
  useBusiness: unsplash("photo-1503454537195-1dcabb73ffb9", 900),
  useEvent: unsplash("photo-1551232864-3f0890e580d9", 900),

  // Производство / процесс
  workshop: unsplash("photo-1487222477894-8943e31ef7b2", 1200),
  fabric: unsplash("photo-1581655353564-df123a1eb820", 1200),
} as const;

export type ImageKey = keyof typeof images;
