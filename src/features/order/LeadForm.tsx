"use client";

import { useState } from "react";
import { Send, Phone, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/interaction/Magnetic";
import { siteConfig } from "@/data/site";

type Status = "idle" | "sending" | "done" | "error";

/**
 * Форма заявки: имя + телефон (+ необязательный комментарий) → POST /api/lead.
 * После успеха показываем экран благодарности и быстрый контакт в мессенджер
 * (запасной канал, чтобы заявка точно дошла, пока не настроен Telegram-бот).
 */
export function LeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const waText = encodeURIComponent(
    `Здравствуйте! Оставляю заявку:\n• Имя: ${name || "—"}\n• Телефон: ${phone || "—"}${
      comment ? `\n• Комментарий: ${comment}` : ""
    }`,
  );
  const whatsappHref = `${siteConfig.social.whatsapp}?text=${waText}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.trim().length < 6) {
      setError("Укажите имя и корректный телефон.");
      return;
    }
    setError(null);
    setStatus("sending");

    // Логируем заявку на сервере (не блокируем UX)
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, comment, website }),
    }).catch(() => {});

    // Перенаправляем в Telegram с предзаполненным сообщением
    const text = encodeURIComponent(
      `Здравствуйте! Хочу оформить заказ.\n• Имя: ${name}\n• Телефон: ${phone}${comment ? `\n• Детали: ${comment}` : ""}`,
    );
    window.open(`${siteConfig.social.telegram}?text=${text}`, "_blank");
    setStatus("done");
  };

  if (status === "done") {
    return (
      <div className="border-line shadow-soft rounded-3xl border bg-white p-8 text-center">
        <span className="bg-accent mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white">
          <Check width={28} height={28} strokeWidth={3} />
        </span>
        <h3 className="font-display text-ink mt-4 text-xl font-bold">
          Заявка принята!
        </h3>
        <p className="text-muted mx-auto mt-2 max-w-sm text-sm">
          Свяжемся с вами в ближайшее время. Хотите быстрее — напишите нам прямо
          сейчас:
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button href={whatsappHref} external>
            <Phone width={18} height={18} /> WhatsApp
          </Button>
          <Button
            href={siteConfig.social.telegram}
            external
            variant="secondary"
          >
            <Send width={18} height={18} /> Telegram
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-line shadow-soft flex flex-col gap-4 rounded-3xl border bg-white p-6 sm:p-8"
    >
      <div className="sr-only" aria-hidden>
        <label htmlFor="lead-website">Сайт</label>
        <input
          id="lead-website"
          name="website"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-name" className="text-ink text-sm font-semibold">
          Имя
        </label>
        <input
          id="lead-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          autoComplete="name"
          required
          maxLength={80}
          className="border-line focus:border-accent bg-paper text-ink h-12 rounded-2xl border px-4 transition-colors outline-none"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-phone" className="text-ink text-sm font-semibold">
          Телефон
        </label>
        <input
          id="lead-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 (___) ___-__-__"
          autoComplete="tel"
          required
          maxLength={40}
          className="border-line focus:border-accent bg-paper text-ink h-12 rounded-2xl border px-4 transition-colors outline-none"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="lead-comment"
          className="text-ink text-sm font-semibold"
        >
          Что хотите напечатать?{" "}
          <span className="text-muted font-normal">(необязательно)</span>
        </label>
        <textarea
          id="lead-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Идея, надпись, фото или ссылка"
          className="border-line focus:border-accent bg-paper text-ink resize-none rounded-2xl border px-4 py-3 transition-colors outline-none"
        />
      </div>

      {error && (
        <p className="text-accent text-sm" role="alert">
          {error}
        </p>
      )}

      <Magnetic className="block w-full" strength={0.2}>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          data-cursor="cta"
          data-cursor-label="Отправить"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Отправляем…" : "Оставить заявку"}
        </Button>
      </Magnetic>
      <p className="text-muted text-center text-xs">
        Нажимая кнопку, вы соглашаетесь на обработку данных. Это ни к чему не
        обязывает.
      </p>
    </form>
  );
}
