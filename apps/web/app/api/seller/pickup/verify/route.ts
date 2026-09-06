import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hashSecret } from "@/lib/order-domain";
import { prisma } from "@/lib/prisma";

const schema = z.object({ orderId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const profile = await prisma.sellerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid pickup code." }, { status: 400 });
  const pickup = await prisma.pickup.findFirst({ where: { orderId: parsed.data.orderId, order: { items: { some: { sellerId: profile.id } }, status: { in: ["PAID", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP"] } } } });
  if (!pickup || pickup.pickupCodeHash !== hashSecret(parsed.data.code)) return NextResponse.json({ error: "Pickup code does not match." }, { status: 400 });
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: parsed.data.orderId } });
    if (!current || current.status === "PICKED_UP" || current.status === "COMPLETED") throw new Error("Order has already been picked up.");
    await tx.pickup.update({ where: { id: pickup.id }, data: { status: "PICKED_UP", pickedUpAt: new Date() } });
    return tx.order.update({ where: { id: current.id }, data: { status: "PICKED_UP" } });
  });
  return NextResponse.json({ order: updated });
}
