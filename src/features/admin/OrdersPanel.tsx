"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, MessageCircleWarning, RefreshCw } from "lucide-react";
import type { StoredSubmission, SubmissionStatus } from "@/types";

const statusMeta: Record<SubmissionStatus, { label: string; className: string }> = {
  delivered: { label: "Доставлена", className: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Ожидает", className: "bg-amber-50 text-amber-700" },
  failed: { label: "Нужна отправка", className: "bg-red-50 text-red-700" },
};

export function OrdersPanel({ initialItems }: { initialItems: StoredSubmission[] }) {
  const [items, setItems] = useState<StoredSubmission[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const result = (await response.json()) as { submissions?: StoredSubmission[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Не удалось загрузить заявки.");
      setItems(result.submissions ?? []);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить заявки.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    total: items.length,
    delivered: items.filter((item) => item.status === "delivered").length,
    attention: items.filter((item) => item.status !== "delivered").length,
  }), [items]);

  const retry = async (id: string) => {
    setRetrying(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${id}/retry`, { method: "POST" });
      const result = (await response.json()) as { submission?: StoredSubmission; error?: string };
      if (result.submission) {
        setItems((current) => current.map((item) => item.id === id ? result.submission! : item));
      }
      if (!response.ok) throw new Error(result.error ?? "Telegram пока недоступен. Заявка сохранена.");
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Не удалось повторить отправку.");
    } finally {
      setRetrying(null);
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Заявки и заказы</h1>
          <p className="mt-1 text-sm text-neutral-500">Все обращения сохраняются до отправки в Telegram.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold hover:bg-neutral-50">
          <RefreshCw className="h-4 w-4" /> Обновить
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Summary label="Всего" value={stats.total} icon={Clock3} />
        <Summary label="Доставлено" value={stats.delivered} icon={CheckCircle2} />
        <Summary label="Требуют внимания" value={stats.attention} icon={MessageCircleWarning} />
      </div>

      {error && <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-500">Загружаем заявки…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 py-12 text-center text-sm text-neutral-500">Заявок пока нет.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {items.map((item) => {
            const status = statusMeta[item.status];
            return (
              <article key={item.id} className="grid gap-4 border-b border-neutral-100 p-4 last:border-b-0 lg:grid-cols-[180px_1fr_auto] lg:items-center">
                <div>
                  <strong className="block text-sm">{item.reference}</strong>
                  <span className="mt-1 block text-xs text-neutral-500">{new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}</span>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                </div>
                <div className="min-w-0 text-sm">
                  <p><strong>{item.name}</strong> · {item.kind === "order" ? "заказ" : "заявка"}</p>
                  <p className="mt-1 break-all text-neutral-600">{item.contact.method}: {item.contact.value}</p>
                  {item.comment && <p className="mt-2 text-neutral-600">{item.comment}</p>}
                  {item.orderDetails && <p className="mt-2 text-xs text-neutral-500">{[item.orderDetails.productName, item.orderDetails.color, item.orderDetails.size].filter(Boolean).join(" · ")}</p>}
                  {item.lastError && <p className="mt-2 text-xs text-red-600">{item.lastError}</p>}
                </div>
                {item.status !== "delivered" && (
                  <button type="button" disabled={retrying === item.id} onClick={() => void retry(item.id)} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-neutral-900 px-3 text-sm font-semibold text-white disabled:opacity-50">
                    <RefreshCw className={`h-4 w-4 ${retrying === item.id ? "animate-spin" : ""}`} /> Повторить
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Summary({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Clock3 }) {
  return <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4"><Icon className="h-5 w-5 text-neutral-500" /><div><strong className="block text-xl">{value}</strong><span className="text-xs text-neutral-500">{label}</span></div></div>;
}
