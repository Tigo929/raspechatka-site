// Prisma 7 configuration file.
// Provides datasource URL for migrate commands.
// See: https://pris.ly/d/config-datasource

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "",
    // Prisma 7 datasource config supports only `url` and `shadowDatabaseUrl`.
    // directUrl (PgBouncer bypass) is not available in this config type;
    // when needed (Этап 4C+), pass the direct connection string via DATABASE_URL
    // in the migration environment and use the pooled URL at runtime via the adapter.
  },
});
