/**
 * Data backend feature flag for «Распечатка».
 *
 * DATA_BACKEND=json     — JSON file storage (default, current production)
 * DATA_BACKEND=postgres — PostgreSQL via Prisma (Этап 4C+)
 *
 * JSON остаётся active до явного переключения в env.
 * Production не переключается автоматически.
 */

export type DataBackend = "json" | "postgres";

const VALID_BACKENDS = new Set<DataBackend>(["json", "postgres"]);

let _resolved: DataBackend | null = null;

export function getDataBackend(): DataBackend {
  if (_resolved !== null) return _resolved;

  const raw = (process.env.DATA_BACKEND ?? "json").trim().toLowerCase();

  if (!VALID_BACKENDS.has(raw as DataBackend)) {
    throw new Error(
      `[storage-config] Unknown DATA_BACKEND="${raw}". ` +
        `Valid values: ${[...VALID_BACKENDS].join(", ")}. ` +
        `Defaulting to "json" is intentional; set DATA_BACKEND=json explicitly if needed.`,
    );
  }

  _resolved = raw as DataBackend;
  return _resolved;
}

export function isJsonBackend(): boolean {
  return getDataBackend() === "json";
}

export function isPostgresBackend(): boolean {
  return getDataBackend() === "postgres";
}

/** Reset cached value. Only for use in tests. */
export function _resetDataBackendForTesting(): void {
  _resolved = null;
}
