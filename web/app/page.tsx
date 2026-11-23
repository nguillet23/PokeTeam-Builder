import { sql } from "../lib/db";

export default async function Home() {
  const rows = await sql`SELECT COUNT(*) AS total FROM pokemon`;

  return (
    <>
      <h1>PokéTeam Builder</h1>
      <p>{rows[0].total} Pokémon in the database.</p>
    </>
  );
}
