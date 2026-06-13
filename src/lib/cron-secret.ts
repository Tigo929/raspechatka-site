import { timingSafeEqual } from "node:crypto";

export type CronSecretResult = "ok" | "not_configured" | "invalid";

export function validateCronSecret(
  provided: string,
  configured: string | undefined,
): CronSecretResult {
  if (!configured) return "not_configured";
  const secretBytes = Buffer.from(configured, "utf8");
  const providedBytes = Buffer.from(provided, "utf8");
  if (secretBytes.length !== providedBytes.length) return "invalid";
  return timingSafeEqual(secretBytes, providedBytes) ? "ok" : "invalid";
}
