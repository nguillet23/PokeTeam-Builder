-- ===========================================================================
-- PokéTeam Builder, step 3 of 3: Row Level Security (RLS) for Supabase
-- ===========================================================================
-- Supabase exposes every table in the public schema through its web API to
-- anyone who has the project URL and publishable (anon) key. With RLS on, the
-- API can only do what a policy below allows:
--
--   POKEMON, ABILITY, POKEMON_ABILITY : anyone can read; nobody can change them
--   TRAINER, PARTY_MEMBER             : no API access at all
--
-- The SQL Editor and psql connect as the postgres role, which bypasses RLS,
-- so the team keeps full read/write access there.
--
-- Run order:
--   1. 01_create_tables.sql       create the tables
--   2. 02_reference_data.sql      load POKEMON, ABILITY, POKEMON_ABILITY from the CSVs
--   3. 03_row_level_security.sql  (this file)
--
-- How to run: Supabase SQL Editor, or psql (see README.md).
-- Re-running:  safe. 01 removes these settings, so run this again after 01.

-- ---------------------------------------------------------------------------
-- Turn RLS on for every table (no policy = no access through the API)
-- ---------------------------------------------------------------------------
ALTER TABLE POKEMON         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ABILITY         ENABLE ROW LEVEL SECURITY;
ALTER TABLE POKEMON_ABILITY ENABLE ROW LEVEL SECURITY;
ALTER TABLE TRAINER         ENABLE ROW LEVEL SECURITY;
ALTER TABLE PARTY_MEMBER    ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Reference data: read-only for everyone through the API
-- (no INSERT/UPDATE/DELETE policies, so those are all rejected)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS pokemon_read_only ON POKEMON;
CREATE POLICY pokemon_read_only ON POKEMON
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS ability_read_only ON ABILITY;
CREATE POLICY ability_read_only ON ABILITY
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS pokemon_ability_read_only ON POKEMON_ABILITY;
CREATE POLICY pokemon_ability_read_only ON POKEMON_ABILITY
    FOR SELECT TO anon, authenticated
    USING (true);

-- ---------------------------------------------------------------------------
-- User data: TRAINER and PARTY_MEMBER intentionally have no policies, so the
-- API can't read or change them. Add policies here if an app needs access.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Checks
-- ---------------------------------------------------------------------------

-- Every table should show rls_on = true.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_on
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('pokemon', 'ability', 'pokemon_ability', 'trainer', 'party_member')
ORDER BY c.relname;

-- Expected: three SELECT policies (ability, pokemon, pokemon_ability).
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
