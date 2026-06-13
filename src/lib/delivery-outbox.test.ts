import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createOrGetSubmission,
  createSubmission,
  listSubmissions,
  updateSubmissionDelivery,
} from "./submission-repository";
import {
  claimNextJob,
  enqueueDeliveryJob,
  getJobBySubmissionId,
  listOutboxJobs,
  requeueJob,
} from "./delivery-outbox-repository";
import { processDeliveryOutbox, reconcileOutbox } from "./submission-delivery";
import { FakeDeliveryProvider } from "./delivery-provider";

let tmpDir = "";

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "raspechatka-outbox-"));
  process.env.PRINTLAB_DATA_DIR = tmpDir;
});

afterEach(async () => {
  delete process.env.PRINTLAB_DATA_DIR;
  await rm(tmpDir, { recursive: true, force: true });
});

function makeInput(kind: "lead" | "order" = "lead", extra: Record<string, unknown> = {}) {
  return {
    kind,
    name: "Тест",
    contact: { method: "phone" as const, value: "+7 900 000-00-00" },
    personalDataConsent: true as const,
    consentAcceptedAt: new Date().toISOString(),
    ...extra,
  };
}

async function makeSubmission(kind: "lead" | "order" = "lead") {
  return createSubmission(makeInput(kind));
}

// ── 1. Fast HTTP response ────────────────────────────────────────────────────

describe("enqueueDeliveryJob", () => {
  it("enqueues a job and returns immediately without calling Telegram", async () => {
    const sub = await makeSubmission();
    const start = Date.now();
    const job = await enqueueDeliveryJob(sub.id, false);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(200); // no network call
    expect(job.submissionId).toBe(sub.id);
    expect(job.status).toBe("pending");
    expect(job.attempts).toBe(0);
    expect(job.message.status).toBe("pending");
    expect(job.archive.required).toBe(false);
  });
});

// ── 2. Idempotency ───────────────────────────────────────────────────────────

describe("idempotency", () => {
  it("findSubmissionByIdempotencyKey returns existing submission", async () => {
    const key = "550e8400-e29b-41d4-a716-446655440000";
    const sub = await createSubmission({
      kind: "lead",
      name: "Анна",
      contact: { method: "phone", value: "+7 900 111-00-00" },
      personalDataConsent: true,
      consentAcceptedAt: new Date().toISOString(),
      idempotencyKey: key,
    });

    const { findSubmissionByIdempotencyKey } = await import("./submission-repository");
    const found = await findSubmissionByIdempotencyKey(key);
    expect(found?.id).toBe(sub.id);
    expect(found?.reference).toBe(sub.reference);
  });

  it("returns null for unknown idempotency key", async () => {
    const { findSubmissionByIdempotencyKey } = await import("./submission-repository");
    const found = await findSubmissionByIdempotencyKey("no-such-key");
    expect(found).toBeNull();
  });
});

// ── 3. Successful delivery via FakeProvider ──────────────────────────────────

describe("processDeliveryOutbox — success path", () => {
  it("delivers all steps and marks job + submission delivered", async () => {
    const sub = await makeSubmission();
    await enqueueDeliveryJob(sub.id, false); // no archive

    const provider = new FakeDeliveryProvider();
    const processed = await processDeliveryOutbox({ provider });

    expect(processed).toBe(1);

    const job = await getJobBySubmissionId(sub.id);
    expect(job?.status).toBe("delivered");
    expect(job?.message.status).toBe("delivered");
  });

  it("returns 0 when queue is empty", async () => {
    const provider = new FakeDeliveryProvider();
    expect(await processDeliveryOutbox({ provider })).toBe(0);
  });
});

// ── 4. Partial failure — message OK, archive fails then retries ──────────────

