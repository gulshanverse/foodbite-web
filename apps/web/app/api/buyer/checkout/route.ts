import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGatewayOrder } from "@/lib/payment";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUYER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const order = await prisma.order.findFirst({ where: { id: orderId, buyerId: user.id, status: "PENDING_PAYMENT" }, include: { payment: true } });
  if (!order || !order.payment) return NextResponse.json({ error: "Pending order not found." }, { status: 404 });
  try {
    const gatewayOrder = await createGatewayOrder({ id: order.id, amount: order.totalAmount, currency: order.currency });
    await prisma.payment.update({ where: { id: order.payment.id }, data: { providerOrderId: gatewayOrder.id, status: "PENDING" } });
    return NextResponse.json({ keyId: process.env.PAYMENT_KEY_ID, orderId: order.id, providerOrderId: gatewayOrder.id, amount: gatewayOrder.amount, currency: gatewayOrder.currency });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment setup failed." }, { status: 503 });
  }
}
