"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/interaction/Magnetic";
import { ConsentCheckbox } from "@/components/legal/ConsentCheckbox";
import {
  ContactMethodTabs,
  fieldLabelClass,
  FormError,
  formCardClass,
  inputClass,
  SubmissionMeta,
  SubmissionSuccess,
  textareaClass,
} from "@/features/order/FormUI";

type ContactMethod = "phone" | "telegram";
type Status = "idle" | "sending" | "done" | "error";

export function LeadForm() {
  const [name, setName] = useState("");
  const [method, setMethod] = useState<ContactMethod>("phone");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  // Stable key for this form session — deduplicate retries on the server side
  const [idempotencyKey] = useState<string>(() => crypto.randomUUID());
  const [pdConsent, setPdConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

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
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: {
            method,
            value: method === "phone" ? phone.trim() : telegram.trim(),
          },
          comment,
          website,
          personalDataConsent: pdConsent,
          consentAcceptedAt: new Date().toISOString(),
          idempotencyKey,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        stored?: boolean;
        delivered?: boolean;
        reference?: string;
        error?: string;
      };
      if (!response.ok || !result.ok || !result.stored) {
        throw new Error(result.error ?? "Не удалось сохранить заявку.");
      }
      // delivery is always async now — no separate note needed
      setReference(result.reference ?? null);
      setStatus("done");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Нет соединения. Попробуйте ещё раз.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <SubmissionSuccess
        title="Заявка принята!"
        description="Уведомление отправлено менеджеру. Свяжемся с вами в ближайшее рабочее время."
        referenceLabel="Номер заявки"
        reference={reference}
      />
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`${formCardClass} flex flex-col gap-4`}
    >
      {/* Honeypot — display:none, чтобы автозаполнение Chrome не вписало
          сюда сайт пользователя (поле "website" он заполняет охотно). */}
      <div style={{ display: "none" }} aria-hidden>
        <input
          id="lead-hp"
          name="hp_field"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Имя */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-name" className={fieldLabelClass}>Имя</label>
        <input
          id="lead-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          autoComplete="name"
          required
          maxLength={80}
          className={inputClass}
        />
      </div>

      <ContactMethodTabs
        label="Как с вами связаться?"
        options={[
          { id: "phone", label: "Телефон" },
          { id: "telegram", label: "Telegram" },
        ]}
        value={method}
        onChange={setMethod}
        columnsClass="grid-cols-2"
      />

      {/* Поле контакта */}
      {method === "phone" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lead-phone" className={fieldLabelClass}>Телефон</label>
          <input
            id="lead-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__"
            autoComplete="tel"
            required
            maxLength={40}
            className={inputClass}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lead-tg" className={fieldLabelClass}>Telegram-юзернейм</label>
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
              className={`${inputClass} w-full pl-8 pr-4`}
            />
          </div>
        </div>
      )}

      {/* Комментарий */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="lead-comment" className={fieldLabelClass}>
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
          className={textareaClass}
        />
      </div>

      {/* Согласие */}
      <ConsentCheckbox
        id="lead-pd-consent"
        checked={pdConsent}
        onChange={setPdConsent}
        type="personal-data"
      />

      <FormError error={error} />

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

      <SubmissionMeta text="После отправки форма сразу создаёт обращение и отправляет уведомление менеджеру в Telegram." />
    </form>
  );
}
