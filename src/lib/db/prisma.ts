/**
 * Prisma 7 singleton client for «Распечатка».
 *
 * Активен только при DATA_BACKEND=postgres. При DATA_BACKEND=json (default)
 * этот модуль импортируется, но клиент НЕ инициализируется и БД не трогается.
 *
 * Hot-reload безопасность: в dev-режиме клиент сохраняется в globalThis
 * чтобы Next.js не создавал новый экземпляр при каждом HMR.
 */

import "server-only";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

type GlobalWithPrisma = typeof globalThis & {
  _prismaClient?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "[Prisma] DATABASE_URL is not set. " +
        "Set DATA_BACKEND=json to use JSON storage (default), " +
        "or provide DATABASE_URL to use PostgreSQL.",
    );
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  const g = globalThis as GlobalWithPrisma;
  if (!g._prismaClient) {
    g._prismaClient = createPrismaClient();
  }
  return g._prismaClient;
}

/** Lazily-initialized Prisma client. Throws if DATABASE_URL is not set. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrismaClient() as unknown as Record<string | symbol, unknown>)[
      prop
    ];
  },
});
