#!/usr/bin/env node
/**
 * Dry-run JSON → PostgreSQL importer for «Распечатка».
 *
 * Режимы:
 *   npm run db:import-json:dry   — читает данные, выводит отчёт, не меняет БД
 *   npm run db:import-json       — реальный import (Этап 4B, только по явной команде)
 *
 * Принципы:
 *   - Не изменяет исходные JSON/NDJSON файлы
 *   - Не раскрывает PII — только агрегаты и безопасные reference
 *   - В dry-run НЕ пишет в PostgreSQL
 *   - Идемпотентен (повторный запуск безопасен)
 *   - Выявляет дубликаты, orphaned files, отсутствующие поля, ошибки парсинга
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Config ───────────────────────────────────────────────────────────────────

const DRY_RUN =
  process.argv.includes("--dry-run") || process.env.IMPORT_MODE !== "real";

const DATA_DIR = path.resolve(
  process.env.PRINTLAB_DATA_DIR ?? path.join(process.cwd(), "data"),
);

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const USE_FIXTURES = process.argv.includes("--fixture");
const ACTIVE_DIR = USE_FIXTURES ? FIXTURES_DIR : DATA_DIR;

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawSubmission {
  id?: string;
  reference?: string;
  idempotencyKey?: string;
  kind?: string;
  status?: string;
  name?: string;
  contact?: { method?: string; value?: string };
  files?: Array<{ key?: string; storedPath?: string }>;
  createdAt?: string;
  [key: string]: unknown;
}

interface RawOutboxJob {
  id?: string;
  submissionId?: string;
  status?: string;
  attempts?: number;
  [key: string]: unknown;
}

interface RawAnalyticsEvent {
  id?: string;
  type?: string;
  page?: string;
  sessionId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface RawReview {
  id?: string;
  name?: string;
  rating?: number;
  text?: string;
  date?: string;
  [key: string]: unknown;
}

interface RawFaqItem {
  id?: string;
  question?: string;
  answer?: string;
  [key: string]: unknown;
}

interface RawCategory {
  slug?: string;
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  [key: string]: unknown;
}

interface RawProduct {
  slug?: string;
  title?: string;
  priceFrom?: number;
  [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ReadResult<T> {
  records: T[];
  parseError: string | null;
}

function readJsonFile<T>(filePath: string): ReadResult<T> {
  if (!fs.existsSync(filePath)) return { records: [], parseError: null };
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return {
      records: Array.isArray(raw) ? (raw as T[]) : [],
      parseError: null,
    };
  } catch (e) {
    return { records: [], parseError: `${filePath}: ${String(e)}` };
  }
}

function readJsonObject(filePath: string): {
  obj: Record<string, unknown> | null;
  parseError: string | null;
} {
  if (!fs.existsSync(filePath)) return { obj: null, parseError: null };
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const obj =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : null;
    return { obj, parseError: obj === null ? `${filePath}: not an object` : null };
  } catch (e) {
    return { obj: null, parseError: `${filePath}: ${String(e)}` };
  }
}

function parseNdjson(filePath: string): {
  records: RawAnalyticsEvent[];
  parseErrors: number;
} {
  if (!fs.existsSync(filePath)) return { records: [], parseErrors: 0 };
  const lines = fs
    .readFileSync(filePath, "utf-8")
    .split("\n")
    .filter(Boolean);
  const records: RawAnalyticsEvent[] = [];
  let parseErrors = 0;
  for (const line of lines) {
    try {
      records.push(JSON.parse(line) as RawAnalyticsEvent);
    } catch {
      parseErrors++;
    }
  }
  return { records, parseErrors };
}

function countBy<T>(arr: T[], key: keyof T): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of arr) {
    const val = String(item[key] ?? "unknown");
    counts[val] = (counts[val] ?? 0) + 1;
  }
  return counts;
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) dups.add(v);
    seen.add(v);
  }
  return [...dups];
}

function safeRef(id: string): string {
  return id.slice(0, 8) + "...";
}

function walkDir(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkDir(full));
    else results.push(full);
  }
  return results;
}

function fixtureFile(realName: string): string {
  const base = path.basename(realName);
  const fixtureBase = base
    .replace(/\.json$/, ".fixture.json")
    .replace(/\.ndjson$/, ".fixture.ndjson");
  return path.join(FIXTURES_DIR, fixtureBase);
}

function resolveDataFile(realName: string): string {
  if (USE_FIXTURES) return fixtureFile(realName);
  return path.join(DATA_DIR, realName);
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

function analyzeSubmissions(records: RawSubmission[]) {
  const ids = records.map((r) => r.id ?? "").filter(Boolean);
  const refs = records.map((r) => r.reference ?? "").filter(Boolean);
  const idemKeys = records
    .map((r) => r.idempotencyKey)
    .filter((k): k is string => Boolean(k));

  const missingRequiredFields: string[] = [];
  for (const r of records) {
    const ref = r.reference ?? `[id:${(r.id ?? "?").slice(0, 8)}]`;
    if (!r.id) missingRequiredFields.push(`${ref}: missing id`);
    if (!r.reference) missingRequiredFields.push(`${ref}: missing reference`);
    if (!r.kind) missingRequiredFields.push(`${ref}: missing kind`);
    if (!r.name) missingRequiredFields.push(`${ref}: missing name`);
    if (!r.contact?.method)
      missingRequiredFields.push(`${ref}: missing contact.method`);
    if (!r.contact?.value)
      missingRequiredFields.push(`${ref}: missing contact.value`);
    if (!r.createdAt) missingRequiredFields.push(`${ref}: missing createdAt`);
  }

  const totalFiles = records.reduce(
    (sum, r) => sum + (r.files?.length ?? 0),
    0,
  );

  return {
    total: records.length,
    byKind: countBy(records, "kind"),
    byStatus: countBy(records, "status"),
    withFiles: records.filter((r) => (r.files?.length ?? 0) > 0).length,
    withIdempotencyKey: idemKeys.length,
    missingRequiredFields,
    duplicateIds: findDuplicates(ids),
    duplicateReferences: findDuplicates(refs),
    duplicateIdempotencyKeys: findDuplicates(idemKeys),
    totalFiles,
  };
}

function analyzeOutboxJobs(
  jobs: RawOutboxJob[],
  submissionIds: Set<string>,
) {
  const ids = jobs.map((j) => j.id ?? "").filter(Boolean);
  const subIds = jobs
    .map((j) => j.submissionId ?? "")
    .filter(Boolean);

  const orphaned: string[] = [];
  const missingSubmissions: string[] = [];

  for (const j of jobs) {
    if (!j.submissionId) {
      orphaned.push(j.id ? safeRef(j.id) : "[no id]");
    } else if (!submissionIds.has(j.submissionId)) {
      missingSubmissions.push(safeRef(j.submissionId));
    }
  }

  return {
    total: jobs.length,
    byStatus: countBy(jobs, "status"),
    duplicateIds: findDuplicates(ids),
    duplicateSubmissionIds: findDuplicates(subIds),
    orphaned,
    missingSubmissions,
  };
}

function analyzeFiles(
  submissions: RawSubmission[],
  orderFilesDir: string,
) {
  const onDisk = walkDir(orderFilesDir).map((p) =>
    path.relative(DATA_DIR, p).replace(/\\/g, "/"),
  );
  const onDiskSet = new Set(onDisk);

  const referenced = new Set<string>();
  for (const sub of submissions) {
    for (const f of sub.files ?? []) {
      if (f.storedPath) referenced.add(f.storedPath.replace(/\\/g, "/"));
    }
  }

  return {
    orphanedFiles: onDisk.filter((p) => !referenced.has(p)),
    referencedButMissing: [...referenced].filter((p) => !onDiskSet.has(p)),
    totalOnDisk: onDisk.length,
  };
}

function validateArray<T extends Record<string, unknown>>(
  records: T[],
  requiredFields: (keyof T)[],
  idField: keyof T = "id" as keyof T,
): { missingRequired: string[] } {
  const missingRequired: string[] = [];
  for (const r of records) {
    const ref = String(r[idField] ?? "[no id]").slice(0, 16);
    for (const field of requiredFields) {
      if (!r[field]) missingRequired.push(`${ref}: missing ${String(field)}`);
    }
  }
  return { missingRequired };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const parseErrors: string[] = [];

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Распечатка — JSON → PostgreSQL importer");
  console.log(`  Mode    : ${DRY_RUN ? "DRY-RUN (no DB writes)" : "⚠ REAL IMPORT"}`);
  console.log(`  DataDir : ${ACTIVE_DIR}`);
  console.log(`  Fixtures: ${USE_FIXTURES ? "YES" : "NO"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log();

  // ── Read transactional sources ────────────────────────────────────────────
  const ordersResult = readJsonFile<RawSubmission>(resolveDataFile("orders.json"));
  if (ordersResult.parseError) parseErrors.push(ordersResult.parseError);

  const outboxResult = readJsonFile<RawOutboxJob>(resolveDataFile("delivery-outbox.json"));
  if (outboxResult.parseError) parseErrors.push(outboxResult.parseError);

  const analyticsResult = parseNdjson(resolveDataFile("analytics.ndjson"));
  const legacyAnalytics = USE_FIXTURES
    ? []
    : readJsonFile<RawAnalyticsEvent>(path.join(DATA_DIR, "analytics.json")).records;

  // ── Read CMS sources ──────────────────────────────────────────────────────
  const reviewsResult = readJsonFile<RawReview>(resolveDataFile("managed-reviews.json"));
  if (reviewsResult.parseError) parseErrors.push(reviewsResult.parseError);

  const faqResult = readJsonFile<RawFaqItem>(resolveDataFile("managed-faq.json"));
  if (faqResult.parseError) parseErrors.push(faqResult.parseError);

  const settingsResult = readJsonObject(resolveDataFile("managed-settings.json"));
  if (settingsResult.parseError) parseErrors.push(settingsResult.parseError);

  const categoriesResult = readJsonFile<RawCategory>(resolveDataFile("managed-categories.json"));
  if (categoriesResult.parseError) parseErrors.push(categoriesResult.parseError);

  const contentResult = readJsonObject(resolveDataFile("managed-content.json"));
  if (contentResult.parseError) parseErrors.push(contentResult.parseError);

  const productsResult = readJsonFile<RawProduct>(resolveDataFile("catalog-products.json"));
  if (productsResult.parseError) parseErrors.push(productsResult.parseError);

  const mediaVersionsResult = readJsonObject(resolveDataFile("media-versions.json"));
  if (mediaVersionsResult.parseError) parseErrors.push(mediaVersionsResult.parseError);

  // ── Print read summary ────────────────────────────────────────────────────
  console.log("Reading source files...");
  console.log(`  orders.json              : ${ordersResult.records.length} records`);
  console.log(`  delivery-outbox.json     : ${outboxResult.records.length} records`);
  console.log(`  analytics.ndjson         : ${analyticsResult.records.length} events (${analyticsResult.parseErrors} errors)`);
  console.log(`  analytics.json (legacy)  : ${legacyAnalytics.length} events`);
  console.log(`  managed-reviews.json     : ${reviewsResult.records.length} records`);
  console.log(`  managed-faq.json         : ${faqResult.records.length} records`);
  console.log(`  managed-settings.json    : ${settingsResult.obj ? "present" : "absent"}`);
  console.log(`  managed-categories.json  : ${categoriesResult.records.length} records`);
  console.log(`  managed-content.json     : ${contentResult.obj ? "present" : "absent"}`);
  console.log(`  catalog-products.json    : ${productsResult.records.length} records`);
  console.log(`  media-versions.json      : ${Object.keys(mediaVersionsResult.obj ?? {}).length} entries`);
  if (parseErrors.length > 0) {
    console.log(`\n  ✗ JSON parse errors (${parseErrors.length}):`);
    for (const e of parseErrors) console.log(`    - ${e}`);
  }
  console.log();

  // ── Analyze ───────────────────────────────────────────────────────────────
  const subAnalysis = analyzeSubmissions(ordersResult.records);
  const subIds = new Set(
    ordersResult.records.map((s) => s.id ?? "").filter(Boolean),
  );
  const jobAnalysis = analyzeOutboxJobs(outboxResult.records, subIds);
  const fileAnalysis = USE_FIXTURES
    ? { orphanedFiles: [], referencedButMissing: [], totalOnDisk: 0 }
    : analyzeFiles(ordersResult.records, path.join(DATA_DIR, "order-files"));

  const reviewsValidation = validateArray(
    reviewsResult.records as Record<string, unknown>[],
    ["id", "name", "rating", "text", "date"],
  );
  const faqValidation = validateArray(
    faqResult.records as Record<string, unknown>[],
    ["id", "question", "answer"],
  );
  const categoriesValidation = validateArray(
    categoriesResult.records as Record<string, unknown>[],
    ["slug", "title", "description", "image", "imageAlt"],
    "slug",
  );
  const productsValidation = validateArray(
    productsResult.records as Record<string, unknown>[],
    ["slug", "title", "priceFrom"],
    "slug",
  );

  const mediaCount = Object.keys(mediaVersionsResult.obj ?? {}).length;
  const publicUploadsCount = USE_FIXTURES
    ? 0
    : walkDir(path.join(process.cwd(), "public", "uploads")).length;

  // ── Print report ──────────────────────────────────────────────────────────
  console.log("═══════════════════════ PARITY REPORT ═══════════════════════");
  console.log();

  // A. Submissions
  console.log("── A. Submissions (orders.json → Submission + SubmissionFile) ─");
  console.log(`  Total              : ${subAnalysis.total}`);
  console.log(`  By kind            : ${JSON.stringify(subAnalysis.byKind)}`);
  console.log(`  By status          : ${JSON.stringify(subAnalysis.byStatus)}`);
  console.log(`  With files         : ${subAnalysis.withFiles} (${subAnalysis.totalFiles} file refs)`);
  console.log(`  With idem.key      : ${subAnalysis.withIdempotencyKey}`);

  if (subAnalysis.missingRequiredFields.length > 0) {
    console.log(`\n  ✗ Missing required fields (${subAnalysis.missingRequiredFields.length}):`);
    for (const m of subAnalysis.missingRequiredFields.slice(0, 10)) console.log(`    - ${m}`);
  } else {
    console.log("  ✓ All required fields present");
  }

  if (subAnalysis.duplicateIds.length > 0) {
    console.log(`  ✗ DUPLICATE IDs (${subAnalysis.duplicateIds.length}) — BLOCKER`);
    for (const d of subAnalysis.duplicateIds) console.log(`    - ${safeRef(d)}`);
  } else {
    console.log("  ✓ No duplicate IDs");
  }

  if (subAnalysis.duplicateReferences.length > 0) {
    console.log(`  ✗ DUPLICATE references (${subAnalysis.duplicateReferences.length}) — BLOCKER`);
    for (const d of subAnalysis.duplicateReferences) console.log(`    - ${d}`);
  } else {
    console.log("  ✓ No duplicate references");
  }

  if (subAnalysis.duplicateIdempotencyKeys.length > 0) {
    console.log(`  ✗ DUPLICATE idempotencyKeys (${subAnalysis.duplicateIdempotencyKeys.length}) — BLOCKER`);
    for (const d of subAnalysis.duplicateIdempotencyKeys) console.log(`    - ${d.slice(0, 8)}...`);
  } else {
    console.log("  ✓ No duplicate idempotencyKeys");
  }

  // B. Outbox
  console.log();
  console.log("── B. DeliveryOutboxJobs (delivery-outbox.json → DeliveryOutboxJob) ─");
  console.log(`  Total              : ${jobAnalysis.total}`);
  console.log(`  By status          : ${JSON.stringify(jobAnalysis.byStatus)}`);

  if (jobAnalysis.duplicateIds.length > 0) {
    console.log(`  ✗ DUPLICATE outbox IDs (${jobAnalysis.duplicateIds.length}) — BLOCKER`);
    for (const d of jobAnalysis.duplicateIds) console.log(`    - ${safeRef(d)}`);
  } else {
    console.log("  ✓ No duplicate outbox IDs");
  }

  if (jobAnalysis.duplicateSubmissionIds.length > 0) {
    console.log(`  ✗ DUPLICATE submissionIds (${jobAnalysis.duplicateSubmissionIds.length}) — BLOCKER`);
    for (const d of jobAnalysis.duplicateSubmissionIds) console.log(`    - ${safeRef(d)}`);
  } else {
    console.log("  ✓ No duplicate outbox submissionIds");
  }

  if (jobAnalysis.orphaned.length > 0) {
    console.log(`  ✗ Jobs without submissionId (${jobAnalysis.orphaned.length}) — BLOCKER`);
    for (const id of jobAnalysis.orphaned) console.log(`    - ${id}`);
  } else {
    console.log("  ✓ All jobs have submissionId");
  }

  if (jobAnalysis.missingSubmissions.length > 0) {
    console.log(`  ✗ Jobs referencing unknown submission (${jobAnalysis.missingSubmissions.length}) — BLOCKER`);
    for (const id of jobAnalysis.missingSubmissions) console.log(`    - ${id}`);
  } else {
    console.log("  ✓ All jobs reference existing submissions");
  }

  // C. Analytics
  console.log();
  console.log("── C. Analytics (analytics.ndjson + analytics.json → AnalyticsEvent) ─");
  const allAnalytics = [...analyticsResult.records, ...legacyAnalytics];
  console.log(`  Total events       : ${allAnalytics.length}`);
  console.log(`  By type            : ${JSON.stringify(countBy(allAnalytics, "type"))}`);
  if (legacyAnalytics.length > 0)
    console.log(`  Legacy JSON        : ${legacyAnalytics.length} events to migrate`);
  if (analyticsResult.parseErrors > 0) {
    console.log(`  ✗ NDJSON parse errors: ${analyticsResult.parseErrors} — BLOCKER`);
  } else {
    console.log("  ✓ No NDJSON parse errors");
  }

  // D. Files
  if (!USE_FIXTURES) {
    console.log();
    console.log("── D. Files (order-files/ + public/uploads/) ─────────────────");
    console.log(`  order-files on disk: ${fileAnalysis.totalOnDisk}`);
    console.log(`  public/uploads     : ${publicUploadsCount}`);
    if (fileAnalysis.referencedButMissing.length > 0) {
      console.log(`  ✗ Referenced but missing on disk (${fileAnalysis.referencedButMissing.length}) — BLOCKER`);
    } else {
      console.log("  ✓ All referenced files exist on disk");
    }
    if (fileAnalysis.orphanedFiles.length > 0) {
      console.log(`  ⚠ Orphaned on disk (no submission): ${fileAnalysis.orphanedFiles.length}`);
    } else {
      console.log("  ✓ No orphaned files on disk");
    }
  }

  // E–K. CMS sources
  console.log();
  console.log("── E. Managed reviews (managed-reviews.json → ManagedReview) ──");
  console.log(`  Total              : ${reviewsResult.records.length}`);
  if (reviewsValidation.missingRequired.length > 0) {
    console.log(`  ⚠ Missing fields   : ${reviewsValidation.missingRequired.length}`);
  } else {
    console.log("  ✓ All required fields present");
  }

  console.log();
  console.log("── F. FAQ (managed-faq.json → FaqItem) ──────────────────────");
  console.log(`  Total              : ${faqResult.records.length}`);
  if (faqValidation.missingRequired.length > 0) {
    console.log(`  ⚠ Missing fields   : ${faqValidation.missingRequired.length}`);
  } else {
    console.log("  ✓ All required fields present");
  }

  console.log();
  console.log("── G. Settings (managed-settings.json → SiteSettings) ────────");
  console.log(`  Present            : ${settingsResult.obj ? "yes" : "no"}`);
  if (settingsResult.obj) {
    const keys = Object.keys(settingsResult.obj).filter(
      (k) => settingsResult.obj![k] !== "",
    );
    console.log(`  Non-empty fields   : ${keys.join(", ") || "none"}`);
  }

  console.log();
  console.log("── H. Categories (managed-categories.json → Category) ─────────");
  console.log(`  Total              : ${categoriesResult.records.length}`);
  if (categoriesValidation.missingRequired.length > 0) {
    console.log(`  ⚠ Missing fields   : ${categoriesValidation.missingRequired.length}`);
  } else {
    console.log("  ✓ All required fields present");
  }

  console.log();
  console.log("── I. Content (managed-content.json → ManagedContent) ─────────");
  console.log(`  Present            : ${contentResult.obj ? "yes" : "no"}`);
  if (contentResult.obj) {
    const keys = Object.keys(contentResult.obj);
    console.log(`  Keys               : ${keys.join(", ")}`);
  }

  console.log();
  console.log("── J. Products (catalog-products.json → Product) ──────────────");
  console.log(`  Total              : ${productsResult.records.length}`);
  if (productsValidation.missingRequired.length > 0) {
    console.log(`  ⚠ Missing fields   : ${productsValidation.missingRequired.length}`);
  } else {
    console.log("  ✓ All required fields present");
  }

  console.log();
  console.log("── K. Media (media-versions.json → MediaAsset) ────────────────");
  console.log(`  Entries            : ${mediaCount}`);

  // L. Coverage matrix
  console.log();
  console.log("── L. Coverage matrix ─────────────────────────────────────────");
  const matrix = [
    ["orders.json", "Submission + SubmissionFile", String(subAnalysis.total), "full", "Этап 4C"],
    ["delivery-outbox.json", "DeliveryOutboxJob", String(jobAnalysis.total), "full", "Этап 4C"],
    ["analytics.ndjson", "AnalyticsEvent", String(analyticsResult.records.length), "full", "Этап 4C"],
    ["analytics.json", "AnalyticsEvent (legacy)", String(legacyAnalytics.length), "count", "Этап 4C"],
    ["managed-reviews.json", "ManagedReview", String(reviewsResult.records.length), "required fields", "Этап 4C"],
    ["managed-faq.json", "FaqItem", String(faqResult.records.length), "required fields", "Этап 4C"],
    ["managed-settings.json", "SiteSettings", settingsResult.obj ? "1" : "0", "presence", "Этап 4C"],
    ["managed-categories.json", "Category", String(categoriesResult.records.length), "required fields", "Этап 4C"],
    ["managed-content.json", "ManagedContent", contentResult.obj ? "1" : "0", "presence", "Этап 4C"],
    ["catalog-products.json", "Product", String(productsResult.records.length), "required fields", "Этап 4C"],
    ["media-versions.json", "MediaAsset", String(mediaCount), "count", "Этап 4C"],
    ["base-products.json", "— (seed only)", "—", "—", "stays seed"],
  ];
  console.log(
    "  Source JSON               | Prisma model             | Count | Validation     | Import",
  );
  console.log("  " + "─".repeat(95));
  for (const [src, model, count, validation, stage] of matrix) {
    console.log(
      `  ${src.padEnd(25)} | ${model.padEnd(24)} | ${count.padStart(5)} | ${validation.padEnd(14)} | ${stage}`,
    );
  }

  // M. Estimated inserts
  console.log();
  console.log("── M. Estimated inserts ───────────────────────────────────────");
  console.log(`  Submission         : ${subAnalysis.total}`);
  console.log(`  SubmissionFile     : ${subAnalysis.totalFiles}`);
  console.log(`  DeliveryOutboxJob  : ${jobAnalysis.total}`);
  console.log(`  AnalyticsEvent     : ${allAnalytics.length}`);
  console.log(`  ManagedReview      : ${reviewsResult.records.length}`);
  console.log(`  FaqItem            : ${faqResult.records.length}`);
  console.log(`  SiteSettings       : ${settingsResult.obj ? 1 : 0}`);
  console.log(`  Category           : ${categoriesResult.records.length}`);
  console.log(`  ManagedContent     : ${contentResult.obj ? 1 : 0}`);
  console.log(`  Product            : ${productsResult.records.length}`);
  console.log(`  MediaAsset         : ${mediaCount}`);

  // ── Blockers ──────────────────────────────────────────────────────────────
  const blockerList: string[] = [];
  if (parseErrors.length > 0)
    blockerList.push(`JSON parse errors: ${parseErrors.length}`);
  if (subAnalysis.duplicateIds.length > 0)
    blockerList.push(`Duplicate submission IDs: ${subAnalysis.duplicateIds.length}`);
  if (subAnalysis.duplicateReferences.length > 0)
    blockerList.push(`Duplicate submission.reference: ${subAnalysis.duplicateReferences.length}`);
  if (subAnalysis.duplicateIdempotencyKeys.length > 0)
    blockerList.push(`Duplicate submission.idempotencyKey: ${subAnalysis.duplicateIdempotencyKeys.length}`);
  if (subAnalysis.missingRequiredFields.length > 0)
    blockerList.push(`Missing required fields in submissions: ${subAnalysis.missingRequiredFields.length}`);
  if (jobAnalysis.duplicateIds.length > 0)
    blockerList.push(`Duplicate outbox job IDs: ${jobAnalysis.duplicateIds.length}`);
  if (jobAnalysis.duplicateSubmissionIds.length > 0)
    blockerList.push(`Duplicate outbox submissionIds: ${jobAnalysis.duplicateSubmissionIds.length}`);
  if (jobAnalysis.orphaned.length > 0)
    blockerList.push(`Outbox jobs without submissionId: ${jobAnalysis.orphaned.length}`);
  if (jobAnalysis.missingSubmissions.length > 0)
    blockerList.push(`Outbox jobs referencing unknown submission: ${jobAnalysis.missingSubmissions.length}`);
  if (analyticsResult.parseErrors > 0)
    blockerList.push(`NDJSON parse errors: ${analyticsResult.parseErrors}`);
  if (!USE_FIXTURES && fileAnalysis.referencedButMissing.length > 0)
    blockerList.push(`Files referenced but missing on disk: ${fileAnalysis.referencedButMissing.length}`);

  const hasBlockers = blockerList.length > 0;

  console.log();
  console.log("─────────────────────────────────────────────────────────────");
  if (hasBlockers) {
    console.log(`⛔ BLOCKERS found (${blockerList.length}) — fix before running real import:`);
    for (const b of blockerList) console.log(`   • ${b}`);
  } else {
    console.log("✅ No blockers. Ready for real import (Этап 4B).");
  }

  if (DRY_RUN) {
    console.log();
    console.log("ℹ  DRY-RUN: no changes made to the database or source files.");
    console.log('   Run with IMPORT_MODE=real for actual import (Этап 4B only).');
  } else {
    console.log();
    console.log("⚠  REAL IMPORT not yet implemented (Этап 4B).");
  }
  console.log();

  process.exit(hasBlockers ? 1 : 0);
}

main().catch((err: unknown) => {
  console.error("Importer error:", err);
  process.exit(1);
});
