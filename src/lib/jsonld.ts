import { siteConfig } from "@/data/site";
import type { FaqItem, Product, Review } from "@/types";

const abs = (path: string) =>
  path.startsWith("http") ? path : `${siteConfig.url}${path}`;

/** Organization + LocalBusiness (рендерится в layout, один раз на сайт). */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    priceRange: "₽₽",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address,
      addressLocality: siteConfig.city,
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.geo.lat,
      longitude: siteConfig.geo.lon,
    },
    openingHours: "Mo-Su 09:00-21:00",
    sameAs: Object.values(siteConfig.social).filter(Boolean),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: siteConfig.aggregateRating.value,
      reviewCount: siteConfig.aggregateRating.count,
    },
  };
}

/** WebSite + SearchAction для расширенного сниппета в поиске. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: "ru-RU",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/catalog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: abs(product.image),
    material: product.material,
    brand: { "@type": "Brand", name: siteConfig.name },
    ...(product.reviewsCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewsCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: product.priceFrom,
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: abs(`/product/${product.slug}`),
      seller: { "@type": "Organization", name: siteConfig.name },
    },
  };
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function reviewsJsonLd(reviews: Review[]) {
  return reviews.map((r) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    author: { "@type": "Person", name: r.name },
    datePublished: r.date,
    reviewBody: r.text,
    reviewRating: {
      "@type": "Rating",
      ratingValue: r.rating,
      bestRating: 5,
    },
    itemReviewed: { "@type": "Organization", name: siteConfig.name },
  }));
}
