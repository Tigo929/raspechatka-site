"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useConsent } from "@/hooks/useConsent";

export function CookieBanner() {
  const { consent, loading, acceptAll, acceptNecessaryOnly, saveCustom } =
    useConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const visible = !loading && !consent;

  const handleAcceptAll = () => {
    acceptAll();
  };

  const handleDecline = () => {
    acceptNecessaryOnly();
  };

  const handleSaveCustom = () => {
    saveCustom({ analytics, marketing });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[90] p-3 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:p-0"
          role="dialog"
          aria-label="Настройки cookie"
          aria-live="polite"
        >
          <div className="bg-midnight text-paper shadow-lift rounded-2xl p-5">
            {!showSettings ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-paper/80 text-sm leading-relaxed">
                    Необходимые cookie обеспечивают работу сайта. Аналитику и
                    маркетинговые сервисы подключаем только с вашего согласия. Подробности в{" "}
                    <Link
                      href="/cookie-policy"
                      className="text-accent underline underline-offset-2"
                    >
                      использованием cookie
                    </Link>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={handleDecline}
                    aria-label="Отклонить"
                    className="text-paper/50 hover:text-paper shrink-0 transition-colors"
                  >
                    <X width={18} height={18} />
                  </button>
                </div>
                <div className="mt-4 flex gap-2.5">
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    className="flex-1"
                  >
                    Принять
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="text-paper/70 hover:text-paper flex flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Settings2 width={15} height={15} />
                    Настроить
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display text-base font-bold">
                  Настройки cookie
                </h3>
                <div className="mt-4 space-y-3">
                  <CookieCategory
                    label="Необходимые"
                    description="Обеспечивают работу сайта. Отключить невозможно."
                    checked
                    disabled
                  />
                  <CookieCategory
                    label="Аналитика"
                    description="Помогает понять, какие страницы удобны и полезны."
                    checked={analytics}
                    onChange={setAnalytics}
                  />
                  <CookieCategory
                    label="Маркетинг"
                    description="Помогает показывать релевантные предложения."
                    checked={marketing}
                    onChange={setMarketing}
                  />
                </div>
                <div className="mt-4 flex gap-2.5">
                  <Button
                    size="sm"
                    onClick={handleSaveCustom}
                    className="flex-1"
                  >
                    Сохранить
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowSettings(false)}
                    className="flex-1"
                  >
                    Назад
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CookieCategory({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 ${disabled ? "opacity-60" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="accent-accent mt-0.5 h-4 w-4 shrink-0"
      />
      <div>
        <p className="text-paper text-sm font-semibold">{label}</p>
        <p className="text-paper/60 text-xs leading-snug">{description}</p>
      </div>
    </label>
  );
}
