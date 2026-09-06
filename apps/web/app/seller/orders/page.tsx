import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SellerOrdersPage() {
  const user = await getCurrentUser(); if (!user || user.role !== "SELLER") redirect("/login?callbackUrl=/seller/orders");
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id } }); if (!seller) redirect("/seller");
  const orders = await prisma.order.findMany({ where: { items: { some: { sellerId: seller.id } } }, orderBy: { createdAt: "desc" }, include: { items: { where: { sellerId: seller.id } }, pickup: true, payment: true } });
  return <main className="mx-auto max-w-6xl px-6 py-10 lg:px-10"><h1 className="text-3xl font-bold text-[#173f3b]">Orders</h1><p className="mt-2 text-[#55706c]">Prepare paid orders, mark them ready, and verify pickup codes.</p><div className="mt-8 overflow-x-auto rounded-2xl border border-[#dbe4df]"><table className="w-full text-left text-sm"><thead className="bg-[#eef2ef] text-[#173f3b]"><tr><th className="p-4">Order</th><th className="p-4">Items</th><th className="p-4">Payment</th><th className="p-4">Status</th><th className="p-4">Pickup</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-t border-[#dbe4df]"><td className="p-4 font-semibold">{order.orderNumber}</td><td className="p-4">{order.items.map((item) => `${item.listingName} × ${item.quantity}`).join(", ")}</td><td className="p-4">₹{Math.round(order.totalAmount / 100)} · {order.payment?.status}</td><td className="p-4 font-semibold">{order.status.replaceAll("_", " ")}</td><td className="p-4">{order.pickup?.status ?? "—"}</td></tr>)}{!orders.length && <tr><td colSpan={5} className="p-10 text-center text-[#55706c]">No orders yet.</td></tr>}</tbody></table></div></main>;
}
