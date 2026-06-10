import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ProductInputError } from "@/lib/product-input";

export function revalidateCatalog(slug: string) {
  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/catalog/futbolka-s-printom");
  revalidatePath("/sitemap.xml");
}

export function productErrorResponse(error: unknown) {
  if (error instanceof ProductInputError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof Error && error.message === "slug_exists") {
    return NextResponse.json(
      { error: "Товар с таким slug уже существует." },
      { status: 409 },
    );
  }
  if (
    error instanceof Error &&
    ["invalid_slug", "invalid_image_type", "invalid_image_size"].includes(
      error.message,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Проверьте slug и формат изображения (JPG, PNG или WebP до 8 МБ).",
      },
      { status: 400 },
    );
  }
  if (error instanceof Error && error.message === "catalog_corrupted") {
    return NextResponse.json(
      {
        error:
          "Файл каталога повреждён. Исправьте data/catalog-products.json перед сохранением.",
      },
      { status: 500 },
    );
  }
  return NextResponse.json(
    { error: "Не удалось сохранить товар." },
    { status: 500 },
  );
}
