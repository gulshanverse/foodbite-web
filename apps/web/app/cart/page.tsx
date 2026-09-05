import { redirect } from "next/navigation";
import { CartClient } from "@/components/checkout/cart-client";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateCart } from "@/lib/order-domain";

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUYER") redirect("/login?callbackUrl=/cart");
  const cart = await getOrCreateCart(user.id);
  const items = cart.items.map((item) => ({ ...item, listing: { ...item.listing, pickupEnd: item.listing.pickupEnd.toISOString() } }));
  return <main className="mx-auto max-w-6xl px-6 py-12 lg:px-10"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#e85d3f]">FoodBite</p><h1 className="mt-2 text-4xl font-bold text-[#173f3b]">Your cart</h1><p className="mt-2 text-[#55706c]">Reserve only when you are ready to check out.</p></div><CartClient initialItems={items} /></main>;
}
