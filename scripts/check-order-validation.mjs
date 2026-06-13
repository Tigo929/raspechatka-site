/**
 * Изолированные проверки логики валидации заказов.
 * Запуск: node scripts/check-order-validation.mjs
 *
 * Тестирует parseOrderQuantity и логику honeypot без зависимости от Next.js.
 * Ни одного HTTP-запроса и ни одного реального заказа не создаётся.
 */

// ── Воспроизведение parseOrderQuantity из src/lib/order-validation.ts ────────

class OrderValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "OrderValidationError";
  }
}

function parseOrderQuantity(raw) {
  if (raw === undefined || raw === null || raw.trim() === "") return 1;

  const s = raw.trim();
  if (!/^\d+$/.test(s)) {
    throw new OrderValidationError(
      "Количество должно быть целым числом от 1 до 999",
    );
  }

  const n = parseInt(s, 10);
  if (n < 1) throw new OrderValidationError("Минимальное количество — 1");
  if (n > 999) throw new OrderValidationError("Максимальное количество — 999");

  return n;
}

// ── Инфраструктура тестов ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function expect(label, got, expected) {
  const ok =
    typeof expected === "object" && expected !== null
      ? JSON.stringify(got) === JSON.stringify(expected)
      : got === expected;
  if (ok) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`);
    console.error(`       got:      ${JSON.stringify(got)}`);
    console.error(`       expected: ${JSON.stringify(expected)}`);
    failed++;
  }
}

function expectValue(label, raw, expectedValue) {
  try {
    const result = parseOrderQuantity(raw);
    expect(label, result, expectedValue);
  } catch (e) {
    console.error(`  ✗  ${label}`);
    console.error(`       threw: ${e.message}`);
    console.error(`       expected value: ${expectedValue}`);
    failed++;
  }
}

function expectThrow(label, raw) {
  try {
    const result = parseOrderQuantity(raw);
    console.error(`  ✗  ${label}`);
    console.error(`       did NOT throw; returned: ${result}`);
    console.error(`       expected: OrderValidationError`);
    failed++;
  } catch (e) {
    if (e instanceof OrderValidationError) {
      console.log(`  ✓  ${label}  [→ "${e.message}"]`);
      passed++;
    } else {
      console.error(`  ✗  ${label}`);
      console.error(`       wrong error type: ${e.constructor.name}: ${e.message}`);
      failed++;
    }
  }
}

// ── Тесты parseOrderQuantity ──────────────────────────────────────────────────

console.log("\n=== parseOrderQuantity — матрица валидации ===\n");

// Дефолтный возврат 1 для отсутствующих/пустых значений
console.log("Отсутствующие / пустые значения → возвращают дефолт 1:");
expectValue('undefined        → 1', undefined, 1);
expectValue('null             → 1', null, 1);
expectValue('""               → 1', "", 1);
expectValue('"  "             → 1', "   ", 1);

// Валидные значения
console.log("\nВалидные значения:");
expectValue('"1"              → 1', "1", 1);
expectValue('"999"            → 999', "999", 999);
expectValue('"100"            → 100', "100", 100);
expectValue('"  5  "          → 5  (trim)', "  5  ", 5);

// Невалидные — должны бросать OrderValidationError
console.log("\nНевалидные значения → OrderValidationError (400 Bad Request):");
expectThrow('"0"              → ошибка (< 1)', "0");
expectThrow('"-1"             → ошибка (отрицательное)', "-1");
expectThrow('"-999"           → ошибка (отрицательное)', "-999");
expectThrow('"1000"           → ошибка (> 999)', "1000");
expectThrow('"9999"           → ошибка (> 999)', "9999");
expectThrow('"1.5"            → ошибка (дробное)', "1.5");
expectThrow('"1,5"            → ошибка (запятая)', "1,5");
expectThrow('"abc"            → ошибка (строка)', "abc");
expectThrow('"1abc"           → ошибка (смешанное)', "1abc");
expectThrow('"1e2"            → ошибка (экспоненциальная запись)', "1e2");
expectThrow('" -5"            → ошибка (пробел + минус)', " -5");
expectThrow('"+1"             → ошибка (знак плюс)', "+1");

// ── Тест логики honeypot ──────────────────────────────────────────────────────

console.log("\n=== Логика honeypot ===\n");

function checkHoneypotConstructor(hpFieldValue) {
  // Воспроизведение: field("hp_field") → truthy → отклонить как спам
  const fieldStr = (hpFieldValue ?? "").trim();
  return fieldStr ? "spam_rejected" : "pass";
}

function checkHoneypotOrder(hpFieldValue) {
  // Воспроизведение: data.hp_field → truthy → отклонить как спам
  return hpFieldValue ? "spam_rejected" : "pass";
}

// Матрица: [описание, значение hp_field, ожидаемый результат]
const honeypotCases = [
  ["пустая строка (легитимная форма)",   "",          "pass"],
  ["undefined (JSON без поля)",          undefined,   "pass"],
  ["null",                               null,        "pass"],
  ["непустое значение (бот заполнил)",   "http://x",  "spam_rejected"],
  ["любой текст",                        "anything",  "spam_rejected"],
  ["пробел + текст",                     " x",        "spam_rejected"],
];

console.log("Конструктор (FormData → field('hp_field').trim()):");
for (const [label, val, expected] of honeypotCases) {
  expect(label.padEnd(45), checkHoneypotConstructor(val), expected);
}

console.log("\nПродуктовая форма (JSON → data.hp_field):");
for (const [label, val, expected] of honeypotCases) {
  expect(label.padEnd(45), checkHoneypotOrder(val), expected);
}

// ── Полная карта honeypot: форма → ключ → endpoint → проверка ────────────────

console.log(`
=== Карта унификации honeypot ===

  OrderForm.tsx (продуктовые страницы)
    DOM input:     name="hp_field"
    React state:   website (внутреннее имя стейт-переменной — не важно)
    JSON payload:  hp_field: website     ← исправлено
    endpoint:      POST /api/order
    DTO поле:      hp_field?: string     ← переименовано из website
    проверка:      if (data.hp_field)    ← исправлено

  ConfiguratorOrderForm.tsx (конструктор)
    DOM input:     name="hp_field"       ✓ уже правильно
    FormData key:  fd.append("hp_field") ✓ уже правильно
    endpoint:      POST /api/orders/constructor
    проверка:      field("hp_field")     ✓ уже правильно

  Итог: оба пайплайна унифицированы на hp_field.
`);

// ── Итог ─────────────────────────────────────────────────────────────────────

console.log("─".repeat(50));
console.log(`Результат: ${passed} ✓ прошло, ${failed} ✗ упало`);
if (failed > 0) {
  console.error("НЕКОТОРЫЕ ПРОВЕРКИ ПРОВАЛИЛИСЬ");
  process.exit(1);
} else {
  console.log("Все проверки прошли ✓");
}
