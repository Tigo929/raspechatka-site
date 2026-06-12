import { NextResponse } from "next/server";
import { writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { bumpMediaVersion } from "@/lib/media-repository";
import { revalidatePath } from "next/cache";
import sharp from "sharp";

export const runtime = "nodejs";

// Разрешённые папки для замены изображений
const ALLOWED_DIRS = ["home", "categories", "products", "use-cases", "mockups"];

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  if (!(await isSameOriginRequest(request)))
    return NextResponse.json({ error: "Недопустимый источник." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 10 * 1024 * 1024)
    return NextResponse.json({ error: "Файл слишком большой (макс. 10 МБ)." }, { status: 413 });

  const formData = await request.formData();
  const file = formData.get("file");
  const targetPath = formData.get("path"); // e.g. "home/hero-print-01.webp"

  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "Файл не загружен." }, { status: 400 });
  if (typeof targetPath !== "string" || !targetPath)
    return NextResponse.json({ error: "Не указан путь." }, { status: 400 });

  // Validate path: must start with allowed dir, no traversal
  const normalized = targetPath.replace(/\\/g, "/").replace(/^\/+/, "");
  const dir = normalized.split("/")[0];
  if (!ALLOWED_DIRS.includes(dir) || normalized.includes(".."))
    return NextResponse.json({ error: "Недопустимый путь." }, { status: 400 });

  // Validate image type
  const extByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  if (!extByType[file.type])
    return NextResponse.json({ error: "Допустимы JPG, PNG, WebP." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const validSig =
    (file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (file.type === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) ||
    (file.type === "image/webp" && bytes.subarray(0,4).toString("ascii") === "RIFF" && bytes.subarray(8,12).toString("ascii") === "WEBP");
  if (!validSig)
    return NextResponse.json({ error: "Некорректный файл изображения." }, { status: 400 });

  const destAbs = path.join(process.cwd(), "public", normalized);
  await mkdir(path.dirname(destAbs), { recursive: true });
  const targetExtension = path.extname(normalized).toLowerCase();
  if (![".webp", ".jpg", ".jpeg", ".png"].includes(targetExtension)) {
    return NextResponse.json({ error: "Недопустимый формат целевого файла." }, { status: 400 });
  }
  const pipeline = sharp(bytes).rotate().resize(2200, 2200, { fit: "inside", withoutEnlargement: true });
  const optimized = targetExtension === ".webp"
    ? await pipeline.webp({ quality: 88 }).toBuffer()
    : targetExtension === ".png"
      ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
      : await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  const temporary = `${destAbs}.${process.pid}.tmp`;
  await writeFile(temporary, optimized);
  await rename(temporary, destAbs);

  const v = await bumpMediaVersion(normalized);
  revalidatePath("/");
  revalidatePath("/configurator");
  revalidatePath("/catalog", "layout");

  return NextResponse.json({ url: `/${normalized}?v=${v}`, ok: true });
}
