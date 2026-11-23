import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sql } from "../../../lib/db";
import { formatAbilityName, formatPokemonName } from "../../../lib/display-names";
import PokemonPicker from "./PokemonPicker";

async function deleteTrainer(formData: FormData) {
  "use server";
  const trainerId = Number(formData.get("trainer_id"));

  // R8: ON DELETE CASCADE also deletes this trainer's PARTY_MEMBER rows.
  const rows = await sql`
    DELETE FROM trainer
    WHERE trainer_id = ${trainerId}
    RETURNING name
  `;

  const name = rows.length > 0 ? rows[0].name : "";
  redirect("/trainers?deleted=" + encodeURIComponent(name));
}

async function addMember(formData: FormData) {
  "use server";
  const trainerId = Number(formData.get("trainer_id"));
  const pokemonId = Number(formData.get("pokemon_id"));
  const abilityId = Number(formData.get("ability_id"));
  const page = "/trainers/" + encodeURIComponent(String(formData.get("trainer_name")));

  // Put the Pokémon in the lowest empty slot. When slots 1-6 are all taken
  // this picks 7, and ck_pm_slot rejects it (R5).
  let error = "";
  try {
    await sql`
      INSERT INTO party_member (trainer_id, party_slot, pokemon_id, ability_id)
      SELECT ${trainerId}, MIN(s), ${pokemonId}, ${abilityId}
      FROM generate_series(1, 7) AS s
      WHERE s NOT IN (SELECT party_slot FROM party_member WHERE trainer_id = ${trainerId})
    `;
  } catch (e: any) {
    error = e.constraint_name ?? "other";
  }

  if (error) redirect(page + "?error=" + error);
  redirect(page + "?added=1");
}

async function removeMember(formData: FormData) {
  "use server";
  const partyMemberId = Number(formData.get("party_member_id"));
  const page = "/trainers/" + encodeURIComponent(String(formData.get("trainer_name")));

  await sql`
    DELETE FROM party_member
    WHERE party_member_id = ${partyMemberId}
  `;

  redirect(page + "?removed=1");
}

// The constraint that rejected the INSERT decides the message.
const messages: Record<string, string> = {
  ck_pm_slot: "A team holds at most six Pokémon (R5)",
  uk_pm_trainer_pokemon: "That Pokémon is already on this team (R6)",
  fk_pm_pokemon_ability: "That ability isn't legal for this Pokémon (R7)",
  other: "Something went wrong, the Pokémon was not added",
};

export default async function TrainerPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ pick?: string; error?: string; added?: string; removed?: string }>;
}) {
  // The name comes from the URL, so spaces arrive as %20.
  const name = decodeURIComponent((await params).name);
  const { pick, error, added, removed } = await searchParams;

  const rows = await sql`
    SELECT trainer_id, name
    FROM trainer
    WHERE name = ${name}
  `;
  if (rows.length === 0) notFound();
  const trainer = rows[0];

  const team = await sql`
    SELECT pm.party_member_id, pm.party_slot, p.pokemon_id, p.name AS pokemon,
           a.ability_id, a.name AS ability
    FROM party_member pm
    JOIN pokemon p ON p.pokemon_id = pm.pokemon_id
    JOIN ability a ON a.ability_id = pm.ability_id
    WHERE pm.trainer_id = ${trainer.trainer_id}
    ORDER BY pm.party_slot
  `;

  // For the "Add a Pokémon" dropdown.
  const allPokemon = await sql<
    { pokemon_id: number; dex_number: number; name: string }[]
  >`
    SELECT pokemon_id, dex_number, name
    FROM pokemon
    ORDER BY dex_number, pokemon_id
  `;

  // After "Choose", ?pick= holds the Pokémon. Show only its legal abilities (R2).
  const pickId = Number(pick);
  const pickAbilities = Number.isInteger(pickId)
    ? await sql`
        SELECT a.ability_id, a.name, pa.ability_slot
        FROM pokemon_ability pa
        JOIN ability a ON a.ability_id = pa.ability_id
        WHERE pa.pokemon_id = ${pickId}
        ORDER BY pa.ability_slot
      `
    : [];
  const picked = allPokemon.find((p) => p.pokemon_id === pickId);

  return (
    <>
      <p>
        <Link href="/trainers">Back to trainers</Link>
      </p>
      <h1>{trainer.name}</h1>

      <h2>Team ({team.length} / 6)</h2>
      {team.length === 0 ? (
        <p>No Pokémon on this team yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Slot</th>
              <th>Pokémon</th>
              <th>Ability</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.party_member_id}>
                <td>{m.party_slot}</td>
                <td>
                  <div className="team-pokemon">
                    <img
                      className="pokemon-sprite pokemon-sprite-small"
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${m.pokemon_id}.png`}
                      alt={`${formatPokemonName(m.pokemon)} sprite`}
                      width={64}
                      height={64}
                    />
                    <Link href={`/pokemon/${m.pokemon_id}`}>
                      {formatPokemonName(m.pokemon)}
                    </Link>
                  </div>
                </td>
                <td>
                  <Link href={`/abilities/${m.ability_id}`}>
                    {formatAbilityName(m.ability)}
                  </Link>
                </td>
                <td>
                  <form action={removeMember}>
                    <input type="hidden" name="party_member_id" value={m.party_member_id} />
                    <input type="hidden" name="trainer_name" value={trainer.name} />
                    <button>Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {removed && <p className="saved">Removed from the team</p>}

      <h2>Add a Pokémon</h2>
      {error && <p className="error">{messages[error] ?? messages.other}</p>}
      {added && <p className="saved">Added to the team</p>}

      {/* Step 1: pick a Pokémon. The page reloads with ?pick=id. */}
      <PokemonPicker pokemon={allPokemon} selectedId={pick} />

      {/* Step 2: pick one of its abilities and add it. */}
      {picked && (
        <form action={addMember}>
          <input type="hidden" name="trainer_id" value={trainer.trainer_id} />
          <input type="hidden" name="trainer_name" value={trainer.name} />
          <input type="hidden" name="pokemon_id" value={picked.pokemon_id} />
          <p>
            {formatPokemonName(picked.name)} with{" "}
            <select name="ability_id">
              {pickAbilities.map((a) => (
                <option key={a.ability_id} value={a.ability_id}>
                  {formatAbilityName(a.name)}
                  {a.ability_slot === 3 && " (hidden)"}
                </option>
              ))}
            </select>{" "}
            <button>Add</button>
          </p>
        </form>
      )}

      <h2>Delete trainer</h2>
      <form action={deleteTrainer}>
        <input type="hidden" name="trainer_id" value={trainer.trainer_id} />
        <button>Delete {trainer.name} and their team</button>
      </form>
    </>
  );
}
