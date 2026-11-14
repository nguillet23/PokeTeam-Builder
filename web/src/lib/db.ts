import "server-only";
import postgres from "postgres";

// One shared connection pool for the whole server.
// DATABASE_URL is the Supabase session-pooler string from web/.env.local
// (and later, from Vercel's environment variables). It never reaches the browser.
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy web/.env.example to web/.env.local and fill it in.");
}

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

// Reuse the pool across hot reloads in development.
export const sql =
  globalForDb.sql ??
  postgres(url, {
    ssl: "require",
    max: 5,
    prepare: false, // safe with Supabase's poolers
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
