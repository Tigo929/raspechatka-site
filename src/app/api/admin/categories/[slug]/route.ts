import "reflect-metadata";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { getCategories, updateCategory } from "@/lib/content-repository";
import { validateDto } from "@/lib/validate";
import { CategoryDto } from "@/lib/dto/category.dto";
import { stripHtml, isValidSlug } from "@/lib/sanitize";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateImageSignature(bytes: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (mimeType === "image/webp") return bytes.subarray(0,4).toString("ascii") === "RIFF" && bytes.subarray(8,12).toString("ascii") === "WEBP";
  return false;
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  if (!(await isSameOriginRequest(request)))
    return NextResponse.json({ error: "Недопустимый источник." }, { status: 403 });

  const { slug } = await params;
  if (!isValidSlug(slug))
    return NextResponse.json({ error: "Некорректный slug." }, { status: 400 });

  const all = await getCategories();
  const existing = all.find((c) => c.slug === slug);
  if (!existing) return NextResponse.json({ error: "Категория не найдена." }, { status: 404 });

  const contentType = request.headers.get("content-type") ?? "";
  let imageUrl = existing.image;

  if (contentType.includes("multipart/form-data")) {
    if (Number(request.headers.get("content-length") ?? 0) > 10 * 1024 * 1024)
      return NextResponse.json({ error: "Файл слишком большой." }, { status: 413 });

    const formData = await request.formData();
    const file = formData.get("image");
    if (file instanceof File && file.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type))
        return NextResponse.json({ error: "Допустимы JPG, PNG, WebP." }, { status: 400 });

      const bytes = Buffer.from(await file.arrayBuffer());
      if (!validateImageSignature(bytes, file.type))
        return NextResponse.json({ error: "Некорректный файл изображения." }, { status: 400 });

      const destDir = path.join(process.cwd(), "public", "categories");
      await mkdir(destDir, { recursive: true });
      const filename = `${slug}.webp`;
      await writeFile(path.join(destDir, filename), bytes);
      imageUrl = `/categories/${filename}?v=${Date.now()}`;
    }

    const rawDto = {
      title: formData.get("title") ?? undefined,
      description: formData.get("description") ?? undefined,
      imageAlt: formData.get("imageAlt") ?? undefined,
    };
    const { data, errors } = await validateDto(CategoryDto, rawDto);
    if (errors) return NextResponse.json({ error: errors[0] }, { status: 422 });

    const category = await updateCategory(slug, {
      title: data.title ? stripHtml(data.title) : existing.title,
      description: data.description ? stripHtml(data.description) : existing.description,
      image: imageUrl,
      imageAlt: data.imageAlt ? stripHtml(data.imageAlt) : existing.imageAlt,
    });
    revalidatePath("/");
    revalidatePath("/catalog");
    return NextResponse.json({ category });
  }

  let plain: unknown;
  try { plain = await request.json(); }
  catch { return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 }); }

  const { data, errors } = await validateDto(CategoryDto, plain);
  if (errors) return NextResponse.json({ error: errors[0] }, { status: 422 });

  const category = await updateCategory(slug, {
    title: data.title ? stripHtml(data.title) : existing.title,
    description: data.description ? stripHtml(data.description) : existing.description,
    image: imageUrl,
    imageAlt: data.imageAlt ? stripHtml(data.imageAlt) : existing.imageAlt,
  });
  revalidatePath("/");
  return NextResponse.json({ category });
}