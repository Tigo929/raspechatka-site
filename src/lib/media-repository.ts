import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const versionsFile = path.join(dataDir, "media-versions.json");

async function safeWrite(file: string, data: unknown) {
  await mkdir(dataDir, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tmp, file);
}

export async function getMediaVersions(): Promise<Record<string, number>> {
  try {
    const raw = JSON.parse(await readFile(versionsFile, "utf8")) as unknown;
    if (raw && typeof raw === "object") return raw as Record<string, number>;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
  return {};
}

export async function bumpMediaVersion(relativePath: string): Promise<number> {
  const versions = await getMediaVersions();
  const ts = Date.now();
  versions[relativePath] = ts;
  await safeWrite(versionsFile, versions);
  return ts;
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
