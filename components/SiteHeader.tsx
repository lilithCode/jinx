import Link from "next/link";
import { LogoMark } from "./Jar";
import { ThemeToggle } from "./ThemeToggle";

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Jinx home">
      <LogoMark />
      Jinx
    </Link>
  );
}

export function SiteHeader({ showCreate = true }: { showCreate?: boolean }) {
  return (
    <header className="site-header wrap">
      <Logo />
      <nav className="site-nav" aria-label="Main">
        <a className="nav-link" href="/#how">How it works</a>
        <Link className="nav-link" href="/rules">House rules</Link>
        <ThemeToggle />
        {showCreate && (
          <Link href="/new" className="btn btn--primary btn--sm">
            + New jar
          </Link>
        )}
      </nav>
    </header>
  );
}
