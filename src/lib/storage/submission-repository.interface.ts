/**
 * Repository interface for Submission storage.
 *
 * Текущая реализация: src/lib/submission-repository.ts (JSON).
 * Будущая реализация: src/lib/storage/postgres/submission-repository.postgres.ts (Этап 4C).
 *
 * Switching: getDataBackend() === "postgres" → use Postgres impl.
 */

import type {
  StoredSubmission,
  SubmissionFile,
} from "@/types";

export interface CreateSubmissionInput {
  kind: "lead" | "order";
  name: string;
  contact: { method: "telegram" | "max" | "phone"; value: string };
  comment?: string;
  orderDetails?: Record<string, unknown>;
  personalDataConsent: true;
  imageRightsConsent?: boolean;
  idempotencyKey?: string;
}

export interface SubmissionFileInput {
  key: string;
  originalName: string;
  storedPath: string;
  mimeType: string;
  size: number;
}

export interface ISubmissionRepository {
  listSubmissions(): Promise<StoredSubmission[]>;
  getSubmission(id: string): Promise<StoredSubmission | null>;
  createSubmission(
    input: CreateSubmissionInput,
    files?: SubmissionFileInput[],
  ): Promise<StoredSubmission>;
  createOrGetSubmission(
    input: CreateSubmissionInput,
    files?: SubmissionFileInput[],
  ): Promise<{ submission: StoredSubmission; created: boolean }>;
  updateSubmissionDelivery(
    id: string,
    status: "delivered" | "failed",
    errorMessage?: string,
  ): Promise<StoredSubmission>;
  updateSubmissionProcessing(
    id: string,
    processingStatus: string,
  ): Promise<StoredSubmission>;
  getSubmissionFile(
    submissionId: string,
    fileKey: string,
  ): Promise<{ absolutePath: string; file: SubmissionFile } | null>;
}
