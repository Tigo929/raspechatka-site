"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Каталог", href: "/catalog" },
  { label: "Конструктор", href: "/configurator" },
  { label: "Как работаем", href: "/#how" },
  { label: "Отзывы", href: "/#reviews" },
  { label: "Вопросы", href: "/#faq" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Блокируем прокрутку под открытым мобильным меню.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-line bg-paper/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between lg:h-20">
          <Link
            href="/"
            className="font-display text-xl font-extrabold tracking-tight text-ink"
            aria-label={`${siteConfig.name} — на главную`}
          >
            PRINT<span className="text-accent">LAB</span>
          </Link>

          <nav
            className="hidden items-center gap-8 lg:flex"
            aria-label="Основная навигация"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={siteConfig.phoneHref}
              className="text-sm font-semibold text-ink transition-colors hover:text-accent"
            >
              {siteConfig.phone}
            </a>
            <Button href="/configurator" size="sm">
              Собрать футболку
            </Button>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink lg:hidden"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </Container>

      {/* Мобильное меню */}
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 bg-paper lg:hidden">
          <Container className="flex h-full flex-col py-6">
            <nav className="flex flex-col gap-1" aria-label="Мобильная навигация">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3.5 text-lg font-semibold text-ink transition-colors hover:bg-paper-dim"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 pt-6">
              <a
                href={siteConfig.phoneHref}
                className="flex items-center justify-center gap-2 text-base font-semibold text-ink"
              >
                <Phone width={18} height={18} /> {siteConfig.phone}
              </a>
              <Button href="/configurator" size="lg" className="w-full">
                Собрать футболку
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
