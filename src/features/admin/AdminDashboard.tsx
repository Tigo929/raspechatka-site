"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  LogOut,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { Category, ManagedProduct, Product, ProductColor } from "@/types";
import { formatPrice } from "@/lib/utils";

const colorOptions: ProductColor[] = [
  { name: "Белый", hex: "#F4F4F1" },
  { name: "Чёрный", hex: "#16161A" },
  { name: "Серый меланж", hex: "#9CA0A6" },
  { name: "Бежевый", hex: "#D9CBB3" },
  { name: "Синий", hex: "#2C3E78" },
  { name: "Бордовый", hex: "#6E2331" },
];

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; product: ManagedProduct };

export function AdminDashboard({
  initialProducts,
  baseProducts,
  categories,
}: {
  initialProducts: ManagedProduct[];
  baseProducts: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      [product.title, product.slug, product.excerpt]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [products, query]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  const remove = async (slug: string) => {
    if (!window.confirm("Удалить товар и загруженное изображение?")) return;
    setDeleting(slug);
    try {
      const response = await fetch(`/api/admin/products/${slug}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Не удалось удалить товар.");
      setProducts((current) =>
        current.filter((product) => product.slug !== slug),
      );
      setNotice("Товар удалён.");
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "Не удалось удалить товар.",
      );
    } finally {
      setDeleting(null);
    }
  };

  const upsert = (product: ManagedProduct) => {
    setProducts((current) => {
      const exists = current.some((item) => item.slug === product.slug);
      return exists
        ? current.map((item) => (item.slug === product.slug ? product : item))
        : [product, ...current];
    });
    setEditor(null);
    setNotice("Изменения сохранены и уже доступны в каталоге.");
    router.refresh();
  };

  const published = products.filter((product) => product.published).length;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-display text-lg font-extrabold">
              Распечат<span className="text-accent">ка</span>
            </Link>
            <span className="hidden h-5 w-px bg-neutral-200 sm:block" />
            <span className="hidden text-sm font-medium text-neutral-500 sm:block">
              Управление каталогом
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/catalog"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Открыть каталог</span>
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
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-8">
        {notice && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm">
            <span role="status">{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Закрыть уведомление"
              className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase">
              Готовые принты
            </p>
            <h1 className="mt-1 text-3xl font-bold">Товары каталога</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              Созданные здесь карточки сразу появляются в категории «С готовым
              принтом» и получают отдельную индексируемую страницу товара.
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
          <Stat
            label="Управляемые товары"
            value={products.length}
            icon={Archive}
          />
          <Stat label="Опубликовано" value={published} icon={CheckCircle2} />
          <Stat
            label="Базовые карточки"
            value={baseProducts.length}
            icon={ImagePlus}
          />
        </div>

        <section className="mt-8 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
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
                  category={categories.find(
                    (item) => item.slug === product.category,
                  )}
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
                {products.length
                  ? "Ничего не найдено"
                  : "Пока нет добавленных товаров"}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {products.length
                  ? "Попробуйте изменить поисковый запрос."
                  : "Создайте первую карточку готового принта."}
              </p>
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-semibold">Базовые товары</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Они хранятся в коде и показаны здесь только для контроля.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {baseProducts.map((product) => (
              <Link
                key={product.slug}
                href={`/product/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 hover:border-neutral-400"
              >
                <Image
                  src={product.image}
                  alt=""
                  width={56}
                  height={70}
                  className="h-14 w-12 rounded-md object-cover"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {product.title}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {formatPrice(product.priceFrom)}
                  </span>
                </span>
                <ExternalLink className="ml-auto h-4 w-4 text-neutral-400" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      {editor && (
        <ProductEditor
          state={editor}
          categories={categories}
          onClose={() => setEditor(null)}
          onSaved={upsert}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Archive;
}) {
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

function ProductRow({
  product,
  category,
  deleting,
  onEdit,
  onDelete,
}: {
  product: ManagedProduct;
  category?: Category;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-4 p-4 md:grid-cols-[64px_minmax(0,1fr)_140px_120px_auto] md:items-center">
      <Image
        src={product.image}
        alt=""
        width={64}
        height={80}
        className="h-20 w-16 rounded-md bg-neutral-100 object-cover"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{product.title}</p>
          <span
            className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
              product.published
                ? "bg-emerald-50 text-emerald-700"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {product.published ? "Опубликован" : "Черновик"}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-neutral-500">
          /{product.slug}
        </p>
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
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Открыть ${product.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Редактировать ${product.title}`}
          className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label={`Удалить ${product.title}`}
          className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ProductEditor({
  state,
  categories,
  onClose,
  onSaved,
}: {
  state: EditorState;
  categories: Category[];
  onClose: () => void;
  onSaved: (product: ManagedProduct) => void;
}) {
  const current = state.mode === "edit" ? state.product : undefined;
  const [title, setTitle] = useState(current?.title ?? "");
  const [slug, setSlug] = useState(current?.slug ?? "");
  const [excerpt, setExcerpt] = useState(current?.excerpt ?? "");
  const [description, setDescription] = useState(current?.description ?? "");
  const [priceFrom, setPriceFrom] = useState(
    String(current?.priceFrom ?? 1190),
  );
  const [category, setCategory] = useState(current?.category ?? "s-printom");
  const [material, setMaterial] = useState(
    current?.material ?? "100% хлопок, 180 г/м²",
  );
  const [printMethod, setPrintMethod] = useState(
    current?.printMethod ?? "DTG / прямая цифровая печать",
  );
  const [imageAlt, setImageAlt] = useState(current?.imageAlt ?? "");
  const [badge, setBadge] = useState(current?.badge ?? "");
  const [published, setPublished] = useState(current?.published ?? true);
  const [colors, setColors] = useState<ProductColor[]>(
    current?.colors ?? colorOptions.slice(0, 2),
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : current?.image),
    [file, current?.image],
  );

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const updateTitle = (value: string) => {
    setTitle(value);
    if (state.mode === "create") {
      setSlug(slugify(value));
      if (!imageAlt) setImageAlt(`Футболка «${value}» с готовым принтом`);
    }
  };

  const toggleColor = (color: ProductColor) => {
    setColors((currentColors) => {
      const exists = currentColors.some((item) => item.hex === color.hex);
      if (exists && currentColors.length === 1) return currentColors;
      return exists
        ? currentColors.filter((item) => item.hex !== color.hex)
        : [...currentColors, color];
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state.mode === "create" && !file) {
      setError("Добавьте изображение товара.");
      return;
    }
    setPending(true);
    setError("");
    const data = new FormData();
    data.set("slug", slug);
    data.set("title", title);
    data.set("excerpt", excerpt);
    data.set("description", description);
    data.set("priceFrom", priceFrom);
    data.set("category", category);
    data.set("material", material);
    data.set("printMethod", printMethod);
    data.set("imageAlt", imageAlt);
    data.set("badge", badge);
    data.set("published", String(published));
    data.set("colors", JSON.stringify(colors));
    if (file) data.set("image", file);

    try {
      const response = await fetch(
        state.mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${current?.slug}`,
        { method: state.mode === "create" ? "POST" : "PUT", body: data },
      );
      const result = (await response.json()) as {
        product?: ManagedProduct;
        error?: string;
      };
      if (!response.ok || !result.product)
        throw new Error(result.error || "Не удалось сохранить товар.");
      onSaved(result.product);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Не удалось сохранить товар.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/35"
      role="dialog"
      aria-modal="true"
      aria-label={
        state.mode === "create" ? "Новый товар" : "Редактирование товара"
      }
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5 sm:px-6">
          <div>
            <h2 className="font-semibold">
              {state.mode === "create" ? "Новый товар" : "Редактирование"}
            </h2>
            <p className="text-xs text-neutral-500">Карточка готового принта</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
            <label className="group relative flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50">
              {preview ? (
                <Image
                  src={preview}
                  alt="Предпросмотр"
                  fill
                  unoptimized={preview.startsWith("blob:")}
                  className="object-cover"
                />
              ) : (
                <span className="flex flex-col items-center gap-2 text-center text-xs text-neutral-500">
                  <ImagePlus className="h-6 w-6" /> Изображение
                  <br />
                  4:5
                </span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
            <div className="grid content-start gap-4">
              <Field label="Название">
                <input
                  value={title}
                  onChange={(event) => updateTitle(event.target.value)}
                  required
                  maxLength={100}
                  className={inputClass}
                />
              </Field>
              <Field label="Slug" hint="Латиница, цифры и дефисы">
                <input
                  value={slug}
                  onChange={(event) =>
                    setSlug(event.target.value.toLowerCase())
                  }
                  required
                  maxLength={80}
                  disabled={state.mode === "edit"}
                  className={inputClass}
                />
              </Field>
              <Field label="Alt изображения">
                <input
                  value={imageAlt}
                  onChange={(event) => setImageAlt(event.target.value)}
                  required
                  maxLength={180}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <Field label="Короткое описание" hint={`${excerpt.length}/220`}>
            <textarea
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              required
              maxLength={220}
              rows={2}
              className={textareaClass}
            />
          </Field>
          <Field label="Полное описание" hint={`${description.length}/3000`}>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              maxLength={3000}
              rows={5}
              className={textareaClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Цена от, ₽">
              <input
                type="number"
                min={1}
                max={1000000}
                value={priceFrom}
                onChange={(event) => setPriceFrom(event.target.value)}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Категория">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={inputClass}
              >
                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Материал">
              <input
                value={material}
                onChange={(event) => setMaterial(event.target.value)}
                required
                maxLength={140}
                className={inputClass}
              />
            </Field>
            <Field label="Метод печати">
              <input
                value={printMethod}
                onChange={(event) => setPrintMethod(event.target.value)}
                required
                maxLength={140}
                className={inputClass}
              />
            </Field>
            <Field label="Бейдж" hint="Необязательно">
              <input
                value={badge}
                onChange={(event) => setBadge(event.target.value)}
                maxLength={30}
                placeholder="Новинка"
                className={inputClass}
              />
            </Field>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold">Доступные цвета</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {colorOptions.map((color) => {
                const selected = colors.some((item) => item.hex === color.hex);
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => toggleColor(color)}
                    aria-pressed={selected}
                    className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium ${selected ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"}`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-neutral-900"
            />
            <span>
              <span className="block text-sm font-semibold">
                Опубликовать товар
              </span>
              <span className="mt-0.5 block text-xs text-neutral-500">
                Выключите, чтобы сохранить карточку как черновик.
              </span>
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-neutral-300 px-4 text-sm font-semibold hover:bg-neutral-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-md bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {pending
              ? "Сохраняем..."
              : state.mode === "create"
                ? "Создать товар"
                : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}

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
        {hint && (
          <span className="text-xs font-normal text-neutral-400">{hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}

function slugify(value: string) {
  const transliteration: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  return value
    .toLowerCase()
    .split("")
    .map((letter) => transliteration[letter] ?? letter)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const inputClass =
  "h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:bg-neutral-100 disabled:text-neutral-500";
const textareaClass =
  "w-full resize-y rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";
