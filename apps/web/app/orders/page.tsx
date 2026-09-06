import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBuyerOrders } from "@/lib/order-domain";

export default async function OrdersPage() {
  const user = await getCurrentUser(); if (!user || user.role !== "BUYER") redirect("/login?callbackUrl=/orders");
  const orders = await getBuyerOrders(user.id);
  return <main className="mx-auto max-w-5xl px-6 py-12 lg:px-10"><h1 className="text-4xl font-bold text-[#173f3b]">Your orders</h1><p className="mt-2 text-[#55706c]">Track pickup orders and payment status.</p><div className="mt-8 space-y-4">{orders.length ? orders.map((order) => <Link key={order.id} href={`/orders/${order.id}`} className="block rounded-2xl border border-[#dbe4df] p-5 transition hover:border-[#173f3b]"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-[#173f3b]">{order.orderNumber}</p><p className="mt-1 text-sm text-[#55706c]">{order.items.length} item{order.items.length === 1 ? "" : "s"} · {new Date(order.createdAt).toLocaleString("en-IN")}</p></div><span className="rounded-full bg-[#eef2ef] px-3 py-1 text-sm font-bold text-[#173f3b]">{order.status.replaceAll("_", " ")}</span></div><p className="mt-4 font-bold text-[#173f3b]">₹{Math.round(order.totalAmount / 100)}</p></Link>) : <div className="rounded-3xl border border-[#dbe4df] p-10 text-center"><h2 className="text-xl font-bold text-[#173f3b]">No orders yet</h2><Link href="/explore" className="mt-4 inline-block font-semibold text-[#173f3b] underline">Explore surplus food</Link></div>}</div></main>;
}
