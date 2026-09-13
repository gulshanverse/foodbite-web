import Link from "next/link";
import { ArrowRight, ClipboardCheck, Database, ShieldAlert } from "lucide-react";
import { requirePermission, type Permission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

type ResourceKind = "overview" | "users" | "sellers" | "listings" | "orders" | "payments" | "moderation" | "complaints" | "settings" | "audit";
type Row = { label: string; value: string | number; detail?: string };
const metadata: Record<ResourceKind, { title: string; kicker: string; description: string; permission: Permission; links: [string, string][] }> = {
  overview: { title: "Admin workspace", kicker: "Platform operations", description: "A focused view of persisted marketplace activity and the next operational surface to open.", permission: "AUDIT_READ", links: [["Analytics", "/admin/analytics"], ["Orders", "/admin/orders"], ["Listings", "/admin/listings"], ["Users", "/admin/users"]] },
  users: { title: "Users", kicker: "Account operations", description: "Review active account records and role distribution without exposing credentials or private secrets.", permission: "ACCOUNT_SUSPEND", links: [["Sellers", "/admin/sellers"], ["NGOs", "/admin/ngos"], ["Analytics", "/admin/analytics"]] },
  sellers: { title: "Sellers", kicker: "Verification operations", description: "Monitor seller verification states and open the existing server-authorized review workflow.", permission: "SELLER_VERIFY", links: [["Listings", "/admin/listings"], ["Analytics", "/admin/analytics"]] },
  listings: { title: "Listings", kicker: "Marketplace operations", description: "Review listing status distribution and identify records that need moderation attention.", permission: "LISTING_MODERATE", links: [["Moderation", "/admin/moderation"], ["Analytics", "/admin/analytics"]] },
  orders: { title: "Orders", kicker: "Order support", description: "See order status distribution and fulfillment mix from real order records.", permission: "ORDER_SUPPORT", links: [["Payments", "/admin/payments"], ["Analytics", "/admin/analytics"]] },
  payments: { title: "Payments", kicker: "Payment operations", description: "Review payment state distribution. Payment transitions remain server-authoritative.", permission: "REFUND_MANAGE", links: [["Orders", "/admin/orders"], ["Analytics", "/admin/analytics"]] },
  moderation: { title: "Moderation", kicker: "Trust and safety", description: "Identify listings awaiting review or blocked by an authorized moderation action.", permission: "LISTING_MODERATE", links: [["Listings", "/admin/listings"], ["Sellers", "/admin/sellers"]] },
  complaints: { title: "Complaints", kicker: "Support operations", description: "The current data model does not expose a complaint entity. This surface shows the support boundary instead of a misleading empty queue.", permission: "ORDER_SUPPORT", links: [["Orders", "/admin/orders"], ["Analytics", "/admin/analytics"]] },
  settings: { title: "Admin settings", kicker: "Access and configuration", description: "Operational settings stay server-side. Development access uses explicit environment bootstrap; credentials are never stored in the client or repository.", permission: "AUDIT_READ", links: [["Analytics", "/admin/analytics"], ["Account", "/account"]] },
  audit: { title: "Audit log", kicker: "Security operations", description: "Review recent server-recorded administrative and workflow events. Sensitive metadata is not rendered in this summary surface.", permission: "AUDIT_READ", links: [["Users", "/admin/users"], ["Settings", "/admin/settings"], ["Analytics", "/admin/analytics"]] },
};

function rows<T extends Record<string, unknown>>(items: T[], key: keyof T): Row[] { return items.map((item) => ({ label: String(item[key]).replaceAll("_", " "), value: Number((item._count as { _all: number })._all), detail: String(key) })); }
async function getRows(kind: ResourceKind): Promise<Row[]> {
  const [users, sellers, listings, orders, payments, audit] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], where: { deletedAt: null }, _count: { _all: true }, orderBy: { role: "asc" } }),
    prisma.sellerProfile.groupBy({ by: ["verificationStatus"], _count: { _all: true }, orderBy: { verificationStatus: "asc" } }),
    prisma.foodListing.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.payment.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.auditLog.groupBy({ by: ["action"], _count: { _all: true }, orderBy: { action: "asc" } }),
  ]);
  if (kind === "users") return rows(users, "role");
  if (kind === "sellers") return rows(sellers, "verificationStatus");
  if (kind === "listings" || kind === "moderation") return rows(listings, "status");
  if (kind === "orders") return rows(orders, "status");
  if (kind === "payments") return rows(payments, "status");
  if (kind === "complaints") return [{ label: "Complaint records", value: "Not modeled", detail: "No complaint entity exists in the current schema" }];
  if (kind === "settings") return [{ label: "Credential storage", value: "Server-side only" }, { label: "Admin bootstrap", value: "Explicit environment opt-in" }, { label: "Production default", value: "Fail closed" }];
  if (kind === "audit") return rows(audit, "action");
  return [
    { label: "Users", value: users.reduce((sum, row) => sum + row._count._all, 0), detail: "non-deleted accounts" },
    { label: "Sellers", value: sellers.reduce((sum, row) => sum + row._count._all, 0), detail: "verification records" },
    { label: "Listings", value: listings.reduce((sum, row) => sum + row._count._all, 0), detail: "all persisted statuses" },
    { label: "Orders", value: orders.reduce((sum, row) => sum + row._count._all, 0), detail: "all persisted statuses" },
  ];
}

