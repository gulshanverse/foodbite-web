import Link from "next/link";
import { MapPin, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { FoodCard } from "./food-card";
import { getMarketplaceCategoriesSafe, getMarketplaceListingsSafe } from "@/lib/marketplace";
import { RecommendationSection } from "./recommendations";

export async function MarketplaceExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const [result, categories] = await Promise.all([getMarketplaceListingsSafe(params), getMarketplaceCategoriesSafe()]);
  const query = result.query;
  const makeHref = (key: string, value?: string) => { const next = new URLSearchParams(); for (const [k, v] of Object.entries(params)) if (typeof v === "string" && k !== key) next.set(k, v); if (value) next.set(key, value); return `/explore?${next.toString()}`; };
  return <main className="product-page">
    <section className="hero-panel px-6 py-8 sm:px-10 sm:py-10">
      <div className="relative z-10 max-w-3xl"><p className="page-kicker">Discover surplus food</p><h1 className="mt-3">Good food, ready for pickup.</h1><p className="mt-4 max-w-2xl text-base leading-7 sm:text-lg">Browse eligible surplus food from local businesses. Availability, pricing, and pickup windows come directly from the seller listing.</p></div>
      <form className="relative z-10 mt-7 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg md:grid-cols-[1.6fr_1fr_1fr_1fr_auto]" action="/explore">
        <label className="sr-only" htmlFor="market-search">Search food or business</label><div className="relative md:col-span-1"><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-[var(--muted)]" /><input id="market-search" name="q" defaultValue={query.q ?? ""} placeholder="Search food or business" className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] pl-10 pr-3 text-sm" /></div>
        <select name="category" defaultValue={query.category ?? ""} aria-label="Filter by category" className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm"><option value="">All categories</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select>
        <select name="foodType" defaultValue={query.foodType ?? ""} aria-label="Filter by food type" className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm"><option value="">All food types</option><option value="VEGETARIAN">Vegetarian</option><option value="NON_VEGETARIAN">Non-vegetarian</option><option value="VEGAN">Vegan</option><option value="JAIN">Jain</option><option value="OTHER">Other</option></select>
        <select name="sort" defaultValue={query.sort} aria-label="Sort listings" className="min-h-11 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm"><option value="recommended">Recommended</option><option value="ending-soon">Ending soon</option><option value="lowest-price">Lowest price</option><option value="highest-discount">Highest discount</option><option value="nearest">Nearest (add location)</option></select>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-5 text-sm font-extrabold text-[var(--background)]"><SlidersHorizontal className="size-4" />Search</button>
      </form>
      {result.databaseError && <p className="relative z-10 mt-4 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-4 text-sm font-semibold text-[var(--accent-strong)]">Marketplace data is temporarily unavailable. Please try again shortly.</p>}
    </section>

    <div className="mt-7 flex items-center gap-2 overflow-x-auto pb-1"><Sparkles className="size-4 shrink-0 text-[var(--accent)]" />{categories.map((category) => <Link key={category.slug} href={makeHref("category", category.slug)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition ${query.category === category.slug ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"}`}>{category.name}</Link>)}</div>
    <RecommendationSection />
    <div className="mt-8 flex items-end justify-between gap-4"><div><p className="page-kicker">Marketplace</p><p className="mt-1 text-sm font-semibold">{result.total} eligible listing{result.total === 1 ? "" : "s"}</p></div>{result.totalPages > 1 && <div className="flex gap-2 text-sm font-bold">{query.page > 1 && <Link href={makeHref("page", String(query.page - 1))} className="rounded-lg border border-[var(--border)] px-3 py-2">Previous</Link>}{query.page < result.totalPages && <Link href={makeHref("page", String(query.page + 1))} className="rounded-lg border border-[var(--border)] px-3 py-2">Next</Link>}</div>}</div>
    {result.listings.length === 0 ? <div className="empty-state mt-5"><h2 className="text-xl font-black">{query.q || query.category ? "We couldn't find a match." : "No surplus food available right now."}</h2><p className="mt-2">Try another search or check back as pickup windows change.</p></div> : <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{result.listings.map((listing) => <FoodCard key={listing.id} listing={listing} />)}</div>}
  </main>;
}
