import { readFile } from "node:fs/promises";
import path from "node:path";
import { unstable_cache, revalidateTag } from "next/cache";
import { getDataDirectory, writeJsonAtomic } from "@/lib/data-storage";

const dataDir = getDataDirectory();
const versionsFile = path.join(dataDir, "media-versions.json");
let mutationQueue: Promise<void> = Promise.resolve();

async function readMediaVersions(): Promise<Record<string, number>> {
  try {
    const raw = JSON.parse(await readFile(versionsFile, "utf8")) as unknown;
    if (raw && typeof raw === "object") return raw as Record<string, number>;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  return {};
}

export const getMediaVersions = unstable_cache(readMediaVersions, ["media-versions"], {
  tags: ["public-content"],
  revalidate: false,
});

export async function bumpMediaVersion(relativePath: string): Promise<number> {
  let result = 0;
  const operation = mutationQueue.then(async () => {
    const versions = await readMediaVersions();
    result = Date.now();
    versions[relativePath] = result;
    await writeJsonAtomic(versionsFile, versions);
    revalidateTag("public-content", "max");
  });
  mutationQueue = operation.then(() => undefined, () => undefined);
  await operation;
  return result;
}

/** Returns the public URL with a cache-busting version query param if available. */
export async function getVersionedUrl(relativePath: string): Promise<string> {
  const base = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const versions = await getMediaVersions();
  const key = relativePath.replace(/^\//, "");
  const v = versions[key];
  return v ? `${base}?v=${v}` : base;
}

/** Synchronous version for client-side use when versions are pre-fetched. */
export function applyVersion(url: string, versions: Record<string, number>): string {
  const [base] = url.split("?");
  const key = base.replace(/^\//, "");
  const v = versions[key];
  return v ? `${base}?v=${v}` : url;
}
