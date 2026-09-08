import { prisma } from "@/lib/prisma";
import type { NotificationChannel, NotificationType } from "@prisma/client";

const MAX_ATTEMPTS = 3;
const RETRY_MINUTES = [5, 30, 120];

type EventPayload = { orderNumber: string; totalAmount: number; pickupCity?: string | null; pickupPincode?: string | null; itemSummary?: string; sellerName?: string | null };

export type NotificationEvent = { eventId: string; recipientId: string; recipientEmail?: string | null; type: NotificationType; payload: EventPayload };

function formatAmount(amount: number) { return `₹${Math.round(amount / 100)}`; }
function template(type: NotificationType, payload: EventPayload) {
  switch (type) {
    case "ORDER_CREATED": return { title: "Order created", body: `Your order ${payload.orderNumber} was created. Complete payment to reserve your food.` };
    case "PAYMENT_SUCCESS": return { title: "Payment confirmed", body: `Payment for order ${payload.orderNumber} of ${formatAmount(payload.totalAmount)} was successful.` };
    case "PAYMENT_FAILED": return { title: "Payment unsuccessful", body: `Payment for order ${payload.orderNumber} was not successful. You can try again from your order page.` };
    case "ORDER_CONFIRMED": return { title: "Order confirmed", body: `Your order ${payload.orderNumber} has been confirmed by the seller.` };
    case "ORDER_PREPARING": return { title: "Order is being prepared", body: `The seller is preparing order ${payload.orderNumber}.` };
    case "ORDER_READY_FOR_PICKUP": return { title: "Order ready for pickup", body: `Order ${payload.orderNumber} is ready for pickup${payload.pickupCity ? ` in ${payload.pickupCity}` : ""}. Open your authenticated order page for pickup instructions.` };
    case "ORDER_PICKED_UP": return { title: "Pickup completed", body: `Pickup for order ${payload.orderNumber} has been recorded.` };
    case "ORDER_COMPLETED": return { title: "Order completed", body: `Order ${payload.orderNumber} is complete. Thank you for helping reduce food waste.` };
    case "ORDER_CANCELLED": return { title: "Order cancelled", body: `Order ${payload.orderNumber} was cancelled.` };
    case "REFUND_PENDING": return { title: "Refund initiated", body: `A refund for order ${payload.orderNumber} is being processed.` };
    case "REFUND_COMPLETED": return { title: "Refund completed", body: `Your refund for order ${payload.orderNumber} has been processed.` };
    case "NEW_SELLER_ORDER": return { title: "New paid order", body: `A new paid order ${payload.orderNumber} requires your attention${payload.itemSummary ? `: ${payload.itemSummary}` : "."}` };
    case "OPERATIONAL_ALERT": return { title: "FoodBite operational alert", body: `There is an operational update related to order ${payload.orderNumber}.` };
  }
}

export async function createNotificationEvents(events: NotificationEvent[]) {
  for (const event of events) {
    const message = template(event.type, event.payload);
    await prisma.notification.upsert({
      where: { eventId_recipientId_type_channel: { eventId: event.eventId, recipientId: event.recipientId, type: event.type, channel: "IN_APP" } },
      create: { eventId: event.eventId, recipientId: event.recipientId, type: event.type, channel: "IN_APP", title: message.title, body: message.body, status: "SENT", sentAt: new Date(), metadata: { orderNumber: event.payload.orderNumber } },
      update: {},
    });
    const preference = await prisma.notificationPreference.findUnique({ where: { userId: event.recipientId }, select: { emailNotifications: true } });
    if (preference?.emailNotifications !== false && event.recipientEmail) {
      await prisma.notification.upsert({
        where: { eventId_recipientId_type_channel: { eventId: event.eventId, recipientId: event.recipientId, type: event.type, channel: "EMAIL" } },
        create: { eventId: event.eventId, recipientId: event.recipientId, type: event.type, channel: "EMAIL", title: message.title, body: message.body, status: "PENDING", metadata: { orderNumber: event.payload.orderNumber } },
        update: {},
      });
    }
  }
}

