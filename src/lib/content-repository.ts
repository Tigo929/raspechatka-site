import { readFile } from "node:fs/promises";
import path from "node:path";
import { unstable_cache, revalidateTag } from "next/cache";
import { randomUUID } from "node:crypto";
import type { Benefit, Category, FaqItem, ManagedContent, ManagedFaqItem, ManagedReview, ManagedSettings, PricingTier, Review, Step, UseCase } from "@/types";
import { reviews as staticReviews } from "@/data/reviews";
import { faq as staticFaq } from "@/data/faq";
import { benefits as staticBenefits, steps as staticSteps } from "@/data/benefits";
import { useCases as staticUseCases } from "@/data/useCases";
import { categories as staticCategories } from "@/data/categories";
import { siteConfig } from "@/data/site";
import { getMediaVersions, applyVersion } from "@/lib/media-repository";
import { getDataDirectory, writeJsonAtomic } from "@/lib/data-storage";

const dataDir = getDataDirectory();
const reviewsFile = path.join(dataDir, "managed-reviews.json");
const faqFile = path.join(dataDir, "managed-faq.json");
const settingsFile = path.join(dataDir, "managed-settings.json");
const categoriesFile = path.join(dataDir, "managed-categories.json");
const contentFile = path.join(dataDir, "managed-content.json");

let reviewsMutationQueue: Promise<void> = Promise.resolve();
let faqMutationQueue: Promise<void> = Promise.resolve();
let settingsMutationQueue: Promise<void> = Promise.resolve();
let categoriesMutationQueue: Promise<void> = Promise.resolve();
let contentMutationQueue: Promise<void> = Promise.resolve();

async function safeWrite(file: string, data: unknown) {
  await writeJsonAtomic(file, data);
}

// ─── REVIEWS ────────────────────────────────────────────────────────────────

function seedReviews(): ManagedReview[] {
  return staticReviews.map((r, i) => ({
    ...r,
    id: randomUUID(),
    source: r.source ?? "manual",
    published: true,
    order: i,
  }));
}

