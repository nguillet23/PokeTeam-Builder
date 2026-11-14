import Link from "next/link";
import { notFound } from "next/navigation";
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

type AbilityRow = {
  ability_id: number;
  name: string;
  ability_slot: number;
};

type Params = Promise<{ id: string }>;

export default async function PokemonPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const pokemonId = Number(id);

  const [[pokemon], abilities, [{ team_count }]] = await Promise.all([
    sql<PokemonRow[]>`
      SELECT pokemon_id, dex_number, name, type1, type2
      FROM pokemon
      WHERE pokemon_id = ${pokemonId}
    `,
    // POKEMON -> POKEMON_ABILITY -> ABILITY; slot 3 is the hidden ability.
    sql<AbilityRow[]>`
      SELECT a.ability_id, a.name, pa.ability_slot
      FROM pokemon_ability pa
      JOIN ability a ON a.ability_id = pa.ability_id
      WHERE pa.pokemon_id = ${pokemonId}
      ORDER BY pa.ability_slot
    `,
    // A trainer has one team and can't repeat a Pokémon on it,
    // so each matching row is one team.
    sql<{ team_count: number }[]>`
      SELECT COUNT(*)::int AS team_count
      FROM party_member
      WHERE pokemon_id = ${pokemonId}
    `,
  ]);

  if (!pokemon) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-gray-500 underline">
        ← Pokédex
      </Link>

      <h1 className="mt-4 text-3xl font-bold capitalize">{pokemon.name}</h1>
      <p className="mt-1 text-sm text-gray-500 tabular-nums">#{pokemon.dex_number}</p>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Type</h2>
        <p className="mt-1 capitalize">
          {pokemon.type1}
          {pokemon.type2 ? ` / ${pokemon.type2}` : ""}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Abilities</h2>
        <ul className="mt-1 space-y-1">
          {abilities.map((a) => (
            <li key={a.ability_id} className="capitalize">
              {a.name.replace(/-/g, " ")}
              {a.ability_slot === 3 && (
                <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs normal-case text-gray-700">
                  hidden
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Popularity</h2>
        <p className="mt-1">
          On {team_count} {team_count === 1 ? "team" : "teams"}
        </p>
      </section>
    </main>
  );
}