describe("processDeliveryOutbox — partial archive failure", () => {
  it("marks message delivered and archive failed; does not re-send message on retry", async () => {
    const sub = await makeSubmission();
    await enqueueDeliveryJob(sub.id, true); // archive required

    // First run: message succeeds, archive fails
    const firstProvider = new FakeDeliveryProvider({ failStep: "archive" });
    await processDeliveryOutbox({ provider: firstProvider });

    const afterFirst = await getJobBySubmissionId(sub.id);
    expect(afterFirst?.message.status).toBe("delivered");
    expect(afterFirst?.archive.status).toBe("failed");
    expect(afterFirst?.status).toBe("failed");
    expect(afterFirst?.attempts).toBe(1);

    // Requeue so nextAttemptAt is now
    await requeueJob(afterFirst!.id);

    // Second run: archive succeeds; message step skipped (already delivered)
    let messageCalls = 0;
    const retryProvider = new FakeDeliveryProvider();
    const origSendMessage = retryProvider.sendMessage.bind(retryProvider);
    retryProvider.sendMessage = async () => {
      messageCalls++;
      return origSendMessage();
    };

    await processDeliveryOutbox({ provider: retryProvider });

    const afterRetry = await getJobBySubmissionId(sub.id);
    expect(afterRetry?.status).toBe("delivered");
    expect(afterRetry?.archive.status).toBe("delivered");
    expect(messageCalls).toBe(0); // message was not re-sent
  });
});

// ── 5. Message failure and backoff ───────────────────────────────────────────

describe("processDeliveryOutbox — message failure", () => {
  it("records error, increments attempts, and sets future nextAttemptAt", async () => {
    const sub = await makeSubmission();
    await enqueueDeliveryJob(sub.id, false);

    const failingProvider = new FakeDeliveryProvider({ failStep: "message" });
    await processDeliveryOutbox({ provider: failingProvider });

    const job = await getJobBySubmissionId(sub.id);
    expect(job?.status).toBe("failed");
    expect(job?.attempts).toBe(1);
    expect(job?.message.status).toBe("failed");
    expect(new Date(job!.nextAttemptAt).getTime()).toBeGreaterThan(Date.now());
  });
});

// ── 6. Lease prevents double-processing ──────────────────────────────────────

describe("claimNextJob — lease", () => {
  it("does not claim the same job twice while lease is active", async () => {
    const sub = await makeSubmission();
    await enqueueDeliveryJob(sub.id, false);

    const first = await claimNextJob();
    expect(first).not.toBeNull();

    const second = await claimNextJob();
    expect(second).toBeNull(); // lease is active
  });
});

// ── 7. requeueJob resets undelivered steps ───────────────────────────────────

describe("requeueJob", () => {
  it("resets status to pending and clears lease", async () => {
    const sub = await makeSubmission();
    await enqueueDeliveryJob(sub.id, true);

    const failingProvider = new FakeDeliveryProvider({ failStep: "archive" });
    await processDeliveryOutbox({ provider: failingProvider });

    const failed = await getJobBySubmissionId(sub.id);
    expect(failed?.status).toBe("failed");

    const requeued = await requeueJob(failed!.id);
    expect(requeued?.status).toBe("pending");
    expect(requeued?.leaseUntil).toBeUndefined();
    expect(requeued?.message.status).toBe("delivered"); // already done — preserved
    expect(requeued?.archive.status).toBe("pending");   // reset
  });
});

// ── 8. Backward compat — submission without outbox job ───────────────────────

describe("backward compatibility", () => {
  it("updateSubmissionDelivery still works independently of outbox", async () => {
    const sub = await makeSubmission();
    const updated = await updateSubmissionDelivery(sub.id, "delivered");
    expect(updated.status).toBe("delivered");
    expect(updated.attempts).toBe(1);

    // No outbox job was created — listOutboxJobs should be empty
    expect(await listOutboxJobs()).toHaveLength(0);
  });
});

// ── 9. Admin requeueJob creates outbox job for legacy submissions ─────────────

describe("admin retry — legacy submission", () => {
  it("enqueues a new job if none exists yet", async () => {
    const sub = await makeSubmission();
    // No enqueueDeliveryJob called — simulating a pre-outbox submission

    // Simulate admin retry logic: enqueue if missing
    let job = await getJobBySubmissionId(sub.id);
    if (!job) {
      job = await enqueueDeliveryJob(sub.id, false);
    }

    expect(job.submissionId).toBe(sub.id);
    expect(job.status).toBe("pending");
  });
});

// ── 10. Speed proof — HTTP enqueue is fast; slow provider adds latency ────────

