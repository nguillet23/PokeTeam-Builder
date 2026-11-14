import Link from "next/link";
import { sql } from "@/lib/db";

// Always read fresh data from the database.
export const dynamic = "force-dynamic";

// Same list as the CHECK constraints on pokemon.type1 / type2.
const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

type PokemonRow = {
  pokemon_id: number;
  dex_number: number;
  name: string;
  type1: string;
  type2: string | null;
};

type SearchParams = Promise<{ q?: string | string[]; type?: string | string[] }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim();
  const rawType = typeof params.type === "string" ? params.type : "";
  const type = TYPES.includes(rawType) ? rawType : "";

  // Names are stored lowercase with hyphens ("mr-mime"), so "Mr Mime" should match.
  // Escape LIKE wildcards so a typed % or _ is searched for literally.
  const pattern =
    "%" + q.toLowerCase().replace(/\s+/g, "-").replace(/[\\%_]/g, "\\$&") + "%";

  const pokemon = await sql<PokemonRow[]>`
    SELECT pokemon_id, dex_number, name, type1, type2
    FROM pokemon
    WHERE name ILIKE ${pattern}
      ${type ? sql`AND (type1 = ${type} OR type2 = ${type})` : sql``}
    ORDER BY dex_number, pokemon_id
  `;

  const filtered = q !== "" || type !== "";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">Pokédex</h1>

      {/* A plain GET form: the filters live in the URL and the query runs on the server. */}
      <form className="mt-4 flex flex-wrap gap-2" action="/">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name"
          className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
        <select
          name="type"
          defaultValue={type}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm capitalize"
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded bg-gray-900 px-4 py-1.5 text-sm text-white">
          Search
        </button>
        {filtered && (
          <Link href="/" className="self-center text-sm text-gray-500 underline">
            Clear
          </Link>
        )}
      </form>

      <p className="mt-3 text-sm text-gray-500">
        {pokemon.length} Pokémon{filtered ? " match" : " from the database"}
      </p>

      {pokemon.length > 0 && (
        <table className="mt-4 w-full text-left text-sm">
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
      )}
    </main>
  );
}
