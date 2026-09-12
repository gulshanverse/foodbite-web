import Link from "next/link";
import { CheckCircle2, Clock3, MapPin, Package, ShieldCheck } from "lucide-react";
import { AddToCart } from "@/components/checkout/add-to-cart";
import { FavoriteButton } from "@/components/marketplace/favorite-button";
import { getMarketplaceListingSafe } from "@/lib/marketplace";

export default async function FoodDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getMarketplaceListingSafe(slug);
  if (!listing) return <main className="product-page"><div className="empty-state"><Package className="mx-auto size-8 text-[var(--accent)]" /><h1 className="mt-5 text-3xl font-black">This surplus listing is no longer available.</h1><p className="mt-3">It may have expired, sold out, or been paused by the seller.</p><Link href="/explore" className="mt-6 inline-flex rounded-xl bg-[var(--foreground)] px-5 py-3 font-bold text-[var(--background)]">Back to explore</Link></div></main>;
  const business = listing.seller.business; const image = listing.images[0]; const available = listing.inventory?.availableQuantity ?? 0;
  return <main className="product-page">
    <Link href="/explore" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--foreground)]">← Back to explore</Link>
    <div className="mt-7 grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
      <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-muted)] shadow-[var(--shadow)]"><div className="aspect-[4/3]">{image ? <img src={image.url} alt={image.altText} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center font-bold text-[var(--muted)]">Surplus food</div>}</div></div>
      <div>
        <div className="flex items-start justify-between gap-4"><div><p className="page-kicker">{listing.category.name}</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">{listing.name}</h1><p className="mt-3 font-semibold text-[var(--muted)]">{business?.name ?? "Local food business"}</p></div><FavoriteButton listingId={listing.id} /></div>
        <div className="mt-7 flex flex-wrap items-end gap-3"><span className="text-4xl font-black">₹{Math.round(listing.sellingPrice / 100)}</span><span className="pb-1 text-lg text-[var(--muted)] line-through">₹{Math.round(listing.originalPrice / 100)}</span><span className="status-chip" data-tone="accent">{listing.discountPercent}% off</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="surface-muted p-4"><p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Availability</p><p className="mt-2 font-black">{available} {listing.unit.toLowerCase()} left</p></div><div className="surface-muted p-4"><p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Pickup</p><p className="mt-2 font-black">Until {listing.pickupEnd.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</p></div></div>
        <p className="mt-6 text-base leading-7">{listing.listingType === "SURPRISE_BOX" ? "Surprise box: exact contents may vary within the seller-provided description." : listing.description ?? "Seller-provided surplus food listing."}</p>
        <div className="mt-6"><AddToCart listingId={listing.id} available={available} /></div>
        <section className="mt-8 surface-card p-6"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="size-4" /></span><h2 className="text-lg font-black">Food information</h2></div><div className="mt-5 grid gap-3 text-sm"><p><strong>Food type:</strong> {listing.foodType.replaceAll("_", " ")}</p>{listing.preparedAt && <p><strong>Prepared at:</strong> {listing.preparedAt.toLocaleString("en-IN")}</p>}{listing.packagingInfo && <p><strong>Packaging:</strong> {listing.packagingInfo}</p>}{listing.allergenInfo && <p><strong>Allergens:</strong> {listing.allergenInfo}</p>}</div><p className="mt-5 text-xs">Information is provided by the seller. FoodBite does not certify food safety.</p></section>
        <section className="mt-4 surface-card p-6"><h2 className="text-lg font-black">Pickup details</h2><div className="mt-4 grid gap-3 text-sm"><p className="inline-flex items-center gap-2"><Clock3 className="size-4 text-[var(--accent)]" />{listing.pickupStart.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} – {listing.pickupEnd.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p><p className="inline-flex items-center gap-2"><MapPin className="size-4 text-[var(--accent)]" />{business?.city ?? "Location shared by the seller"}{business?.state ? `, ${business.state}` : ""}</p>{business?.verificationStatus === "VERIFIED" && <p className="inline-flex items-center gap-2 font-bold"><CheckCircle2 className="size-4 text-[var(--accent)]" />Verified business</p>}</div></section>
      </div>
    </div>
  </main>;
}
