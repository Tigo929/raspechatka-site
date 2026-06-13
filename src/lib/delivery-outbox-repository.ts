import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDataDirectory, writeJsonAtomic } from "@/lib/data-storage";
import type { DeliveryOutboxJob, DeliveryStepState } from "@/types";

function outboxFile() {
  return path.join(getDataDirectory(), "delivery-outbox.json");
}

// In-process serialization queue — same pattern as submission-repository.
// Prevents concurrent writes to the single JSON file within one Node process.
let outboxMutationQueue: Promise<void> = Promise.resolve();

function mutateOutbox<T>(operation: (jobs: DeliveryOutboxJob[]) => Promise<T>): Promise<T> {
  let result!: T;
  const run = outboxMutationQueue.then(async () => {
    result = await operation(await readOutboxJobs());
  });
  outboxMutationQueue = run.then(() => undefined, () => undefined);
  return run.then(() => result);
}

async function readOutboxJobs(): Promise<DeliveryOutboxJob[]> {
  try {
    const raw = await readFile(outboxFile(), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as DeliveryOutboxJob[]) : [];
  } catch {
    return [];
  }
}

/** Exponential backoff delays in ms: 1m → 5m → 15m → 30m cap. */
function backoffMs(attempts: number): number {
  const steps = [60_000, 300_000, 900_000, 1_800_000];
  return steps[Math.min(attempts, steps.length - 1)];
}

/**
 * Idempotent: if a job already exists for this submissionId, returns it.
 * Prevents duplicate jobs when called twice (e.g. API retry + after() race).
 */
export function enqueueDeliveryJob(
  submissionId: string,
  archiveRequired: boolean,
): Promise<DeliveryOutboxJob> {
  return mutateOutbox(async (jobs) => {
    const existing = jobs.find((j) => j.submissionId === submissionId);
    if (existing) return existing;

    const now = new Date().toISOString();
    const job: DeliveryOutboxJob = {
      id: randomUUID(),
      submissionId,
      status: "pending",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
      nextAttemptAt: now,
      message: { status: "pending" },
      archive: { required: archiveRequired, status: "pending" },
    };
    await writeJsonAtomic(outboxFile(), [...jobs, job]);
    return job;
  });
}

/**
 * Atomically claims the next eligible job.
 * Eligible: not delivered, AND lease is inactive, AND nextAttemptAt <= now.
 * Handles crash recovery: a "processing" job whose lease has expired is re-claimable.
 */
export function claimNextJob(): Promise<DeliveryOutboxJob | null> {
  return mutateOutbox(async (jobs) => {
    const now = new Date();
    const job = jobs.find((j) => {
      if (j.status === "delivered") return false;
      const leaseActive = Boolean(j.leaseUntil) && new Date(j.leaseUntil!) > now;
      const attemptReady = new Date(j.nextAttemptAt) <= now;
      return !leaseActive && attemptReady;
    });
    if (!job) return null;
    job.status = "processing";
    job.leaseUntil = new Date(Date.now() + 60_000).toISOString();
    job.updatedAt = now.toISOString();
    await writeJsonAtomic(outboxFile(), jobs);
    return { ...job };
  });
}

export function saveJobMessageDelivered(jobId: string): Promise<void> {
  return mutateOutbox(async (jobs) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const now = new Date().toISOString();
    job.message.status = "delivered";
    job.message.deliveredAt = now;
    job.updatedAt = now;
    if (!job.archive.required || job.archive.status === "delivered") {
      job.status = "delivered";
      job.leaseUntil = undefined;
    }
    await writeJsonAtomic(outboxFile(), jobs);
  });
}

export function saveJobArchiveDelivered(jobId: string): Promise<void> {
  return mutateOutbox(async (jobs) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const now = new Date().toISOString();
    job.archive.status = "delivered";
    job.archive.deliveredAt = now;
    job.updatedAt = now;
    if (job.message.status === "delivered") {
      job.status = "delivered";
      job.leaseUntil = undefined;
    }
    await writeJsonAtomic(outboxFile(), jobs);
  });
}

export function failJobStep(
  jobId: string,
  step: "message" | "archive",
  error: string,
): Promise<void> {
  return mutateOutbox(async (jobs) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const now = new Date().toISOString();
    (job[step] as { status: DeliveryStepState; lastError?: string }).status = "failed";
    (job[step] as { status: DeliveryStepState; lastError?: string }).lastError =
      error.slice(0, 500);
    job.attempts += 1;
    job.lastError = error.slice(0, 500);
    job.status = "failed";
    job.leaseUntil = undefined;
    job.nextAttemptAt = new Date(Date.now() + backoffMs(job.attempts)).toISOString();
    job.updatedAt = now;
    await writeJsonAtomic(outboxFile(), jobs);
  });
}

/** Resets undelivered steps back to pending so the cron can retry immediately. */
export function requeueJob(jobId: string): Promise<DeliveryOutboxJob | null> {
  return mutateOutbox(async (jobs) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return null;
    const now = new Date().toISOString();
    if (job.message.status !== "delivered") job.message.status = "pending";
    if (job.archive.required && job.archive.status !== "delivered")
      job.archive.status = "pending";
    job.status = "pending";
    job.leaseUntil = undefined;
    job.nextAttemptAt = now;
    job.updatedAt = now;
    await writeJsonAtomic(outboxFile(), jobs);
    return { ...job };
  });
}

export function getJobBySubmissionId(submissionId: string): Promise<DeliveryOutboxJob | null> {
  return readOutboxJobs().then(
    (jobs) => jobs.find((j) => j.submissionId === submissionId) ?? null,
  );
}

export function listOutboxJobs(): Promise<DeliveryOutboxJob[]> {
  return readOutboxJobs();
}
