import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/features/products/ProductCard";
import { LeadCta } from "@/components/sections/LeadCta";
import { Faq } from "@/components/sections/Faq";
import { Reviews } from "@/components/sections/Reviews";
import { FinalCta } from "@/components/sections/FinalCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd, reviewsJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getLanding, seoLandings } from "@/data/seoLandings";
import { getAllProducts } from "@/lib/product-repository";
import { getPublicReviews } from "@/lib/content-repository";

export function generateStaticParams() {
  return seoLandings.map((l) => ({ slug: l.slug }));
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const landing = getLanding(slug);
  if (!landing) return {};
  return buildMetadata({
    title: landing.metaTitle,
    description: landing.metaDescription,
    path: `/catalog/${landing.slug}`,
    keywords: [landing.keyword],
  });
}

/** Скрываем «Подходящие модели» для страниц, где они не нужны */
const HIDE_PRODUCTS = new Set(["futbolka-s-nadpisyu", "futbolka-s-logotipom", "futbolka-s-foto"]);

/** Показываем форму обратной связи вместо кнопок */
const SHOW_LEAD_FORM = new Set(["futbolka-s-nadpisyu", "futbolka-s-logotipom"]);

export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const landing = getLanding(slug);
  if (!landing) notFound();

  const [allProducts, publicReviews] = await Promise.all([getAllProducts(), getPublicReviews()]);
  const requested = new Set(landing.productSlugs);
  const products = allProducts.filter(
    (product) =>
      requested.has(product.slug) ||
      (landing.slug === "futbolka-s-printom" &&
        product.category === "s-printom"),
  );

  const hideProducts = HIDE_PRODUCTS.has(slug);
  const showLeadForm = SHOW_LEAD_FORM.has(slug);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: "Каталог", path: "/catalog" },
          { name: landing.heading, path: `/catalog/${landing.slug}` },
        ])}
      />
      <JsonLd data={faqJsonLd(landing.faq)} />
      <JsonLd data={reviewsJsonLd(publicReviews)} />

      {/* Hero посадочной */}
      <Section className="pt-10 pb-8 sm:pt-14">
        <Breadcrumbs
          items={[
            { name: "Главная", href: "/" },
            { name: "Каталог", href: "/catalog" },
            { name: landing.heading, href: `/catalog/${landing.slug}` },
          ]}
        />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <Reveal>
            <h1 className="font-display text-ink text-4xl font-extrabold text-balance sm:text-5xl">
              {landing.heading}
            </h1>
            <p className="text-muted mt-5 max-w-xl text-lg text-pretty">
              {landing.intro}
            </p>

            {/* Кнопки: зависят от slug */}
            {slug === "futbolka-s-printom" && (
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/catalog" size="lg">
                  Весь каталог
                </Button>
              </div>
            )}

            {slug === "futbolka-s-foto" && (
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/configurator" size="lg">
                  Открыть конструктор
                </Button>
              </div>
            )}

            {!showLeadForm && slug !== "futbolka-s-printom" && slug !== "futbolka-s-foto" && (
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/configurator" size="lg">
                  Собрать футболку
                </Button>
                <Button href="/catalog" variant="ghost" size="lg">
                  Весь каталог
                </Button>
              </div>
            )}
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="border-line shadow-soft grid gap-3 rounded-3xl border bg-white p-6">
              {landing.sellingPoints.map((sp) => (
                <li key={sp.title} className="flex gap-3">
                  <span className="bg-accent-soft text-accent mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    <Check width={15} height={15} />
                  </span>
                  <div>
                    <p className="text-ink font-semibold">{sp.title}</p>
                    <p className="text-muted text-sm">{sp.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      {/* Подборка товаров — скрываем для некоторых страниц */}
      {!hideProducts && products.length > 0 && (
        <Section className="py-12 sm:py-16">
          <Reveal>
            <h2 className="font-display text-ink text-2xl font-bold sm:text-3xl">
              Подходящие модели
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.05}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* Форма обратной связи — для страниц с надписью и логотипом */}
      {showLeadForm && <LeadCta />}

      <Reviews />

      <Faq items={landing.faq} title={`Вопросы про «${landing.keyword}»`} />
      <FinalCta />
    </>
  );
}
