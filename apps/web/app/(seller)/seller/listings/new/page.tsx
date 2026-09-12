import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import { ListingForm } from "@/components/seller/seller-forms";

export default async function NewListingPage() { await requireRole("SELLER"); return <main className="product-page"><Link href="/seller/listings" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)]"> <ArrowLeft className="size-4" /> Back to listings</Link><div className="mt-7 flex items-end gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><Sparkles className="size-6" /></span><div><p className="page-kicker">Seller catalog</p><h1 className="mt-2 text-4xl font-black sm:text-5xl">Add surplus food</h1></div></div><p className="mt-4 max-w-3xl">Create a clear offer for buyers. Save a draft first; publishing validates the business relationship, pricing, quantity, and pickup window on the server.</p><div className="form-section mt-7"><ListingForm /></div></main>; }
