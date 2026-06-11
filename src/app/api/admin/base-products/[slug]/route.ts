import "reflect-metadata";
import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { getBaseProducts, saveProductImage, updateBaseProduct } from "@/lib/product-repository";
import { revalidateCatalog } from "@/lib/product-admin";
import { validateDto } from "@/lib/validate";
import { BaseProductDto } from "@/lib/dto/base-product.dto";
import { stripHtml, isValidSlug } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  if (!(await isSameOriginRequest(request)))
    return NextResponse.json({ error: "Недопустимый источник." }, { status: 403 });

  const { slug } = await params;
  if (!isValidSlug(slug))
    return NextResponse.json({ error: "Некорректный slug." }, { status: 400 });

  const all = await getBaseProducts();
  if (!all.find((p) => p.slug === slug))
    return NextResponse.json({ error: "Товар не найден." }, { status: 404 });

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    if (Number(request.headers.get("content-length") ?? 0) > 9 * 1024 * 1024)
      return NextResponse.json({ error: "Файл слишком большой." }, { status: 413 });

    const formData = await request.formData();
    const file = formData.get("image");
    let imageUrl: string | undefined;
    if (file instanceof File && file.size > 0) {
      imageUrl = await saveProductImage(slug, file);
    }

    const rawDto: Record<string, unknown> = {};
    for (const key of ["title", "excerpt", "description", "material", "printMethod", "imageAlt", "badge"]) {
      const v = formData.get(key);
      if (typeof v === "string" && v.trim()) rawDto[key] = v.trim();
    }
    const priceFrom = Number(formData.get("priceFrom"));
    if (priceFrom > 0) rawDto.priceFrom = priceFrom;
    const colorsRaw = formData.get("colors");
    if (typeof colorsRaw === "string") {
      try { rawDto.colors = JSON.parse(colorsRaw); } catch { /* ignore */ }
    }

    const { data, errors } = await validateDto(BaseProductDto, rawDto);
    if (errors) return NextResponse.json({ error: errors[0] }, { status: 422 });

    const sanitized: Record<string, unknown> = {};
    if (data.title) sanitized.title = stripHtml(data.title);
    if (data.excerpt) sanitized.excerpt = stripHtml(data.excerpt);
    if (data.description) sanitized.description = stripHtml(data.description);
    if (data.material) sanitized.material = stripHtml(data.material);
    if (data.printMethod) sanitized.printMethod = stripHtml(data.printMethod);
    if (data.imageAlt) sanitized.imageAlt = stripHtml(data.imageAlt);
    if (data.badge) sanitized.badge = stripHtml(data.badge);
    if (data.priceFrom) sanitized.priceFrom = data.priceFrom;
    if (data.colors) sanitized.colors = data.colors;
    if (imageUrl) sanitized.image = imageUrl;

    const product = await updateBaseProduct(slug, sanitized);
    revalidateCatalog(slug);
    return NextResponse.json({ product });
  }

  // JSON body
  let plain: unknown;
  try { plain = await request.json(); }
  catch { return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 }); }

  const { data, errors } = await validateDto(BaseProductDto, plain);
  if (errors) return NextResponse.json({ error: errors[0] }, { status: 422 });

  const sanitized: Record<string, unknown> = {};
  if (data.title) sanitized.title = stripHtml(data.title);
  if (data.excerpt) sanitized.excerpt = stripHtml(data.excerpt);
  if (data.description) sanitized.description = stripHtml(data.description);
  if (data.material) sanitized.material = stripHtml(data.material);
  if (data.printMethod) sanitized.printMethod = stripHtml(data.printMethod);
  if (data.imageAlt) sanitized.imageAlt = stripHtml(data.imageAlt);
  if (data.badge) sanitized.badge = stripHtml(data.badge);
  if (data.priceFrom) sanitized.priceFrom = data.priceFrom;
  if (data.colors) sanitized.colors = data.colors;

  const product = await updateBaseProduct(slug, sanitized);
  revalidateCatalog(slug);
  return NextResponse.json({ product });
}