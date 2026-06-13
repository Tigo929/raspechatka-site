import { NextResponse } from "next/server";
import { isAdminAuthenticated, isSameOriginRequest } from "@/lib/admin-auth";
import { getSettings, updateSettings } from "@/lib/content-repository";
import type { ManagedSettings } from "@/types";
import { stripHtml } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
  if (!(await isSameOriginRequest(request)))
    return NextResponse.json({ error: "Недопустимый источник." }, { status: 403 });

  let body: Partial<ManagedSettings>;
  try {
    body = await request.json() as Partial<ManagedSettings>;
  } catch {
    return NextResponse.json({ error: "Некорректный формат данных." }, { status: 400 });
  }
  if (!body.phone || !body.email)
    return NextResponse.json({ error: "Телефон и email обязательны." }, { status: 400 });

  const clean = (value: string | undefined, maxLength: number) => stripHtml(value?.trim() ?? "").slice(0, maxLength);
  const phone = clean(body.phone, 40);
  const email = clean(body.email, 160).toLowerCase();
  const telegram = clean(body.telegram, 300);
  const max = clean(body.max, 300);
  if (!/^[\d\s+()-]{6,40}$/.test(phone))
    return NextResponse.json({ error: "Некорректный номер телефона." }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Некорректный email." }, { status: 422 });
  if (telegram && !/^https:\/\//i.test(telegram))
    return NextResponse.json({ error: "Ссылка Telegram должна начинаться с https://" }, { status: 422 });
  if (max && !/^https:\/\/max\.ru\//i.test(max))
    return NextResponse.json({ error: "Ссылка MAX должна начинаться с https://max.ru/ (vk.me и другие домены не принимаются). Оставьте поле пустым, чтобы скрыть кнопку MAX." }, { status: 422 });

  const settings = await updateSettings({
    phone,
    email,
    address: clean(body.address, 240),
    hours: clean(body.hours, 160),
    telegram,
    max,
    yandexMetrikaId: clean(body.yandexMetrikaId, 30),
  });
  return NextResponse.json({ settings });
}
