# PokéTeam Builder

CSC 4480 final project: an Oracle database of every Pokémon (Gen 1–9) with their types and abilities, where each trainer saves one team of up to six. Keys and CHECK constraints reject illegal teams (a 7th Pokémon, duplicates, or an ability the Pokémon can't have).

## Layout

| Folder | Contents |
|---|---|
| `Designs/` | ER diagram and relational schema (SVG) |
| `Imported_Data/` | Raw CSVs from [PokeAPI](https://github.com/PokeAPI/pokeapi) |
| `scripts/` | `organize_data.py`: turns the raw CSVs into load-ready files |
| `Organized_Data/` | `POKEMON.csv`, `ABILITY.csv`, `POKEMON_ABILITY.csv` |
| `db/` | Oracle SQL: create tables, load reference data |

## Setup

1. (Optional) Rebuild the data: `python scripts/organize_data.py`
2. In SQL Developer on csdb, run `db/01_create_tables.sql` with **Run Script (F5)** (safe to re-run).
3. In [SQLcl](https://www.oracle.com/sqlcl/), opened from the project folder, run `@db/02_reference_data.sql`. It loads the CSVs in `Organized_Data/` (expect 1,080 Pokémon, 293 abilities, 2,548 Pokémon–ability rows).
