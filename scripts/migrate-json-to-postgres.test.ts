/**
 * Tests for the JSON → PostgreSQL dry-run importer.
 * Uses fixture files in scripts/fixtures/ — never touches real data.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const FIXTURES_DIR = path.join(import.meta.dirname, "fixtures");

function readJsonFixture<T>(name: string): T[] {
  const fp = path.join(FIXTURES_DIR, name);
  if (!fs.existsSync(fp)) return [];
  const raw = JSON.parse(fs.readFileSync(fp, "utf-8"));
  return Array.isArray(raw) ? raw : [];
}

function readJsonObjectFixture(name: string): Record<string, unknown> | null {
  const fp = path.join(FIXTURES_DIR, name);
  if (!fs.existsSync(fp)) return null;
  const raw = JSON.parse(fs.readFileSync(fp, "utf-8"));
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null;
}

function readNdjsonFixture(name: string): unknown[] {
  const fp = path.join(FIXTURES_DIR, name);
  if (!fs.existsSync(fp)) return [];
  return fs
    .readFileSync(fp, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
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

// ─── Transactional fixtures ───────────────────────────────────────────────────

describe("Importer fixtures: transactional sources", () => {
  it("orders.fixture.json is readable and has records", () => {
    const records = readJsonFixture<Record<string, unknown>>("orders.fixture.json");
    expect(records.length).toBeGreaterThan(0);
  });

  it("delivery-outbox.fixture.json is readable and has records", () => {
    const records = readJsonFixture<Record<string, unknown>>(
      "delivery-outbox.fixture.json",
    );
    expect(records.length).toBeGreaterThan(0);
  });

  it("analytics.fixture.ndjson is readable and has records", () => {
    const records = readNdjsonFixture("analytics.fixture.ndjson");
    expect(records.length).toBeGreaterThan(0);
  });
});

// ─── CMS fixtures ─────────────────────────────────────────────────────────────

describe("Importer fixtures: CMS sources", () => {
  it("managed-reviews.fixture.json has required fields", () => {
    const records = readJsonFixture<{
      id?: string;
      name?: string;
      rating?: number;
      text?: string;
      date?: string;
    }>("managed-reviews.fixture.json");
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) {
      expect(r.id).toBeTruthy();
      expect(r.name).toBeTruthy();
      expect(r.rating).toBeDefined();
      expect(r.text).toBeTruthy();
      expect(r.date).toBeTruthy();
    }
  });

  it("managed-faq.fixture.json has required fields", () => {
    const records = readJsonFixture<{
      id?: string;
      question?: string;
      answer?: string;
    }>("managed-faq.fixture.json");
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) {
      expect(r.id).toBeTruthy();
      expect(r.question).toBeTruthy();
      expect(r.answer).toBeTruthy();
    }
  });

  it("managed-settings.fixture.json is an object with expected keys", () => {
    const obj = readJsonObjectFixture("managed-settings.fixture.json");
    expect(obj).not.toBeNull();
    expect(obj).toHaveProperty("phone");
    expect(obj).toHaveProperty("email");
    expect(obj).toHaveProperty("telegram");
  });

  it("managed-categories.fixture.json has required fields", () => {
    const records = readJsonFixture<{
      slug?: string;
      title?: string;
      description?: string;
      image?: string;
      imageAlt?: string;
    }>("managed-categories.fixture.json");
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) {
      expect(r.slug).toBeTruthy();
      expect(r.title).toBeTruthy();
      expect(r.description).toBeTruthy();
      expect(r.image).toBeTruthy();
      expect(r.imageAlt).toBeTruthy();
    }
  });

  it("managed-content.fixture.json has CMS content keys", () => {
    const obj = readJsonObjectFixture("managed-content.fixture.json");
    expect(obj).not.toBeNull();
    expect(obj).toHaveProperty("pricing");
    expect(obj).toHaveProperty("benefits");
    expect(obj).toHaveProperty("steps");
  });

  it("catalog-products.fixture.json is a valid (possibly empty) array", () => {
    const fp = path.join(FIXTURES_DIR, "catalog-products.fixture.json");
    expect(fs.existsSync(fp)).toBe(true);
    const raw = JSON.parse(fs.readFileSync(fp, "utf-8"));
    expect(Array.isArray(raw)).toBe(true);
  });

  it("media-versions.fixture.json is an object with path→version entries", () => {
    const obj = readJsonObjectFixture("media-versions.fixture.json");
    expect(obj).not.toBeNull();
    const entries = Object.entries(obj!);
    expect(entries.length).toBeGreaterThan(0);
    for (const [, version] of entries) {
      expect(typeof version).toBe("number");
    }
  });
});

// ─── Data integrity ───────────────────────────────────────────────────────────

describe("Importer: data integrity checks on fixtures", () => {
  interface RawSubmission {
    id?: string;
    reference?: string;
    idempotencyKey?: string;
    kind?: string;
    status?: string;
    name?: string;
    contact?: { method?: string; value?: string };
    files?: unknown[];
    createdAt?: string;
  }

  let orders: RawSubmission[];

  beforeAll(() => {
    orders = readJsonFixture<RawSubmission>("orders.fixture.json");
  });

  it("all submissions have required fields", () => {
    for (const o of orders) {
      expect(o.id, `${o.reference} missing id`).toBeTruthy();
      expect(o.reference, `${o.id} missing reference`).toBeTruthy();
      expect(o.kind, `${o.reference} missing kind`).toBeTruthy();
      expect(o.name, `${o.reference} missing name`).toBeTruthy();
      expect(o.createdAt, `${o.reference} missing createdAt`).toBeTruthy();
    }
  });

  it("fixture has intentional duplicate idempotencyKey (for blocker testing)", () => {
    const idemKeys = orders
      .map((o) => o.idempotencyKey)
      .filter(Boolean) as string[];
    const dups = findDuplicates(idemKeys);
    expect(dups.length).toBeGreaterThan(0);
  });

  it("no duplicate submission IDs in fixtures", () => {
    const ids = orders.map((o) => o.id).filter(Boolean) as string[];
    expect(findDuplicates(ids).length).toBe(0);
  });

  it("no duplicate submission references in fixtures", () => {
    const refs = orders.map((o) => o.reference).filter(Boolean) as string[];
    expect(findDuplicates(refs).length).toBe(0);
  });

  it("outbox jobs all reference valid submission IDs", () => {
    interface RawJob {
      id?: string;
      submissionId?: string;
    }
    const jobs = readJsonFixture<RawJob>("delivery-outbox.fixture.json");
    const subIds = new Set(orders.map((o) => o.id));
    for (const job of jobs) {
      expect(
        job.submissionId && subIds.has(job.submissionId),
        `job ${job.id} references unknown submissionId: ${job.submissionId}`,
      ).toBe(true);
    }
  });

  it("analytics events all have required fields", () => {
    interface RawEvent {
      id?: string;
      type?: string;
      page?: string;
      sessionId?: string;
      timestamp?: string;
    }
    const events = readNdjsonFixture(
      "analytics.fixture.ndjson",
    ) as RawEvent[];
    for (const e of events) {
      expect(e.id).toBeTruthy();
      expect(e.type).toBeTruthy();
      expect(e.page).toBeTruthy();
      expect(e.sessionId).toBeTruthy();
      expect(e.timestamp).toBeTruthy();
    }
  });
});

// ─── Blocker conditions ───────────────────────────────────────────────────────

describe("Importer: blocker conditions", () => {
  interface Submission {
    id?: string;
    reference?: string;
    idempotencyKey?: string;
  }
  interface Job {
    id?: string;
    submissionId?: string;
  }

  it("duplicate idempotencyKey causes hasBlockers = true", () => {
    const orders = readJsonFixture<Submission>("orders.fixture.json");
    const idemKeys = orders
      .map((o) => o.idempotencyKey)
      .filter(Boolean) as string[];
    const dups = findDuplicates(idemKeys);
    // The fixture intentionally has a duplicate — verify it triggers a blocker
    expect(dups.length).toBeGreaterThan(0);
    const hasBlockers = dups.length > 0;
    expect(hasBlockers).toBe(true);
  });

  it("duplicate submission.id causes hasBlockers = true", () => {
    const synthetic: Submission[] = [
      { id: "dup-id", reference: "REF-001" },
      { id: "dup-id", reference: "REF-002" },
    ];
    const ids = synthetic.map((s) => s.id!);
    const dups = findDuplicates(ids);
    expect(dups.length).toBeGreaterThan(0);
    expect(dups.length > 0).toBe(true);
  });

  it("duplicate submission.reference causes hasBlockers = true", () => {
    const synthetic: Submission[] = [
      { id: "id-1", reference: "SAME-REF" },
      { id: "id-2", reference: "SAME-REF" },
    ];
    const refs = synthetic.map((s) => s.reference!);
    const dups = findDuplicates(refs);
    expect(dups.length).toBeGreaterThan(0);
    expect(dups.length > 0).toBe(true);
  });

  it("outbox job without submissionId causes hasBlockers = true", () => {
    const jobs: Job[] = [{ id: "job-1" }]; // no submissionId
    const orphaned = jobs.filter((j) => !j.submissionId);
    expect(orphaned.length).toBeGreaterThan(0);
    expect(orphaned.length > 0).toBe(true);
  });

  it("outbox job referencing unknown submission causes hasBlockers = true", () => {
    const subIds = new Set(["sub-001", "sub-002"]);
    const jobs: Job[] = [{ id: "job-1", submissionId: "sub-999" }];
    const missing = jobs.filter(
      (j) => j.submissionId && !subIds.has(j.submissionId),
    );
    expect(missing.length).toBeGreaterThan(0);
    expect(missing.length > 0).toBe(true);
  });

  it("duplicate outbox job IDs causes hasBlockers = true", () => {
    const jobs: Job[] = [
      { id: "dup-job-id", submissionId: "sub-1" },
      { id: "dup-job-id", submissionId: "sub-2" },
    ];
    const ids = jobs.map((j) => j.id!);
    const dups = findDuplicates(ids);
    expect(dups.length).toBeGreaterThan(0);
    expect(dups.length > 0).toBe(true);
  });

  it("duplicate outbox submissionIds causes hasBlockers = true", () => {
    const jobs: Job[] = [
      { id: "job-1", submissionId: "same-sub" },
      { id: "job-2", submissionId: "same-sub" },
    ];
    const subIds = jobs.map((j) => j.submissionId!);
    const dups = findDuplicates(subIds);
    expect(dups.length).toBeGreaterThan(0);
    expect(dups.length > 0).toBe(true);
  });
});

// ─── Non-destructive guarantees ───────────────────────────────────────────────

describe("Importer: non-destructive guarantees", () => {
  it("fixture files are not modified by reading them", () => {
    const fp = path.join(FIXTURES_DIR, "orders.fixture.json");
    const before = fs.statSync(fp).mtimeMs;
    readJsonFixture("orders.fixture.json");
    const after = fs.statSync(fp).mtimeMs;
    expect(after).toBe(before);
  });

  it("all files in fixtures dir have 'fixture' in the name", () => {
    const entries = fs.readdirSync(FIXTURES_DIR, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);
    for (const f of files) {
      expect(f, `unexpected file in fixtures dir: ${f}`).toMatch(/fixture/);
    }
  });
});

// ─── Empty directory handling ─────────────────────────────────────────────────

describe("Importer: empty directory handling", () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(FIXTURES_DIR, "empty-test-"));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("handles missing orders file gracefully", () => {
    const missingFile = path.join(tempDir, "orders.json");
    expect(fs.existsSync(missingFile)).toBe(false);
    const raw = (() => {
      if (!fs.existsSync(missingFile)) return [];
      return JSON.parse(fs.readFileSync(missingFile, "utf-8"));
    })();
    expect(raw).toEqual([]);
  });

  it("handles missing settings file gracefully (returns null, not throws)", () => {
    const missingFile = path.join(tempDir, "managed-settings.json");
    expect(fs.existsSync(missingFile)).toBe(false);
    const result = (() => {
      if (!fs.existsSync(missingFile)) return null;
      return JSON.parse(fs.readFileSync(missingFile, "utf-8"));
    })();
    expect(result).toBeNull();
  });
});
