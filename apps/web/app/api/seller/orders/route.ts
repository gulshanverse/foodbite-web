import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const transitionSchema = z.object({ orderId: z.string().uuid(), status: z.enum(["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED", "CANCELLED"]) });
const allowed: Record<string, string[]> = { PAID: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["PREPARING", "CANCELLED"], PREPARING: ["READY_FOR_PICKUP"], READY_FOR_PICKUP: ["COMPLETED"] };

async function seller() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SELLER" || user.status !== "ACTIVE") return null;
  return prisma.sellerProfile.findUnique({ where: { userId: user.id } });
}

export async function GET() {
  const profile = await seller();
  if (!profile) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const orders = await prisma.order.findMany({ where: { items: { some: { sellerId: profile.id } } }, orderBy: { createdAt: "desc" }, include: { items: { where: { sellerId: profile.id } }, pickup: true, payment: true } });
  return NextResponse.json({ orders });
}

export async function PATCH(request: Request) {
  const profile = await seller();
  if (!profile) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = transitionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order transition." }, { status: 400 });
  const order = await prisma.order.findFirst({ where: { id: parsed.data.orderId, items: { some: { sellerId: profile.id } } }, include: { items: true, pickup: true } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!allowed[order.status]?.includes(parsed.data.status)) return NextResponse.json({ error: `Cannot move ${order.status} to ${parsed.data.status}.` }, { status: 409 });
  if (parsed.data.status === "READY_FOR_PICKUP" && !order.pickup) return NextResponse.json({ error: "Pickup credentials are not initialized." }, { status: 409 });
  const updated = await prisma.order.update({ where: { id: order.id }, data: { status: parsed.data.status }, include: { items: true, pickup: true } });
  if (parsed.data.status === "READY_FOR_PICKUP") await prisma.pickup.update({ where: { orderId: order.id }, data: { status: "READY", readyAt: new Date() } });
  return NextResponse.json({ order: updated });
}
