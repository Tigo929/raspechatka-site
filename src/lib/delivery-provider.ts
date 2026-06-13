import type { StoredSubmission } from "@/types";
import { sendTelegramTextMessage, sendTelegramZipArchive } from "@/lib/submission-delivery";

export interface SubmissionDeliveryProvider {
  sendMessage(submission: StoredSubmission): Promise<void>;
  sendArchive(submission: StoredSubmission): Promise<void>;
}

export class TelegramDeliveryProvider implements SubmissionDeliveryProvider {
  async sendMessage(submission: StoredSubmission): Promise<void> {
    await sendTelegramTextMessage(submission);
  }
  async sendArchive(submission: StoredSubmission): Promise<void> {
    await sendTelegramZipArchive(submission);
  }
}

export class FakeDeliveryProvider implements SubmissionDeliveryProvider {
  private readonly delayMs: number;
  private readonly failStep: "message" | "archive" | null;

  constructor(opts: { delayMs?: number; failStep?: "message" | "archive" } = {}) {
    this.delayMs = opts.delayMs ?? 0;
    this.failStep = opts.failStep ?? null;
  }

  async sendMessage(): Promise<void> {
    if (this.delayMs > 0) await sleep(this.delayMs);
    if (this.failStep === "message") throw new Error("FakeDeliveryProvider: message step forced failure");
  }

  async sendArchive(): Promise<void> {
    if (this.delayMs > 0) await sleep(this.delayMs);
    if (this.failStep === "archive") throw new Error("FakeDeliveryProvider: archive step forced failure");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
