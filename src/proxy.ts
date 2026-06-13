import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Proxy в Next.js 16 всегда выполняется в Node.js runtime — runtime declaration не нужна.
// Имя куки и алгоритм верификации токена должны совпадать с admin-auth.ts.
// Не импортируем admin-auth.ts напрямую: он тянет next/headers, несовместимые с proxy-контекстом.
const ADMIN_COOKIE = "printlab_admin_session";

/**
 * Проверяет подпись и срок действия токена сессии.
 * Алгоритм совпадает с verifyAdminSessionToken в admin-auth.ts.
 * При изменении формата токена обновить оба файла синхронно.
 */
function verifyToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts as [string, string];

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { expiresAt?: number; nonce?: string };
    return (
      typeof data.expiresAt === "number" &&
      data.expiresAt > Date.now() &&
      typeof data.nonce === "string" &&
      data.nonce.length === 32
    );
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Публичные маршруты — без проверки
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/admin/logout")
  ) {
    return NextResponse.next();
  }

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET?.trim();

  // Без валидного секрета /admin полностью недоступен — никакого cookie-presence fallback.
  if (!secret || secret.length < 32) {
    const message =
      process.env.NODE_ENV === "production"
        ? "Административная панель не настроена. Обратитесь к администратору сервера."
        : "Задайте ADMIN_SESSION_SECRET (минимум 32 символа) в .env.local для доступа к /admin.";
    if (isAdminApi) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const authorized = token !== undefined && verifyToken(token, secret);

  if (!authorized) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Требуется авторизация." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
