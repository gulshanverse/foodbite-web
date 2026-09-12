import { redirect } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { CartClient } from "@/components/checkout/cart-client";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateCart } from "@/lib/order-domain";

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUYER") redirect("/login?callbackUrl=/cart");
  const cart = await getOrCreateCart(user.id);
  const items = cart.items.map((item) => ({ ...item, listing: { ...item.listing, pickupEnd: item.listing.pickupEnd.toISOString() } }));
  return <main className="product-page"><div className="flex items-end justify-between gap-5"><div><p className="page-kicker">Your selections</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">Your cart</h1><p className="mt-3 max-w-xl">Review your surplus food picks before reserving a checkout window.</p></div><div className="hidden rounded-2xl bg-[var(--surface)] p-3 shadow-sm sm:block"><ShoppingBag className="size-6 text-[var(--accent)]" /></div></div><div className="mt-8"><CartClient initialItems={items} /></div><div className="mt-8 flex items-center gap-2 text-xs font-semibold text-[var(--muted)]"><ArrowRight className="size-3.5 text-[var(--accent)]" />Reservation is created only when you continue to checkout.</div></main>;
}
