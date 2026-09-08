"use client";
import { useState } from "react";

type Item = { id: string; title: string; body: string; createdAt: string; readAt: string | null };
export function NotificationsList({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  async function markRead(id: string) { const response = await fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ read: true }) }); if (response.ok) setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item)); }
  if (!items.length) return <div className="rounded-2xl border border-dashed border-[#dbe4df] p-10 text-center text-[#55706c]">You have no notifications yet.</div>;
  return <div className="space-y-3">{items.map((notification) => <article key={notification.id} className={`rounded-2xl border p-5 ${notification.readAt ? "border-[#dbe4df] bg-white" : "border-[#f0b2a4] bg-[#fff7f4]"}`}><div className="flex items-start justify-between gap-4"><h2 className="font-bold text-[#173f3b]">{notification.title}</h2>{!notification.readAt && <button type="button" onClick={() => markRead(notification.id)} className="rounded-lg border border-[#e85d3f] px-3 py-2 text-xs font-bold text-[#b33f2d] focus:outline-none focus:ring-2 focus:ring-[#e85d3f]">Mark read</button>}</div><p className="mt-2 text-sm text-[#55706c]">{notification.body}</p><time className="mt-3 block text-xs text-[#8a9b96]" dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString("en-IN")}</time></article>)}</div>;
}
