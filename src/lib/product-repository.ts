import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { unstable_cache, revalidateTag } from "next/cache";
import { baseProducts } from "@/data/products";
import type { ManagedProduct, Product, ProductColor } from "@/types";

const dataDir = path.join(process.cwd(), "data");
const catalogFile = path.join(dataDir, "catalog-products.json");
const baseProductsFile = path.join(dataDir, "base-products.json");
const uploadDir = path.join(process.cwd(), "public", "uploads", "products");

let mutationQueue: Promise<void> = Promise.resolve();

function isColor(value: unknown): value is ProductColor {
  if (!value || typeof value !== "object") return false;
  const color = value as Record<string, unknown>;
  return (
    typeof color.name === "string" &&
    typeof color.hex === "string" &&
    /^#[0-9a-f]{6}$/i.test(color.hex)
  );
}

function isManagedProduct(value: unknown): value is ManagedProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Record<string, unknown>;
  return (
    product.managed === true &&
    typeof product.slug === "string" &&
    typeof product.title === "string" &&
    typeof product.excerpt === "string" &&
    typeof product.description === "string" &&
    typeof product.priceFrom === "number" &&
    typeof product.rating === "number" &&
    typeof product.reviewsCount === "number" &&
    typeof product.category === "string" &&
    typeof product.image === "string" &&
    typeof product.imageAlt === "string" &&
    Array.isArray(product.colors) &&
    product.colors.length > 0 &&
    product.colors.every(isColor) &&
    typeof product.material === "string" &&
    typeof product.printMethod === "string" &&
    typeof product.published === "boolean" &&
    typeof product.createdAt === "string" &&
    typeof product.updatedAt === "string"
  );
}

async function ensureCatalogFile() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(uploadDir, { recursive: true });
  try {
    await readFile(catalogFile, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await writeFile(catalogFile, "[]\n", "utf8");
  }
}

export async function getManagedProducts(): Promise<ManagedProduct[]> {
  await ensureCatalogFile();
  try {
    const raw = JSON.parse(await readFile(catalogFile, "utf8")) as unknown;
    if (!Array.isArray(raw) || !raw.every(isManagedProduct)) {
      throw new Error("invalid_catalog_shape");
    }
    return raw;
  } catch (error) {
    throw new Error("catalog_corrupted", { cause: error });
  }
}

async function persistManagedProducts(products: ManagedProduct[]) {
  await ensureCatalogFile();
  const temporaryFile = `${catalogFile}.${process.pid}.tmp`;
  await writeFile(
    temporaryFile,
    `${JSON.stringify(products, null, 2)}\n`,
    "utf8",
  );
  await rename(temporaryFile, catalogFile);
  revalidateTag("products", "max");
}

async function mutateManagedProducts<T>(
  mutation: (products: ManagedProduct[]) => Promise<T> | T,
) {
  const operation = mutationQueue.then(() =>
    getManagedProducts().then(mutation),
  );
  mutationQueue = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

// ─── Base products (editable via admin) ──────────────────────────────────────

export async function getBaseProducts(): Promise<Product[]> {
  try {
    const raw = JSON.parse(await readFile(baseProductsFile, "utf8")) as unknown;
    if (Array.isArray(raw) && raw.length > 0) return raw as Product[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    await mkdir(dataDir, { recursive: true });
    await writeFile(baseProductsFile, `${JSON.stringify(baseProducts, null, 2)}\n`, "utf8");
    return baseProducts;
  }
  return baseProducts;
}

export async function updateBaseProduct(slug: string, update: Partial<Omit<Product, "slug" | "managed" | "createdAt" | "updatedAt">>): Promise<Product> {
  const all = await getBaseProducts();
  const idx = all.findIndex((p) => p.slug === slug);
  if (idx === -1) throw new Error("not_found");
  const updated = [...all];
  updated[idx] = { ...updated[idx], ...update };
  const tmp = `${baseProductsFile}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
  await rename(tmp, baseProductsFile);
  revalidateTag("products", "max");
  return updated[idx];
}

async function _getAllPublicProducts(): Promise<Product[]> {
  const [base, managed] = await Promise.all([getBaseProducts(), getManagedProducts()]);
  return [...base, ...managed.filter((p) => p.published)];
}

const getCachedPublicProducts = unstable_cache(_getAllPublicProducts, ["all-public-products"], {
  tags: ["products"],
  revalidate: false,
});

export async function getAllProducts(options?: {
  includeUnpublished?: boolean;
}): Promise<Product[]> {
  if (options?.includeUnpublished) {
    const [base, managed] = await Promise.all([getBaseProducts(), getManagedProducts()]);
    return [...base, ...managed];
  }
  return getCachedPublicProducts();
}

export async function getProduct(
  slug: string,
  options?: {
    includeUnpublished?: boolean;
  },
): Promise<Product | undefined> {
  const products = await getAllProducts(options);
  return products.find((product) => product.slug === slug);
}

export const getPopularProducts = unstable_cache(
  async (limit = 4) => {
    const products = await _getAllPublicProducts();
    return [...products].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, limit);
  },
  ["popular-products"],
  { tags: ["products"], revalidate: false },
);

export async function createManagedProduct(product: ManagedProduct) {
  return mutateManagedProducts(async (managed) => {
    const slugTaken =
      baseProducts.some((item) => item.slug === product.slug) ||
      managed.some((item) => item.slug === product.slug);
    if (slugTaken) throw new Error("slug_exists");
    await persistManagedProducts([product, ...managed]);
    return product;
  });
}

export async function updateManagedProduct(
  slug: string,
  update: Omit<ManagedProduct, "slug" | "createdAt" | "managed">,
) {
  return mutateManagedProducts(async (managed) => {
    const index = managed.findIndex((product) => product.slug === slug);
    if (index === -1) throw new Error("not_found");
    const previous = managed[index];
    const next: ManagedProduct = {
      ...update,
      slug,
      createdAt: previous.createdAt,
      managed: true,
    };
    managed[index] = next;
    await persistManagedProducts(managed);
    return { previous, product: next };
  });
}

export async function deleteManagedProduct(slug: string) {
  return mutateManagedProducts(async (managed) => {
    const product = managed.find((item) => item.slug === slug);
    if (!product) throw new Error("not_found");
    await persistManagedProducts(managed.filter((item) => item.slug !== slug));
    return product;
  });
}

export async function saveProductImage(slug: string, file: File) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) {
    throw new Error("invalid_slug");
  }
  const extensionByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensionByType[file.type];
  if (!extension) throw new Error("invalid_image_type");
  if (file.size <= 0 || file.size > 8 * 1024 * 1024) {
    throw new Error("invalid_image_size");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const validSignature =
    (file.type === "image/jpeg" &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff) ||
    (file.type === "image/png" &&
      bytes
        .subarray(0, 8)
        .equals(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        )) ||
    (file.type === "image/webp" &&
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP");
  if (!validSignature) throw new Error("invalid_image_type");

  await mkdir(uploadDir, { recursive: true });
  const filename = `${slug}-${Date.now()}.${extension}`;
  await writeFile(path.join(uploadDir, filename), bytes);
  return `/uploads/products/${filename}`;
}

export async function deleteManagedImage(image: string) {
  if (!image.startsWith("/uploads/products/")) return;
  const filename = path.basename(image);
  try {
    await unlink(path.join(uploadDir, filename));
  } catch {
    // Файл уже отсутствует: состояние каталога всё равно можно обновить.
  }
}
