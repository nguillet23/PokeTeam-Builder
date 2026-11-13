-- PokéTeam Builder: reference data (Gen 1-9 Pokémon, their abilities, and
-- which Pokémon can have which ability), loaded straight from the CSVs in
-- Organized_Data/. Run after 01_create_tables.sql.
--
-- This script uses psql's \copy command, which reads a CSV on YOUR computer
-- and sends it to the Supabase server (no server-side file access needed).
-- It must be run with psql, not the Supabase SQL Editor:
--
--   1. Open a terminal in the project folder (the one holding Organized_Data/).
--   2. psql "<Supabase connection string>"
--      (Supabase dashboard -> Connect -> Session pooler URI)
--   3. \i db/02_reference_data.sql
--
-- Each CSV's header row matches the table's column names. An empty field
-- (type2 for single-type Pokémon) loads as NULL.
--
-- Stop at the first error, and load everything in one transaction so a
-- failure leaves the tables empty instead of half-loaded.
\set ON_ERROR_STOP on
BEGIN;

-- Parents first (POKEMON, ABILITY), then the linking table, so the foreign
-- keys in POKEMON_ABILITY are satisfied.

-- POKEMON (pokemon_id, dex_number, name, type1, type2): 1,080 rows
\copy POKEMON (pokemon_id, dex_number, name, type1, type2) FROM 'Organized_Data/POKEMON.csv' WITH (FORMAT csv, HEADER true)

-- ABILITY (ability_id, name): 293 rows
\copy ABILITY (ability_id, name) FROM 'Organized_Data/ABILITY.csv' WITH (FORMAT csv, HEADER true)

-- POKEMON_ABILITY (pokemon_id, ability_id, ability_slot): 2,548 rows
\copy POKEMON_ABILITY (pokemon_id, ability_id, ability_slot) FROM 'Organized_Data/POKEMON_ABILITY.csv' WITH (FORMAT csv, HEADER true)

COMMIT;

-- Check the load. Expected: POKEMON 1080, ABILITY 293, POKEMON_ABILITY 2548.
SELECT 'POKEMON' AS table_name, COUNT(*) AS row_count FROM POKEMON
UNION ALL
SELECT 'ABILITY', COUNT(*) FROM ABILITY
UNION ALL
SELECT 'POKEMON_ABILITY', COUNT(*) FROM POKEMON_ABILITY;

-- R2 check: every Pokémon has at least one ability, and every ability belongs
-- to at least one Pokémon. Both queries should return 0.
SELECT COUNT(*) AS pokemon_without_ability
FROM POKEMON p
WHERE NOT EXISTS (SELECT 1 FROM POKEMON_ABILITY pa WHERE pa.pokemon_id = p.pokemon_id);

SELECT COUNT(*) AS unused_abilities
FROM ABILITY a
WHERE NOT EXISTS (SELECT 1 FROM POKEMON_ABILITY pa WHERE pa.ability_id = a.ability_id);
