import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/features/products/ProductCard";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { categories } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";

export const metadata: Metadata = buildMetadata({
  title: "Каталог футболок с печатью",
  description:
    "Каталог футболок с печатью: oversize, классика, чёрные, парные и корпоративные модели. Премиальный хлопок, стойкая печать, заказ от одной штуки.",
  path: "/catalog",
  keywords: ["каталог футболок", "футболки с печатью", "купить футболку с принтом"],
});

export default function CatalogPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: "Каталог", path: "/catalog" },
        ])}
      />

      <Section className="pb-0 pt-10 sm:pt-14">
        <Breadcrumbs
          items={[
            { name: "Главная", href: "/" },
            { name: "Каталог", href: "/catalog" },
          ]}
        />
        <Reveal className="mt-6 max-w-3xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink text-balance sm:text-5xl">
            Каталог футболок с печатью
          </h1>
          <p className="mt-4 text-lg text-muted text-pretty">
            Выберите модель и оформите заказ или соберите свой дизайн в
            конструкторе. Все футболки печатаются на премиальном хлопке от одной
            штуки.
          </p>
        </Reveal>
      </Section>

      {categories.map((category) => {
        const items = getProductsByCategory(category.slug);
        if (items.length === 0) return null;
        return (
          <Section key={category.slug} id={category.slug} className="py-12 sm:py-14">
            <Container className="px-0">
              <Reveal className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                    {category.title}
                  </h2>
                  <p className="mt-1.5 max-w-xl text-sm text-muted">
                    {category.description}
                  </p>
                </div>
              </Reveal>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((p, i) => (
                  <Reveal key={p.slug} delay={(i % 4) * 0.05}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            </Container>
          </Section>
        );
      })}

      <Faq />
      <FinalCta />
    </>
  );
}
