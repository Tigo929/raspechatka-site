import type { Metadata } from "next";
import { siteConfig } from "@/data/site";

interface BuildMetaArgs {
  title?: string;
  description?: string;
  /** Путь без домена, например "/catalog/futbolka-s-printom". */
  path?: string;
  keywords?: string[];
  images?: string[];
}

/**
 * Единый билдер метаданных: title-шаблон, canonical, Open Graph, Twitter.
 * Базовые поля (metadataBase, шаблон, OG-картинка) заданы в layout.
 */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  keywords,
  images,
}: BuildMetaArgs): Metadata {
  const canonical = path;
  const ogImages = images ?? [`/opengraph-image`];

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title: title ?? siteConfig.name,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? siteConfig.name,
      description,
      images: ogImages,
    },
  };
}
