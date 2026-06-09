/**
 * Единая конфигурация бренда и контактов.
 * Замените значения на реальные перед запуском (домен, телефон, мессенджеры).
 */

export const siteConfig = {
  name: "PRINTLAB",
  legalName: "PRINTLAB — студия печати",
  // Используется для canonical, sitemap, OG, JSON-LD.
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://printlab.ru",
  description:
    "Премиальная печать на футболках на заказ: с принтом, фото, надписью или логотипом. Без минимального тиража, бесплатный макет, печать от 1 дня.",
  tagline: "Печать на футболках, которой хочется хвастаться",
  locale: "ru_RU",
  // Контакты (заглушки — заменить на реальные).
  phone: "+7 (495) 000-00-00",
  phoneHref: "tel:+74950000000",
  email: "hello@printlab.ru",
  city: "Москва",
  address: "г. Москва, ул. Примерная, 1",
  hours: "Пн–Вс, 9:00–21:00",
  social: {
    telegram: "https://t.me/printlab",
    whatsapp: "https://wa.me/74950000000",
    instagram: "https://instagram.com/printlab",
    vk: "https://vk.com/printlab",
  },
  // Агрегированный рейтинг для hero и Schema.org.
  aggregateRating: {
    value: 4.9,
    count: 1842,
  },
} as const;

export type SiteConfig = typeof siteConfig;
