import "reflect-metadata";
import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { createFaqItem, getFaq } from "@/lib/content-repository";
import { validateDto } from "@/lib/validate";
import { FaqDto } from "@/lib/dto/faq.dto";
import { stripHtml } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  return NextResponse.json({ items: await getFaq() });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  if (!(await isSameOriginRequest(request)))
    return NextResponse.json({ error: "Недопустимый источник." }, { status: 403 });

  let plain: unknown;
  try { plain = await request.json(); }
  catch { return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 }); }

  const { data, errors } = await validateDto(FaqDto, plain);
  if (errors) return NextResponse.json({ error: errors[0] }, { status: 422 });

  const item = await createFaqItem({
    question: stripHtml(data.question),
    answer: stripHtml(data.answer),
    order: data.order ?? 0,
    published: data.published ?? true,
  });
  return NextResponse.json({ item }, { status: 201 });
}