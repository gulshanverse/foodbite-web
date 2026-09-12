import { redirect } from "next/navigation";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getCurrentUser } from "@/lib/auth";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUYER") redirect("/login?callbackUrl=/checkout");
  return <main className="product-page"><div className="mb-7"><p className="page-kicker">Final step</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">Checkout</h1><p className="mt-3 max-w-2xl">Choose how you will receive your order, then continue to secure payment.</p></div><CheckoutClient /></main>;
}
