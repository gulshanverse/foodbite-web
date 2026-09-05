"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

type Razorpay = new (options: Record<string, unknown>) => { open: () => void };
declare global { interface Window { Razorpay?: Razorpay } }

export function CheckoutClient() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function checkout() {
    setBusy(true); setError("");
    try {
      const orderResponse = await fetch("/api/buyer/orders", { method: "POST" });
      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.error ?? "Unable to reserve your cart.");
      const order = orderData.order as { id: string };
      const paymentResponse = await fetch("/api/buyer/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: order.id }) });
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentData.error ?? "Unable to start payment.");
      if (!window.Razorpay) throw new Error("Payment checkout is still loading. Please try again.");
      const checkoutWindow = new window.Razorpay({ key: paymentData.keyId, amount: paymentData.amount, currency: paymentData.currency, name: "FoodBite", description: "Surplus food pickup", order_id: paymentData.providerOrderId, handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verify = await fetch("/api/payments/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: order.id, providerOrderId: response.razorpay_order_id, providerPaymentId: response.razorpay_payment_id, signature: response.razorpay_signature }) });
        if (!verify.ok) { setError("Payment was received but verification failed. Please contact support with your order number."); return; }
        router.push(`/orders/${order.id}`); router.refresh();
      }, theme: { color: "#173f3b" } });
      checkoutWindow.open();
    } catch (err) { setError(err instanceof Error ? err.message : "Checkout failed."); }
    finally { setBusy(false); }
  }
  return <><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" /><div className="max-w-xl rounded-3xl border border-[#dbe4df] p-6"><h1 className="text-3xl font-bold text-[#173f3b]">Checkout</h1><p className="mt-3 text-[#55706c]">Your cart will be reserved for 10 minutes while payment is completed.</p><div className="mt-6 rounded-2xl bg-[#eef2ef] p-4 text-sm text-[#173f3b]"><strong>Pickup only.</strong> The seller will prepare the order for the displayed pickup window.</div>{error && <p className="mt-5 rounded-xl bg-[#fff1e9] p-4 text-sm text-[#b33f2d]">{error}</p>}<button onClick={checkout} disabled={busy} className="mt-6 w-full rounded-xl bg-[#e85d3f] px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "Preparing secure checkout…" : "Continue to payment"}</button><p className="mt-3 text-xs text-[#8a9b96]">FoodBite never treats the browser as the source of truth for price or payment status.</p></div></>;
}
