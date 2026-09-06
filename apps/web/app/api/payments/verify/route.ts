import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markPaymentSuccessful } from "@/lib/order-domain";
import { verifyCheckoutSignature } from "@/lib/payment";

const schema = z.object({ orderId: z.string().uuid(), providerOrderId: z.string().min(1).max(200), providerPaymentId: z.string().min(1).max(200), signature: z.string().min(1).max(200) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUYER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !verifyCheckoutSignature(parsed.success ? parsed.data.providerOrderId : "", parsed.success ? parsed.data.providerPaymentId : "", parsed.success ? parsed.data.signature : "")) return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  const payment = await prisma.payment.findFirst({ where: { providerOrderId: parsed.data.providerOrderId, order: { id: parsed.data.orderId, buyerId: user.id } } });
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  const order = await markPaymentSuccessful(parsed.data.providerOrderId, parsed.data.providerPaymentId);
  return NextResponse.json({ order });
}
