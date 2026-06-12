"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  BarChart2,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon,
  ImagePlus,
  Layers,
  LogOut,
  MessageSquare,
  PackagePlus,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  Star,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import type {
  Benefit,
  Category,
  ManagedContent,
  ManagedFaqItem,
  ManagedProduct,
  ManagedReview,
  ManagedSettings,
  PricingTier,
  Product,
  ProductColor,
  Step,
  UseCase,
} from "@/types";
import { formatPrice } from "@/lib/utils";

// ─── Shared ──────────────────────────────────────────────────────────────────

const colorOptions: ProductColor[] = [
  { name: "Белый", hex: "#F4F4F1" },
  { name: "Чёрный", hex: "#16161A" },
  { name: "Серый меланж", hex: "#9CA0A6" },
  { name: "Бежевый", hex: "#D9CBB3" },
  { name: "Синий", hex: "#2C3E78" },
  { name: "Бордовый", hex: "#6E2331" },
];

const inputClass =
  "h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-100 disabled:text-neutral-500";
const textareaClass =
  "w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-3 text-sm font-semibold">
        {label}
        {hint && <span className="text-xs font-normal text-neutral-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  if (!text) return null;
  return (
    <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm">
      <span role="status">{text}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Archive }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-100">
        <Icon className="h-5 w-5 text-neutral-600" />
      </span>
      <span>
        <strong className="block text-xl leading-none">{value}</strong>
        <span className="mt-1 block text-xs text-neutral-500">{label}</span>
      </span>
    </div>
  );
}

// ─── Tab navigation ───────────────────────────────────────────────────────────

type Tab = "products" | "reviews" | "faq" | "settings" | "analytics" | "media" | "content";

const tabs: { id: Tab; label: string; icon: typeof Archive }[] = [
  { id: "products", label: "Товары", icon: Archive },
  { id: "content", label: "Контент", icon: Layers },
  { id: "reviews", label: "Отзывы", icon: Star },
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "settings", label: "Настройки", icon: Settings },
  { id: "analytics", label: "Аналитика", icon: BarChart2 },
  { id: "media", label: "Медиа", icon: ImageIcon },
];

// ─── Root Dashboard ───────────────────────────────────────────────────────────

