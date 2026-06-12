import Link from "next/link";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/data/site";
import { seoLandings } from "@/data/seoLandings";
import { getCategories, getPublicSettings } from "@/lib/content-repository";

export async function Footer() {
  const year = new Date().getFullYear();
  const [categories, settings] = await Promise.all([getCategories(), getPublicSettings()]);
  const phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, "")}`;
  // Перелинковка на ключевые посадочные усиливает внутренний вес.
  const popularLandings = seoLandings.slice(0, 6);

  return (
    <footer data-site-chrome className="bg-midnight text-paper/70">
      <Container className="py-16 lg:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 xl:gap-12">
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="font-display text-2xl font-extrabold text-white"
            >
              Распечат<span className="text-accent">ка</span>
            </Link>
            <p className="text-paper/60 mt-4 max-w-xs text-sm leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={settings.telegram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="hover:bg-accent flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors"
              >
                <Send width={18} height={18} />
              </a>
              <a
                href={phoneHref}
                aria-label="Позвонить"
                className="hover:bg-accent flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors"
              >
                <Phone width={18} height={18} />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white uppercase">
              Каталог
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/catalog#${c.slug}`}
                    className="hover:text-accent transition-colors"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white uppercase">
              Популярное
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {popularLandings.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/catalog/${l.slug}`}
                    className="hover:text-accent transition-colors"
                  >
                    {l.heading}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white uppercase">
              Информация
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/contacts", label: "Контакты" },
                { href: "/terms", label: "Условия заказа" },
                { href: "/delivery-and-return", label: "Доставка и возврат" },
                { href: "/privacy", label: "Конфиденциальность" },
                { href: "/cookie-policy", label: "Cookie" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-accent transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white uppercase">
              Контакты
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone width={16} height={16} className="mt-0.5 shrink-0" />
                <a href={phoneHref} className="hover:text-accent">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail width={16} height={16} className="mt-0.5 shrink-0" />
                <a
                  href={`mailto:${settings.email}`}
                  className="hover:text-accent"
                >
                  {settings.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin width={16} height={16} className="mt-0.5 shrink-0" />
                <span>
                  {settings.address}
                  <br />
                  {settings.hours}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-paper/50 mt-14 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs sm:flex-row sm:items-start sm:justify-between">
          <p>
            © {year} {siteConfig.legalName}. Все права защищены.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 sm:text-right">
            <Link href="/privacy" className="hover:text-paper/80 transition-colors">Персональные данные</Link>
            <Link href="/personal-data-consent" className="hover:text-paper/80 transition-colors">Согласие на обработку</Link>
            <Link href="/cookie-policy" className="hover:text-paper/80 transition-colors">Cookie</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
