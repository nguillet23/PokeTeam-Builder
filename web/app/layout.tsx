import Link from "next/link";
import "./style.css";

export const metadata = {
  title: "PokéTeam Builder",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav className="site-nav" aria-label="Main navigation">
            <Link className="site-brand" href="/">
              PokéTeam Builder
            </Link>
            <div className="site-nav-links">
              <Link href="/">Pokédex</Link>
              <Link href="/trainers">Trainers</Link>
            </div>
          </nav>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
