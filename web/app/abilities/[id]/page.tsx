import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "../../../lib/db";

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

  // Every Pokémon that can have this ability (POKEMON_ABILITY, the other way).
  const pokemon = await sql`
    SELECT p.pokemon_id, p.dex_number, p.name, pa.ability_slot
    FROM pokemon_ability pa
    JOIN pokemon p ON p.pokemon_id = pa.pokemon_id
    WHERE pa.ability_id = ${abilityId}
    ORDER BY p.dex_number, p.pokemon_id
  `;

  return (
    <>
      <p>
        <Link href="/">Back to Pokédex</Link>
      </p>
      <h1>{ability.name}</h1>
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
                <Link href={`/pokemon/${p.pokemon_id}`}>{p.name}</Link>
              </td>
              <td>{p.ability_slot === 3 ? "hidden" : p.ability_slot}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
