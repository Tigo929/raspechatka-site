"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import {
  MaxIconButton,
  TelegramIconButton,
} from "@/components/ui/MessengerButtons";
import type { ManagedSettings } from "@/types";

/**
 * Закреплённый внизу экрана блок CTA для мобильных — постоянный путь к заказу
 * и быстрый контакт. Появляется после небольшого скролла, чтобы не мешать hero.
 */
export function MobileStickyCTA({ settings }: { settings: ManagedSettings }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      data-site-chrome
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="border-line bg-paper/95 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link
            href="/configurator"
            className="bg-accent shadow-soft flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold text-white active:scale-[0.97]"
          >
            <Sparkles width={17} height={17} /> Собрать футболку
          </Link>
          <TelegramIconButton href={settings.telegram} />
          {settings.max && <MaxIconButton href={settings.max} />}
        </div>
      </div>
    </div>
  );
}
