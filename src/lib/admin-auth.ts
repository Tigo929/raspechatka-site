import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

export const adminCookieName = "printlab_admin_session";
const sessionLifetimeSeconds = 60 * 60 * 12;

// Если ADMIN_SESSION_SECRET не задан — генерируем случайный при запуске.
// Сессии перестанут работать после рестарта сервера, но пароль не используется как секрет.
const runtimeSecret = randomBytes(32).toString("hex");

function getPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : runtimeSecret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  // Сравниваем только при одинаковой длине; иначе timingSafeEqual бросит
  if (leftBuf.length !== rightBuf.length) return false;
  return timingSafeEqual(leftBuf, rightBuf);
}

export function isAdminConfigured() {
  return getPassword().length >= 12;
}

export function verifyAdminPassword(password: string) {
  const expected = getPassword();
  return expected.length >= 12 && safeEqual(password, expected);
}

export function createAdminSessionToken() {
  const nonce = randomBytes(16).toString("hex");
  const payload = Buffer.from(
    JSON.stringify({ expiresAt: Date.now() + sessionLifetimeSeconds * 1000, nonce }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token?: string) {
  if (!token || !isAdminConfigured()) return false;

  const parts = token.split(".");
  // Ожидаем ровно 2 части: payload.signature
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload || !signature) return false;

  if (!safeEqual(signature, sign(payload))) return false;

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

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(adminCookieName)?.value);
}

export async function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol =
    process.env.NODE_ENV === "production"
      ? "https"
      : (headerStore.get("x-forwarded-proto") ?? "http");

  if (!host) return false;
  const expectedOrigin = `${protocol}://${host}`;

  // Проверяем Origin (основной) или Referer (запасной для форм)
  if (origin) return origin === expectedOrigin;
  if (referer) return referer.startsWith(expectedOrigin + "/");

  return false;
}

export const adminSessionMaxAge = sessionLifetimeSeconds;
