export class OrderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

/**
 * Парсит количество из строки FormData-поля.
 * - Пустая строка / absent → возвращает 1 (безопасный дефолт бизнес-логики).
 * - Любое значение вне [1, 999] или нецелое → бросает OrderValidationError.
 */
export function parseOrderQuantity(raw: string | null | undefined): number {
  if (raw === undefined || raw === null || raw.trim() === "") return 1;

  const s = raw.trim();
  // Только цифры: никаких десятичных точек, знаков, пробелов
  if (!/^\d+$/.test(s)) {
    throw new OrderValidationError(
      "Количество должно быть целым числом от 1 до 999",
    );
  }

  const n = parseInt(s, 10);
  if (n < 1)
    throw new OrderValidationError("Минимальное количество — 1");
  if (n > 999)
    throw new OrderValidationError("Максимальное количество — 999");

  return n;
}
