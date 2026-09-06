import { NextResponse } from "next/server";
import { handlePaymentWebhook } from "@/lib/commerce-domain";
export async function POST(request: Request) { try { const rawBody = await request.text(); const signature = request.headers.get("x-payment-signature"); const result = await handlePaymentWebhook(rawBody, signature); return NextResponse.json(result); } catch { return NextResponse.json({ error: "Payment webhook could not be verified or processed." }, { status: 400 }); } }
