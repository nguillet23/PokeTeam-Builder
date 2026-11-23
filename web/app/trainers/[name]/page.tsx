import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sql } from "../../../lib/db";

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

export default async function TrainerPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  // The name comes from the URL, so spaces arrive as %20.
  const name = decodeURIComponent((await params).name);

  const rows = await sql`
    SELECT trainer_id, name
    FROM trainer
    WHERE name = ${name}
  `;
  if (rows.length === 0) notFound();
  const trainer = rows[0];

  const team = await sql`
    SELECT pm.party_slot, p.pokemon_id, p.name AS pokemon,
           a.ability_id, a.name AS ability
    FROM party_member pm
    JOIN pokemon p ON p.pokemon_id = pm.pokemon_id
    JOIN ability a ON a.ability_id = pm.ability_id
    WHERE pm.trainer_id = ${trainer.trainer_id}
    ORDER BY pm.party_slot
  `;

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
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.party_slot}>
                <td>{m.party_slot}</td>
                <td>
                  <Link href={`/pokemon/${m.pokemon_id}`}>{m.pokemon}</Link>
                </td>
                <td>
                  <Link href={`/abilities/${m.ability_id}`}>{m.ability}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Delete trainer</h2>
      <form action={deleteTrainer}>
        <input type="hidden" name="trainer_id" value={trainer.trainer_id} />
        <button>Delete {trainer.name} and their team</button>
      </form>
    </>
  );
}
