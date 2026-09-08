import { createHmac } from "node:crypto";

export type PaymentOrder = { id: string; amount: number; currency: string };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function authHeader() { return `Basic ${Buffer.from(`${required("PAYMENT_KEY_ID")}:${required("PAYMENT_KEY_SECRET")}`).toString("base64")}`; }

export async function createGatewayOrder(input: PaymentOrder) {
  const provider = process.env.PAYMENT_PROVIDER ?? "razorpay";
  if (provider !== "razorpay") throw new Error(`Unsupported payment provider: ${provider}`);
  const response = await fetch("https://api.razorpay.com/v1/orders", { method: "POST", headers: { Authorization: authHeader(), "Content-Type": "application/json" }, body: JSON.stringify({ amount: input.amount, currency: input.currency, receipt: input.id, notes: { orderId: input.id } }), cache: "no-store" });
  if (!response.ok) throw new Error("Payment gateway order creation failed.");
  return response.json() as Promise<{ id: string; amount: number; currency: string; status: string }>;
}

export async function refundGatewayPayment(providerPaymentId: string, amount: number) {
  const provider = process.env.PAYMENT_PROVIDER ?? "razorpay";
  if (provider !== "razorpay") throw new Error(`Unsupported payment provider: ${provider}`);
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(providerPaymentId)}/refund`, { method: "POST", headers: { Authorization: authHeader(), "Content-Type": "application/json" }, body: JSON.stringify({ amount }), cache: "no-store" });
  if (!response.ok) throw new Error("Payment gateway refund failed.");
  return response.json() as Promise<{ id: string; status: string; amount: number }>;
}

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const secret = required("PAYMENT_KEY_SECRET");
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return expected.length === signature.length && expected === signature;
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = required("PAYMENT_WEBHOOK_SECRET");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected.length === signature.length && expected === signature;
}
