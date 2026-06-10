/**
 * Централизованный реестр изображений.
 *
 * Все публичные картинки хранятся локально. Чтобы заменить изображение на
 * сайте, поменяйте путь здесь в одном месте.
 */

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
  // Категории
  catPrint: "/categories/ready-print.webp",
  catPhoto: "/categories/photo-print.webp",
  catText: "/categories/text-print.webp",
  catLogo: "/categories/logo-print.webp",

  // Товары
  prodOversize: "/products/oversize-premium.webp",
  prodClassic: "/products/classic-cotton.webp",
  prodBlack: "/products/noir-heavy.webp",
  prodHanger: "/products/pair-edition.webp",
  prodRack: "/products/corporate-line.webp",
  prodFolded: "/products/photo-art.webp",

  // Сценарии использования
  useGift: "/use-cases/use-gift.webp",
  useBusiness: "/use-cases/use-business.webp",
  useEvent: "/use-cases/use-event.webp",
} as const;