export async function notifyOrderEvent(orderId: string, type: NotificationType) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { buyer: true, items: { include: { seller: { include: { user: true, business: true } } } } } });
  if (!order) return;
  const payload: EventPayload = { orderNumber: order.orderNumber, totalAmount: order.totalAmount, pickupCity: order.pickupCity, pickupPincode: order.pickupPincode };
  const events: NotificationEvent[] = [{ eventId: `${order.id}:${type}:buyer`, recipientId: order.buyerId, recipientEmail: order.buyer.email, type, payload }];
  if (type === "PAYMENT_SUCCESS") {
    const sellers = new Map(order.items.map((item) => [item.sellerId, item.seller]));
    for (const [sellerId, seller] of sellers) events.push({ eventId: `${order.id}:NEW_SELLER_ORDER:${sellerId}`, recipientId: seller.userId, recipientEmail: seller.user.email, type: "NEW_SELLER_ORDER", payload: { ...payload, itemSummary: order.items.filter((item) => item.sellerId === sellerId).map((item) => `${item.quantity} × ${item.listingName}`).join(", "), sellerName: seller.business?.name } });
  }
  await createNotificationEvents(events);
}

export async function processPendingNotification(id: string) {
  const now = new Date();
  const claimed = await prisma.notification.updateMany({ where: { id, channel: "EMAIL", status: { in: ["PENDING", "FAILED"] }, deliveryAttempts: { lt: MAX_ATTEMPTS }, OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] }, data: { status: "PROCESSING", processedAt: now, deliveryAttempts: { increment: 1 } } });
  if (claimed.count !== 1) return { skipped: true };
  const notification = await prisma.notification.findUnique({ where: { id }, include: { recipient: { select: { email: true } } } });
  if (!notification) return { skipped: true };
  try {
    await emailProvider.send({ to: notification.recipient.email, subject: notification.title, text: notification.body });
    await prisma.notification.update({ where: { id }, data: { status: "SENT", sentAt: new Date(), lastError: null } });
    console.info(JSON.stringify({ operation: "notification_delivery", notificationId: id, eventType: notification.type, channel: notification.channel, provider: "resend", result: "sent" }));
    return { sent: true };
  } catch (error) {
    const attempts = notification.deliveryAttempts;
    await prisma.notification.update({ where: { id }, data: { status: "FAILED", lastError: error instanceof Error ? error.message.slice(0, 200) : "provider_failure", nextAttemptAt: attempts < MAX_ATTEMPTS ? new Date(Date.now() + RETRY_MINUTES[Math.min(attempts - 1, RETRY_MINUTES.length - 1)] * 60_000) : null } });
    console.warn(JSON.stringify({ operation: "notification_delivery", notificationId: id, eventType: notification.type, channel: notification.channel, provider: "resend", result: "failed", failureCategory: error instanceof Error ? error.message : "provider_failure", attempt: attempts }));
    return { sent: false, failed: true };
  }
}

export async function processPendingNotifications(limit = 25) {
  const pending = await prisma.notification.findMany({ where: { channel: "EMAIL", status: { in: ["PENDING", "FAILED"] }, deliveryAttempts: { lt: MAX_ATTEMPTS }, OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }] }, orderBy: { createdAt: "asc" }, take: Math.min(limit, 100), select: { id: true } });
  const results = []; for (const item of pending) results.push(await processPendingNotification(item.id)); return results;
}

export const emailProvider = {
  async send(input: { to: string; subject: string; text: string }) {
    const apiKey = process.env.EMAIL_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) throw new Error("email_provider_unavailable");
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.text }), cache: "no-store" });
    if (!response.ok) throw new Error("email_provider_rejected");
  },
};

export function isNotificationChannel(value: string): value is NotificationChannel { return ["IN_APP", "EMAIL", "SMS", "PUSH", "WHATSAPP"].includes(value); }
