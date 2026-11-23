import { redirect } from "next/navigation";
import { sql } from "../../lib/db";

// Runs on the server when the form is submitted.
async function createTrainer(formData: FormData) {
  "use server";
  const name = String(formData.get("name")).trim();
  if (name === "") redirect("/trainers?error=empty");

  let error = "";
  try {
    await sql`INSERT INTO trainer (name) VALUES (${name})`;
  } catch (e: any) {
    // R4: the UNIQUE constraint rejects a name that is already used.
    error = e.constraint_name === "uk_trainer_name" ? "taken" : "other";
  }

  // redirect() has to be outside the try, or the catch would swallow it.
  if (error) redirect("/trainers?error=" + error);
  redirect("/trainers?saved=" + encodeURIComponent(name));
}

const messages: Record<string, string> = {
  empty: "Please enter a name",
  taken: "That trainer name is taken (R4)",
  other: "Something went wrong, the trainer was not saved",
};

export default async function TrainersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;

  // LEFT JOIN so trainers with an empty team still show, with 0.
  const trainers = await sql`
    SELECT t.trainer_id, t.name, COUNT(pm.party_member_id) AS team_size
    FROM trainer t
    LEFT JOIN party_member pm ON pm.trainer_id = t.trainer_id
    GROUP BY t.trainer_id, t.name
    ORDER BY t.name
  `;

  return (
    <>
      <h1>Trainers</h1>

      <form action={createTrainer}>
        <input name="name" placeholder="Trainer name" maxLength={50} required />{" "}
        <button>Create trainer</button>
      </form>
      {error && <p className="error">{messages[error] ?? messages.other}</p>}
      {saved && <p className="saved">Created trainer {saved}</p>}

      <table>
        <thead>
          <tr>
            <th>Trainer</th>
            <th>Team size</th>
          </tr>
        </thead>
        <tbody>
          {trainers.map((t) => (
            <tr key={t.trainer_id}>
              <td>{t.name}</td>
              <td>{t.team_size} / 6</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
