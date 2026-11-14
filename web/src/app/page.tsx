import { sql } from "@/lib/db";

// Always read fresh data from the database.
export const dynamic = "force-dynamic";

type PokemonRow = {
  pokemon_id: number;
  dex_number: number;
  name: string;
  type1: string;
  type2: string | null;
};

export default async function Home() {
  const pokemon = await sql<PokemonRow[]>`
    SELECT pokemon_id, dex_number, name, type1, type2
    FROM pokemon
    ORDER BY dex_number, pokemon_id
  `;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Pokédex</h1>
      <p className="mt-1 text-sm text-gray-500">{pokemon.length} Pokémon from the database</p>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b">
          <tr>
            <th className="py-2 pr-4">#</th>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2">Type</th>
          </tr>
        </thead>
        <tbody>
          {pokemon.map((p) => (
            <tr key={p.pokemon_id} className="border-b border-gray-200/50">
              <td className="py-1.5 pr-4 tabular-nums">{p.dex_number}</td>
              <td className="py-1.5 pr-4 capitalize">{p.name}</td>
              <td className="py-1.5 capitalize">
                {p.type1}
                {p.type2 ? ` / ${p.type2}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
