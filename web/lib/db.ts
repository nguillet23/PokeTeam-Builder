import postgres from "postgres";

// One shared connection to the Supabase database.
// DATABASE_URL comes from .env.local (see .env.example).
export const sql = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  max: 5,
  idle_timeout: 20, // close unused connections after 20 seconds
});
