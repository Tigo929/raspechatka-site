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
  { label: "Контакты", href: "/#contacts" },
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

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-line bg-paper/85 border-b backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between lg:h-20">
          <Link
            href="/"
            onClick={() => {
              setOpen(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="font-display text-ink text-xl font-extrabold"
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
                className="text-ink-soft hover:text-accent text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={siteConfig.phoneHref}
              className="text-ink hover:text-accent text-sm font-semibold transition-colors"
            >
              {siteConfig.phone}
            </a>
            <Button href="/configurator" size="sm">
              Собрать футболку
            </Button>
          </div>

          <button
            type="button"
            className="text-ink flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </Container>

      {/* Мобильное меню */}
      {open && (
        <div
          id="mobile-menu"
          className="bg-paper fixed inset-x-0 top-16 bottom-0 z-40 lg:hidden"
        >
          <Container className="flex h-full flex-col py-6">
            <nav
              className="flex flex-col gap-1"
              aria-label="Мобильная навигация"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-ink hover:bg-paper-dim rounded-xl px-4 py-3.5 text-lg font-semibold transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 pt-6">
              <a
                href={siteConfig.phoneHref}
                className="text-ink flex items-center justify-center gap-2 text-base font-semibold"
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
