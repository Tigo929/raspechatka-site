import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import {
  ProductInputError,
  parseManagedProductForm,
} from "@/lib/product-input";
import {
  deleteManagedImage,
  deleteManagedProduct,
  getManagedProducts,
  saveProductImage,
  updateManagedProduct,
} from "@/lib/product-repository";
import { productErrorResponse, revalidateCatalog } from "@/lib/product-admin";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
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

  const { slug } = await params;
  const existing = (await getManagedProducts()).find(
    (product) => product.slug === slug,
  );
  if (!existing)
    return NextResponse.json({ error: "Товар не найден." }, { status: 404 });

  let newImage: string | undefined;
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (file instanceof File && file.size > 0) {
      newImage = await saveProductImage(slug, file);
    }
    const product = parseManagedProductForm(formData, {
      slug,
      image: newImage ?? existing.image,
      createdAt: existing.createdAt,
    });
    const updated = await updateManagedProduct(slug, product);
    if (newImage && updated.previous.image !== newImage) {
      await deleteManagedImage(updated.previous.image);
    }
    revalidateCatalog(slug);
    return NextResponse.json({ product: updated.product });
  } catch (error) {
    if (newImage) await deleteManagedImage(newImage);
    if (error instanceof ProductInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return productErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
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
  const { slug } = await params;
  try {
    const product = await deleteManagedProduct(slug);
    await deleteManagedImage(product.image);
    revalidateCatalog(slug);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Товар не найден." }, { status: 404 });
  }
}
