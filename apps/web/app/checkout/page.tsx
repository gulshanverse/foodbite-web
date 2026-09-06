import { redirect } from "next/navigation";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getCurrentUser } from "@/lib/auth";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUYER") redirect("/login?callbackUrl=/checkout");
  return <main className="mx-auto max-w-6xl px-6 py-12 lg:px-10"><CheckoutClient /></main>;
}
