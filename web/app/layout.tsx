import Link from "next/link";
import "./style.css";

export const metadata = {
  title: "PokéTeam Builder",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <p>
          <Link href="/">Pokédex</Link> | <Link href="/trainers">Trainers</Link>
        </p>
        {children}
      </body>
    </html>
  );
}
