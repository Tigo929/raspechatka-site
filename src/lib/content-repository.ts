import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { FaqItem, ManagedFaqItem, ManagedReview, ManagedSettings, Review } from "@/types";
import { reviews as staticReviews } from "@/data/reviews";
import { faq as staticFaq } from "@/data/faq";
import { siteConfig } from "@/data/site";

const dataDir = path.join(process.cwd(), "data");
const reviewsFile = path.join(dataDir, "managed-reviews.json");
const faqFile = path.join(dataDir, "managed-faq.json");
const settingsFile = path.join(dataDir, "managed-settings.json");

let reviewsMutationQueue: Promise<void> = Promise.resolve();
let faqMutationQueue: Promise<void> = Promise.resolve();

async function safeWrite(file: string, data: unknown) {
  await mkdir(dataDir, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tmp, file);
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

export async function getPublicReviews(): Promise<Review[]> {
  const all = await getReviews();
  return all.filter((r) => r.published && r.rating >= 4);
}

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
    return updated[idx];
  });
}

export async function deleteReview(id: string): Promise<void> {
  return mutateReviews(async (items) => {
    const filtered = items.filter((r) => r.id !== id);
    if (filtered.length === items.length) throw new Error("not_found");
    await safeWrite(reviewsFile, filtered);
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

export async function getPublicFaq(): Promise<FaqItem[]> {
  const all = await getFaq();
  return all.filter((f) => f.published).map(({ question, answer }) => ({ question, answer }));
}

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
    return updated[idx];
  });
}

export async function deleteFaqItem(id: string): Promise<void> {
  return mutateFaq(async (items) => {
    const filtered = items.filter((f) => f.id !== id);
    if (filtered.length === items.length) throw new Error("not_found");
    await safeWrite(faqFile, filtered);
  });
}

export async function reorderFaq(ids: string[]): Promise<void> {
  return mutateFaq(async (items) => {
    const updated = items.map((item) => {
      const idx = ids.indexOf(item.id);
      return { ...item, order: idx === -1 ? item.order : idx };
    });
    await safeWrite(faqFile, updated);
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
    whatsapp: siteConfig.social.whatsapp,
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
  await safeWrite(settingsFile, data);
  return data;
}
