import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Tilt } from "@/components/interaction/Tilt";
import { categories } from "@/data/categories";

export function Categories() {
  return (
    <Section id="categories" className="bg-paper-dim/60">
      <SectionHeading
        eyebrow="Категории"
        title="Что напечатать на футболке"
        subtitle="Выберите направление — и переходите к товарам или конструктору."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c, i) => (
          <Reveal key={c.slug} delay={i * 0.06}>
            <Tilt max={8}>
            <Link
              href={`/catalog/${categorySlugToLanding(c.slug)}`}
              data-cursor="view"
              className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl shadow-soft transition-shadow duration-300 hover:shadow-lift"
            >
              <Image
                src={c.image}
                alt={c.imageAlt}
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 24vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/85 via-midnight/20 to-transparent" />
              <div className="relative p-6 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold">{c.title}</h3>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-colors group-hover:bg-accent">
                    <ArrowUpRight width={18} height={18} />
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-white/80">{c.description}</p>
              </div>
            </Link>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/** Привязка категории к релевантной SEO-посадочной. */
function categorySlugToLanding(slug: string): string {
  const map: Record<string, string> = {
    "s-printom": "futbolka-s-printom",
    "s-foto": "futbolka-s-foto",
    "s-nadpisyu": "futbolka-s-nadpisyu",
    "s-logotipom": "futbolka-s-logotipom",
  };
  return map[slug] ?? "futbolka-s-printom";
}
