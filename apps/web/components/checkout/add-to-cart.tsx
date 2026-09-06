"use client";

import { useState } from "react";
import Link from "next/link";

export function AddToCart({ listingId, available }: { listingId: string; available: number }) {
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function add() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/buyer/cart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ listingId, quantity }) });
      const data = await response.json();
      if (response.status === 401) { window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`; return; }
      if (!response.ok) throw new Error(data.error ?? "Unable to add to cart.");
      setMessage("Added to cart.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add to cart."); }
    finally { setBusy(false); }
  }
  return <div className="mt-8 rounded-2xl border border-[#dbe4df] p-4"><div className="flex items-center gap-3"><label htmlFor="quantity" className="text-sm font-semibold text-[#173f3b]">Quantity</label><input id="quantity" type="number" min={1} max={available} value={quantity} onChange={(e) => setQuantity(Math.min(available, Math.max(1, Number(e.target.value) || 1)))} className="w-20 rounded-lg border border-[#cdd9d4] px-3 py-2 text-center" /><button onClick={add} disabled={busy || available < 1} className="flex-1 rounded-xl bg-[#173f3b] px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Adding…" : "Add to cart"}</button></div>{message && <p className="mt-3 text-sm text-[#55706c]">{message}</p>}<Link href="/cart" className="mt-3 inline-block text-sm font-semibold text-[#173f3b] underline">View cart</Link></div>;
}
