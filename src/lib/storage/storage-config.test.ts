import { afterEach, describe, expect, it } from "vitest";
import {
  _resetDataBackendForTesting,
  getDataBackend,
  isJsonBackend,
  isPostgresBackend,
} from "./storage-config";

describe("storage-config / getDataBackend", () => {
  afterEach(() => {
    _resetDataBackendForTesting();
    delete process.env.DATA_BACKEND;
  });

  it("defaults to json when DATA_BACKEND is not set", () => {
    delete process.env.DATA_BACKEND;
    expect(getDataBackend()).toBe("json");
  });

  it("returns json when DATA_BACKEND=json", () => {
    process.env.DATA_BACKEND = "json";
    expect(getDataBackend()).toBe("json");
  });

  it("returns postgres when DATA_BACKEND=postgres", () => {
    process.env.DATA_BACKEND = "postgres";
    expect(getDataBackend()).toBe("postgres");
  });

  it("throws on invalid DATA_BACKEND value", () => {
    process.env.DATA_BACKEND = "mysql";
    expect(() => getDataBackend()).toThrow(/Unknown DATA_BACKEND/);
  });

  it("isJsonBackend returns true for default", () => {
    delete process.env.DATA_BACKEND;
    expect(isJsonBackend()).toBe(true);
    expect(isPostgresBackend()).toBe(false);
  });

  it("isPostgresBackend returns true when postgres", () => {
    process.env.DATA_BACKEND = "postgres";
    expect(isPostgresBackend()).toBe(true);
    expect(isJsonBackend()).toBe(false);
  });
});