export async function AdminResourcePage({ kind }: { kind: ResourceKind }) {
  const config = metadata[kind];
  const gate = await requirePermission(config.permission);
  if (gate.response === "unauthenticated") return <main className="product-page"><section className="empty-state"><ShieldAlert className="mx-auto size-8 text-[var(--accent)]" /><h1 className="mt-4 text-3xl font-black">Sign in required</h1><p className="mt-2">This operations surface is available to authorized FoodBite staff.</p><Link className="home-primary mt-6" href="/login">Sign in <ArrowRight className="size-4" /></Link></section></main>;
  if (gate.response) return <main className="product-page"><section className="empty-state"><ShieldAlert className="mx-auto size-8 text-[var(--accent)]" /><h1 className="mt-4 text-3xl font-black">Access unavailable</h1><p className="mt-2">Your role does not have permission to view this operational surface.</p><Link className="home-secondary mt-6" href="/forbidden">Review access <ArrowRight className="size-4" /></Link></section></main>;
  const data = await getRows(kind);
  return <main className="product-page workspace-page"><section className="workspace-hero"><div className="workspace-hero-content"><div className="workspace-breadcrumb"><Database className="size-3.5" /> Admin workspace <span>/</span> {config.title}</div><div className="workspace-title-row"><div><div className="workspace-status-row"><span className="status-chip" data-tone="accent"><ClipboardCheck className="size-3.5" /> Server-authorized</span><span className="status-chip">Persisted records</span></div><h1 className="workspace-title">{config.title}</h1><p className="workspace-description">{config.description}</p></div></div></div></section><section className="mt-5 surface-card p-5 sm:p-7"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="page-kicker">{config.kicker}</p><h2 className="mt-2 text-2xl font-black">Current state</h2></div><p className="max-w-md text-sm leading-6">Counts reflect records currently in the database. No predictive, historical, or fabricated values are shown.</p></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{data.map((item) => <article key={`${item.label}-${item.detail ?? ""}`} className="surface-muted p-4"><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">{item.label}</p><p className="mt-2 break-words text-2xl font-black text-[var(--foreground)]">{item.value}</p>{item.detail && <p className="mt-1 text-xs text-[var(--muted)]">{item.detail}</p>}</article>)}</div></section><nav className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Admin related surfaces">{config.links.map(([label, href]) => <Link key={href} href={href} className="workspace-link-card"><span className="workspace-link-copy"><strong>{label}</strong><small>Open authorized workspace</small></span><ArrowRight className="workspace-link-arrow size-4" /></Link>)}</nav></main>;
}
