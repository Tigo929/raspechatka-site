/** Удаляет HTML-теги и null-байты из строки (защита от stored XSS). */
export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")        // убираем HTML-теги
    .replace(/\x00/g, "")           // null-байты
    .replace(/[^\S\n]+/g, " ")      // нормализуем пробелы (кроме переносов строк)
    .trim();
}

/** Валидирует slug: только строчные буквы, цифры, дефисы. */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(slug);
}

/** Валидирует UUID. */
export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
