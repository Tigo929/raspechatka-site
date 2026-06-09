import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
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
import { getProductsByCategory, products } from "@/data/products";

const catalogMetadata = buildMetadata({
  title: "Каталог футболок с печатью",
  description:
    "Каталог футболок с печатью: oversize, классика, чёрные, парные и корпоративные модели. Премиальный хлопок, стойкая печать, заказ от одной штуки.",
  path: "/catalog",
  keywords: [
    "каталог футболок",
    "футболки с печатью",
    "купить футболку с принтом",
  ],
});

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = params?.q?.trim();

  if (!query) return catalogMetadata;

  return {
    ...catalogMetadata,
    title: `Поиск: ${query}`,
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const normalizedQuery = query.toLowerCase();
  const searchResults = normalizedQuery
    ? products.filter((product) => {
        const category = categories.find(
          (item) => item.slug === product.category,
        );
        const haystack = [
          product.title,
          product.excerpt,
          product.description,
          product.material,
          product.printMethod,
          category?.title,
          category?.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
    : [];

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: "Каталог", path: "/catalog" },
        ])}
      />

      <Section className="pt-10 pb-0 sm:pt-14">
        <Breadcrumbs
          items={[
            { name: "Главная", href: "/" },
            { name: "Каталог", href: "/catalog" },
          ]}
        />
        <Reveal className="mt-6 max-w-3xl">
          <h1 className="font-display text-ink text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Каталог футболок с печатью
          </h1>
          <p className="text-muted mt-4 text-lg text-pretty">
            Выберите модель и оформите заказ или соберите свой дизайн в
            конструкторе. Все футболки печатаются на премиальном хлопке от одной
            штуки.
          </p>
          <form
            action="/catalog"
            className="border-line shadow-soft mt-7 flex max-w-xl flex-col gap-2 rounded-2xl border bg-white p-2 sm:flex-row"
          >
            <label className="sr-only" htmlFor="catalog-search">
              Найти футболку
            </label>
            <div className="flex min-h-12 flex-1 items-center gap-2 px-3">
              <Search width={18} height={18} className="text-muted shrink-0" />
              <input
                id="catalog-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Например: фото, логотип, oversize"
                className="text-ink placeholder:text-muted w-full bg-transparent text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-ink text-paper hover:bg-ink-soft inline-flex h-12 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors"
            >
              Найти
            </button>
          </form>
        </Reveal>
      </Section>

      {query ? (
        <Section className="py-12 sm:py-14">
          <Container className="px-0">
            <Reveal className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-ink text-2xl font-bold sm:text-3xl">
                  Результаты поиска
                </h2>
                <p className="text-muted mt-1.5 max-w-xl text-sm">
                  {searchResults.length > 0
                    ? `По запросу «${query}» найдено: ${searchResults.length}`
                    : `По запросу «${query}» ничего не найдено`}
                </p>
              </div>
              <Link
                href="/catalog"
                className="text-accent text-sm font-semibold hover:underline"
              >
                Сбросить поиск
              </Link>
            </Reveal>
            {searchResults.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {searchResults.map((p, i) => (
                  <Reveal key={p.slug} delay={(i % 4) * 0.05}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <Reveal className="border-line shadow-soft rounded-3xl border bg-white p-8 text-center">
                <p className="text-muted">
                  Попробуйте запрос проще: «фото», «логотип», «чёрная» или
                  соберите дизайн в конструкторе.
                </p>
              </Reveal>
            )}
          </Container>
        </Section>
      ) : (
        categories.map((category) => {
          const items = getProductsByCategory(category.slug);
          if (items.length === 0) return null;
          return (
            <Section
              key={category.slug}
              id={category.slug}
              className="py-12 sm:py-14"
            >
              <Container className="px-0">
                <Reveal className="mb-8 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-display text-ink text-2xl font-bold sm:text-3xl">
                      {category.title}
                    </h2>
                    <p className="text-muted mt-1.5 max-w-xl text-sm">
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
        })
      )}

      <Faq />
      <FinalCta />
    </>
  );
}
