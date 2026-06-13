"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  ImageIcon,
  MessageCircleWarning,
  RefreshCw,
} from "lucide-react";
import type { DeliveryOutboxJob, ProcessingStatus, SubmissionWithOutbox } from "@/types";

const deliveryMeta: Record<string, { label: string; className: string }> = {
  delivered:  { label: "Доставлена в TG",    className: "bg-emerald-50 text-emerald-700" },
  pending:    { label: "Ожидает отправки",   className: "bg-amber-50  text-amber-700"   },
  failed:     { label: "Ошибка отправки",    className: "bg-red-50    text-red-700"     },
  processing: { label: "Отправляется…",      className: "bg-sky-50    text-sky-700"     },
  queued:     { label: "В очереди",          className: "bg-amber-50  text-amber-700"   },
};

const outboxStatusMeta: Record<string, { label: string; className: string }> = {
  pending:    { label: "Очередь",            className: "bg-amber-50  text-amber-700"   },
  processing: { label: "Обрабатывается",     className: "bg-sky-50    text-sky-700"     },
  delivered:  { label: "Доставлено",         className: "bg-emerald-50 text-emerald-700" },
  failed:     { label: "Ошибка (ретрай)",    className: "bg-red-50    text-red-700"     },
};

const stepMeta: Record<string, { label: string; className: string }> = {
  pending:   { label: "Ожидает",   className: "text-amber-600"   },
  delivered: { label: "Доставлено", className: "text-emerald-600" },
  failed:    { label: "Ошибка",    className: "text-red-600"     },
};

const processingMeta: Record<ProcessingStatus, { label: string; className: string }> = {
  new:         { label: "Новая",    className: "bg-sky-50    text-sky-700"     },
  in_progress: { label: "В работе", className: "bg-amber-50  text-amber-700"   },
  done:        { label: "Выполнена", className: "bg-emerald-50 text-emerald-700" },
  cancelled:   { label: "Отменена", className: "bg-neutral-100 text-neutral-500" },
};

const processingOrder: ProcessingStatus[] = ["new", "in_progress", "done", "cancelled"];

const fileLabels: Record<string, string> = {
  previewImage:  "Превью заказа",
  frontPreview:  "Превью (перед)",
  backPreview:   "Превью (спина)",
  frontImage:    "Оригинал (перед)",
  backImage:     "Оригинал (спина)",
};

const contactLabels: Record<string, string> = {
  telegram: "Telegram",
  max:      "MAX",
  phone:    "Телефон",
};

type Filter = "all" | ProcessingStatus;

const getProcessing = (item: SubmissionWithOutbox): ProcessingStatus =>
  item.processingStatus ?? "new";

function resolveDeliveryLabel(item: SubmissionWithOutbox) {
  const job = item.outboxJob;
  if (!job) return deliveryMeta[item.status] ?? deliveryMeta.pending;
  return deliveryMeta[job.status] ?? deliveryMeta.pending;
}

