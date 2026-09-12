"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const links = [
  ["Explore", "/explore"],
  ["For businesses", "/seller"],
  ["For NGOs", "/ngo"],
  ["Account", "/account"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="FoodBite home" onClick={() => setOpen(false)}>
          <span className="brand-mark">F</span>
          <span>FoodBite</span>
        </Link>

        {!isAuth && <nav className="site-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={href} href={href} data-active={pathname === href || pathname.startsWith(`${href}/`) ? "true" : undefined}>{label}</Link>)}
        </nav>}

        <div className="header-actions">
          {!isAuth && <Link href="/login" className="header-signin">Sign in</Link>}
          <ThemeToggle />
          {!isAuth && <button type="button" className="mobile-menu-trigger" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>}
        </div>
      </div>

      {!isAuth && open && <nav className="mobile-site-nav" aria-label="Mobile navigation">
        {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        <Link href="/login" className="mobile-signin" onClick={() => setOpen(false)}>Sign in <span>→</span></Link>
      </nav>}
    </header>
  );
}
