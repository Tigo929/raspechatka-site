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

export const images = {
  hero: unsplash("photo-1503341504253-dff4815485f1", 1600),
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
