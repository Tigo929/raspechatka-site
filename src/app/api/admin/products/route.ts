import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import {
  ProductInputError,
  parseManagedProductForm,
  validateProductSlug,
} from "@/lib/product-input";
import {
  createManagedProduct,
  getManagedProducts,
  saveProductImage,
} from "@/lib/product-repository";
import { productErrorResponse, revalidateCatalog } from "@/lib/product-admin";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Требуется авторизация." },
      { status: 401 },
    );
  }
  return NextResponse.json({ products: await getManagedProducts() });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Требуется авторизация." },
      { status: 401 },
    );
  }
  if (!(await isSameOriginRequest(request))) {
    return NextResponse.json(
      { error: "Недопустимый источник запроса." },
      { status: 403 },
    );
  }
  if (Number(request.headers.get("content-length") ?? 0) > 9 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Файл слишком большой." },
      { status: 413 },
    );
  }

  let image = "";
  try {
    const formData = await request.formData();
    const slugValue = formData.get("slug");
    const file = formData.get("image");
    if (
      typeof slugValue !== "string" ||
      !(file instanceof File) ||
      file.size === 0
    ) {
      throw new ProductInputError("Добавьте изображение товара.");
    }
    const slug = validateProductSlug(slugValue.trim().toLowerCase());
    image = await saveProductImage(slug, file);
    const product = parseManagedProductForm(formData, { image });
    await createManagedProduct(product);
    revalidateCatalog(product.slug);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (image) {
      const { deleteManagedImage } = await import("@/lib/product-repository");
      await deleteManagedImage(image);
    }
    return productErrorResponse(error);
  }
}
