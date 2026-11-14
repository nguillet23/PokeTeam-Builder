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
2. Run the three scripts in `db/` in order, from a terminal in the project folder, with [psql](https://www.postgresql.org/download/). Get the host and user from the Supabase dashboard (**Connect** → **Direct** → **Session pooler**):

   ```powershell
   $env:PGPASSWORD = '<database password>'
   psql -h <pooler-host> -p 5432 -U postgres.<project-ref> -d postgres `
        -f db/01_create_tables.sql -f db/02_reference_data.sql -f db/03_row_level_security.sql
   ```

   | Script | What it does | Where it can run |
   |---|---|---|
   | `01_create_tables.sql` | Drops and recreates the five tables | SQL Editor or psql |
   | `02_reference_data.sql` | `\copy`s the CSVs in `Organized_Data/` (expect 1,080 Pokémon, 293 abilities, 2,548 Pokémon–ability rows) | psql only |
   | `03_row_level_security.sql` | Turns on Row Level Security: the public API can only read POKEMON, ABILITY and POKEMON_ABILITY; TRAINER and PARTY_MEMBER are hidden | SQL Editor or psql |

   Re-running 01 wipes the data and RLS settings, so always run 02 and 03 after it. The SQL Editor and psql keep full access either way. Passing the password through `PGPASSWORD` avoids having to URL-encode characters like `#` in a connection string.
