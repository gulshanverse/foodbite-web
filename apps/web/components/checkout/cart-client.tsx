"use client";

import { useState } from "react";
import Link from "next/link";

type Item = { listingId: string; quantity: number; listing: { name: string; sellingPrice: number; unit: string; pickupEnd: string; images: { url: string; altText: string }[] } };

export function CartClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.listing.sellingPrice * item.quantity, 0);
  async function update(listingId: string, quantity: number) {
    setBusy(true);
    const response = await fetch("/api/buyer/cart", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ listingId, quantity }) });
    if (response.ok) setItems((current) => quantity < 1 ? current.filter((item) => item.listingId !== listingId) : current.map((item) => item.listingId === listingId ? { ...item, quantity } : item));
    setBusy(false);
  }
  if (!items.length) return <div className="rounded-3xl border border-[#dbe4df] p-10 text-center"><h1 className="text-2xl font-bold text-[#173f3b]">Your cart is empty</h1><p className="mt-2 text-[#55706c]">Find eligible surplus food before it is gone.</p><Link href="/explore" className="mt-5 inline-block rounded-xl bg-[#173f3b] px-5 py-3 font-semibold text-white">Explore food</Link></div>;
  return <div className="grid gap-8 lg:grid-cols-[1fr_360px]"> <section className="space-y-4">{items.map((item) => <article key={item.listingId} className="flex gap-4 rounded-2xl border border-[#dbe4df] p-4">{item.listing.images[0] && <img src={item.listing.images[0].url} alt={item.listing.images[0].altText} className="h-24 w-24 rounded-xl object-cover" />}<div className="min-w-0 flex-1"><h2 className="font-bold text-[#173f3b]">{item.listing.name}</h2><p className="mt-1 text-sm text-[#55706c]">₹{Math.round(item.listing.sellingPrice / 100)} / {item.listing.unit.toLowerCase()}</p><p className="mt-1 text-xs text-[#8a9b96]">Pickup until {new Date(item.listing.pickupEnd).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</p><div className="mt-3 flex items-center gap-2"><button disabled={busy} onClick={() => update(item.listingId, item.quantity - 1)} className="h-8 w-8 rounded-lg border">−</button><span className="w-8 text-center font-semibold">{item.quantity}</span><button disabled={busy} onClick={() => update(item.listingId, item.quantity + 1)} className="h-8 w-8 rounded-lg border">+</button><button disabled={busy} onClick={() => update(item.listingId, 0)} className="ml-3 text-sm font-semibold text-[#b33f2d]">Remove</button></div></div></article>)}</section><aside className="h-fit rounded-3xl border border-[#dbe4df] p-6"><h2 className="text-xl font-bold text-[#173f3b]">Order summary</h2><div className="mt-5 flex justify-between text-[#55706c]"><span>Subtotal</span><span>₹{Math.round(subtotal / 100)}</span></div><div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold text-[#173f3b]"><span>Total</span><span>₹{Math.round(subtotal / 100)}</span></div><Link href="/checkout" className="mt-6 block rounded-xl bg-[#e85d3f] px-4 py-3 text-center font-bold text-white">Continue to checkout</Link><p className="mt-3 text-xs text-[#8a9b96]">Pickup only. Delivery is not part of this phase.</p></aside></div>;
}
