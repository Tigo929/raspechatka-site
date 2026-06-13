/**
 * Воспроизводимые проверки логики авторизации /admin.
 * Запуск: node scripts/check-admin-auth.mjs
 *
 * Тестирует ту же логику, что proxy.ts + admin-auth.ts,
 * без зависимости от Next.js runtime.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// ── Воспроизведение логики из admin-auth.ts ──────────────────────────────────

function sign(value, secret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function createToken(secret, overrides = {}) {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = overrides.expiresAt ?? Date.now() + 12 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ expiresAt, nonce })).toString("base64url");
  const sig = overrides.sig ?? sign(payload, secret);
  return `${payload}.${sig}`;
}

function verifyToken(token, secret) {
  if (!secret || secret.length < 32) return { ok: false, reason: "no_secret" };
  if (!token) return { ok: false, reason: "no_token" };

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "bad_format" };
  const [payload, sig] = parts;
  if (!payload || !sig) return { ok: false, reason: "empty_parts" };

  if (!safeEqual(sig, sign(payload, secret))) return { ok: false, reason: "bad_signature" };

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.expiresAt !== "number") return { ok: false, reason: "no_expiresAt" };
    if (data.expiresAt <= Date.now()) return { ok: false, reason: "expired" };
    if (typeof data.nonce !== "string" || data.nonce.length !== 32) {
      return { ok: false, reason: "bad_nonce" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "json_parse_error" };
  }
}

// ── Инфраструктура тестов ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function expect(label, got, expected) {
  const ok = got === expected;
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

function expectOk(label, token, secret) {
  expect(label, verifyToken(token, secret).ok, true);
}

function expectFail(label, token, secret, reason) {
  const result = verifyToken(token, secret);
  if (reason) {
    expect(`${label} [reason=${reason}]`, result.reason, reason);
  } else {
    expect(label, result.ok, false);
  }
}

// ── Тесты ─────────────────────────────────────────────────────────────────────

const VALID_SECRET = randomBytes(32).toString("hex"); // 64 символа
const OTHER_SECRET = randomBytes(32).toString("hex");

console.log("\n=== Admin Auth verification script ===\n");

// 1. Cookie отсутствует
console.log("1. Cookie отсутствует");
expectFail("undefined → no_token", undefined, VALID_SECRET, "no_token");

// 2. Cookie произвольная
console.log("\n2. Произвольная cookie");
expectFail("случайная строка → bad_format", "random-garbage", VALID_SECRET, "bad_format");
expectFail("base64.base64 без правильной подписи → bad_signature",
  Buffer.from('{"expiresAt":9999999999999,"nonce":"a".repeat(32)}').toString("base64url") + ".fakesig",
  VALID_SECRET, "bad_signature");

// 3. Изменённый payload (правильная подпись старого payload, новый payload)
console.log("\n3. Изменённый payload (tampered)");
const validToken = createToken(VALID_SECRET);
const [origPayload, origSig] = validToken.split(".");
const tamperedData = JSON.parse(Buffer.from(origPayload, "base64url").toString());
tamperedData.expiresAt = Date.now() + 999 * 24 * 60 * 60 * 1000; // +999 дней
const tamperedPayload = Buffer.from(JSON.stringify(tamperedData)).toString("base64url");
const tamperedToken = `${tamperedPayload}.${origSig}`; // старая подпись, новый payload
expectFail("изменённый payload со старой подписью → bad_signature",
  tamperedToken, VALID_SECRET, "bad_signature");

// 4. Изменённая подпись
console.log("\n4. Изменённая подпись");
const badSigToken = `${origPayload}.invalidsignature`;
expectFail("правильный payload, неверная подпись → bad_signature",
  badSigToken, VALID_SECRET, "bad_signature");

// 5. Истёкший токен
console.log("\n5. Истёкший токен");
const expiredToken = createToken(VALID_SECRET, { expiresAt: Date.now() - 1000 });
expectFail("expiresAt в прошлом → expired", expiredToken, VALID_SECRET, "expired");

// 6. Секрет отсутствует
console.log("\n6. Секрет отсутствует");
expectFail("null secret → no_secret", validToken, null, "no_secret");
expectFail("empty string → no_secret", validToken, "", "no_secret");
expectFail("undefined → no_secret", validToken, undefined, "no_secret");

// 7. Секрет слишком короткий
console.log("\n7. Секрет слишком короткий");
expectFail("31 символ → no_secret", validToken, "a".repeat(31), "no_secret");

// 8. Правильный токен и правильный секрет
console.log("\n8. Корректный токен и корректный секрет");
const freshToken = createToken(VALID_SECRET);
expectOk("свежий токен, правильный секрет", freshToken, VALID_SECRET);

// 9. Правильный токен, но другой секрет
console.log("\n9. Правильный токен, чужой секрет");
expectFail("токен подписан одним секретом, проверяем другим → bad_signature",
  freshToken, OTHER_SECRET, "bad_signature");

// 10. Граничные случаи формата
console.log("\n10. Граничные случаи");
expectFail("пустая строка → no_token (falsy)", "", VALID_SECRET, "no_token");
expectFail("три части вместо двух → bad_format", "a.b.c", VALID_SECRET, "bad_format");
expectFail("одна часть → bad_format", "abc", VALID_SECRET, "bad_format");

// ── Итог ─────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(44)}`);
console.log(`Результат: ${passed} ✓ прошло, ${failed} ✗ упало`);
if (failed > 0) {
  console.error("НЕКОТОРЫЕ ПРОВЕРКИ ПРОВАЛИЛИСЬ");
  process.exit(1);
} else {
  console.log("Все проверки прошли ✓");
}