describe("speed proof", () => {
  it("enqueue < 50ms; 3s+3s archive provider takes > 6s", async () => {
    const sub = await makeSubmission();

    const start = Date.now();
    await enqueueDeliveryJob(sub.id, true); // archive required: 2 steps
    const enqueueMs = Date.now() - start;
    expect(enqueueMs).toBeLessThan(50);

    const providerStart = Date.now();
    const slowProvider = new FakeDeliveryProvider({ delayMs: 3_000 }); // 3s per step
    await processDeliveryOutbox({ provider: slowProvider });
    const processMs = Date.now() - providerStart;

    console.table({
      "enqueueDeliveryJob (ms)": enqueueMs,
      "processDeliveryOutbox 3s+3s (ms)": processMs,
    });

    expect(processMs).toBeGreaterThan(6_000); // message + archive = at least 6s
  }, 15_000);
});

// ── 11. Batch limit ───────────────────────────────────────────────────────────

describe("processDeliveryOutbox — batch limit", () => {
  it("processes exactly `limit` jobs per call, leaving the rest pending", async () => {
    for (let i = 0; i < 25; i++) {
      const sub = await makeSubmission();
      await enqueueDeliveryJob(sub.id, false);
    }

    const processed = await processDeliveryOutbox({ provider: new FakeDeliveryProvider(), limit: 10 });
    expect(processed).toBe(10);

    const remaining = (await listOutboxJobs()).filter((j) => j.status === "pending");
    expect(remaining).toHaveLength(15);
  }, 10_000);
});

// ── 12. createOrGetSubmission — parallel idempotency ─────────────────────────

describe("createOrGetSubmission — parallel idempotency", () => {
  it("10 concurrent calls with same key produce exactly 1 submission and 1 reference", async () => {
    const key = randomUUID();
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        createOrGetSubmission(makeInput("lead", { idempotencyKey: key })),
      ),
    );

    const createdCount = results.filter((r) => r.created).length;
    expect(createdCount).toBe(1);

    const ids = new Set(results.map((r) => r.submission.id));
    expect(ids.size).toBe(1); // all callers got the same submission

    const refs = new Set(results.map((r) => r.submission.reference));
    expect(refs.size).toBe(1); // same reference

    const allSubs = await listSubmissions();
    expect(allSubs.filter((s) => s.idempotencyKey === key)).toHaveLength(1);
  });
});

// ── 13. enqueueDeliveryJob — parallel idempotency ────────────────────────────

describe("enqueueDeliveryJob — parallel idempotency", () => {
  it("10 concurrent calls with same submissionId create exactly 1 outbox job", async () => {
    const sub = await makeSubmission();
    const jobs = await Promise.all(
      Array.from({ length: 10 }, () => enqueueDeliveryJob(sub.id, false)),
    );

    const ids = new Set(jobs.map((j) => j.id));
    expect(ids.size).toBe(1); // all return the same job

    expect(await listOutboxJobs()).toHaveLength(1);
  });
});

// ── 14. reconcileOutbox ───────────────────────────────────────────────────────

describe("reconcileOutbox", () => {
  it("creates jobs for undelivered submissions that have no outbox job", async () => {
    await makeSubmission();
    await makeSubmission();

    const created = await reconcileOutbox();
    expect(created).toBe(2);
    expect(await listOutboxJobs()).toHaveLength(2);
  });

  it("second call creates 0 new jobs (idempotent)", async () => {
    await makeSubmission();
    await reconcileOutbox();
    const created2 = await reconcileOutbox();
    expect(created2).toBe(0);
  });

  it("skips submissions already marked delivered", async () => {
    const sub = await makeSubmission();
    await updateSubmissionDelivery(sub.id, "delivered");
    const created = await reconcileOutbox();
    expect(created).toBe(0);
    expect(await listOutboxJobs()).toHaveLength(0);
  });
});

// ── 14b. reconcileOutbox — legacy safety (pre-outbox submissions) ────────────

