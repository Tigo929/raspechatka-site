"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Send, Sparkles } from "lucide-react";
import { siteConfig } from "@/data/site";

/**
 * Закреплённый внизу экрана блок CTA для мобильных — постоянный путь к заказу
 * и быстрый контакт. Появляется после небольшого скролла, чтобы не мешать hero.
 */
export function MobileStickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="border-t border-line bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Link
            href="/configurator"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent font-semibold text-white shadow-soft active:scale-[0.97]"
          >
            <Sparkles width={18} height={18} /> Собрать футболку
          </Link>
          <a
            href={siteConfig.social.telegram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Написать в Telegram"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-paper active:scale-[0.97]"
          >
            <Send width={20} height={20} />
          </a>
        </div>
      </div>
    </div>
  );
}
