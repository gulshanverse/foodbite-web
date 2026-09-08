import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { hashSecret } from "@/lib/order-domain";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import { notifyOrderEvent } from "@/lib/notification-domain";

const schema = z.object({ orderId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const profile = await prisma.sellerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: "Seller profile not found." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid pickup code." }, { status: 400 });
  const updated = await prisma.$transaction(async (tx) => {
    const pickup = await tx.pickup.findFirst({ where: { orderId: parsed.data.orderId, status: "READY", pickupCodeHash: hashSecret(parsed.data.code), order: { items: { some: { sellerId: profile.id } }, status: "READY_FOR_PICKUP" } } });
    if (!pickup) throw new Error("Pickup code does not match or pickup is not ready.");
    const changed = await tx.pickup.updateMany({ where: { id: pickup.id, status: "READY" }, data: { status: "PICKED_UP", pickedUpAt: new Date() } });
    if (changed.count !== 1) throw new Error("Pickup has already been completed.");
    return tx.order.update({ where: { id: parsed.data.orderId }, data: { status: "PICKED_UP" } });
  });
  await recordAuditEvent({ actorId: user.id, action: "PICKUP_VERIFIED", resourceType: "Order", resourceId: parsed.data.orderId, metadata: { outcome: "success" } });
  void notifyOrderEvent(parsed.data.orderId, "ORDER_PICKED_UP").catch((error) => console.error(JSON.stringify({ operation: "notification_dispatch", orderId: parsed.data.orderId, type: "ORDER_PICKED_UP", outcome: "failed", errorCategory: error instanceof Error ? error.message : "unknown" })));
  return NextResponse.json({ order: updated });
}
