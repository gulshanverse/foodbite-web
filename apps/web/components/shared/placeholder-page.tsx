import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

const moduleLinks = [
  ["Explore marketplace", "/explore"],
  ["Account", "/account"],
  ["Seller workspace", "/seller"],
] as const;

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="product-page">
      <section className="hero-panel px-6 py-8 sm:px-10 sm:py-12">
        <div className="relative z-10 max-w-3xl">
          <p className="page-kicker">FoodBite workspace</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="status-chip" data-tone="accent"><Sparkles className="size-3.5" /> Product surface</span>
            <span className="status-chip"><CheckCircle2 className="size-3.5" /> Responsive by design</span>
          </div>
          <h1 className="mt-5">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 sm:text-lg">{description}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="metric-card"><BarChart3 className="size-5 text-[var(--accent)]" /><p className="mt-4 font-bold">Clear at a glance</p><p className="mt-1 text-sm">Important states and next actions will stay easy to scan.</p></div>
        <div className="metric-card"><ShieldCheck className="size-5 text-[var(--accent)]" /><p className="mt-4 font-bold">Trust-first UX</p><p className="mt-1 text-sm">No fabricated status, metrics, ratings, or operational claims.</p></div>
        <div className="metric-card"><Sparkles className="size-5 text-[var(--accent)]" /><p className="mt-4 font-bold">Ready for the workflow</p><p className="mt-1 text-sm">The visual surface is prepared for its domain controls as they become available.</p></div>
      </section>

      <section className="surface-card mt-6 p-6 sm:p-8">
        <p className="page-kicker">Keep moving</p>
        <h2 className="mt-2 text-2xl font-bold">Explore the active FoodBite experience</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {moduleLinks.map(([label, href]) => <Link key={href} href={href} className="group flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-sm font-bold transition hover:-translate-y-0.5 hover:border-[var(--accent)]"><span>{label}</span><ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link>)}
        </div>
      </section>
    </main>
  );
}
