import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalyticsSummary } from "./analytics-repository";

let temporaryDirectory = "";

beforeEach(async () => {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "raspechatka-analytics-"));
  vi.stubEnv("PRINTLAB_DATA_DIR", temporaryDirectory);
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://raspechatka.example");
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(temporaryDirectory, { recursive: true, force: true });
});

describe("analytics summary", () => {
  it("works on the server and excludes own-domain referrers", async () => {
    const now = new Date().toISOString();
    await writeFile(path.join(temporaryDirectory, "analytics.json"), JSON.stringify([
      { id: "1", type: "pageview", page: "/", sessionId: "a", device: "desktop", referrer: "https://raspechatka.example/catalog", timestamp: now },
      { id: "2", type: "pageview", page: "/catalog", sessionId: "b", device: "mobile", referrer: "https://yandex.ru/search", timestamp: now },
    ]));

    const summary = await getAnalyticsSummary();
    expect(summary.totalPageviews).toBe(2);
    expect(summary.topReferrers).toEqual([{ referrer: "yandex.ru", count: 1 }]);
  });
});
