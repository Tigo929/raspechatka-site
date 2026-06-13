import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { getDataDirectory, readJsonFile, writeJsonAtomic } from "@/lib/data-storage";
import type {
  ProcessingStatus,
  StoredSubmission,
  SubmissionContact,
  SubmissionFile,
  SubmissionStatus,
} from "@/types";

export interface SubmissionFileInput {
  key: SubmissionFile["key"];
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface CreateSubmissionInput {
  kind: StoredSubmission["kind"];
  name: string;
  contact: SubmissionContact;
  comment?: string;
  orderDetails?: Record<string, unknown>;
  personalDataConsent: true;
  imageRightsConsent?: boolean;
  consentAcceptedAt: string;
  /** Client-generated UUID for deduplication. Server rejects duplicates. */
  idempotencyKey?: string;
}

let mutationQueue: Promise<void> = Promise.resolve();

function ordersFile() {
  return path.join(getDataDirectory(), "orders.json");
}

function safeExtension(name: string, mimeType: string) {
  const byMime: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  return byMime[mimeType] ?? path.extname(name).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 8);
}

function makeReference(date = new Date()) {
  const day = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `RP-${day}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

async function readAllUnsafe(): Promise<StoredSubmission[]> {
  const items = await readJsonFile<unknown>(ordersFile(), []);
  return Array.isArray(items) ? (items as StoredSubmission[]) : [];
}

async function mutate<T>(operation: (items: StoredSubmission[]) => Promise<T>) {
  let result!: T;
  const run = mutationQueue.then(async () => {
    result = await operation(await readAllUnsafe());
  });
  mutationQueue = run.then(() => undefined, () => undefined);
  await run;
  return result;
}

export async function listSubmissions(): Promise<StoredSubmission[]> {
  return (await readAllUnsafe()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSubmission(id: string): Promise<StoredSubmission | null> {
  return (await readAllUnsafe()).find((item) => item.id === id) ?? null;
}

export async function findSubmissionByIdempotencyKey(
  key: string,
): Promise<StoredSubmission | null> {
  return (await readAllUnsafe()).find((item) => item.idempotencyKey === key) ?? null;
}

export async function createSubmission(
  input: CreateSubmissionInput,
  fileInputs: SubmissionFileInput[] = [],
): Promise<StoredSubmission> {
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const relativeDirectory = path.join("order-files", id);
  const absoluteDirectory = path.join(getDataDirectory(), relativeDirectory);
  const files: SubmissionFile[] = [];

  try {
    if (fileInputs.length > 0) await mkdir(absoluteDirectory, { recursive: true });
    for (const file of fileInputs) {
      const storedName = `${file.key}${safeExtension(file.originalName, file.mimeType) || ".bin"}`;
      await writeFile(path.join(absoluteDirectory, storedName), file.buffer, { flag: "wx" });
      files.push({
        key: file.key,
        originalName: file.originalName,
        storedPath: path.join(relativeDirectory, storedName).replaceAll("\\", "/"),
        mimeType: file.mimeType,
        size: file.buffer.byteLength,
      });
    }

    const submission: StoredSubmission = {
      id,
      reference: makeReference(),
      idempotencyKey: input.idempotencyKey,
      kind: input.kind,
      status: "pending",
      processingStatus: "new",
      name: input.name,
      contact: input.contact,
      comment: input.comment,
      orderDetails: input.orderDetails,
      personalDataConsent: input.personalDataConsent,
      imageRightsConsent: input.imageRightsConsent,
      consentAcceptedAt: input.consentAcceptedAt,
      files,
      attempts: 0,
      createdAt,
      updatedAt: createdAt,
    };

    await mutate(async (items) => {
      await writeJsonAtomic(ordersFile(), [...items, submission]);
    });
    return submission;
  } catch (error) {
    await rm(absoluteDirectory, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }
}

/**
 * Atomically finds an existing submission by idempotency key or creates a new one.
 * Files are written speculatively before acquiring the mutation lock; cleaned up if duplicate found.
 */
export async function createOrGetSubmission(
  input: CreateSubmissionInput,
  fileInputs: SubmissionFileInput[] = [],
): Promise<{ submission: StoredSubmission; created: boolean }> {
  if (!input.idempotencyKey) {
    const submission = await createSubmission(input, fileInputs);
    return { submission, created: true };
  }

  const key = input.idempotencyKey;
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const relativeDirectory = path.join("order-files", id);
  const absoluteDirectory = path.join(getDataDirectory(), relativeDirectory);
  const files: SubmissionFile[] = [];

  // Speculatively write files outside the mutation lock (slow I/O, may be discarded)
  try {
    if (fileInputs.length > 0) await mkdir(absoluteDirectory, { recursive: true });
    for (const file of fileInputs) {
      const storedName = `${file.key}${safeExtension(file.originalName, file.mimeType) || ".bin"}`;
      await writeFile(path.join(absoluteDirectory, storedName), file.buffer, { flag: "wx" });
      files.push({
        key: file.key,
        originalName: file.originalName,
        storedPath: path.join(relativeDirectory, storedName).replaceAll("\\", "/"),
        mimeType: file.mimeType,
        size: file.buffer.byteLength,
      });
    }
  } catch (error) {
    await rm(absoluteDirectory, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }

  let created = true;
  let result!: StoredSubmission;

  try {
    result = await mutate(async (items) => {
      const existing = items.find((s) => s.idempotencyKey === key);
      if (existing) {
        created = false;
        return existing;
      }
      const submission: StoredSubmission = {
        id,
        reference: makeReference(),
        idempotencyKey: key,
        kind: input.kind,
        status: "pending",
        processingStatus: "new",
        name: input.name,
        contact: input.contact,
        comment: input.comment,
        orderDetails: input.orderDetails,
        personalDataConsent: input.personalDataConsent,
        imageRightsConsent: input.imageRightsConsent,
        consentAcceptedAt: input.consentAcceptedAt,
        files,
        attempts: 0,
        createdAt,
        updatedAt: createdAt,
      };
      await writeJsonAtomic(ordersFile(), [...items, submission]);
      return submission;
    });
  } catch (error) {
    if (fileInputs.length > 0) {
      await rm(absoluteDirectory, { recursive: true, force: true }).catch(() => undefined);
    }
    throw error;
  }

  if (!created && fileInputs.length > 0) {
    await rm(absoluteDirectory, { recursive: true, force: true }).catch(() => undefined);
  }

  return { submission: result, created };
}

export async function updateSubmissionDelivery(
  id: string,
  status: SubmissionStatus,
  error?: string,
): Promise<StoredSubmission> {
  return mutate(async (items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("not_found");
    const now = new Date().toISOString();
    const updated: StoredSubmission = {
      ...items[index],
      status,
      attempts: items[index].attempts + 1,
      updatedAt: now,
      deliveredAt: status === "delivered" ? now : items[index].deliveredAt,
      lastError: status === "delivered" ? undefined : error?.slice(0, 500),
    };
    const next = [...items];
    next[index] = updated;
    await writeJsonAtomic(ordersFile(), next);
    return updated;
  });
}

export async function updateSubmissionProcessing(
  id: string,
  processingStatus: ProcessingStatus,
): Promise<StoredSubmission> {
  return mutate(async (items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("not_found");
    const updated: StoredSubmission = {
      ...items[index],
      processingStatus,
      updatedAt: new Date().toISOString(),
    };
    const next = [...items];
    next[index] = updated;
    await writeJsonAtomic(ordersFile(), next);
    return updated;
  });
}

export async function readSubmissionFile(file: SubmissionFile): Promise<Buffer> {
  const absolutePath = path.resolve(getDataDirectory(), file.storedPath);
  const root = `${path.resolve(getDataDirectory())}${path.sep}`;
  if (!absolutePath.startsWith(root)) throw new Error("invalid_file_path");
  return readFile(absolutePath);
}
