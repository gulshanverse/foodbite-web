import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { paymentWebhookSchema } from "@foodbite/validation";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/payment";
import { markPaymentFailed, markPaymentSuccessful } from "@/lib/order-domain";
import { createRequestId, log, safeErrorCategory } from "@/lib/logger";

const headers = (requestId: string) => ({ "x-request-id": requestId, "cache-control": "no-store" });

export async function POST(request: Request) {
  const requestId = createRequestId(request.headers.get("x-request-id"));
  const started = Date.now();
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? request.headers.get("x-webhook-signature") ?? "";
  let parsed: ReturnType<typeof paymentWebhookSchema.safeParse>;

  try {
    if (!verifyWebhookSignature(rawBody, signature)) {
      log("warn", "payment_webhook_rejected", { requestId, outcome: "invalid_signature" });
      return NextResponse.json({ error: "Invalid webhook signature.", requestId }, { status: 401, headers: headers(requestId) });
    }
    parsed = paymentWebhookSchema.safeParse(JSON.parse(rawBody));
  } catch (error) {
    log("warn", "payment_webhook_rejected", { requestId, outcome: "malformed_or_unconfigured", category: safeErrorCategory(error) });
    return NextResponse.json({ error: "Invalid webhook request.", requestId }, { status: 400, headers: headers(requestId) });
  }
  if (!parsed.success) return NextResponse.json({ error: "Invalid webhook payload.", requestId }, { status: 400, headers: headers(requestId) });

  const event = parsed.data;
  try {
    let record: { id: string; processedAt: Date | null };
    try {
      record = await prisma.paymentWebhook.create({
        data: { eventId: event.eventId, provider: event.provider, eventType: event.eventType, payload: { orderId: event.orderId, status: event.status }, receivedAt: new Date() },
        select: { id: true, processedAt: true },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      const existing = await prisma.paymentWebhook.findUnique({ where: { eventId: event.eventId }, select: { id: true, provider: true, processedAt: true } });
      if (!existing || existing.provider !== event.provider) throw new Error("payment_webhook_event_conflict");
      log("info", "payment_webhook_duplicate", { requestId, eventId: event.eventId, processed: Boolean(existing.processedAt), durationMs: Date.now() - started });
      return NextResponse.json({ ok: true, duplicate: true, requestId }, { headers: headers(requestId) });
    }

    const payment = await prisma.payment.findUnique({ where: { orderId: event.orderId }, select: { provider: true, providerOrderId: true } });
    if (!payment?.providerOrderId || payment.provider !== event.provider) throw new Error("payment_provider_order_mismatch");
    if (event.status === "SUCCESS") await markPaymentSuccessful(payment.providerOrderId, event.providerPaymentId ?? "unknown");
    else if (event.status === "FAILED") await markPaymentFailed(payment.providerOrderId, "provider_failed");
    // REFUNDED is recorded and authenticated here; refund reconciliation remains provider-specific.
    await prisma.paymentWebhook.update({ where: { id: record.id }, data: { processedAt: new Date() } });
    log("info", "payment_webhook_processed", { requestId, eventId: event.eventId, status: event.status, durationMs: Date.now() - started });
    return NextResponse.json({ ok: true, requestId }, { headers: headers(requestId) });
  } catch (error) {
    log("error", "payment_webhook_failed", { requestId, eventId: event.eventId, category: safeErrorCategory(error), durationMs: Date.now() - started });
    return NextResponse.json({ error: "Payment webhook processing failed.", requestId }, { status: 503, headers: headers(requestId) });
  }
}
