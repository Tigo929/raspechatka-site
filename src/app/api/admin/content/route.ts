import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { getContent, updateContent } from "@/lib/content-repository";
import type { ManagedContent } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  return NextResponse.json(await getContent());
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  if (!(await isSameOriginRequest(request)))
    return NextResponse.json({ error: "Недопустимый источник." }, { status: 403 });

  const url = new URL(request.url);
  const section = url.searchParams.get("section") as keyof ManagedContent | null;
  const allowed: (keyof ManagedContent)[] = ["pricing", "benefits", "steps", "trustbar", "useCases"];
  if (!section || !allowed.includes(section))
    return NextResponse.json({ error: "Укажите параметр section." }, { status: 400 });

  const body = (await request.json()) as { data: ManagedContent[keyof ManagedContent] };
  if (!body.data) return NextResponse.json({ error: "Нет данных." }, { status: 400 });

  await updateContent(section, body.data);
  revalidatePath("/");
  revalidatePath("/configurator");
  return NextResponse.json({ ok: true });
}
