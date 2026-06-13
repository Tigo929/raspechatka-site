/**
 * Repository interface for DeliveryOutboxJob storage.
 *
 * Текущая реализация: src/lib/delivery-outbox-repository.ts (JSON).
 * Будущая реализация: src/lib/storage/postgres/outbox-repository.postgres.ts (Этап 4C).
 */

import type { DeliveryOutboxJob } from "@/types";

export interface IOutboxRepository {
  listOutboxJobs(): Promise<DeliveryOutboxJob[]>;
  getJobBySubmissionId(submissionId: string): Promise<DeliveryOutboxJob | null>;
  enqueueDeliveryJob(
    submissionId: string,
    hasFile: boolean,
  ): Promise<DeliveryOutboxJob>;
  claimNextJob(): Promise<DeliveryOutboxJob | null>;
  markJobDelivered(
    jobId: string,
    step: "message" | "archive",
  ): Promise<DeliveryOutboxJob>;
  markJobFailed(
    jobId: string,
    step: "message" | "archive",
    error: string,
  ): Promise<DeliveryOutboxJob>;
  requeueJob(jobId: string): Promise<DeliveryOutboxJob>;
}
