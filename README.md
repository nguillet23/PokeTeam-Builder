# PokéTeam Builder

CSC 4480 final project: a PostgreSQL database (hosted on Supabase) of every Pokémon (Gen 1–9) with their types and abilities, where each trainer saves one team of up to six. Keys and CHECK constraints reject illegal teams (a 7th Pokémon, duplicates, or an ability the Pokémon can't have).

## Layout

| Folder | Contents |
|---|---|
| `Designs/` | ER diagram and relational schema (SVG) |
| `Imported_Data/` | Raw CSVs from [PokeAPI](https://github.com/PokeAPI/pokeapi) |
| `scripts/` | `organize_data.py`: turns the raw CSVs into load-ready files |
| `Organized_Data/` | `POKEMON.csv`, `ABILITY.csv`, `POKEMON_ABILITY.csv` |
| `db/` | PostgreSQL: create tables, load reference data from the CSVs, Row Level Security |

## Setup

1. (Optional) Rebuild the data: `python scripts/organize_data.py`
2. In the Supabase dashboard's **SQL Editor**, run `db/01_create_tables.sql` (safe to re-run; it drops and recreates the tables).
3. From a terminal in the project folder, connect with [psql](https://www.postgresql.org/download/) using the Supabase connection string (dashboard → **Connect** → Session pooler URI), then run `\i db/02_reference_data.sql`. It `\copy`s the CSVs in `Organized_Data/` into the tables (expect 1,080 Pokémon, 293 abilities, 2,548 Pokémon–ability rows).

   ```
   psql "postgresql://postgres.<project-ref>:<password>@<host>:5432/postgres"
   \i db/02_reference_data.sql
   ```
4. Run `db/03_row_level_security.sql` (SQL Editor, or `psql ... -f db/03_row_level_security.sql`). It turns on Row Level Security so the public API can only read POKEMON, ABILITY and POKEMON_ABILITY; TRAINER and PARTY_MEMBER are hidden from it. Re-run it whenever you re-run step 2. The SQL Editor and psql still have full access.
