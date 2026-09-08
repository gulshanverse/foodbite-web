import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!seller) return NextResponse.json({ orders: [] });
  const orders = await prisma.order.findMany({ where: { items: { some: { sellerId: seller.id } } }, orderBy: { createdAt: "desc" }, take: 100, include: { items: { where: { sellerId: seller.id } }, payment: { select: { status: true, amount: true, currency: true } }, pickup: { select: { status: true, readyAt: true, pickedUpAt: true } }, delivery: { select: { status: true, city: true, state: true, postalCode: true, recipientName: true, phone: true, addressLine1: true, locality: true } } } });
  return NextResponse.json({ orders });
}