export function OrdersPanel({ initialItems }: { initialItems: SubmissionWithOutbox[] }) {
  const [items, setItems]           = useState<SubmissionWithOutbox[]>(initialItems);
  const [loading, setLoading]       = useState(false);
  const [retrying, setRetrying]     = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [filter, setFilter]         = useState<Filter>("all");
  const [error, setError]           = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const result = (await response.json()) as { submissions?: SubmissionWithOutbox[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Не удалось загрузить заявки.");
      setItems(result.submissions ?? []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заявки.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => ({
      total:      items.length,
      fresh:      items.filter((item) => getProcessing(item) === "new").length,
      inProgress: items.filter((item) => getProcessing(item) === "in_progress").length,
      attention:  items.filter((item) => {
        const job = item.outboxJob;
        return job ? job.status !== "delivered" : item.status !== "delivered";
      }).length,
    }),
    [items],
  );

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((item) => getProcessing(item) === filter)),
    [items, filter],
  );

  const retry = async (id: string) => {
    setRetrying(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${id}/retry`, { method: "POST" });
      const result = (await response.json()) as {
        ok?: boolean;
        queued?: boolean;
        submission?: SubmissionWithOutbox;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Не удалось поставить в очередь.");
      if (result.submission) {
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...result.submission! } : item)),
        );
      }
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Не удалось поставить в очередь.");
    } finally {
      setRetrying(null);
    }
  };

  const changeProcessing = async (id: string, processingStatus: ProcessingStatus) => {
    setSavingStatus(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processingStatus }),
      });
      const result = (await response.json()) as { submission?: SubmissionWithOutbox; error?: string };
      if (!response.ok || !result.submission) {
        throw new Error(result.error ?? "Не удалось обновить статус.");
      }
      setItems((current) => current.map((item) => (item.id === id ? result.submission! : item)));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Не удалось обновить статус.");
    } finally {
      setSavingStatus(null);
    }
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "all",         label: `Все (${items.length})` },
    { id: "new",         label: `Новые (${stats.fresh})` },
    { id: "in_progress", label: `В работе (${stats.inProgress})` },
    { id: "done",        label: "Выполнены" },
    { id: "cancelled",   label: "Отменены" },
  ];

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Заявки и заказы</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Кликните по заявке, чтобы открыть детали и макеты. Меняйте статус обработки по ходу работы.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold hover:bg-neutral-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Обновить
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Summary label="Всего"             value={stats.total}      icon={Clock3} />
        <Summary label="Новые"             value={stats.fresh}      icon={MessageCircleWarning} />
        <Summary label="В работе"          value={stats.inProgress} icon={RefreshCw} />
        <Summary label="Проблемы доставки" value={stats.attention}  icon={CheckCircle2} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === item.id
                ? "bg-neutral-900 text-white"
                : "border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-500">Загружаем заявки…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 py-12 text-center text-sm text-neutral-500">
          {filter === "all" ? "Заявок пока нет." : "Нет заявок с этим статусом."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {visible.map((item) => {
            const delivery   = resolveDeliveryLabel(item);
            const processing = processingMeta[getProcessing(item)];
            const isOpen     = expanded === item.id;
            return (
              <article key={item.id} className="border-b border-neutral-100 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                  className="grid w-full gap-4 p-4 text-left hover:bg-neutral-50 lg:grid-cols-[170px_1fr_auto] lg:items-center"
                  aria-expanded={isOpen}
                >
                  <div>
                    <strong className="block text-sm">{item.reference}</strong>
                    <span className="mt-1 block text-xs text-neutral-500">
                      {new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(
                        new Date(item.createdAt),
                      )}
                    </span>
                    <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${processing.className}`}>
                      {processing.label}
                    </span>
                  </div>
                  <div className="min-w-0 text-sm">
                    <p>
                      <strong>{item.name}</strong> · {item.kind === "order" ? "заказ" : "заявка"}
                      {item.files.length > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-neutral-500">
                          <ImageIcon className="h-3.5 w-3.5" /> {item.files.length}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 break-all text-neutral-600">
                      {contactLabels[item.contact.method] ?? item.contact.method}:{" "}
                      {item.contact.method === "telegram" ? `@${item.contact.value}` : item.contact.value}
                    </p>
                    {item.orderDetails && (
                      <p className="mt-1 text-xs text-neutral-500">
                        {[
                          item.orderDetails.productName,
                          item.orderDetails.color,
                          item.orderDetails.size,
                          item.orderDetails.quantity != null ? `${item.orderDetails.quantity} шт.` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${delivery.className}`}>
                      {delivery.label}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-100 bg-neutral-50/60 p-4">
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                      <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                        <DetailRow label="Контакт">
                          {contactLabels[item.contact.method] ?? item.contact.method}:{" "}
                          {item.contact.method === "telegram" ? (
                            <a
                              href={`https://t.me/${item.contact.value}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-700 underline underline-offset-2"
                            >
                              @{item.contact.value}
                            </a>
                          ) : (
                            <a href={`tel:${item.contact.value.replace(/[^+\d]/g, "")}`} className="text-sky-700 underline underline-offset-2">
                              {item.contact.value}
                            </a>
                          )}
                        </DetailRow>
                        {item.comment && <DetailRow label="Комментарий">{item.comment}</DetailRow>}
                        {item.orderDetails?.productName != null && (
                          <DetailRow label="Товар">{String(item.orderDetails.productName)}</DetailRow>
                        )}
                        {item.orderDetails?.color != null && (
                          <DetailRow label="Цвет">{String(item.orderDetails.color)}</DetailRow>
                        )}
                        {item.orderDetails?.size != null && (
                          <DetailRow label="Размер">{String(item.orderDetails.size)}</DetailRow>
                        )}
                        <DetailRow label="Количество">
                          {item.orderDetails?.quantity != null
                            ? `${String(item.orderDetails.quantity)} шт.`
                            : "не указано"}
                        </DetailRow>
                        <DetailRow label="Согласие на ПД">
                          {item.personalDataConsent ? "Да" : "Нет"}
                          {item.imageRightsConsent ? " · права на изображение подтверждены" : ""}
                        </DetailRow>
                        <OutboxJobDetail job={item.outboxJob} submission={item} />
                      </dl>

                      <div className="flex flex-col gap-2 lg:w-56">
                        <label className="text-xs font-semibold text-neutral-500" htmlFor={`status-${item.id}`}>
                          Статус обработки
                        </label>
                        <select
                          id={`status-${item.id}`}
                          value={getProcessing(item)}
                          disabled={savingStatus === item.id}
                          onChange={(e) => void changeProcessing(item.id, e.target.value as ProcessingStatus)}
                          className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold disabled:opacity-50"
                        >
                          {processingOrder.map((status) => (
                            <option key={status} value={status}>
                              {processingMeta[status].label}
                            </option>
                          ))}
                        </select>
                        {(!item.outboxJob || item.outboxJob.status !== "delivered") && (
                          <button
                            type="button"
                            disabled={retrying === item.id}
                            onClick={() => void retry(item.id)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            <RefreshCw className={`h-4 w-4 ${retrying === item.id ? "animate-spin" : ""}`} />
                            Повторить доставку
                          </button>
                        )}
                      </div>
                    </div>

                    {item.files.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-semibold text-neutral-500">Макеты и превью</p>
                        <div className="flex flex-wrap gap-3">
                          {item.files.map((file) => (
                            <a
                              key={file.key}
                              href={`/api/admin/orders/${item.id}/files/${file.key}`}
                              target="_blank"
                              rel="noreferrer"
                              className="group block w-36"
                              title="Открыть в полном размере"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element -- приватные файлы заявки, недоступные next/image */}
                              <img
                                src={`/api/admin/orders/${item.id}/files/${file.key}`}
                                alt={fileLabels[file.key] ?? file.key}
                                className="h-36 w-36 rounded-lg border border-neutral-200 bg-white object-contain transition-shadow group-hover:shadow-md"
                                loading="lazy"
                              />
                              <span className="mt-1 block truncate text-center text-xs text-neutral-500">
                                {fileLabels[file.key] ?? file.key}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function OutboxJobDetail({
  job,
  submission,
}: {
  job: DeliveryOutboxJob | undefined;
  submission: SubmissionWithOutbox;
}) {
  if (!job) {
    return (
      <DetailRow label="Доставка в Telegram">
        {submission.status === "delivered"
          ? `Доставлено (устаревший режим) · попыток: ${submission.attempts}`
          : `${submission.status} · попыток: ${submission.attempts}`}
        {submission.lastError && (
          <span className="ml-1 text-red-600"> · {submission.lastError}</span>
        )}
      </DetailRow>
    );
  }

  const status = outboxStatusMeta[job.status] ?? outboxStatusMeta.pending;
  const fmt = (iso: string | undefined) =>
    iso
      ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(
          new Date(iso),
        )
      : null;

  return (
    <>
      <DetailRow label="Outbox-очередь">
        <span className={`font-semibold ${status.className}`}>{status.label}</span>
        {" · "}попыток: {job.attempts}
        {job.nextAttemptAt && job.status === "failed" && (
          <span className="ml-1 text-neutral-500">· след. попытка: {fmt(job.nextAttemptAt)}</span>
        )}
      </DetailRow>
      <DetailRow label="Шаги доставки">
        <span>
          Сообщение:{" "}
          <span className={stepMeta[job.message.status]?.className}>
            {stepMeta[job.message.status]?.label ?? job.message.status}
          </span>
          {job.message.deliveredAt && <span className="text-neutral-400"> ({fmt(job.message.deliveredAt)})</span>}
        </span>
        {job.archive.required && (
          <span className="ml-3">
            Архив:{" "}
            <span className={stepMeta[job.archive.status]?.className}>
              {stepMeta[job.archive.status]?.label ?? job.archive.status}
            </span>
            {job.archive.deliveredAt && <span className="text-neutral-400"> ({fmt(job.archive.deliveredAt)})</span>}
          </span>
        )}
        {job.lastError && (
          <div className="mt-0.5 text-red-600">{job.lastError}</div>
        )}
      </DetailRow>
    </>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-neutral-500">{label}</dt>
      <dd className="mt-0.5 break-words">{children}</dd>
    </div>
  );
}

function Summary({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Clock3 }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
      <Icon className="h-5 w-5 text-neutral-500" />
      <div>
        <strong className="block text-xl">{value}</strong>
        <span className="text-xs text-neutral-500">{label}</span>
      </div>
    </div>
  );
}
