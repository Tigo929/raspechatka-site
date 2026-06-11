"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/interaction/Magnetic";
import { ConsentCheckbox } from "@/components/legal/ConsentCheckbox";

type ContactMethod = "phone" | "telegram";
type Status = "idle" | "sending" | "done" | "error";

export function LeadForm() {
  const [name, setName] = useState("");
  const [method, setMethod] = useState<ContactMethod>("phone");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [pdConsent, setPdConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Укажите ваше имя.");
      return;
    }
    if (method === "phone" && phone.trim().length < 6) {
      setError("Укажите корректный номер телефона.");
      return;
    }
    if (method === "telegram" && !telegram.trim()) {
      setError("Укажите ваш Telegram-юзернейм.");
      return;
    }
    if (!pdConsent) {
      setError("Необходимо согласие на обработку персональных данных.");
      return;
    }

    setError(null);
    setStatus("sending");

    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: method === "phone" ? phone.trim() : telegram.trim(),
          comment,
          website,
          personalDataConsent: pdConsent,
          consentAcceptedAt: new Date().toISOString(),
        }),
      });
      setStatus("done");
    } catch {
      setStatus("done");
    }
  };

  if (status === "done") {
    return (
      <div className="border-line shadow-soft rounded-3xl border bg-white p-8 text-center">
        <span className="bg-accent mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white">
          <Check width={28} height={28} strokeWidth={3} />
        </span>
        <h3 className="font-display text-ink mt-4 text-xl font-bold">Заявка принята!</h3>
        <p className="text-muted mx-auto mt-2 max-w-sm text-sm">
          Свяжемся с вами в ближайшее рабочее время.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-line shadow-soft flex flex-col gap-4 rounded-3xl border bg-white p-6 sm:p-8"
    >
      {/* Honeypot */}
      <div className="sr-only" aria-hidden>
        <label htmlFor="lead-website">Сайт</label>
        <input
          id="lead-website"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Имя */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-name" className="text-ink text-sm font-semibold">Имя</label>
        <input
          id="lead-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          autoComplete="name"
          required
          maxLength={80}
          className="border-line focus:border-accent bg-paper text-ink h-12 rounded-2xl border px-4 outline-none transition-colors"
        />
      </div>

      {/* Способ связи */}
      <div className="flex flex-col gap-1.5">
        <span className="text-ink text-sm font-semibold">Как с вами связаться?</span>
        <div className="border-line grid grid-cols-2 gap-1 rounded-2xl border bg-white p-1">
          {(["phone", "telegram"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded-xl py-2 text-sm font-semibold transition-colors ${
                method === m ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              {m === "phone" ? "Телефон" : "Telegram"}
            </button>
          ))}
        </div>
      </div>

      {/* Поле контакта */}
      {method === "phone" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lead-phone" className="text-ink text-sm font-semibold">Телефон</label>
          <input
            id="lead-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__"
            autoComplete="tel"
            required
            maxLength={40}
            className="border-line focus:border-accent bg-paper text-ink h-12 rounded-2xl border px-4 outline-none transition-colors"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lead-tg" className="text-ink text-sm font-semibold">Telegram-юзернейм</label>
          <div className="relative">
            <span className="text-muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm">@</span>
            <input
              id="lead-tg"
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value.replace(/^@/, ""))}
              placeholder="username"
              autoComplete="off"
              maxLength={80}
              className="border-line focus:border-accent bg-paper text-ink h-12 w-full rounded-2xl border pl-8 pr-4 outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Комментарий */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-comment" className="text-ink text-sm font-semibold">
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
          className="border-line focus:border-accent bg-paper text-ink resize-none rounded-2xl border px-4 py-3 outline-none transition-colors"
        />
      </div>

      {/* Согласие */}
      <ConsentCheckbox
        id="lead-pd-consent"
        checked={pdConsent}
        onChange={setPdConsent}
        type="personal-data"
      />

      {error && (
        <p className="text-accent text-sm" role="alert">{error}</p>
      )}

      <Magnetic className="block w-full" strength={0.2}>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          data-cursor="cta"
          disabled={status === "sending" || !pdConsent}
        >
          {status === "sending" ? "Отправляем…" : "Оставить заявку"}
        </Button>
      </Magnetic>
    </form>
  );
}