export async function getReviews(): Promise<ManagedReview[]> {
  try {
    const raw = JSON.parse(await readFile(reviewsFile, "utf8")) as unknown;
    if (Array.isArray(raw)) return raw as ManagedReview[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const seed = seedReviews();
    await safeWrite(reviewsFile, seed);
    return seed;
  }
  return [];
}

export const getPublicReviews = unstable_cache(
  async (): Promise<Review[]> => {
    const all = await getReviews();
    return all.filter((r) => r.published && r.rating >= 4 && r.source !== "manual");
  },
  ["public-reviews"],
  { tags: ["public-content"], revalidate: false },
);

async function mutateReviews<T>(fn: (items: ManagedReview[]) => Promise<T> | T) {
  const op = reviewsMutationQueue.then(() => getReviews().then(fn));
  reviewsMutationQueue = op.then(() => undefined, () => undefined);
  return op;
}

export async function createReview(data: Omit<ManagedReview, "id">): Promise<ManagedReview> {
  return mutateReviews(async (items) => {
    const review: ManagedReview = { ...data, id: randomUUID() };
    const updated = [review, ...items];
    await safeWrite(reviewsFile, updated);
    revalidateTag("public-content", "max");
    return review;
  });
}

export async function updateReview(id: string, data: Omit<ManagedReview, "id">): Promise<ManagedReview> {
  return mutateReviews(async (items) => {
    const idx = items.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("not_found");
    const updated = [...items];
    updated[idx] = { ...data, id };
    await safeWrite(reviewsFile, updated);
    revalidateTag("public-content", "max");
    return updated[idx];
  });
}

export async function deleteReview(id: string): Promise<void> {
  return mutateReviews(async (items) => {
    const filtered = items.filter((r) => r.id !== id);
    if (filtered.length === items.length) throw new Error("not_found");
    await safeWrite(reviewsFile, filtered);
    revalidateTag("public-content", "max");
  });
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function seedFaq(): ManagedFaqItem[] {
  return staticFaq.map((item, i) => ({
    ...item,
    id: randomUUID(),
    order: i,
    published: true,
  }));
}

export async function getFaq(): Promise<ManagedFaqItem[]> {
  try {
    const raw = JSON.parse(await readFile(faqFile, "utf8")) as unknown;
    if (Array.isArray(raw)) return (raw as ManagedFaqItem[]).sort((a, b) => a.order - b.order);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const seed = seedFaq();
    await safeWrite(faqFile, seed);
    return seed;
  }
  return [];
}

export const getPublicFaq = unstable_cache(
  async (): Promise<FaqItem[]> => {
    const all = await getFaq();
    return all.filter((f) => f.published).map(({ question, answer }) => ({ question, answer }));
  },
  ["public-faq"],
  { tags: ["public-content"], revalidate: false },
);

async function mutateFaq<T>(fn: (items: ManagedFaqItem[]) => Promise<T> | T) {
  const op = faqMutationQueue.then(() => getFaq().then(fn));
  faqMutationQueue = op.then(() => undefined, () => undefined);
  return op;
}

export async function createFaqItem(data: Omit<ManagedFaqItem, "id">): Promise<ManagedFaqItem> {
  return mutateFaq(async (items) => {
    const item: ManagedFaqItem = { ...data, id: randomUUID() };
    const maxOrder = items.reduce((m, i) => Math.max(m, i.order), -1);
    item.order = maxOrder + 1;
    const updated = [...items, item];
    await safeWrite(faqFile, updated);
    revalidateTag("public-content", "max");
    return item;
  });
}

export async function updateFaqItem(id: string, data: Omit<ManagedFaqItem, "id">): Promise<ManagedFaqItem> {
  return mutateFaq(async (items) => {
    const idx = items.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error("not_found");
    const updated = [...items];
    updated[idx] = { ...data, id };
    await safeWrite(faqFile, updated);
    revalidateTag("public-content", "max");
    return updated[idx];
  });
}

export async function deleteFaqItem(id: string): Promise<void> {
  return mutateFaq(async (items) => {
    const filtered = items.filter((f) => f.id !== id);
    if (filtered.length === items.length) throw new Error("not_found");
    await safeWrite(faqFile, filtered);
    revalidateTag("public-content", "max");
  });
}

export async function reorderFaq(ids: string[]): Promise<void> {
  return mutateFaq(async (items) => {
    const updated = items.map((item) => {
      const idx = ids.indexOf(item.id);
      return { ...item, order: idx === -1 ? item.order : idx };
    });
    await safeWrite(faqFile, updated);
    revalidateTag("public-content", "max");
  });
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

function defaultSettings(): ManagedSettings {
  return {
    phone: siteConfig.phone,
    email: siteConfig.email,
    address: siteConfig.address,
    hours: siteConfig.hours,
    telegram: siteConfig.social.telegram,
    max: siteConfig.social.max,
    yandexMetrikaId: process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID ?? "",
  };
}

export async function getSettings(): Promise<ManagedSettings> {
  try {
    const raw = JSON.parse(await readFile(settingsFile, "utf8")) as unknown;
    if (raw && typeof raw === "object") return raw as ManagedSettings;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const defaults = defaultSettings();
    await safeWrite(settingsFile, defaults);
    return defaults;
  }
  return defaultSettings();
}

export async function updateSettings(data: ManagedSettings): Promise<ManagedSettings> {
  let result = data;
  const operation = settingsMutationQueue.then(async () => {
    await safeWrite(settingsFile, data);
    revalidateTag("public-content", "max");
    result = data;
  });
  settingsMutationQueue = operation.then(() => undefined, () => undefined);
  await operation;
  return result;
}

export const getPublicSettings = unstable_cache(getSettings, ["public-settings"], {
  tags: ["public-content"],
  revalidate: false,
});

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

async function readCategories(): Promise<Category[]> {
  let cats: Category[];
  try {
    const raw = JSON.parse(await readFile(categoriesFile, "utf8")) as unknown;
    cats = Array.isArray(raw) && raw.length > 0 ? (raw as Category[]) : staticCategories;
    if (!(Array.isArray(raw) && raw.length > 0)) {
      await safeWrite(categoriesFile, staticCategories);
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    await safeWrite(categoriesFile, staticCategories);
    cats = staticCategories;
  }
  const versions = await getMediaVersions();
  return cats.map((c) => ({ ...c, image: applyVersion(c.image, versions) }));
}

export const getCategories = unstable_cache(readCategories, ["categories"], {
  tags: ["public-content"],
  revalidate: false,
});

export async function updateCategory(slug: string, data: Omit<Category, "slug">): Promise<Category> {
  let result!: Category;
  const operation = categoriesMutationQueue.then(async () => {
    const all = await readCategories();
    const idx = all.findIndex((c) => c.slug === slug);
    if (idx === -1) throw new Error("not_found");
    const updated = [...all];
    updated[idx] = { ...data, slug };
    await safeWrite(categoriesFile, updated);
    revalidateTag("public-content", "max");
    result = updated[idx];
  });
  categoriesMutationQueue = operation.then(() => undefined, () => undefined);
  await operation;
  return result;
}

// ─── MANAGED CONTENT (pricing / benefits / steps / trustbar / useCases) ───────

const defaultPricing: PricingTier[] = [
  {
    name: "Один заказ",
    price: 949,
    oldPrice: 1190,
    badge: "🎉 В честь открытия",
    note: "за футболку",
    features: ["Без минимального тиража", "Макет в подарок", "Печать от 1 дня", "Премиальный хлопок"],
    ctaLabel: "Собрать футболку",
    ctaHref: "/configurator",
    featured: true,
  },
  {
    name: "Малый тираж",
    price: 849,
    oldPrice: null,
    badge: null,
    note: "за футболку от 10 шт.",
    features: ["Скидка за объём", "Единое качество тиража", "Сортировка по размерам", "Приоритетная печать"],
    ctaLabel: "Рассчитать тираж",
    ctaHref: "/catalog/merch-na-zakaz",
    featured: false,
  },
  {
    name: "Корпоративный",
    price: 749,
    oldPrice: null,
    badge: null,
    note: "за футболку от 50 шт.",
    features: ["Лучшая цена за штуку", "Работа по договору", "Документы для юрлиц", "Персональный менеджер"],
    ctaLabel: "Для бизнеса",
    ctaHref: "/catalog/korporativnye-futbolki",
    featured: false,
  },
];

function defaultContent(): ManagedContent {
  return {
    pricing: defaultPricing,
    benefits: staticBenefits,
    steps: staticSteps,
    trustbar: [
      "Без минимального тиража",
      "Макет в подарок при первом заказе",
      "Печать от 1 дня",
      "Премиальный хлопок 180–240 г/м²",
      "Гарантия на результат",
      "Доставка по всей России",
      "Работаем с юрлицами",
    ],
    useCases: staticUseCases,
  };
}

async function readContent(): Promise<ManagedContent> {
  try {
    const raw = JSON.parse(await readFile(contentFile, "utf8")) as unknown;
    if (raw && typeof raw === "object") {
      const def = defaultContent();
      return { ...def, ...(raw as Partial<ManagedContent>) };
    }
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const def = defaultContent();
    await safeWrite(contentFile, def);
    return def;
  }
  return defaultContent();
}

// Публичные страницы используют кешированную версию.
// Мутации (updateContent) вызывают readContent() напрямую — без кеша.
const getCachedContent = unstable_cache(readContent, ["managed-content"], {
  tags: ["public-content"],
  revalidate: false,
});

export async function getContent(): Promise<ManagedContent> {
  return getCachedContent();
}

export async function updateContent(section: keyof ManagedContent, data: ManagedContent[keyof ManagedContent]): Promise<void> {
  const operation = contentMutationQueue.then(async () => {
    const current = await readContent();
    await safeWrite(contentFile, { ...current, [section]: data });
    revalidateTag("public-content", "max");
  });
  contentMutationQueue = operation.then(() => undefined, () => undefined);
  await operation;
}

export async function getPricing(): Promise<PricingTier[]> {
  return (await getContent()).pricing;
}

export async function getBenefits(): Promise<Benefit[]> {
  return (await getContent()).benefits;
}

export async function getSteps(): Promise<Step[]> {
  return (await getContent()).steps;
}

export async function getTrustBar(): Promise<string[]> {
  return (await getContent()).trustbar;
}

export async function getUseCases(): Promise<UseCase[]> {
  const useCases = (await getContent()).useCases;
  const versions = await getMediaVersions();
  return useCases.map((u) => ({ ...u, image: applyVersion(u.image, versions) }));
}
