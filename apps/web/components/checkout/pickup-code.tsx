"use client";

import { useEffect, useState } from "react";

export function PickupCode({ orderId }: { orderId: string }) {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => { const key = `foodbite:pickup-code:${orderId}`; const value = sessionStorage.getItem(key); if (value) { setCode(value); sessionStorage.removeItem(key); } }, [orderId]);
  if (!code) return null;
  return <div className="mt-5 rounded-xl bg-[#173f3b] p-5 text-white"><p className="text-xs uppercase tracking-widest opacity-75">Pickup code</p><p className="mt-2 text-4xl font-black tracking-[.35em]">{code}</p><p className="mt-2 text-xs opacity-75">Keep this code private and show it to the seller at pickup.</p></div>;
}
