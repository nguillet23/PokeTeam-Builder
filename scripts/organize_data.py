"""Turn the raw PokeAPI CSVs in Imported_Data/ into files that match our schema.

Only Generation 1-2 Pokemon (#1-251) are kept, with the abilities they had
in Generation 3 (abilities did not exist before then).

Output (in Organized_Data/):
  POKEMON.csv          pokemon_id, name, type1, type2 (type2 = NULL if single-type)
  POKEMON_ABILITY.csv  pokemon_id, ability_id
  ABILITY.csv          ability_id, name (each ability listed once)

Usage:  python scripts/organize_data.py [Imported_Data] [Organized_Data]
"""
import csv
import sys
from pathlib import Path

# Generation 1-2 only: Pokemon #1 (Bulbasaur) to #251 (Celebi).
# Alternate forms (ids 10001+) are left out.
LAST_POKEMON_ID = 251

# Abilities were introduced in Generation 3, so we use each Pokemon's
# Gen 3 abilities. Hidden abilities (slot 3) came later, in Gen 5.
ABILITY_GEN = 3
HIDDEN_SLOT = "3"


def read(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write(path, header, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


def main(data_dir, out_dir):
    data = Path(data_dir)
    out = Path(out_dir)
    out.mkdir(exist_ok=True)

    type_names = {r["id"]: r["identifier"] for r in read(data / "types.csv")}
    abilities = read(data / "abilities.csv")
    ability_names = {r["id"]: r["identifier"] for r in abilities}
    ability_gen = {r["id"]: int(r["generation_id"]) for r in abilities}

    # pokemon_id -> {slot: type name}
    types = {}
    for r in read(data / "pokemon_types.csv"):
        types.setdefault(r["pokemon_id"], {})[r["slot"]] = type_names[r["type_id"]]

    pokemon_rows = []
    for p in read(data / "pokemon.csv"):
        if int(p["id"]) > LAST_POKEMON_ID:
            continue
        t = types.get(p["id"], {})
        pokemon_rows.append([int(p["id"]), p["identifier"], t.get("1"), t.get("2", "NULL")])
    pokemon_rows.sort()

    # Abilities as they were in Generation 3, the first games with abilities.
    # Start from today's abilities, then undo later changes using
    # pokemon_abilities_past.csv (a row there means "up to generation X,
    # this slot held this ability"; an empty ability_id means the slot was empty).
    slots = {}  # (pokemon_id, slot) -> ability_id
    for r in read(data / "pokemon_abilities.csv"):
        if int(r["pokemon_id"]) <= LAST_POKEMON_ID:
            slots[(r["pokemon_id"], r["slot"])] = r["ability_id"]
    past = {}  # (pokemon_id, slot) -> earliest (generation, ability_id) at or after ABILITY_GEN
    for r in read(data / "pokemon_abilities_past.csv"):
        gen = int(r["generation_id"])
        if int(r["pokemon_id"]) <= LAST_POKEMON_ID and gen >= ABILITY_GEN:
            key = (r["pokemon_id"], r["slot"])
            if key not in past or gen < past[key][0]:
                past[key] = (gen, r["ability_id"])
    for key, (_, ability_id) in past.items():
        slots[key] = ability_id

    ability_rows = sorted({
        (int(pid), int(aid))
        for (pid, slot), aid in slots.items()
        if aid and slot != HIDDEN_SLOT and ability_gen[aid] <= ABILITY_GEN
    })

    # Sanity checks against our constraints
    ids = {row[0] for row in pokemon_rows}
    assert all(row[2] for row in pokemon_rows), "every Pokemon needs type1"
    assert all(row[2] != row[3] for row in pokemon_rows), "type1 must differ from type2"
    assert len({row[1] for row in pokemon_rows}) == len(pokemon_rows), "names must be unique"
    assert all(pid in ids for pid, _ in ability_rows), "ability row for unknown Pokemon"
    no_ability = ids - {pid for pid, _ in ability_rows}

    # Each ability once (only the ones our Pokemon use), with PokeAPI's id
    used = {aid for _, aid in ability_rows}
    ability_list = sorted((aid, ability_names[str(aid)]) for aid in used)
    assert len({name for _, name in ability_list}) == len(ability_list), "ability names must be unique"

    write(out / "POKEMON.csv", ["pokemon_id", "name", "type1", "type2"], pokemon_rows)
    write(out / "ABILITY.csv", ["ability_id", "name"], ability_list)
    write(out / "POKEMON_ABILITY.csv", ["pokemon_id", "ability_id"], ability_rows)

    print(f"ABILITY.csv:         {len(ability_list)} rows")

    print(f"POKEMON.csv:         {len(pokemon_rows)} rows")
    print(f"POKEMON_ABILITY.csv: {len(ability_rows)} rows")
    print(f"single-type Pokemon: {sum(1 for r in pokemon_rows if r[3] == "NULL")}")
    print(f"Pokemon with no ability: {len(no_ability)} {sorted(no_ability)[:10]}")


if __name__ == "__main__":
    args = sys.argv[1:] + ["Imported_Data", "Organized_Data"][len(sys.argv) - 1:]
    main(args[0], args[1])
