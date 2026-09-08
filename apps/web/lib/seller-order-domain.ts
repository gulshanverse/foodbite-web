import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";

const transitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PAID: ["CONFIRMED"],
  CONFIRMED: ["PREPARING"],
  PREPARING: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["PICKED_UP"],
  PICKED_UP: ["COMPLETED"],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus) { return transitions[from]?.includes(to) ?? false; }

export async function transitionSellerOrder(userId: string, orderId: string, to: Extract<OrderStatus, "CONFIRMED" | "PREPARING" | "READY_FOR_PICKUP" | "CANCELLED" | "COMPLETED">) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!seller) throw new Error("Seller profile not found.");
  const order = await prisma.order.findFirst({ where: { id: orderId, items: { some: { sellerId: seller.id } } }, select: { id: true, status: true } });
  if (!order || !canTransitionOrder(order.status, to)) throw new Error("Order transition is not allowed.");
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.update({ where: { id: orderId }, data: { status: to, completedAt: to === "COMPLETED" ? new Date() : undefined, cancelledAt: to === "CANCELLED" ? new Date() : undefined } });
    if (to === "READY_FOR_PICKUP") await tx.pickup.updateMany({ where: { orderId, status: { in: ["PENDING", "READY"] } }, data: { status: "READY", readyAt: new Date() } });
    return result;
  });
  await recordAuditEvent({ actorId: userId, action: "SELLER_ORDER_STATUS_CHANGED", resourceType: "Order", resourceId: orderId, metadata: { from: order.status, to } });
  return updated;
}
