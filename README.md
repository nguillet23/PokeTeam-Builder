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
2. In SQL Developer on csdb, run with **Run Script (F5)**, in order:
   1. `db/01_create_tables.sql` (safe to re-run)
   2. `db/02_reference_data.sql` (expect 1,080 Pokémon, 293 abilities, 2,548 Pokémon–ability rows)
