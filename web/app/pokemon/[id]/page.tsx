import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "../../../lib/db";

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

  // Its legal abilities, through the POKEMON_ABILITY link table (R2).
  const abilities = await sql`
    SELECT a.ability_id, a.name, pa.ability_slot
    FROM pokemon_ability pa
    JOIN ability a ON a.ability_id = pa.ability_id
    WHERE pa.pokemon_id = ${pokemonId}
    ORDER BY pa.ability_slot
  `;

  // How many teams it is on. R6 means it can be on a team only once.
  const teams = await sql`
    SELECT COUNT(*) AS total
    FROM party_member
    WHERE pokemon_id = ${pokemonId}
  `;

  return (
    <>
      <p>
        <Link href="/">Back to Pokédex</Link>
      </p>
      <h1>{p.name}</h1>
      <p>
        Pokédex #{p.dex_number}
        <br />
        Type: {p.type1}
        {p.type2 && " / " + p.type2}
        <br />
        On {teams[0].total} team(s)
      </p>

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
              <td>{a.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
