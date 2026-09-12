"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, Building2, ClipboardList, HeartHandshake, LayoutDashboard, Package, Settings, ShoppingBag, UserCircle } from "lucide-react";

const groups = {
  seller: [
    ["Dashboard", "/seller", LayoutDashboard], ["Listings", "/seller/listings", Package], ["Inventory", "/seller/inventory", ClipboardList], ["Orders", "/seller/orders", ShoppingBag], ["Donations", "/seller/donations", HeartHandshake], ["Business", "/seller/business", Building2], ["Analytics", "/seller/analytics", BarChart3], ["Profile", "/seller/profile", UserCircle], ["Settings", "/seller/settings", Settings],
  ],
  buyer: [["Explore", "/explore", ShoppingBag], ["Cart", "/cart", ShoppingBag], ["Orders", "/orders", ClipboardList], ["Account", "/account", UserCircle]],
  ngo: [["Dashboard", "/ngo", LayoutDashboard], ["Donations", "/ngo/donations", HeartHandshake], ["Profile", "/ngo/profile", UserCircle]],
  admin: [["Dashboard", "/admin", LayoutDashboard], ["Analytics", "/admin/analytics", BarChart3], ["Orders", "/admin/orders", ClipboardList], ["Listings", "/admin/listings", Package], ["Sellers", "/admin/sellers", Building2], ["NGOs", "/admin/ngos", HeartHandshake], ["Users", "/admin/users", UserCircle], ["Moderation", "/admin/moderation", Bell], ["Settings", "/admin/settings", Settings]],
} as const;

type Role = keyof typeof groups;
export function DashboardShell({ role, children }: Readonly<{ role: Role; children: React.ReactNode }>) {
  const pathname = usePathname();
  const links = groups[role];
  const label = role === "seller" ? "Seller workspace" : role === "buyer" ? "Your FoodBite" : role === "ngo" ? "Recovery workspace" : "Admin workspace";
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-kicker">{label}</div>
        <nav className="sidebar-nav">
          {links.map(([name, href, Icon]) => <Link key={href} href={href} className="sidebar-link" data-active={pathname === href || (href !== `/${role}` && pathname.startsWith(`${href}/`))}><Icon size={17} />{name}</Link>)}
        </nav>
      </aside>
      <div className="mobile-sidebar" aria-label={`${label} navigation`}>
        {links.map(([name, href]) => <Link key={href} href={href} className="sidebar-link" data-active={pathname === href}>{name}</Link>)}
      </div>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
