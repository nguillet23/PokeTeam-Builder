import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "../../../lib/db";
import { formatAbilityName, formatPokemonName } from "../../../lib/display-names";

type PokeApiAbility = {
  effect_entries: {
    effect: string;
    language: { name: string };
  }[];
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
  }[];
};

export default async function AbilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const abilityId = Number(id);
  if (!Number.isInteger(abilityId)) notFound();

  const rows = await sql`
    SELECT ability_id, name
    FROM ability
    WHERE ability_id = ${abilityId}
  `;
  if (rows.length === 0) notFound();
  const ability = rows[0];

  const [response, pokemon] = await Promise.all([
    fetch(`https://pokeapi.co/api/v2/ability/${abilityId}/`, {
      next: { revalidate: 86400 },
    }),
    sql`
      SELECT p.pokemon_id, p.dex_number, p.name, pa.ability_slot
      FROM pokemon_ability pa
      JOIN pokemon p ON p.pokemon_id = pa.pokemon_id
      WHERE pa.ability_id = ${abilityId}
      ORDER BY p.dex_number, p.pokemon_id
    `,
  ]);
  if (!response.ok) {
    throw new Error(`PokeAPI request failed for ability ${abilityId}: ${response.status}`);
  }

  const data = (await response.json()) as PokeApiAbility;
  const description =
    data.effect_entries.find((entry) => entry.language.name === "en")?.effect ??
    data.flavor_text_entries
      .find((entry) => entry.language.name === "en")
      ?.flavor_text.replace(/[\n\f\r]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() ??
    "No English description is available from PokeAPI.";

  return (
    <>
      <p>
        <Link href="/">Back to Pokédex</Link>
      </p>
      <h1>{formatAbilityName(ability.name)}</h1>
      <h2>Description</h2>
      <p className="ability-description">{description}</p>
      <h2>Pokémon with this ability</h2>
      <p>{pokemon.length} Pokémon can have this ability.</p>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Pokémon</th>
            <th>Slot</th>
          </tr>
        </thead>
        <tbody>
          {pokemon.map((p) => (
            <tr key={p.pokemon_id}>
              <td>{p.dex_number}</td>
              <td>
                <Link href={`/pokemon/${p.pokemon_id}`}>{formatPokemonName(p.name)}</Link>
              </td>
              <td>{p.ability_slot === 3 ? "hidden" : p.ability_slot}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
