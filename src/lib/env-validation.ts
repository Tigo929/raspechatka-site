// Проверка конфигурации сервера при запуске.
// Никогда не логируем значения секретов — только факт их наличия и длину.

export function validateServerConfig(): void {
  const isProd = process.env.NODE_ENV === "production";
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── ADMIN_SESSION_SECRET ─────────────────────────────────────────────────
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() ?? "";
  if (secret.length === 0) {
    errors.push("ADMIN_SESSION_SECRET не задан — /admin недоступен");
  } else if (secret.length < 32) {
    errors.push(
      `ADMIN_SESSION_SECRET слишком короткий (${secret.length} симв., требуется ≥32) — /admin недоступен`,
    );
  }

  // ── ADMIN_PASSWORD ───────────────────────────────────────────────────────
  const password = process.env.ADMIN_PASSWORD?.trim() ?? "";
  if (password.length === 0) {
    errors.push("ADMIN_PASSWORD не задан — вход в /admin невозможен");
  } else if (password.length < 12) {
    errors.push(
      `ADMIN_PASSWORD слишком короткий (${password.length} симв., требуется ≥12) — вход в /admin невозможен`,
    );
  }

  // ── Telegram (некритично: доставка опциональна) ──────────────────────────
  if (!process.env.TELEGRAM_BOT_TOKEN?.trim()) {
    warnings.push("TELEGRAM_BOT_TOKEN не задан — заявки сохраняются, но не доставляются в Telegram");
  }
  if (!process.env.TELEGRAM_CHAT_ID?.trim()) {
    warnings.push("TELEGRAM_CHAT_ID не задан — заявки сохраняются, но не доставляются в Telegram");
  }

  // ── NEXT_PUBLIC_SITE_URL (критично в production для SEO) ─────────────────
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  if (isProd) {
    if (!siteUrl) {
      errors.push("NEXT_PUBLIC_SITE_URL не задан — canonical URL и sitemap некорректны");
    } else if (siteUrl.includes("example.com") || !siteUrl.startsWith("https://")) {
      errors.push(
        "NEXT_PUBLIC_SITE_URL содержит placeholder или не начинается с https:// — canonical URL некорректны",
      );
    }
  } else if (!siteUrl) {
    warnings.push("NEXT_PUBLIC_SITE_URL не задан — canonical URL будут некорректны в production");
  }

  // ── Вывод ────────────────────────────────────────────────────────────────
  const prefix = "[config]";
  for (const w of warnings) {
    console.warn(`${prefix} ПРЕДУПРЕЖДЕНИЕ: ${w}`);
  }
  for (const e of errors) {
    console.error(`${prefix} ОШИБКА КОНФИГУРАЦИИ: ${e}`);
  }

  // В production бросаем только при отсутствии NEXT_PUBLIC_SITE_URL,
  // чтобы индексация не испортилась при деплое без env-файла.
  // Для admin-секретов краш не делаем: публичная часть сайта должна работать.
  if (isProd && errors.some((e) => e.includes("NEXT_PUBLIC_SITE_URL"))) {
    throw new Error(
      `${prefix} Деплой прерван: NEXT_PUBLIC_SITE_URL не задан или содержит placeholder. Добавьте его в переменные окружения.`,
    );
  }
}
