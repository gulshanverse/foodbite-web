"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function SiteHeader() {
  const pathname = usePathname();
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/signup");
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="FoodBite home">
          <span className="brand-mark">F</span>
          <span>FoodBite</span>
        </Link>
        {!isAuth ? (
          <nav className="site-nav" aria-label="Primary navigation">
            <Link href="/explore">Explore</Link>
            <Link href="/seller">For businesses</Link>
            <Link href="/ngo">For NGOs</Link>
            <Link href="/account">Account</Link>
          </nav>
        ) : null}
        <div className="header-actions">
          {!isAuth ? <Link href="/login" className="site-nav" style={{ textDecoration: "none", color: "var(--muted)", fontWeight: 700, fontSize: 14 }}>Sign in</Link> : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
