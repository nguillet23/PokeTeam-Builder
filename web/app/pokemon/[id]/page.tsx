import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "../../../lib/db";
import {
  formatAbilityName,
  formatPokemonName,
  formatTypeName,
} from "../../../lib/display-names";
import PokemonSprite from "./PokemonSprite";

type PokemonSpeciesResponse = {
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }[];
};

const preferredFlavorTextVersions = ["legends-za", "scarlet", "sword"];
const gameTitleOverrides: Record<string, string> = {
  "legends-arceus": "Pokémon Legends: Arceus",
  "legends-za": "Pokémon Legends: Z-A",
  scarlet: "Pokémon Scarlet",
  sword: "Pokémon Sword",
};

function formatGameTitle(version: string) {
  return (
    gameTitleOverrides[version] ??
    `Pokémon ${version
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")}`
  );
}

export default async function PokemonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pokemonId = Number(id);
  if (!Number.isInteger(pokemonId)) notFound();

  const rows = await sql`
    SELECT pokemon_id, dex_number, name, type1, type2
    FROM pokemon
    WHERE pokemon_id = ${pokemonId}
  `;
  if (rows.length === 0) notFound();
  const p = rows[0];

  const [abilities, trainers, speciesResponse] = await Promise.all([
    sql`
      SELECT a.ability_id, a.name, pa.ability_slot
      FROM pokemon_ability pa
      JOIN ability a ON a.ability_id = pa.ability_id
      WHERE pa.pokemon_id = ${pokemonId}
      ORDER BY pa.ability_slot
    `,
    sql`
      SELECT t.trainer_id, t.name
      FROM party_member pm
      JOIN trainer t ON t.trainer_id = pm.trainer_id
      WHERE pm.pokemon_id = ${pokemonId}
      ORDER BY t.name
    `,
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${p.dex_number}/`, {
      next: { revalidate: 86400 },
    }),
  ]);
  if (!speciesResponse.ok) {
    throw new Error(
      `PokeAPI request failed for Pokémon species ${p.dex_number}: ${speciesResponse.status}`,
    );
  }

  const species = (await speciesResponse.json()) as PokemonSpeciesResponse;
  const englishEntries = species.flavor_text_entries.filter(
    (entry) => entry.language.name === "en",
  );
  const preferredEntry = preferredFlavorTextVersions
    .map((version) => englishEntries.find((entry) => entry.version.name === version))
    .find((entry) => entry !== undefined);
  const flavorTextEntry =
    preferredEntry ?? englishEntries[englishEntries.length - 1];
  const flavorText = flavorTextEntry?.flavor_text
    .replace(/[\n\f\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const pokemonName = formatPokemonName(p.name);

  return (
    <>
      <p>
        <Link href="/">Back to Pokédex</Link>
      </p>
      <h1>{pokemonName}</h1>
      <PokemonSprite key={p.pokemon_id} pokemonId={p.pokemon_id} name={pokemonName} />
      <p>
        Pokédex #{p.dex_number}
        <br />
        Type: {formatTypeName(p.type1)}
        {p.type2 && " / " + formatTypeName(p.type2)}
      </p>

      <h2>Trainers with this Pokémon</h2>
      {trainers.length > 0 ? (
        <ul className="trainer-list">
          {trainers.map((trainer) => (
            <li key={trainer.trainer_id}>
              <Link href={`/trainers/${encodeURIComponent(trainer.name)}`}>
                {trainer.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>Not currently on any trainer&apos;s team.</p>
      )}

      <h2>Pokédex Entry</h2>
      {flavorTextEntry && flavorText ? (
        <>
          <blockquote className="pokemon-flavor-text">{flavorText}</blockquote>
          <p className="pokemon-flavor-source">
            From {formatGameTitle(flavorTextEntry.version.name)}
          </p>
        </>
      ) : (
        <p>No English flavor text is available from PokeAPI.</p>
      )}

      <h2>Abilities</h2>
      <table>
        <thead>
          <tr>
            <th>Slot</th>
            <th>Ability</th>
          </tr>
        </thead>
        <tbody>
          {abilities.map((a) => (
            <tr key={a.ability_id}>
              <td>{a.ability_slot === 3 ? "hidden" : a.ability_slot}</td>
              <td>
                <Link href={`/abilities/${a.ability_id}`}>{formatAbilityName(a.name)}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
