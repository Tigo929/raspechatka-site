import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Tilt } from "@/components/interaction/Tilt";
import { getCategories } from "@/lib/content-repository";

export async function Categories() {
  const categories = await getCategories();
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
                href={categoryHref(c.slug)}
                data-cursor="view"
                className="group shadow-soft hover:shadow-lift relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-3xl transition-shadow duration-300"
              >
                <Image
                  src={c.image}
                  alt={c.imageAlt}
                  fill
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 24vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="from-midnight/85 via-midnight/20 absolute inset-0 bg-gradient-to-t to-transparent" />
                <div className="relative p-6 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold">
                      {c.title}
                    </h3>
                    <span className="group-hover:bg-accent flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-colors">
                      <ArrowUpRight width={18} height={18} />
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-white/80">
                    {c.description}
                  </p>
                </div>
              </Link>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function categoryHref(slug: string): string {
  const map: Record<string, string> = {
    "s-printom": "/catalog/futbolka-s-printom",
    "s-foto": "/configurator",
    "s-nadpisyu": "/catalog/futbolka-s-nadpisyu",
    "s-logotipom": "/catalog/futbolka-s-logotipom",
  };
  return map[slug] ?? "/configurator";
}
