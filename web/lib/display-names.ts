const pokemonNameOverrides: Record<string, string> = {
  "chi-yu": "Chi-Yu",
  "chien-pao": "Chien-Pao",
  farfetchd: "Farfetch'd",
  flabebe: "Flabébé",
  "hakamo-o": "Hakamo-o",
  "ho-oh": "Ho-Oh",
  "jangmo-o": "Jangmo-o",
  "mime-jr": "Mime Jr.",
  "mr-mime": "Mr. Mime",
  "mr-rime": "Mr. Rime",
  "nidoran-f": "Nidoran♀",
  "nidoran-m": "Nidoran♂",
  "porygon-z": "Porygon-Z",
  sirfetchd: "Sirfetch'd",
  "ting-lu": "Ting-Lu",
  "type-null": "Type: Null",
  "wo-chien": "Wo-Chien",
};

const abilityNameOverrides: Record<string, string> = {
  "mind-s-eye": "Mind's Eye",
  "self-destruct": "Self-Destruct",
};

const regionalForms: Record<string, string> = {
  alola: "Alolan",
  galar: "Galarian",
  hisui: "Hisuian",
  paldea: "Paldean",
};

function capitalizeWords(name: string) {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatPokemonName(name: string) {
  const override = pokemonNameOverrides[name];
  if (override) return override;

  const separator = name.lastIndexOf("-");
  const region = regionalForms[name.slice(separator + 1)];
  if (separator > 0 && region) {
    const baseName = name.slice(0, separator);
    return `${region} ${pokemonNameOverrides[baseName] ?? capitalizeWords(baseName)}`;
  }

  return capitalizeWords(name);
}

export function formatAbilityName(name: string) {
  return abilityNameOverrides[name] ?? capitalizeWords(name);
}

export function formatTypeName(name: string) {
  return capitalizeWords(name);
}

export function normalizeNameForSearch(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
