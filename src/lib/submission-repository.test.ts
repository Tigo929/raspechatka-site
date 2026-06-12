import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSubmission, listSubmissions, updateSubmissionDelivery } from "./submission-repository";

let temporaryDirectory = "";

beforeEach(async () => {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "raspechatka-orders-"));
  vi.stubEnv("PRINTLAB_DATA_DIR", temporaryDirectory);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(temporaryDirectory, { recursive: true, force: true });
});

describe("submission repository", () => {
  it("saves a lead before delivery and assigns a reference", async () => {
    const item = await createSubmission({
      kind: "lead",
      name: "Анна",
      contact: { method: "phone", value: "+7 900 000-00-00" },
      personalDataConsent: true,
      consentAcceptedAt: new Date().toISOString(),
    });

    expect(item.status).toBe("pending");
    expect(item.reference).toMatch(/^RP-\d{8}-[A-F0-9]{6}$/);
    expect(await listSubmissions()).toHaveLength(1);
  });

  it("keeps uploaded files and delivery status", async () => {
    const item = await createSubmission({
      kind: "order",
      name: "Иван",
      contact: { method: "telegram", value: "ivan_test" },
      orderDetails: { color: "Белая", size: "M" },
      personalDataConsent: true,
      imageRightsConsent: true,
      consentAcceptedAt: new Date().toISOString(),
    }, [{ key: "frontImage", originalName: "print.png", mimeType: "image/png", buffer: Buffer.from("image") }]);

    const file = item.files[0];
    expect(await readFile(path.join(temporaryDirectory, file.storedPath), "utf8")).toBe("image");
    const delivered = await updateSubmissionDelivery(item.id, "delivered");
    expect(delivered.status).toBe("delivered");
    expect(delivered.attempts).toBe(1);
    expect(delivered.deliveredAt).toBeTruthy();
  });
});
