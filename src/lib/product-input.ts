import { categories } from "@/data/categories";
import type { ManagedProduct, ProductColor } from "@/types";

const categorySlugs = new Set(categories.map((category) => category.slug));
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class ProductInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductInputError";
  }
}

export function validateProductSlug(slug: string) {
  if (!slugPattern.test(slug) || slug.length > 80) {
    throw new ProductInputError(
      "Slug должен содержать латиницу, цифры и дефисы.",
    );
  }
  return slug;
}

function requiredString(formData: FormData, key: string, max: number) {
  const value = formData.get(key);
  if (typeof value !== "string")
    throw new ProductInputError(`Поле «${key}» обязательно.`);
  const normalized = value.trim();
  if (!normalized || normalized.length > max) {
    throw new ProductInputError(`Проверьте поле «${key}».`);
  }
  return normalized;
}

function optionalString(formData: FormData, key: string, max: number) {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (normalized.length > max)
    throw new ProductInputError(`Поле «${key}» слишком длинное.`);
  return normalized || undefined;
}

function parseColors(formData: FormData): ProductColor[] {
  const raw = formData.get("colors");
  if (typeof raw !== "string")
    throw new ProductInputError("Выберите хотя бы один цвет.");
  let colors: unknown;
  try {
    colors = JSON.parse(raw);
  } catch {
    throw new ProductInputError("Не удалось прочитать цвета товара.");
  }
  if (!Array.isArray(colors) || colors.length === 0 || colors.length > 12) {
    throw new ProductInputError("Выберите от 1 до 12 цветов.");
  }

  return colors.map((item) => {
    if (!item || typeof item !== "object")
      throw new ProductInputError("Некорректный цвет.");
    const color = item as Record<string, unknown>;
    if (
      typeof color.name !== "string" ||
      !color.name.trim() ||
      color.name.length > 40 ||
      typeof color.hex !== "string" ||
      !/^#[0-9a-f]{6}$/i.test(color.hex)
    ) {
      throw new ProductInputError("Некорректный цвет.");
    }
    return { name: color.name.trim(), hex: color.hex.toUpperCase() };
  });
}

export function parseManagedProductForm(
  formData: FormData,
  options: { slug?: string; image: string; createdAt?: string },
): ManagedProduct {
  const slug =
    options.slug ?? requiredString(formData, "slug", 80).toLowerCase();
  validateProductSlug(slug);

  const category = requiredString(formData, "category", 80);
  if (!categorySlugs.has(category))
    throw new ProductInputError("Неизвестная категория.");

  const priceFrom = Number(formData.get("priceFrom"));
  if (!Number.isInteger(priceFrom) || priceFrom < 1 || priceFrom > 1_000_000) {
    throw new ProductInputError("Укажите корректную цену.");
  }

  const now = new Date().toISOString();
  return {
    slug,
    title: requiredString(formData, "title", 100),
    excerpt: requiredString(formData, "excerpt", 220),
    description: requiredString(formData, "description", 3000),
    priceFrom,
    rating: 5,
    reviewsCount: 0,
    category,
    image: options.image,
    imageAlt: requiredString(formData, "imageAlt", 180),
    colors: parseColors(formData),
    material: requiredString(formData, "material", 140),
    printMethod: requiredString(formData, "printMethod", 140),
    badge: optionalString(formData, "badge", 30),
    published: formData.get("published") === "true",
    managed: true,
    createdAt: options.createdAt ?? now,
    updatedAt: now,
  };
}
