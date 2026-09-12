import { requireRole } from "@/lib/authorization";
import { ShieldCheck, Store, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function SellerProfilePage() {
  const user = await requireRole("SELLER");
  return (
    <main>
      <div className="mx-auto max-w-5xl px-1 py-8 sm:px-3 lg:py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[var(--accent)]">Seller profile</p>
            <h1 className="mt-2">Your seller profile</h1>
            <p className="mt-3 text-base">Manage your seller identity and verification status.</p>
          </div>
          <Link href="/seller/business" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--foreground)] no-underline hover:bg-[var(--surface-muted)]">Business settings <ArrowRight size={16} /></Link>
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
            <div className="flex items-start gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--surface-muted)] text-[var(--foreground)]"><Store size={24} /></div>
              <div><p className="text-xs font-bold uppercase tracking-[.12em]">Account</p><h2 className="mt-1 text-2xl font-extrabold">{user.email}</h2><p className="mt-2 text-sm">Seller account · Active</p></div>
            </div>
            <div className="mt-8 border-t border-[var(--border)] pt-6">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[var(--accent)]" size={21} /><div><h3 className="font-bold">Verification</h3><p className="mt-1 text-sm">Seller verification is pending the onboarding workflow. FoodBite does not represent this seller as verified until that process is completed.</p></div></div>
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-6 sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[var(--accent)]">Next step</p>
            <h2 className="mt-2 text-xl font-extrabold">Complete your business profile</h2>
            <p className="mt-2 text-sm">Add pickup, delivery and operating-hour details so your listings can present clear fulfillment information.</p>
            <Link href="/seller/business" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--foreground)]">Open business settings <ArrowRight size={15} /></Link>
          </div>
        </section>
      </div>
    </main>
  );
}
