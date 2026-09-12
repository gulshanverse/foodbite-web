import { requireRole } from "@/lib/authorization";
import { getOwnNgoProfile } from "@/lib/donation-domain";

export default async function NgoProfilePage() {
  const user = await requireRole("NGO");
  const profile = await getOwnNgoProfile(user.id);
  return (
    <main className="product-page">
      <p className="page-kicker">Recovery partner profile</p>
      <h1 className="mt-3 text-4xl font-black sm:text-5xl">Your profile</h1>
      <p className="mt-3 max-w-2xl">Keep the details sellers need for responsible donation coordination current.</p>
      <section className="form-section mt-7 max-w-3xl">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Organization</p><p className="mt-2 text-lg font-black">{profile?.organizationName ?? "Not provided"}</p></div>
          <div><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Verification</p><p className="mt-2 text-lg font-black">{profile?.verificationStatus?.replaceAll("_", " ") ?? "Pending"}</p></div>
          <div><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Contact person</p><p className="mt-2 text-lg font-black">{profile?.contactPerson ?? "Not provided"}</p></div>
          <div><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Service area</p><p className="mt-2 text-lg font-black">{profile?.serviceArea ?? "Not provided"}</p></div>
        </div>
        <p className="mt-7 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--muted)]">Profile editing is available through the existing NGO profile API. FoodBite does not certify food safety; keep seller-provided food information and collection procedures under your organization’s responsibility.</p>
      </section>
    </main>
  );
}
