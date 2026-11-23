import { sql } from "../lib/db";

export default async function Pokedex() {
  // Regional variants share a dex number, so pokemon_id breaks the tie.
  const pokemon = await sql`
    SELECT pokemon_id, dex_number, name, type1, type2
    FROM pokemon
    ORDER BY dex_number, pokemon_id
  `;

  return (
    <>
      <h1>Pokédex</h1>
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
              <td>{p.name}</td>
              <td>{p.type1}</td>
              <td>{p.type2}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
