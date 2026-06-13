import { describe, expect, it } from "vitest";
import { validateCronSecret } from "./cron-secret";

describe("validateCronSecret", () => {
  it("returns not_configured when configured is undefined", () => {
    expect(validateCronSecret("any-value", undefined)).toBe("not_configured");
  });

  it("returns not_configured when configured is empty string", () => {
    expect(validateCronSecret("any-value", "")).toBe("not_configured");
  });

  it("returns invalid for wrong length — no exception thrown", () => {
    expect(validateCronSecret("short", "a-much-longer-secret")).toBe("invalid");
  });

  it("returns invalid for same length but wrong value", () => {
    const configured = "abcdefghijklmnop"; // 16 chars
    const wrong      = "wrongwrongwrongw"; // 16 chars, different value
    expect(validateCronSecret(wrong, configured)).toBe("invalid");
  });

  it("returns ok for correct value", () => {
    const secret = "correct-secret-32-chars-long-xyzw";
    expect(validateCronSecret(secret, secret)).toBe("ok");
  });
});
