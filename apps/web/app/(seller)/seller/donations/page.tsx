import { requireRole } from '@/lib/authorization';
import { listSellerDonations } from '@/lib/donation-domain';
type SellerDonation = Awaited<ReturnType<typeof listSellerDonations>>[number];
type SellerDonationReservation = SellerDonation['reservations'][number];

export default async function SellerDonationsPage() {
  const user = await requireRole('SELLER');
  const donations = await listSellerDonations(user.id);
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#e85d3f]">
        Seller operations
      </p>
      <h1 className="mt-3 text-4xl font-bold text-[#173f3b]">Donations</h1>
      <p className="mt-3 text-[#55706c]">
        Donation quantities are reserved from real inventory. Seller-provided food information is
        not a FoodBite safety certification.
      </p>
      <div className="mt-10 space-y-4">
        {donations.map((donation: SellerDonation) => (
          <article key={donation.id} className="rounded-2xl border border-[#dbe4df] bg-white p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="font-bold text-[#173f3b]">{donation.listing.name}</h2>
              <span className="rounded-full bg-[#eef2ef] px-3 py-1 text-xs font-bold">
                {donation.status.replaceAll('_', ' ')}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#55706c]">
              Available {donation.availableQuantity} · Reserved {donation.reservedQuantity} ·
              Collected {donation.collectedQuantity}
            </p>
            {donation.reservations.map((reservation: SellerDonationReservation) => (
              <p key={reservation.id} className="mt-3 text-sm text-[#55706c]">
                Recovery partner: {reservation.ngo.organizationName} · {reservation.quantity}{' '}
                portions
              </p>
            ))}
          </article>
        ))}
        {!donations.length && <p className="text-sm text-[#55706c]">No donations created yet.</p>}
      </div>
    </main>
  );
}
