import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/features/products/ProductCard";
import { Faq } from "@/components/sections/Faq";
import { Reviews } from "@/components/sections/Reviews";
import { FinalCta } from "@/components/sections/FinalCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/seo";
import { getLanding, seoLandings } from "@/data/seoLandings";
import { getProduct } from "@/data/products";

export function generateStaticParams() {
  return seoLandings.map((l) => ({ slug: l.slug }));
}

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

export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const landing = getLanding(slug);
  if (!landing) notFound();

  const products = landing.productSlugs
    .map((s) => getProduct(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

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

      {/* Hero посадочной */}
      <Section className="pb-8 pt-10 sm:pt-14">
        <Breadcrumbs
          items={[
            { name: "Главная", href: "/" },
            { name: "Каталог", href: "/catalog" },
            { name: landing.heading, href: `/catalog/${landing.slug}` },
          ]}
        />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <Reveal>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink text-balance sm:text-5xl">
              {landing.heading}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted text-pretty">
              {landing.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/configurator" size="lg">
                Собрать футболку
              </Button>
              <Button href="/catalog" variant="ghost" size="lg">
                Весь каталог
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="grid gap-3 rounded-3xl border border-line bg-white p-6 shadow-soft">
              {landing.sellingPoints.map((sp) => (
                <li key={sp.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Check width={15} height={15} />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{sp.title}</p>
                    <p className="text-sm text-muted">{sp.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      {/* Подборка товаров */}
      {products.length > 0 && (
        <Section className="py-12 sm:py-16">
          <Reveal>
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
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

      <Reviews />
      <Faq items={landing.faq} title={`Вопросы про «${landing.keyword}»`} />
      <FinalCta />
    </>
  );
}
