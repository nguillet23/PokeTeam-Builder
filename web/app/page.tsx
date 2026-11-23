import Link from "next/link";
import { sql } from "../lib/db";

export default async function Pokedex({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; type?: string }>;
}) {
  // The form puts ?name=...&type=... in the URL.
  const { name = "", type = "" } = await searchParams;

  // Every type that appears in the table, for the dropdown.
  const types = await sql`
    SELECT DISTINCT type1 AS type
    FROM pokemon
    ORDER BY type1
  `;

  // An empty type means "any type".
  const pokemon = await sql`
    SELECT pokemon_id, dex_number, name, type1, type2
    FROM pokemon
    WHERE name ILIKE ${"%" + name + "%"}
      AND (${type} = '' OR type1 = ${type} OR type2 = ${type})
    ORDER BY dex_number, pokemon_id
  `;

  return (
    <>
      <h1>Pokédex</h1>

      <form method="get">
        <input name="name" placeholder="Name" defaultValue={name} />{" "}
        <select name="type" defaultValue={type}>
          <option value="">Any type</option>
          {types.map((t) => (
            <option key={t.type} value={t.type}>
              {t.type}
            </option>
          ))}
        </select>{" "}
        <button>Search</button> <a href="/">Clear</a>
      </form>

      <p>{pokemon.length} Pokémon</p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Type 1</th>
            <th>Type 2</th>
          </tr>
        </thead>
        <tbody>
          {pokemon.map((p) => (
            <tr key={p.pokemon_id}>
              <td>{p.dex_number}</td>
              <td>
                <Link href={`/pokemon/${p.pokemon_id}`}>{p.name}</Link>
              </td>
              <td>{p.type1}</td>
              <td>{p.type2}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
