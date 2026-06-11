import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { createFaqItem, getFaq } from "@/lib/content-repository";
import type { ManagedFaqItem } from "@/types";

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

  const body = (await request.json()) as Partial<ManagedFaqItem>;
  if (!body.question?.trim() || !body.answer?.trim())
    return NextResponse.json({ error: "Вопрос и ответ обязательны." }, { status: 400 });

  const item = await createFaqItem({
    question: body.question.trim(),
    answer: body.answer.trim(),
    order: 0,
    published: body.published ?? true,
  });
  return NextResponse.json({ item }, { status: 201 });
}
