import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";
import { getAllProducts } from "@/lib/product-repository";
import { seoLandings } from "@/data/seoLandings";

// Стабильные даты предотвращают ложное «обновление» в глазах Google при каждом деплое.
// Меняйте дату вручную при смысловом изменении страницы.
const SITE_LAUNCH = new Date("2025-06-01");
const CATALOG_UPDATED = new Date("2025-06-01");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: SITE_LAUNCH,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/catalog`,
      lastModified: CATALOG_UPDATED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/configurator`,
      lastModified: SITE_LAUNCH,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const landingRoutes: MetadataRoute.Sitemap = seoLandings.map((l) => ({
    url: `${base}/catalog/${l.slug}`,
    lastModified: CATALOG_UPDATED,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const products = await getAllProducts();
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: CATALOG_UPDATED,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...landingRoutes, ...productRoutes];
}