describe("reconcileOutbox — legacy safety", () => {
  it("does NOT create a job for a legacy delivered submission (status=delivered, no outbox job)", async () => {
    const sub = await makeSubmission();
    // Simulate old synchronous delivery: submission marked delivered without going through outbox
    await updateSubmissionDelivery(sub.id, "delivered");
    expect(await listOutboxJobs()).toHaveLength(0); // no outbox job exists

    const created = await reconcileOutbox();
    expect(created).toBe(0);
    expect(await listOutboxJobs()).toHaveLength(0);
  });

  it("creates a job for a legacy failed submission (status=failed, no outbox job)", async () => {
    const sub = await makeSubmission();
    // Simulate old synchronous delivery attempt that failed: no outbox job
    await updateSubmissionDelivery(sub.id, "failed", "network error");
    expect(await listOutboxJobs()).toHaveLength(0);

    const created = await reconcileOutbox();
    expect(created).toBe(1);
    const job = await getJobBySubmissionId(sub.id);
    expect(job).not.toBeNull();
    expect(job?.status).toBe("pending");
  });

  it("does NOT create additional jobs for a submission that already has an outbox job", async () => {
    const sub = await makeSubmission();
    await enqueueDeliveryJob(sub.id, false); // job already exists
    expect(await listOutboxJobs()).toHaveLength(1);

    const created = await reconcileOutbox();
    expect(created).toBe(0);
    expect(await listOutboxJobs()).toHaveLength(1); // still exactly 1 job
  });
});

// ── 15. Crash-gap recovery via idempotency retry ──────────────────────────────

describe("crash-gap: submission exists but outbox job is missing", () => {
  it("always calling enqueueDeliveryJob (idempotent) after createOrGetSubmission covers the gap", async () => {
    const key = randomUUID();

    // First request: createOrGetSubmission succeeds; imagine crash before enqueueDeliveryJob
    const { submission } = await createOrGetSubmission(makeInput("lead", { idempotencyKey: key }));
    expect(await getJobBySubmissionId(submission.id)).toBeNull(); // no job yet

    // Retry request: same key → returns existing submission (created = false)
    const { submission: s2, created } = await createOrGetSubmission(
      makeInput("lead", { idempotencyKey: key }),
    );
    expect(created).toBe(false);
    expect(s2.id).toBe(submission.id);

    // API always calls enqueueDeliveryJob (idempotent) — fills the crash-gap
    await enqueueDeliveryJob(s2.id, false);
    expect(await getJobBySubmissionId(s2.id)).not.toBeNull();
  });
});

// ── 16. Parallel processDeliveryOutbox — one-job lease exclusion ──────────────

describe("processDeliveryOutbox — parallel lease exclusion", () => {
  it("two concurrent calls process at most 1 job (sendMessage called exactly once)", async () => {
    const sub = await makeSubmission();
    await enqueueDeliveryJob(sub.id, false);

    let callCount = 0;
    const provider = new FakeDeliveryProvider();
    const origSend = provider.sendMessage.bind(provider);
    provider.sendMessage = async () => {
      callCount++;
      return origSend();
    };

    const [r1, r2] = await Promise.all([
      processDeliveryOutbox({ provider, limit: 1 }),
      processDeliveryOutbox({ provider, limit: 1 }),
    ]);

    expect(r1 + r2).toBe(1); // total jobs processed across both calls
    expect(callCount).toBe(1); // sendMessage called exactly once
  });
});

// ── 17. Expired lease — crash-recovery re-claim ───────────────────────────────

describe("claimNextJob — expired lease re-claim (crash recovery)", () => {
  it("re-claims a processing job after its lease is manually expired", async () => {
    const sub = await makeSubmission();
    await enqueueDeliveryJob(sub.id, false);

    // Claim the job (status → processing, leaseUntil = now + 60s)
    const claimed = await claimNextJob();
    expect(claimed).not.toBeNull();

    // Second claim fails while lease is active
    expect(await claimNextJob()).toBeNull();

    // Simulate crash: manually expire the lease by writing to the outbox file
    const outboxPath = path.join(tmpDir, "delivery-outbox.json");
    const rawJobs = JSON.parse(await readFile(outboxPath, "utf8")) as Array<{
      leaseUntil?: string;
    }>;
    rawJobs[0].leaseUntil = new Date(Date.now() - 1_000).toISOString(); // expired 1s ago
    await writeFile(outboxPath, JSON.stringify(rawJobs));

    // Claim should now succeed (processing + expired lease → re-claimable)
    const reclaimed = await claimNextJob();
    expect(reclaimed).not.toBeNull();
    expect(reclaimed?.submissionId).toBe(sub.id);
  });
});
