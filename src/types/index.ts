/** Общие типы домена PRINTLAB. */

export interface ProductColor {
  name: string;
  /** HEX для свотча и превью в конфигураторе. */
  hex: string;
}

export interface Product {
  slug: string;
  title: string;
  /** Короткое описание для карточки. */
  excerpt: string;
  /** Полное описание для страницы товара. */
  description: string;
  priceFrom: number;
  rating: number;
  reviewsCount: number;
  /** Категория (slug из categories). */
  category: string;
  image: string;
  imageAlt: string;
  colors: ProductColor[];
  /** Материал/состав — снижает возражения по качеству. */
  material: string;
  /** Метод печати. */
  printMethod: string;
  badge?: string;
  /** Управляемые из админ-панели товары можно скрывать без удаления. */
  published?: boolean;
  /** Системное поле для административного интерфейса. */
  managed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedProduct extends Product {
  managed: true;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  slug: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

/** Источник отзыва — для бейджа платформы и фильтрации. */
export type ReviewSource = "yandex" | "avito" | "manual";

export interface Review {
  name: string;
  /** Город/контекст — повышает доверие. */
  context: string;
  rating: number;
  text: string;
  date: string;
  /** Откуда отзыв (Яндекс.Карты / Avito). По умолчанию manual. */
  source?: ReviewSource;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Benefit {
  /** Имя иконки из lucide-react. */
  icon: string;
  title: string;
  text: string;
}

export interface Step {
  title: string;
  text: string;
}

export interface UseCase {
  title: string;
  text: string;
  image: string;
  imageAlt: string;
}

/** SEO-посадочная под конкретный поисковый интент. */
export interface SeoLanding {
  slug: string;
  /** H1 и заголовок страницы. */
  heading: string;
  metaTitle: string;
  metaDescription: string;
  keyword: string;
  intro: string;
  /** Продающие подзаголовки/абзацы. */
  sellingPoints: { title: string; text: string }[];
  /** Slug'и товаров для подборки. */
  productSlugs: string[];
  faq: FaqItem[];
}