export function AdminDashboard({
  initialProducts,
  baseProducts,
  categories: initialCategories,
  initialReviews,
  initialFaq,
  initialSettings,
  initialContent,
}: {
  initialProducts: ManagedProduct[];
  baseProducts: Product[];
  categories: Category[];
  initialReviews: ManagedReview[];
  initialFaq: ManagedFaqItem[];
  initialSettings: ManagedSettings;
  initialContent: ManagedContent;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [notice, setNotice] = useState("");

  const notify = useCallback((msg: string) => setNotice(msg), []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-dvh bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display text-lg font-extrabold">
              Распечат<span className="text-accent">ка</span>
            </Link>
            <span className="hidden h-5 w-px bg-neutral-200 sm:block" />
            <span className="hidden text-sm font-medium text-neutral-500 sm:block">
              Управление сайтом
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Открыть сайт</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mx-auto max-w-[1440px] px-5 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Разделы">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex h-10 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8">
        <Notice text={notice} onClose={() => setNotice("")} />

        {activeTab === "products" && (
          <ProductsPanel
            initialProducts={initialProducts}
            baseProducts={baseProducts}
            categories={initialCategories}
            onNotify={notify}
          />
        )}
        {activeTab === "content" && (
          <ContentPanel
            initialContent={initialContent}
            initialCategories={initialCategories}
            onNotify={notify}
          />
        )}
        {activeTab === "reviews" && (
          <ReviewsPanel initialReviews={initialReviews} onNotify={notify} />
        )}
        {activeTab === "faq" && (
          <FaqPanel initialFaq={initialFaq} onNotify={notify} />
        )}
        {activeTab === "settings" && (
          <SettingsPanel initialSettings={initialSettings} onNotify={notify} />
        )}
        {activeTab === "analytics" && <AnalyticsPanel />}
        {activeTab === "media" && <MediaPanel />}
      </div>
    </div>
  );
}

// ─── Products Panel ───────────────────────────────────────────────────────────

type ProductEditorState = { mode: "create" } | { mode: "edit"; product: ManagedProduct };

function ProductsPanel({
  initialProducts,
  baseProducts,
  categories,
  onNotify,
}: {
  initialProducts: ManagedProduct[];
  baseProducts: Product[];
  categories: Category[];
  onNotify: (msg: string) => void;
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [editor, setEditor] = useState<ProductEditorState | null>(null);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.title, p.slug, p.excerpt].join(" ").toLowerCase().includes(q),
    );
  }, [products, query]);

  const remove = async (slug: string) => {
    if (!window.confirm("Удалить товар и загруженное изображение?")) return;
    setDeleting(slug);
    try {
      const res = await fetch(`/api/admin/products/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Не удалось удалить.");
      setProducts((p) => p.filter((item) => item.slug !== slug));
      onNotify("Товар удалён.");
    } catch (e) {
      onNotify(e instanceof Error ? e.message : "Ошибка удаления.");
    } finally {
      setDeleting(null);
    }
  };

  const upsert = (product: ManagedProduct) => {
    setProducts((cur) => {
      const exists = cur.some((p) => p.slug === product.slug);
      return exists ? cur.map((p) => (p.slug === product.slug ? product : p)) : [product, ...cur];
    });
    setEditor(null);
    onNotify("Товар сохранён и доступен в каталоге.");
    router.refresh();
  };

  const published = products.filter((p) => p.published).length;

  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">Готовые принты</p>
          <h1 className="mt-1 text-3xl font-bold">Товары каталога</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Созданные здесь карточки появляются в каталоге и получают индексируемую страницу товара.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ mode: "create" })}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          <PackagePlus className="h-4 w-4" /> Добавить товар
        </button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <StatCard label="Управляемые товары" value={products.length} icon={Archive} />
        <StatCard label="Опубликовано" value={published} icon={CheckCircle2} />
        <StatCard label="Базовые карточки" value={baseProducts.length} icon={ImagePlus} />
      </div>

      <section className="mt-8 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию или slug"
              className="h-10 w-full rounded-md border border-neutral-300 pr-3 pl-9 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
          <p className="text-sm text-neutral-500">
            Показано: {filtered.length} из {products.length}
          </p>
        </div>

        {filtered.length ? (
          <div className="divide-y divide-neutral-200">
            {filtered.map((product) => (
              <ProductRow
                key={product.slug}
                product={product}
                category={categories.find((c) => c.slug === product.category)}
                deleting={deleting === product.slug}
                onEdit={() => setEditor({ mode: "edit", product })}
                onDelete={() => remove(product.slug)}
              />
            ))}
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <Archive className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-3 font-semibold">
              {products.length ? "Ничего не найдено" : "Пока нет добавленных товаров"}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {products.length ? "Измените запрос." : "Создайте первую карточку."}
            </p>
          </div>
        )}
      </section>

      <BaseProductsSection baseProducts={baseProducts} categories={categories} onNotify={onNotify} router={router} />

      {editor && (
        <ProductEditor
          state={editor}
          categories={categories}
          onClose={() => setEditor(null)}
          onSaved={upsert}
        />
      )}
    </>
  );
}

function ProductRow({
  product, category, deleting, onEdit, onDelete,
}: {
  product: ManagedProduct;
  category?: Category;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-4 p-4 md:grid-cols-[64px_minmax(0,1fr)_140px_120px_auto] md:items-center">
      <Image src={product.image} alt="" width={64} height={80} className="h-20 w-16 rounded-md bg-neutral-100 object-cover" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{product.title}</p>
          <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${product.published ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>
            {product.published ? "Опубликован" : "Черновик"}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-neutral-500">/{product.slug}</p>
      </div>
      <div className="text-sm">
        <p className="font-medium">{category?.title ?? product.category}</p>
        <p className="mt-0.5 text-xs text-neutral-500">Категория</p>
      </div>
      <div className="text-sm">
        <p className="font-semibold">{formatPrice(product.priceFrom)}</p>
        <p className="mt-0.5 text-xs text-neutral-500">Цена от</p>
      </div>
      <div className="flex items-center gap-1 md:justify-end">
        {product.published && (
          <Link href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`Открыть ${product.title}`} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100">
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
        <button type="button" onClick={onEdit} aria-label="Редактировать" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100">
          <Pencil className="h-4 w-4" />
        </button>
        <button type="button" onClick={onDelete} disabled={deleting} aria-label="Удалить" className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-40">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ProductEditor({
  state, categories, onClose, onSaved,
}: {
  state: ProductEditorState;
  categories: Category[];
  onClose: () => void;
  onSaved: (product: ManagedProduct) => void;
}) {
  const current = state.mode === "edit" ? state.product : undefined;
  const [title, setTitle] = useState(current?.title ?? "");
  const [slug, setSlug] = useState(current?.slug ?? "");
  const [excerpt, setExcerpt] = useState(current?.excerpt ?? "");
  const [description, setDescription] = useState(current?.description ?? "");
  const [priceFrom, setPriceFrom] = useState(String(current?.priceFrom ?? 1190));
  const [category, setCategory] = useState(current?.category ?? "s-printom");
  const [material, setMaterial] = useState(current?.material ?? "100% хлопок, 180 г/м²");
  const [printMethod, setPrintMethod] = useState(current?.printMethod ?? "Печать на заказ");
  const [imageAlt, setImageAlt] = useState(current?.imageAlt ?? "");
  const [badge, setBadge] = useState(current?.badge ?? "");
  const [published, setPublished] = useState(current?.published ?? true);
  const [colors, setColors] = useState<ProductColor[]>(current?.colors ?? colorOptions.slice(0, 2));
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : current?.image), [file, current?.image]);

  useEffect(() => { return () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }; }, [preview]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const updateTitle = (value: string) => {
    setTitle(value);
    if (state.mode === "create") {
      setSlug(slugify(value));
      if (!imageAlt) setImageAlt(`Футболка «${value}» с принтом`);
    }
  };

  const toggleColor = (color: ProductColor) => {
    setColors((cur) => {
      const exists = cur.some((c) => c.hex === color.hex);
      if (exists && cur.length === 1) return cur;
      return exists ? cur.filter((c) => c.hex !== color.hex) : [...cur, color];
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.mode === "create" && !file) { setError("Добавьте изображение."); return; }
    setPending(true); setError("");
    const data = new FormData();
    data.set("slug", slug); data.set("title", title); data.set("excerpt", excerpt);
    data.set("description", description); data.set("priceFrom", priceFrom);
    data.set("category", category); data.set("material", material);
    data.set("printMethod", printMethod); data.set("imageAlt", imageAlt);
    data.set("badge", badge); data.set("published", String(published));
    data.set("colors", JSON.stringify(colors));
    if (file) data.set("image", file);
    try {
      const res = await fetch(
        state.mode === "create" ? "/api/admin/products" : `/api/admin/products/${current?.slug}`,
        { method: state.mode === "create" ? "POST" : "PUT", body: data },
      );
      const result = (await res.json()) as { product?: ManagedProduct; error?: string };
      if (!res.ok || !result.product) throw new Error(result.error || "Ошибка сохранения.");
      onSaved(result.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35" role="dialog" aria-modal="true" aria-label={state.mode === "create" ? "Новый товар" : "Редактирование товара"} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5 sm:px-6">
          <div>
            <h2 className="font-semibold">{state.mode === "create" ? "Новый товар" : "Редактирование"}</h2>
            <p className="text-xs text-neutral-500">Карточка готового принта</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="Закрыть"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
            <label className="group relative flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50">
              {preview ? (
                <Image src={preview} alt="Предпросмотр" fill unoptimized={preview.startsWith("blob:")} className="object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-center text-xs text-neutral-500"><ImagePlus className="h-6 w-6" /> Фото 4:5</span>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" />
            </label>
            <div className="grid content-start gap-4">
              <Field label="Название"><input value={title} onChange={(e) => updateTitle(e.target.value)} required maxLength={100} className={inputClass} /></Field>
              <Field label="Slug" hint="Латиница, цифры, дефисы"><input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} required maxLength={80} disabled={state.mode === "edit"} className={inputClass} /></Field>
              <Field label="Alt изображения"><input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} required maxLength={180} className={inputClass} /></Field>
            </div>
          </div>
          <Field label="Короткое описание" hint={`${excerpt.length}/220`}><textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required maxLength={220} rows={2} className={textareaClass} /></Field>
          <Field label="Полное описание" hint={`${description.length}/3000`}><textarea value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={3000} rows={5} className={textareaClass} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Цена от, ₽"><input type="number" min={1} max={1000000} value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} required className={inputClass} /></Field>
            <Field label="Категория"><select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select></Field>
            <Field label="Материал"><input value={material} onChange={(e) => setMaterial(e.target.value)} required maxLength={140} className={inputClass} /></Field>
            <Field label="Метод печати"><input value={printMethod} onChange={(e) => setPrintMethod(e.target.value)} required maxLength={140} className={inputClass} /></Field>
            <Field label="Бейдж" hint="Необязательно"><input value={badge} onChange={(e) => setBadge(e.target.value)} maxLength={30} placeholder="Хит" className={inputClass} /></Field>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Доступные цвета</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {colorOptions.map((color) => {
                const selected = colors.some((c) => c.hex === color.hex);
                return (
                  <button key={color.hex} type="button" onClick={() => toggleColor(color)} aria-pressed={selected} className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium ${selected ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"}`}>
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />{color.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="mt-0.5 h-4 w-4 accent-neutral-900" />
            <span><span className="block text-sm font-semibold">Опубликовать товар</span><span className="mt-0.5 block text-xs text-neutral-500">Выключите, чтобы сохранить как черновик.</span></span>
          </label>
          {error && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-neutral-300 px-4 text-sm font-semibold hover:bg-neutral-50">Отмена</button>
          <button type="submit" disabled={pending} className="h-10 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
            {pending ? "Сохраняем..." : state.mode === "create" ? "Создать товар" : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Base Products Section ────────────────────────────────────────────────────

function BaseProductsSection({
  baseProducts,
  categories,
  onNotify,
  router,
}: {
  baseProducts: Product[];
  categories: Category[];
  onNotify: (msg: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [products, setProducts] = useState(baseProducts);
  const [editing, setEditing] = useState<Product | null>(null);

  const saved = (updated: Product) => {
    setProducts((cur) => cur.map((p) => (p.slug === updated.slug ? updated : p)));
    setEditing(null);
    onNotify("Базовый товар обновлён.");
    router.refresh();
  };

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold">Базовые товары</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.slug} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3">
            <Image src={product.image} alt="" width={56} height={70} className="h-14 w-12 rounded-md object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{product.title}</span>
              <span className="text-xs text-neutral-500">{formatPrice(product.priceFrom)}</span>
            </span>
            <button type="button" onClick={() => setEditing(product)} aria-label="Редактировать" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100">
              <Pencil className="h-4 w-4" />
            </button>
            <Link href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" aria-label="Открыть" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
      {editing && (
        <BaseProductEditor
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}
    </section>
  );
}

function BaseProductEditor({
  product, categories, onClose, onSaved,
}: {
  product: Product;
  categories: Category[];
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const [title, setTitle] = useState(product.title);
  const [excerpt, setExcerpt] = useState(product.excerpt);
  const [description, setDescription] = useState(product.description);
  const [priceFrom, setPriceFrom] = useState(String(product.priceFrom));
  const [category, setCategory] = useState(product.category);
  const [material, setMaterial] = useState(product.material);
  const [printMethod, setPrintMethod] = useState(product.printMethod);
  const [imageAlt, setImageAlt] = useState(product.imageAlt);
  const [badge, setBadge] = useState(product.badge ?? "");
  const [colors, setColors] = useState<ProductColor[]>(product.colors);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : product.image), [file, product.image]);

  useEffect(() => { return () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }; }, [preview]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const toggleColor = (color: ProductColor) => {
    setColors((cur) => {
      const exists = cur.some((c) => c.hex === color.hex);
      if (exists && cur.length === 1) return cur;
      return exists ? cur.filter((c) => c.hex !== color.hex) : [...cur, color];
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true); setError("");
    const data = new FormData();
    data.set("title", title); data.set("excerpt", excerpt);
    data.set("description", description); data.set("priceFrom", priceFrom);
    data.set("category", category); data.set("material", material);
    data.set("printMethod", printMethod); data.set("imageAlt", imageAlt);
    data.set("badge", badge); data.set("colors", JSON.stringify(colors));
    if (file) data.set("image", file);
    try {
      const res = await fetch(`/api/admin/base-products/${product.slug}`, { method: "PUT", body: data });
      const result = (await res.json()) as { product?: Product; error?: string };
      if (!res.ok || !result.product) throw new Error(result.error || "Ошибка сохранения.");
      onSaved(result.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5 sm:px-6">
          <div>
            <h2 className="font-semibold">Редактирование базового товара</h2>
            <p className="text-xs text-neutral-500">{product.slug}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="Закрыть"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
            <label className="group relative flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50">
              <Image src={preview} alt="Предпросмотр" fill unoptimized={preview.startsWith("blob:")} className="object-cover" />
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" />
            </label>
            <div className="grid content-start gap-4">
              <Field label="Название"><input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} className={inputClass} /></Field>
              <Field label="Alt изображения"><input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} required maxLength={180} className={inputClass} /></Field>
              <Field label="Бейдж" hint="Необязательно"><input value={badge} onChange={(e) => setBadge(e.target.value)} maxLength={30} placeholder="Хит" className={inputClass} /></Field>
            </div>
          </div>
          <Field label="Короткое описание" hint={`${excerpt.length}/220`}><textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required maxLength={220} rows={2} className={textareaClass} /></Field>
          <Field label="Полное описание" hint={`${description.length}/3000`}><textarea value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={3000} rows={5} className={textareaClass} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Цена от, ₽"><input type="number" min={1} value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} required className={inputClass} /></Field>
            <Field label="Категория"><select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select></Field>
            <Field label="Материал"><input value={material} onChange={(e) => setMaterial(e.target.value)} required maxLength={140} className={inputClass} /></Field>
            <Field label="Метод печати"><input value={printMethod} onChange={(e) => setPrintMethod(e.target.value)} required maxLength={140} className={inputClass} /></Field>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Доступные цвета</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {colorOptions.map((color) => {
                const selected = colors.some((c) => c.hex === color.hex);
                return (
                  <button key={color.hex} type="button" onClick={() => toggleColor(color)} aria-pressed={selected} className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium ${selected ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"}`}>
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color.hex }} />{color.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
          {error && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-neutral-300 px-4 text-sm font-semibold hover:bg-neutral-50">Отмена</button>
          <button type="submit" disabled={pending} className="h-10 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
            {pending ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Content Panel ────────────────────────────────────────────────────────────

type ContentSection = "pricing" | "benefits" | "steps" | "trustbar" | "useCases" | "categories";

function ContentPanel({
  initialContent,
  initialCategories,
  onNotify,
}: {
  initialContent: ManagedContent;
  initialCategories: Category[];
  onNotify: (msg: string) => void;
}) {
  const [section, setSection] = useState<ContentSection>("pricing");
  const [content, setContent] = useState(initialContent);
  const [categories, setCategories] = useState(initialCategories);

  const saveSection = async (key: keyof ManagedContent, data: ManagedContent[keyof ManagedContent]) => {
    const res = await fetch(`/api/admin/content?section=${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Ошибка сохранения.");
    setContent((c) => ({ ...c, [key]: data }));
    onNotify("Сохранено.");
  };

  const saveCategory = async (slug: string, data: Omit<Category, "slug">, imageFile?: File | null) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.set(k, v));
    if (imageFile) form.set("image", imageFile);
    const res = await fetch(`/api/admin/categories/${slug}`, { method: "PUT", body: form });
    const result = (await res.json()) as { category?: Category; error?: string };
    if (!res.ok || !result.category) throw new Error(result.error ?? "Ошибка сохранения.");
    setCategories((cur) => cur.map((c) => (c.slug === slug ? result.category! : c)));
    onNotify("Категория сохранена.");
  };

  const sectionTabs: { id: ContentSection; label: string }[] = [
    { id: "pricing", label: "Цены" },
    { id: "benefits", label: "Преимущества" },
    { id: "steps", label: "Как мы работаем" },
    { id: "trustbar", label: "Trust Bar" },
    { id: "useCases", label: "Сценарии" },
    { id: "categories", label: "Категории" },
  ];

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase text-neutral-500">Контент сайта</p>
        <h1 className="mt-1 text-3xl font-bold">Редактор контента</h1>
        <p className="mt-2 text-sm text-neutral-600">Измените тексты, цены и изображения секций главной страницы.</p>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-neutral-200">
        {sectionTabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setSection(t.id)} className={`inline-flex h-10 items-center whitespace-nowrap border-b-2 px-4 text-sm font-medium transition-colors ${section === t.id ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {section === "pricing" && <PricingEditor tiers={content.pricing} onSave={(d) => saveSection("pricing", d)} />}
        {section === "benefits" && <BenefitsEditor items={content.benefits} onSave={(d) => saveSection("benefits", d)} />}
        {section === "steps" && <StepsEditor items={content.steps} onSave={(d) => saveSection("steps", d)} />}
        {section === "trustbar" && <TrustBarEditor items={content.trustbar} onSave={(d) => saveSection("trustbar", d)} />}
        {section === "useCases" && <UseCasesEditor items={content.useCases} onSave={(d) => saveSection("useCases", d)} />}
        {section === "categories" && <CategoriesEditor categories={categories} onSave={saveCategory} />}
      </div>
    </>
  );
}

// ─── Pricing Editor ───────────────────────────────────────────────────────────

function PricingEditor({ tiers, onSave }: { tiers: PricingTier[]; onSave: (d: PricingTier[]) => Promise<void> }) {
  const [items, setItems] = useState(tiers);
  const [editing, setEditing] = useState<{ idx: number; tier: PricingTier } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const empty = (): PricingTier => ({ name: "", price: 0, oldPrice: null, badge: null, note: "", features: [], ctaLabel: "Заказать", ctaHref: "/configurator", featured: false });

  const save = async () => {
    setPending(true); setError("");
    try { await onSave(items); } catch (e) { setError(e instanceof Error ? e.message : "Ошибка."); } finally { setPending(false); }
  };

  const commitEditing = (tier: PricingTier) => {
    if (!editing) return;
    setItems((cur) => editing.idx === -1 ? [...cur, tier] : cur.map((t, i) => i === editing.idx ? tier : t));
    setEditing(null);
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Тарифные карточки ({items.length})</p>
        <button type="button" onClick={() => setEditing({ idx: -1, tier: empty() })} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800"><Plus className="h-3.5 w-3.5" /> Добавить</button>
      </div>
      {items.map((tier, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
          <div>
            <p className="font-semibold text-sm">{tier.name} <span className="ml-2 text-xs text-neutral-500">₽{tier.price} / {tier.note}</span></p>
            <p className="text-xs text-neutral-400 mt-0.5">{tier.features.slice(0, 2).join(" · ")}</p>
          </div>
          <div className="flex items-center gap-1">
            {tier.featured && <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Хит</span>}
            <button type="button" onClick={() => setEditing({ idx: i, tier })} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => setItems((c) => c.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={save} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"><Save className="h-4 w-4" />{pending ? "Сохраняем..." : "Сохранить"}</button>
      {editing && <PricingTierEditor tier={editing.tier} onClose={() => setEditing(null)} onSave={commitEditing} />}
    </div>
  );
}

function PricingTierEditor({ tier, onClose, onSave }: { tier: PricingTier; onClose: () => void; onSave: (t: PricingTier) => void }) {
  const [t, setT] = useState(tier);
  const [featureInput, setFeatureInput] = useState(tier.features.join("\n"));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...t, features: featureInput.split("\n").map((s) => s.trim()).filter(Boolean) });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
          <h2 className="font-semibold">Тарифная карточка</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="Закрыть"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
          <Field label="Название тарифа"><input value={t.name} onChange={(e) => setT((p) => ({ ...p, name: e.target.value }))} required className={inputClass} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Цена, ₽"><input type="number" min={0} value={t.price} onChange={(e) => setT((p) => ({ ...p, price: Number(e.target.value) }))} required className={inputClass} /></Field>
            <Field label="Зачёркнутая цена, ₽" hint="Необязательно"><input type="number" min={0} value={t.oldPrice ?? ""} onChange={(e) => setT((p) => ({ ...p, oldPrice: e.target.value ? Number(e.target.value) : null }))} className={inputClass} /></Field>
          </div>
          <Field label="Подпись к цене" hint="Например: за футболку"><input value={t.note} onChange={(e) => setT((p) => ({ ...p, note: e.target.value }))} required className={inputClass} /></Field>
          <Field label="Бейдж" hint="Необязательно"><input value={t.badge ?? ""} onChange={(e) => setT((p) => ({ ...p, badge: e.target.value || null }))} className={inputClass} /></Field>
          <Field label="Фичи (по одной на строку)" hint="Enter = новая строка"><textarea value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} rows={5} className={textareaClass} /></Field>
          <Field label="Текст кнопки"><input value={t.ctaLabel} onChange={(e) => setT((p) => ({ ...p, ctaLabel: e.target.value }))} required className={inputClass} /></Field>
          <Field label="Ссылка кнопки"><input value={t.ctaHref} onChange={(e) => setT((p) => ({ ...p, ctaHref: e.target.value }))} required className={inputClass} /></Field>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={t.featured} onChange={(e) => setT((p) => ({ ...p, featured: e.target.checked }))} className="h-4 w-4 accent-neutral-900" />
            <span className="text-sm font-semibold">Выделить как основной</span>
          </label>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-neutral-300 px-4 text-sm font-semibold hover:bg-neutral-50">Отмена</button>
          <button type="submit" className="h-10 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800">Готово</button>
        </div>
      </form>
    </div>
  );
}

// ─── Benefits Editor ──────────────────────────────────────────────────────────

function BenefitsEditor({ items, onSave }: { items: Benefit[]; onSave: (d: Benefit[]) => Promise<void> }) {
  const [list, setList] = useState(items);
  const [editing, setEditing] = useState<{ idx: number; item: Benefit } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setPending(true); setError("");
    try { await onSave(list); } catch (e) { setError(e instanceof Error ? e.message : "Ошибка."); } finally { setPending(false); }
  };

  const commit = (item: Benefit) => {
    if (!editing) return;
    setList((cur) => editing.idx === -1 ? [...cur, item] : cur.map((b, i) => i === editing.idx ? item : b));
    setEditing(null);
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Карточки преимуществ ({list.length})</p>
        <button type="button" onClick={() => setEditing({ idx: -1, item: { icon: "star", title: "", text: "" } })} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800"><Plus className="h-3.5 w-3.5" /> Добавить</button>
      </div>
      {list.map((b, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
          <div>
            <p className="font-semibold text-sm">{b.title}</p>
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{b.text}</p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setEditing({ idx: i, item: b })} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => setList((c) => c.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={save} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"><Save className="h-4 w-4" />{pending ? "Сохраняем..." : "Сохранить"}</button>
      {editing && (
        <SimpleDrawer title="Преимущество" onClose={() => setEditing(null)} onSave={() => commit(editing.item)}>
          <Field label="Иконка" hint="Название из lucide-react, напр. star"><input value={editing.item.icon} onChange={(e) => setEditing((p) => p && ({ ...p, item: { ...p.item, icon: e.target.value } }))} required className={inputClass} /></Field>
          <Field label="Заголовок"><input value={editing.item.title} onChange={(e) => setEditing((p) => p && ({ ...p, item: { ...p.item, title: e.target.value } }))} required className={inputClass} /></Field>
          <Field label="Описание"><textarea value={editing.item.text} onChange={(e) => setEditing((p) => p && ({ ...p, item: { ...p.item, text: e.target.value } }))} required rows={3} className={textareaClass} /></Field>
        </SimpleDrawer>
      )}
    </div>
  );
}

// ─── Steps Editor ─────────────────────────────────────────────────────────────

function StepsEditor({ items, onSave }: { items: Step[]; onSave: (d: Step[]) => Promise<void> }) {
  const [list, setList] = useState(items);
  const [editing, setEditing] = useState<{ idx: number; item: Step } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setPending(true); setError("");
    try { await onSave(list); } catch (e) { setError(e instanceof Error ? e.message : "Ошибка."); } finally { setPending(false); }
  };

  const commit = (item: Step) => {
    if (!editing) return;
    setList((cur) => editing.idx === -1 ? [...cur, item] : cur.map((s, i) => i === editing.idx ? item : s));
    setEditing(null);
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Шаги ({list.length})</p>
        <button type="button" onClick={() => setEditing({ idx: -1, item: { title: "", text: "" } })} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800"><Plus className="h-3.5 w-3.5" /> Добавить</button>
      </div>
      {list.map((s, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4">
          <div>
            <p className="font-semibold text-sm">0{i + 1}. {s.title}</p>
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{s.text}</p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setEditing({ idx: i, item: s })} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => setList((c) => c.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={save} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"><Save className="h-4 w-4" />{pending ? "Сохраняем..." : "Сохранить"}</button>
      {editing && (
        <SimpleDrawer title="Шаг" onClose={() => setEditing(null)} onSave={() => commit(editing.item)}>
          <Field label="Заголовок шага"><input value={editing.item.title} onChange={(e) => setEditing((p) => p && ({ ...p, item: { ...p.item, title: e.target.value } }))} required className={inputClass} /></Field>
          <Field label="Описание"><textarea value={editing.item.text} onChange={(e) => setEditing((p) => p && ({ ...p, item: { ...p.item, text: e.target.value } }))} required rows={3} className={textareaClass} /></Field>
        </SimpleDrawer>
      )}
    </div>
  );
}

// ─── TrustBar Editor ──────────────────────────────────────────────────────────

function TrustBarEditor({ items, onSave }: { items: string[]; onSave: (d: string[]) => Promise<void> }) {
  const [list, setList] = useState(items);
  const [newItem, setNewItem] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setPending(true); setError("");
    try { await onSave(list); } catch (e) { setError(e instanceof Error ? e.message : "Ошибка."); } finally { setPending(false); }
  };

  const add = () => {
    const v = newItem.trim();
    if (!v) return;
    setList((c) => [...c, v]);
    setNewItem("");
  };

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm font-semibold">Строки бегущей строки ({list.length})</p>
      <div className="space-y-2">
        {list.map((item, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2">
            <span className="flex-1 text-sm">{item}</span>
            <button type="button" onClick={() => setList((c) => c.filter((_, j) => j !== i))} className="flex h-7 w-7 items-center justify-center rounded text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder="Новый пункт..." className={`${inputClass} flex-1`} />
        <button type="button" onClick={add} className="inline-flex h-10 items-center gap-1 rounded-md bg-neutral-100 px-3 text-sm font-medium hover:bg-neutral-200"><Plus className="h-4 w-4" /></button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={save} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"><Save className="h-4 w-4" />{pending ? "Сохраняем..." : "Сохранить"}</button>
    </div>
  );
}

// ─── UseCases Editor ──────────────────────────────────────────────────────────

function UseCasesEditor({ items, onSave }: { items: UseCase[]; onSave: (d: UseCase[]) => Promise<void> }) {
  const [list, setList] = useState(items);
  const [editing, setEditing] = useState<{ idx: number; item: UseCase } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setPending(true); setError("");
    try { await onSave(list); } catch (e) { setError(e instanceof Error ? e.message : "Ошибка."); } finally { setPending(false); }
  };

  const commit = (item: UseCase) => {
    if (!editing) return;
    setList((cur) => editing.idx === -1 ? [...cur, item] : cur.map((u, i) => i === editing.idx ? item : u));
    setEditing(null);
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Сценарии ({list.length})</p>
        <button type="button" onClick={() => setEditing({ idx: -1, item: { title: "", text: "", image: "", imageAlt: "" } })} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800"><Plus className="h-3.5 w-3.5" /> Добавить</button>
      </div>
      {list.map((u, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
          {u.image && <Image src={u.image} alt={u.imageAlt} width={64} height={40} className="h-10 w-16 rounded-md object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">{u.title}</p>
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{u.text}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => setEditing({ idx: i, item: u })} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={() => setList((c) => c.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={save} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"><Save className="h-4 w-4" />{pending ? "Сохраняем..." : "Сохранить"}</button>
      {editing && (
        <SimpleDrawer title="Сценарий" onClose={() => setEditing(null)} onSave={() => commit(editing.item)}>
          <Field label="Заголовок"><input value={editing.item.title} onChange={(e) => setEditing((p) => p && ({ ...p, item: { ...p.item, title: e.target.value } }))} required className={inputClass} /></Field>
          <Field label="Описание"><textarea value={editing.item.text} onChange={(e) => setEditing((p) => p && ({ ...p, item: { ...p.item, text: e.target.value } }))} required rows={3} className={textareaClass} /></Field>
          <Field label="URL изображения" hint="Или замените через Медиа"><input value={editing.item.image} onChange={(e) => setEditing((p) => p && ({ ...p, item: { ...p.item, image: e.target.value } }))} required className={inputClass} /></Field>
          <Field label="Alt изображения"><input value={editing.item.imageAlt} onChange={(e) => setEditing((p) => p && ({ ...p, item: { ...p.item, imageAlt: e.target.value } }))} required className={inputClass} /></Field>
        </SimpleDrawer>
      )}
    </div>
  );
}

// ─── Categories Editor ────────────────────────────────────────────────────────

function CategoriesEditor({
  categories,
  onSave,
}: {
  categories: Category[];
  onSave: (slug: string, data: Omit<Category, "slug">, imageFile?: File | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState<Category | null>(null);

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm font-semibold">Категории ({categories.length})</p>
      {categories.map((c) => (
        <div key={c.slug} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4">
          <Image src={c.image} alt={c.imageAlt} width={48} height={64} className="h-16 w-12 rounded-md object-cover" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">{c.title}</p>
            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{c.description}</p>
          </div>
          <button type="button" onClick={() => setEditing(c)} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button>
        </div>
      ))}
      {editing && (
        <CategoryEditor
          category={editing}
          onClose={() => setEditing(null)}
          onSave={async (data, file) => { await onSave(editing.slug, data, file); setEditing(null); }}
        />
      )}
    </div>
  );
}

function CategoryEditor({
  category, onClose, onSave,
}: {
  category: Category;
  onClose: () => void;
  onSave: (data: Omit<Category, "slug">, file?: File | null) => Promise<void>;
}) {
  const [title, setTitle] = useState(category.title);
  const [description, setDescription] = useState(category.description);
  const [imageAlt, setImageAlt] = useState(category.imageAlt);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : category.image), [file, category.image]);

  useEffect(() => { return () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }; }, [preview]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true); setError("");
    try {
      await onSave({ title, description, image: category.image, imageAlt }, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
          <h2 className="font-semibold">Редактирование категории</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="Закрыть"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
          <label className="group relative flex aspect-[3/4] w-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50">
            <Image src={preview} alt="Предпросмотр" fill unoptimized={preview.startsWith("blob:")} className="object-cover" />
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" />
          </label>
          <Field label="Заголовок категории"><input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} className={inputClass} /></Field>
          <Field label="Описание (подпись)"><textarea value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={200} rows={2} className={textareaClass} /></Field>
          <Field label="Alt изображения"><input value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} required maxLength={180} className={inputClass} /></Field>
          {error && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-neutral-300 px-4 text-sm font-semibold hover:bg-neutral-50">Отмена</button>
          <button type="submit" disabled={pending} className="h-10 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">{pending ? "Сохраняем..." : "Сохранить"}</button>
        </div>
      </form>
    </div>
  );
}

// ─── SimpleDrawer helper ──────────────────────────────────────────────────────

function SimpleDrawer({
  title,
  children,
  onClose,
  onSave,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="Закрыть"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">{children}</div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-neutral-300 px-4 text-sm font-semibold hover:bg-neutral-50">Отмена</button>
          <button type="button" onClick={onSave} className="h-10 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800">Готово</button>
        </div>
      </div>
    </div>
  );
}

// ─── Reviews Panel ────────────────────────────────────────────────────────────

type ReviewEditorState = { mode: "create" } | { mode: "edit"; review: ManagedReview };

function ReviewsPanel({
  initialReviews,
  onNotify,
}: {
  initialReviews: ManagedReview[];
  onNotify: (msg: string) => void;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [editor, setEditor] = useState<ReviewEditorState | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!window.confirm("Удалить отзыв?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setReviews((r) => r.filter((item) => item.id !== id));
      onNotify("Отзыв удалён.");
    } catch {
      onNotify("Не удалось удалить отзыв.");
    } finally {
      setDeleting(null);
    }
  };

  const upsert = (review: ManagedReview) => {
    setReviews((cur) => {
      const exists = cur.some((r) => r.id === review.id);
      return exists ? cur.map((r) => (r.id === review.id ? review : r)) : [review, ...cur];
    });
    setEditor(null);
    onNotify("Отзыв сохранён.");
  };

  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">Контент</p>
          <h1 className="mt-1 text-3xl font-bold">Отзывы клиентов</h1>
          <p className="mt-2 text-sm text-neutral-600">Показываются в карусели на главной странице и страницах каталога.</p>
        </div>
        <button type="button" onClick={() => setEditor({ mode: "create" })} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800">
          <Plus className="h-4 w-4" /> Добавить отзыв
        </button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <StatCard label="Всего отзывов" value={reviews.length} icon={MessageSquare} />
        <StatCard label="Опубликовано" value={reviews.filter((r) => r.published).length} icon={CheckCircle2} />
        <StatCard label="Средний рейтинг" value={reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—"} icon={Star} />
      </div>

      <section className="mt-8 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        {reviews.length ? (
          <div className="divide-y divide-neutral-200">
            {reviews.map((review) => (
              <div key={review.id} className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm">{review.name}</span>
                    <span className="text-xs text-neutral-500">{review.context}</span>
                    <span className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`} />))}</span>
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${review.published ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>{review.published ? "Опубликован" : "Скрыт"}</span>
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">{review.source}</span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-700 line-clamp-2">{review.text}</p>
                  <p className="mt-1 text-xs text-neutral-400">{review.date}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => setEditor({ mode: "edit", review })} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(review.id)} disabled={deleting === review.id} className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-3 font-semibold">Нет отзывов</p>
          </div>
        )}
      </section>

      {editor && <ReviewEditor state={editor} onClose={() => setEditor(null)} onSaved={upsert} />}
    </>
  );
}

function ReviewEditor({
  state, onClose, onSaved,
}: {
  state: ReviewEditorState;
  onClose: () => void;
  onSaved: (review: ManagedReview) => void;
}) {
  const current = state.mode === "edit" ? state.review : undefined;
  const [name, setName] = useState(current?.name ?? "");
  const [context, setContext] = useState(current?.context ?? "");
  const [rating, setRating] = useState(current?.rating ?? 5);
  const [text, setText] = useState(current?.text ?? "");
  const [date, setDate] = useState(current?.date ?? new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState<ManagedReview["source"]>(current?.source ?? "manual");
  const [published, setPublished] = useState(current?.published ?? true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true); setError("");
    const body = { name, context, rating, text, date, source, published };
    try {
      const res = await fetch(
        state.mode === "create" ? "/api/admin/reviews" : `/api/admin/reviews/${current?.id}`,
        { method: state.mode === "create" ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      );
      const result = (await res.json()) as { review?: ManagedReview; error?: string };
      if (!res.ok || !result.review) throw new Error(result.error || "Ошибка сохранения.");
      onSaved(result.review);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
          <h2 className="font-semibold">{state.mode === "create" ? "Новый отзыв" : "Редактирование отзыва"}</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="Закрыть"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Имя"><input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className={inputClass} /></Field>
            <Field label="Контекст / подпись"><input value={context} onChange={(e) => setContext(e.target.value)} maxLength={100} placeholder="Яндекс.Карты · знаток" className={inputClass} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Рейтинг">
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className={inputClass}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </Field>
            <Field label="Дата"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} /></Field>
            <Field label="Источник">
              <select value={source} onChange={(e) => setSource(e.target.value as ManagedReview["source"])} className={inputClass}>
                <option value="manual">Клиент</option>
                <option value="yandex">Яндекс.Карты</option>
                <option value="avito">Avito</option>
              </select>
            </Field>
          </div>
          <Field label="Текст отзыва" hint={`${text.length}/1000`}>
            <textarea value={text} onChange={(e) => setText(e.target.value)} required maxLength={1000} rows={5} className={textareaClass} />
          </Field>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-neutral-900" />
            <span className="text-sm font-semibold">Опубликовать</span>
          </label>
          {error && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-neutral-300 px-4 text-sm font-semibold hover:bg-neutral-50">Отмена</button>
          <button type="submit" disabled={pending} className="h-10 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
            {pending ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── FAQ Panel ────────────────────────────────────────────────────────────────

type FaqEditorState = { mode: "create" } | { mode: "edit"; item: ManagedFaqItem };

function FaqPanel({
  initialFaq,
  onNotify,
}: {
  initialFaq: ManagedFaqItem[];
  onNotify: (msg: string) => void;
}) {
  const [items, setItems] = useState(initialFaq);
  const [editor, setEditor] = useState<FaqEditorState | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!window.confirm("Удалить вопрос?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((cur) => cur.filter((i) => i.id !== id));
      onNotify("Вопрос удалён.");
    } catch {
      onNotify("Не удалось удалить.");
    } finally {
      setDeleting(null);
    }
  };

  const upsert = (item: ManagedFaqItem) => {
    setItems((cur) => {
      const exists = cur.some((i) => i.id === item.id);
      return exists ? cur.map((i) => (i.id === item.id ? item : i)) : [...cur, item];
    });
    setEditor(null);
    onNotify("FAQ сохранён.");
  };

  const togglePublished = async (item: ManagedFaqItem) => {
    const updated = { ...item, published: !item.published };
    const res = await fetch(`/api/admin/faq/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const result = (await res.json()) as { item: ManagedFaqItem };
      setItems((cur) => cur.map((i) => (i.id === item.id ? result.item : i)));
    }
  };

  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">Контент</p>
          <h1 className="mt-1 text-3xl font-bold">Вопросы и ответы</h1>
          <p className="mt-2 text-sm text-neutral-600">Показываются в блоке FAQ на главной странице.</p>
        </div>
        <button type="button" onClick={() => setEditor({ mode: "create" })} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800">
          <Plus className="h-4 w-4" /> Добавить вопрос
        </button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <StatCard label="Всего вопросов" value={items.length} icon={HelpCircle} />
        <StatCard label="Опубликовано" value={items.filter((i) => i.published).length} icon={CheckCircle2} />
      </div>

      <section className="mt-8 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        {items.length ? (
          <div className="divide-y divide-neutral-200">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-start gap-4 p-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm">{item.question}</p>
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${item.published ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>{item.published ? "Виден" : "Скрыт"}</span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{item.answer}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => togglePublished(item)} title={item.published ? "Скрыть" : "Показать"} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100">
                    <CheckCircle2 className={`h-4 w-4 ${item.published ? "text-emerald-600" : "text-neutral-400"}`} />
                  </button>
                  <button type="button" onClick={() => setEditor({ mode: "edit", item })} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(item.id)} disabled={deleting === item.id} className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-3 font-semibold">Нет вопросов</p>
          </div>
        )}
      </section>

      {editor && <FaqEditor state={editor} onClose={() => setEditor(null)} onSaved={upsert} />}
    </>
  );
}

function FaqEditor({
  state, onClose, onSaved,
}: {
  state: FaqEditorState;
  onClose: () => void;
  onSaved: (item: ManagedFaqItem) => void;
}) {
  const current = state.mode === "edit" ? state.item : undefined;
  const [question, setQuestion] = useState(current?.question ?? "");
  const [answer, setAnswer] = useState(current?.answer ?? "");
  const [published, setPublished] = useState(current?.published ?? true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true); setError("");
    const body = { question, answer, published, order: current?.order ?? 0 };
    try {
      const res = await fetch(
        state.mode === "create" ? "/api/admin/faq" : `/api/admin/faq/${current?.id}`,
        { method: state.mode === "create" ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      );
      const result = (await res.json()) as { item?: ManagedFaqItem; error?: string };
      if (!res.ok || !result.item) throw new Error(result.error || "Ошибка.");
      onSaved(result.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={submit} className="flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
          <h2 className="font-semibold">{state.mode === "create" ? "Новый вопрос" : "Редактирование FAQ"}</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="Закрыть"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
          <Field label="Вопрос"><input value={question} onChange={(e) => setQuestion(e.target.value)} required maxLength={300} className={inputClass} /></Field>
          <Field label="Ответ" hint={`${answer.length}/2000`}><textarea value={answer} onChange={(e) => setAnswer(e.target.value)} required maxLength={2000} rows={6} className={textareaClass} /></Field>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-neutral-900" />
            <span className="text-sm font-semibold">Опубликовать</span>
          </label>
          {error && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-md border border-neutral-300 px-4 text-sm font-semibold hover:bg-neutral-50">Отмена</button>
          <button type="submit" disabled={pending} className="h-10 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
            {pending ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel({
  initialSettings,
  onNotify,
}: {
  initialSettings: ManagedSettings;
  onNotify: (msg: string) => void;
}) {
  const [s, setS] = useState(initialSettings);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof ManagedSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true); setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const result = (await res.json()) as { settings?: ManagedSettings; error?: string };
      if (!res.ok || !result.settings) throw new Error(result.error || "Ошибка.");
      setS(result.settings);
      onNotify("Настройки сохранены. Изменения вступят в силу после перезапуска сервера.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase text-neutral-500">Конфигурация</p>
        <h1 className="mt-1 text-3xl font-bold">Настройки сайта</h1>
        <p className="mt-2 text-sm text-neutral-600">Контакты, ссылки и идентификатор Яндекс.Метрики.</p>
      </div>

      <form onSubmit={submit} className="mt-8 max-w-2xl space-y-6">
        <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Контакты</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Телефон"><input value={s.phone} onChange={update("phone")} required className={inputClass} /></Field>
            <Field label="Email"><input type="email" value={s.email} onChange={update("email")} required className={inputClass} /></Field>
            <Field label="Адрес"><input value={s.address} onChange={update("address")} className={inputClass} /></Field>
            <Field label="Часы работы"><input value={s.hours} onChange={update("hours")} className={inputClass} /></Field>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold mb-4">Мессенджеры</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telegram (t.me/...)"><input value={s.telegram} onChange={update("telegram")} placeholder="https://t.me/username" className={inputClass} /></Field>
            <Field label="MAX (vk.me/...)"><input value={s.max} onChange={update("max")} placeholder="https://vk.me/79001234567" className={inputClass} /></Field>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold mb-1">Яндекс.Метрика</h2>
          <p className="text-sm text-neutral-500 mb-4">Вставьте номер счётчика (только цифры). Также добавьте <code className="font-mono bg-neutral-100 px-1 rounded">NEXT_PUBLIC_YANDEX_METRIKA_ID</code> в <code className="font-mono bg-neutral-100 px-1 rounded">.env.local</code> и перезапустите сервер.</p>
          <Field label="ID счётчика"><input value={s.yandexMetrikaId} onChange={update("yandexMetrikaId")} placeholder="12345678" pattern="\d*" className={inputClass} /></Field>
        </section>

        {error && <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-md bg-neutral-900 px-6 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">
          <Save className="h-4 w-4" /> {pending ? "Сохраняем..." : "Сохранить настройки"}
        </button>
      </form>
    </>
  );
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────

interface AnalyticsSummary {
  totalPageviews: number;
  uniqueSessions: number;
  avgDuration: number;
  topPages: { page: string; views: number }[];
  devices: { mobile: number; desktop: number; tablet: number };
  daily: { date: string; views: number; sessions: number }[];
  topReferrers: { referrer: string; count: number }[];
  bounceRate: number;
}

function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/analytics/summary")
      .then((r) => r.json())
      .then((json: { summary?: AnalyticsSummary; error?: string }) => {
        if (json.summary) setData(json.summary);
        else setError(json.error ?? "Ошибка загрузки.");
      })
      .catch(() => setError("Не удалось загрузить аналитику."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-24 text-center text-sm text-neutral-500">Загрузка данных…</div>;
  if (error) return <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!data) return null;

  const formatDuration = (s: number) => s < 60 ? `${s} сек` : `${Math.floor(s / 60)} мин ${s % 60} сек`;

  const maxDailyViews = Math.max(...data.daily.map((d) => d.views), 1);
  const totalDevices = (data.devices.mobile + data.devices.desktop + data.devices.tablet) || 1;

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase text-neutral-500">Метрики</p>
        <h1 className="mt-1 text-3xl font-bold">Аналитика посещений</h1>
        <p className="mt-2 text-sm text-neutral-600">Собственный трекер — данные без внешних сервисов. Обновляется в реальном времени.</p>
      </div>

      {/* KPI cards */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Просмотров страниц" value={data.totalPageviews.toLocaleString("ru")} icon={TrendingUp} />
        <StatCard label="Уникальных сессий" value={data.uniqueSessions.toLocaleString("ru")} icon={CheckCircle2} />
        <StatCard label="Среднее время на сайте" value={formatDuration(data.avgDuration)} icon={BarChart2} />
        <StatCard label="Показатель отказов" value={`${data.bounceRate}%`} icon={MessageSquare} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Daily chart */}
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Просмотры за 30 дней</h2>
          {data.daily.every((d) => d.views === 0) ? (
            <p className="text-sm text-neutral-500 py-8 text-center">Данных пока нет — посетите сайт, чтобы появились записи.</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {data.daily.slice(-30).map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-neutral-900 rounded-t transition-all"
                    style={{ height: `${Math.max(2, (d.views / maxDailyViews) * 128)}px` }}
                  />
                  <div className="absolute bottom-full mb-1 hidden group-hover:block text-[10px] bg-neutral-900 text-white px-2 py-1 rounded whitespace-nowrap z-10">
                    {d.date.slice(5)}: {d.views} просм., {d.sessions} сессий
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 flex justify-between text-[10px] text-neutral-400">
            <span>{data.daily[0]?.date.slice(5)}</span>
            <span>{data.daily[data.daily.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        {/* Device breakdown */}
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Устройства</h2>
          <div className="space-y-3">
            {(
              [
                { key: "mobile", label: "Мобильные" },
                { key: "desktop", label: "Десктоп" },
                { key: "tablet", label: "Планшеты" },
              ] as const
            ).map(({ key, label }) => {
              const count = data.devices[key];
              const pct = Math.round((count / totalDevices) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{label}</span>
                    <span className="text-neutral-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div className="h-full bg-neutral-900 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top pages */}
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Популярные страницы</h2>
          {data.topPages.length ? (
            <div className="divide-y divide-neutral-100">
              {data.topPages.map((p, i) => (
                <div key={p.page} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-neutral-400 w-5 text-right">{i + 1}</span>
                    <span className="truncate font-mono text-xs">{p.page}</span>
                  </span>
                  <span className="ml-4 shrink-0 font-semibold">{p.views}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Нет данных.</p>
          )}
        </div>

        {/* Referrers */}
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Источники трафика</h2>
          {data.topReferrers.length ? (
            <div className="divide-y divide-neutral-100">
              {data.topReferrers.map((r, i) => (
                <div key={r.referrer} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-neutral-400 w-5 text-right">{i + 1}</span>
                    <span className="truncate">{r.referrer || "Прямой переход"}</span>
                  </span>
                  <span className="ml-4 shrink-0 font-semibold">{r.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Нет данных о переходах.</p>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Media Panel ─────────────────────────────────────────────────────────────

interface ImageSlot {
  path: string;       // путь в public/, например "home/hero-print-01.webp"
  label: string;
  hint?: string;
  aspect: string;     // CSS aspect-ratio class
}

const IMAGE_SLOTS: { section: string; slots: ImageSlot[] }[] = [
  {
    section: "Главная — карусель Hero",
    slots: [
      { path: "home/hero-print-01.webp", label: "Hero 1", hint: "Белая футболка, фронт", aspect: "aspect-[3/4]" },
      { path: "home/hero-print-02.webp", label: "Hero 2", hint: "Чёрная оверсайз", aspect: "aspect-[3/4]" },
      { path: "home/hero-print-03.webp", label: "Hero 3", hint: "Белая, спина", aspect: "aspect-[3/4]" },
      { path: "home/hero-print-04.webp", label: "Hero 4", hint: "Выдача клиенту", aspect: "aspect-[3/4]" },
      { path: "home/hero-print-05.webp", label: "Hero 5", hint: "Крупный план", aspect: "aspect-[3/4]" },
      { path: "home/hero-print-06.webp", label: "Hero 6", hint: "Тираж на вешалках", aspect: "aspect-[3/4]" },
    ],
  },
  {
    section: "Категории",
    slots: [
      { path: "categories/ready-print.webp", label: "С готовым принтом", aspect: "aspect-[3/4]" },
      { path: "categories/photo-print.webp", label: "С вашим фото", aspect: "aspect-[3/4]" },
      { path: "categories/text-print.webp", label: "С надписью", aspect: "aspect-[3/4]" },
      { path: "categories/logo-print.webp", label: "С логотипом", aspect: "aspect-[3/4]" },
    ],
  },
  {
    section: "Карточки товаров (базовые)",
    slots: [
      { path: "products/oversize-premium.webp", label: "Oversize Premium", aspect: "aspect-[4/5]" },
      { path: "products/classic-cotton.webp", label: "Classic Cotton", aspect: "aspect-[4/5]" },
      { path: "products/noir-heavy.webp", label: "Noir Heavy", aspect: "aspect-[4/5]" },
      { path: "products/pair-edition.webp", label: "Pair Edition", aspect: "aspect-[4/5]" },
      { path: "products/corporate-line.webp", label: "Corporate Line", aspect: "aspect-[4/5]" },
      { path: "products/photo-art.webp", label: "Photo Art", aspect: "aspect-[4/5]" },
    ],
  },
  {
    section: "Под любой повод (UseCases)",
    slots: [
      { path: "use-cases/use-gift.webp", label: "Подарок с характером", aspect: "aspect-[16/10]" },
      { path: "use-cases/use-business.webp", label: "Мерч и брендинг", aspect: "aspect-[16/10]" },
      { path: "use-cases/use-event.webp", label: "Мероприятия и команды", aspect: "aspect-[16/10]" },
    ],
  },
  {
    section: "Конструктор — мокапы футболок",
    slots: [
      { path: "mockups/tshirt-white-front.webp", label: "Белая, перед", aspect: "aspect-square" },
      { path: "mockups/tshirt-white-back.webp", label: "Белая, спина", aspect: "aspect-square" },
      { path: "mockups/tshirt-black-front.webp", label: "Чёрная, перед", aspect: "aspect-square" },
      { path: "mockups/tshirt-black-back.webp", label: "Чёрная, спина", aspect: "aspect-square" },
    ],
  },
];

function MediaPanel() {
  const [uploading, setUploading] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const upload = async (slot: ImageSlot, file: File) => {
    setUploading(slot.path);
    setError("");
    const form = new FormData();
    form.set("file", file);
    form.set("path", slot.path);
    try {
      const res = await fetch("/api/admin/images", { method: "POST", body: form });
      const result = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !result.url) throw new Error(result.error ?? "Ошибка загрузки.");
      // Bust cache with timestamp query
      setPreviews((p) => ({ ...p, [slot.path]: `${result.url}?t=${Date.now()}` }));
      setNotice(`«${slot.label}» обновлено. Перезагрузите страницу сайта чтобы увидеть изменение.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase text-neutral-500">Контент</p>
        <h1 className="mt-1 text-3xl font-bold">Медиатека</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Замените любое изображение — загрузите JPG, PNG или WebP, и оно сразу обновится на сайте.
        </p>
      </div>

      {notice && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="shrink-0"><X className="h-4 w-4" /></button>
        </div>
      )}
      {error && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="shrink-0"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="mt-8 space-y-10">
        {IMAGE_SLOTS.map((section) => (
          <section key={section.section}>
            <h2 className="mb-4 text-base font-semibold">{section.section}</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {section.slots.map((slot) => (
                <ImageSlotCard
                  key={slot.path}
                  slot={slot}
                  previewSrc={previews[slot.path]}
                  uploading={uploading === slot.path}
                  onFile={(file) => upload(slot, file)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function ImageSlotCard({
  slot,
  previewSrc,
  uploading,
  onFile,
}: {
  slot: ImageSlot;
  previewSrc?: string;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  const currentSrc = previewSrc ?? `/${slot.path}`;

  return (
    <div className="flex flex-col gap-2">
      <div className={`relative ${slot.aspect} w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100`}>
        <Image
          src={currentSrc}
          alt={slot.label}
          fill
          unoptimized={currentSrc.includes("?t=")}
          className="object-cover"
          sizes="200px"
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold leading-tight">{slot.label}</p>
        {slot.hint && <p className="text-[11px] text-neutral-400">{slot.hint}</p>}
        <p className="mt-0.5 font-mono text-[10px] text-neutral-400 truncate">{slot.path}</p>
      </div>
      <label className={`inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 text-xs font-medium hover:bg-neutral-50 ${uploading ? "pointer-events-none opacity-50" : ""}`}>
        <Upload className="h-3 w-3" /> Заменить
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(value: string) {
  const map: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"c",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
  return value.toLowerCase().split("").map((c) => map[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
