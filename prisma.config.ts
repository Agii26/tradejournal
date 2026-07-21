import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prisma CLI (migrate/studio/introspect) uses the direct connection.
  // The running app uses DATABASE_URL (pooled) via @prisma/adapter-neon — see src/lib/prisma.ts.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
