import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { markPaymentSuccessful } from "@/lib/order-domain";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  try { if (!verifyWebhookSignature(rawBody, signature)) return NextResponse.json({ error: "Invalid signature." }, { status: 400 }); }
  catch { return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 503 }); }
  let payload: { event?: string; id?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try { payload = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const eventId = payload.id;
  if (!eventId) return NextResponse.json({ error: "Missing event id." }, { status: 400 });
  const existing = await prisma.paymentWebhook.findUnique({ where: { eventId } });
  if (existing?.processedAt) return NextResponse.json({ received: true });
  const webhook = existing ?? await prisma.paymentWebhook.create({ data: { eventId, provider: "razorpay", eventType: payload.event ?? "unknown", payload } });
  if (payload.event === "payment.captured") {
    const entity = payload.payload?.payment?.entity;
    if (entity?.order_id && entity.id) {
      try {
        const payment = await prisma.payment.findUnique({ where: { providerOrderId: entity.order_id } });
        if (payment) await markPaymentSuccessful(entity.order_id, entity.id);
        await prisma.paymentWebhook.update({ where: { id: webhook.id }, data: { processedAt: new Date(), paymentId: payment?.id } });
      } catch { return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 }); }
    }
  } else {
    await prisma.paymentWebhook.update({ where: { id: webhook.id }, data: { processedAt: new Date() } });
  }
  return NextResponse.json({ received: true });
}
