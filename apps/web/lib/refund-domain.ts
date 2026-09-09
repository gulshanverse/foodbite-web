import { prisma } from "@/lib/prisma";
import { refundGatewayPayment } from "@/lib/payment";
import { recordAuditEvent } from "@/lib/audit";
import { notifyOrderEvent } from "@/lib/notification-domain";
import { log, safeErrorCategory } from "@/lib/logger";

function dispatch(orderId: string, type: "REFUND_PENDING" | "REFUND_COMPLETED") { void notifyOrderEvent(orderId, type).catch((error) => log("error", "notification_dispatch_failed", { orderId, type, category: safeErrorCategory(error) })); }

export async function refundOrder(actorId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order?.payment) throw new Error("Payment not found.");
  if (order.status === "REFUNDED" || order.payment.status === "REFUNDED") return order;
  if (order.payment.status !== "SUCCESS" || !order.payment.providerPaymentId) throw new Error("Only a provider-confirmed payment can be refunded.");
  await prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({ where: { id: orderId, status: { in: ["PAID", "CANCELLED", "REFUND_PENDING"] } }, data: { status: "REFUND_PENDING" } });
    if (changed.count !== 1 && order.status !== "REFUND_PENDING") throw new Error("Order is not eligible for refund.");
    await tx.payment.update({ where: { id: order.payment!.id }, data: { status: "PENDING" } });
  });
  dispatch(orderId, "REFUND_PENDING");
  try {
    await refundGatewayPayment(order.payment.providerPaymentId, order.payment.amount);
  } catch (error) {
    await recordAuditEvent({ actorId, action: "REFUND_FAILED", resourceType: "Order", resourceId: orderId, metadata: { outcome: "provider_rejected" } });
    throw error;
  }
  const refunded = await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: order.payment!.id }, data: { status: "REFUNDED" } });
    return tx.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
  });
  await recordAuditEvent({ actorId, action: "REFUND_CONFIRMED", resourceType: "Order", resourceId: orderId, metadata: { outcome: "provider_confirmed" } });
  dispatch(orderId, "REFUND_COMPLETED");
  return refunded;
}
