import Link from "next/link";
import { ArrowRight, HeartHandshake, MapPin } from "lucide-react";
import { requireRole } from "@/lib/authorization";

export default async function NgoWorkspacePage() {
  await requireRole("NGO");
  return (
    <main className="product-page">
      <section className="hero-panel px-6 py-8 sm:px-9 sm:py-10">
        <p className="page-kicker">Recovery partner workspace</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">Coordinate meaningful collection.</h1>
        <p className="mt-4 max-w-2xl">Review eligible surplus food, manage reservations, and keep collection details close to the next action.</p>
      </section>
      <section className="mt-6 grid gap-5 md:grid-cols-2">
        <Link href="/ngo/donations" className="surface-card group p-6 transition hover:-translate-y-0.5">
          <span className="grid size-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><HeartHandshake className="size-5" /></span>
          <h2 className="mt-6 text-xl font-black">Donation opportunities</h2>
          <p className="mt-2 text-sm leading-6">Browse current offers from active food businesses and see the information provided for collection planning.</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-black">Open opportunities <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
        </Link>
        <section className="surface-card p-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]"><MapPin className="size-5" /></span>
          <h2 className="mt-6 text-xl font-black">Your collection context</h2>
          <p className="mt-2 text-sm leading-6">Keep your service area, operating hours, and contact details current from your profile so sellers can coordinate responsibly.</p>
          <Link href="/ngo/profile" className="mt-6 inline-flex items-center gap-2 text-sm font-black">Review profile <ArrowRight className="size-4" /></Link>
        </section>
      </section>
    </main>
  );
}
