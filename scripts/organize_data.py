"""Turn the raw PokeAPI CSVs in Imported_Data/ into files that match our schema.

Which Pokemon are kept:
  * Generation 1-9: the default form of every species #1 (Bulbasaur) to
    #1025 (Pecharunt).
  * Alternate forms count as the same Pokemon, so only the default form is
    kept (e.g. deoxys-normal, not deoxys-attack). Mega Evolutions, Gigantamax,
    totem, and costume forms are left out.
  * Regional variants (Alolan, Galarian, Hisuian, Paldean) are separate
    Pokemon: each gets its own row, with its own pokemon_id and the same
    dex_number as the original. If a variant has several forms itself
    (Galarian Darmanitan, Paldean Tauros), only its first form is kept.

Types and abilities are each Pokemon's current ones from PokeAPI. A Pokemon
has up to three abilities: slots 1-2 are regular, slot 3 is hidden.

Output (in Organized_Data/, Unix line endings, empty field = NULL):
  POKEMON.csv          pokemon_id, dex_number, name, type1, type2
  ABILITY.csv          ability_id, name (each ability listed once)
  POKEMON_ABILITY.csv  pokemon_id, ability_id, ability_slot

Usage:  python scripts/organize_data.py [Imported_Data] [Organized_Data]
"""
import csv
import sys
from pathlib import Path

LAST_DEX_NUMBER = 1025  # Pecharunt, the last Generation 9 Pokemon
REGIONS = ("alola", "galar", "hisui", "paldea")
# Non-default forms whose names mention a region but are not regional variants.
NOT_REGIONAL = ("totem", "cap", "mega", "gmax")
TYPES = {"normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
         "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark",
         "steel", "fairy"}


def read(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write(path, header, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(header)
        w.writerows(rows)


def region_of(name):
    """Return the region a variant's name belongs to, or None."""
    parts = name.split("-")
    if any(p in NOT_REGIONAL for p in parts):
        return None
    return next((r for r in REGIONS if r in parts), None)


def main(data_dir, out_dir):
    data = Path(data_dir)
    out = Path(out_dir)
    out.mkdir(exist_ok=True)

    type_names = {r["id"]: r["identifier"] for r in read(data / "types.csv")}
    ability_names = {r["id"]: r["identifier"] for r in read(data / "abilities.csv")}

    # pokemon_id -> {slot: type name}
    types = {}
    for r in read(data / "pokemon_types.csv"):
        types.setdefault(r["pokemon_id"], {})[r["slot"]] = type_names[r["type_id"]]

    # Pick the rows to keep.
    kept = []           # (pokemon_id, dex_number, name)
    seen_variants = set()  # (dex_number, region): keep only the first form of a variant
    for p in sorted(read(data / "pokemon.csv"), key=lambda r: int(r["id"])):
        dex = int(p["species_id"])
        if dex > LAST_DEX_NUMBER:
            continue
        if p["is_default"] == "1":
            kept.append((int(p["id"]), dex, p["identifier"]))
            continue
        region = region_of(p["identifier"])
        if region and (dex, region) not in seen_variants:
            seen_variants.add((dex, region))
            kept.append((int(p["id"]), dex, p["identifier"]))

    pokemon_rows = []
    for pid, dex, name in kept:
        t = types.get(str(pid), {})
        pokemon_rows.append([pid, dex, name, t.get("1"), t.get("2", "")])

    ids = {row[0] for row in pokemon_rows}
    ability_rows = sorted(
        (int(r["pokemon_id"]), int(r["ability_id"]), int(r["slot"]))
        for r in read(data / "pokemon_abilities.csv")
        if int(r["pokemon_id"]) in ids
    )

    # Each ability once (only the ones our Pokemon use), with PokeAPI's id.
    used = {aid for _, aid, _ in ability_rows}
    ability_list = sorted((aid, ability_names[str(aid)]) for aid in used)

    # Sanity checks against our constraints.
    assert all(r[3] in TYPES for r in pokemon_rows), "type1 must be one of the 18 types"
    assert all(r[4] in TYPES or r[4] == "" for r in pokemon_rows), "type2 must be a type or NULL"
    assert all(r[3] != r[4] for r in pokemon_rows), "type1 must differ from type2"
    assert len({r[2] for r in pokemon_rows}) == len(pokemon_rows), "Pokemon names must be unique"
    assert len({name for _, name in ability_list}) == len(ability_list), "ability names must be unique"
    assert all(1 <= slot <= 3 for _, _, slot in ability_rows), "ability_slot must be 1-3"
    assert len({(p, a) for p, a, _ in ability_rows}) == len(ability_rows), "PK (pokemon_id, ability_id)"
    assert len({(p, s) for p, _, s in ability_rows}) == len(ability_rows), "UNIQUE (pokemon_id, ability_slot)"
    assert ids == {p for p, _, _ in ability_rows}, "every Pokemon needs at least one ability"

    write(out / "POKEMON.csv", ["pokemon_id", "dex_number", "name", "type1", "type2"], pokemon_rows)
    write(out / "ABILITY.csv", ["ability_id", "name"], ability_list)
    write(out / "POKEMON_ABILITY.csv", ["pokemon_id", "ability_id", "ability_slot"], ability_rows)

    originals = sum(1 for r in pokemon_rows if r[0] == r[1])
    print(f"POKEMON.csv:         {len(pokemon_rows)} rows "
          f"({originals} species + {len(pokemon_rows) - originals} regional variants)")
    for region in REGIONS:
        print(f"  {region:<7} {sum(1 for _, r in seen_variants if r == region)}")
    print(f"ABILITY.csv:         {len(ability_list)} rows")
    print(f"POKEMON_ABILITY.csv: {len(ability_rows)} rows")
    print(f"single-type Pokemon: {sum(1 for r in pokemon_rows if r[4] == '')}")
    per = {}
    for p, _, _ in ability_rows:
        per[p] = per.get(p, 0) + 1
    for n in (1, 2, 3):
        print(f"Pokemon with {n} abilit{'y' if n == 1 else 'ies'}: {sum(1 for v in per.values() if v == n)}")


if __name__ == "__main__":
    args = sys.argv[1:] + ["Imported_Data", "Organized_Data"][len(sys.argv) - 1:]
    main(args[0], args[1])
