import { prisma } from "@/lib/prisma";
import { donationReservationSchema, donationSchema, ngoProfileSchema } from "@foodbite/validation";
import { createPickupSecrets, hashSecret } from "@/lib/order-domain";
import { recordAuditEvent } from "@/lib/audit";
import { createNotificationEvents } from "@/lib/notification-domain";
import { log, safeErrorCategory } from "@/lib/logger";
import type { DonationStatus, SellerVerificationStatus } from "@prisma/client";

const verificationTransitions: Record<SellerVerificationStatus, SellerVerificationStatus[]> = { PENDING: ["UNDER_REVIEW", "REJECTED"], UNDER_REVIEW: ["VERIFIED", "REJECTED", "SUSPENDED"], VERIFIED: ["SUSPENDED"], REJECTED: ["UNDER_REVIEW"], SUSPENDED: ["UNDER_REVIEW"] };
export function canTransitionNgoVerification(from: SellerVerificationStatus, to: SellerVerificationStatus) { return verificationTransitions[from].includes(to); }

const donationTransitions: Partial<Record<DonationStatus, DonationStatus[]>> = { AVAILABLE: ["RESERVED", "CANCELLED", "EXPIRED"], RESERVED: ["ACCEPTED", "CANCELLED", "EXPIRED"], ACCEPTED: ["READY_FOR_PICKUP", "CANCELLED"], READY_FOR_PICKUP: ["COLLECTED", "FAILED_COLLECTION"], COLLECTED: ["COMPLETED"], FAILED_COLLECTION: ["READY_FOR_PICKUP", "CANCELLED"] };
export function canTransitionDonation(from: DonationStatus, to: DonationStatus) { return donationTransitions[from]?.includes(to) ?? false; }

async function notifyDonation(donationId: string, type: "DONATION_AVAILABLE" | "DONATION_RESERVED" | "DONATION_ACCEPTED" | "DONATION_READY" | "DONATION_COLLECTED" | "DONATION_COMPLETED" | "DONATION_CANCELLED" | "DONATION_EXPIRED", recipientIds: string[]) {
  const events = recipientIds.map((recipientId) => ({ eventId: `${donationId}:${type}:${recipientId}`, recipientId, type, payload: { orderNumber: `DON-${donationId.slice(0, 8).toUpperCase()}`, totalAmount: 0 } }));
  try { await createNotificationEvents(events); } catch (error) { log("error", "donation_notification_failed", { donationId, type, category: safeErrorCategory(error) }); }
}

export async function getOwnNgoProfile(userId: string) { return prisma.nGOProfile.findUnique({ where: { userId } }); }
export async function updateNgoProfile(userId: string, input: unknown) { const value = ngoProfileSchema.parse(input); return prisma.nGOProfile.update({ where: { userId }, data: value }); }
export async function transitionNgoVerification(actorId: string, ngoId: string, to: SellerVerificationStatus, reason?: string) {
  const ngo = await prisma.nGOProfile.findUnique({ where: { id: ngoId }, select: { id: true, userId: true, verificationStatus: true } });
  if (!ngo || ngo.userId === actorId || !canTransitionNgoVerification(ngo.verificationStatus, to)) throw new Error("NGO verification transition is not allowed.");
  const updated = await prisma.nGOProfile.update({ where: { id: ngoId }, data: { verificationStatus: to } });
  await recordAuditEvent({ actorId, action: "NGO_VERIFICATION_CHANGED", resourceType: "NGOProfile", resourceId: ngoId, metadata: { from: ngo.verificationStatus, to, reason } });
  return updated;
}

export async function createDonation(userId: string, input: unknown) {
  const { listingId, quantity } = donationSchema.parse(input);
  const seller = await prisma.sellerProfile.findUnique({ where: { userId }, select: { id: true, verificationStatus: true, user: { select: { status: true } } } });
  if (!seller || seller.user.status !== "ACTIVE" || seller.verificationStatus !== "VERIFIED") throw new Error("Verified active seller access is required.");
  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Inventory" WHERE "listingId" = ${listingId}::uuid FOR UPDATE`;
    if (!locked.length) throw new Error("Inventory not found.");
    const listing = await tx.foodListing.findFirst({ where: { id: listingId, sellerId: seller.id, status: "ACTIVE", pickupEnd: { gt: new Date() }, seller: { user: { status: "ACTIVE" } } }, include: { inventory: true } });
    if (!listing?.inventory || quantity > listing.inventory.availableQuantity || quantity < 1) throw new Error("Donation quantity is unavailable.");
    const secrets = createPickupSecrets();
    await tx.inventory.update({ where: { listingId }, data: { availableQuantity: { decrement: quantity }, donatedQuantity: { increment: quantity }, version: { increment: 1 } } });
    return tx.donation.create({ data: { listingId, sellerId: seller.id, status: "AVAILABLE", quantity, availableQuantity: quantity, expiresAt: listing.pickupEnd, pickupCodeHash: hashSecret(secrets.code), pickupCodeLast4: secrets.code.slice(-4), qrTokenHash: hashSecret(secrets.token) }, include: { listing: true } });
  }, { isolationLevel: "Serializable" });
  await recordAuditEvent({ actorId: userId, action: "DONATION_CREATED", resourceType: "Donation", resourceId: result.id });
  return result;
}

export async function listAvailableDonations() { return prisma.donation.findMany({ where: { status: "AVAILABLE", expiresAt: { gt: new Date() }, listing: { status: "ACTIVE", seller: { user: { status: "ACTIVE" } } }, availableQuantity: { gt: 0 } }, include: { listing: { select: { name: true, foodType: true, preparedAt: true, packagingInfo: true, allergenInfo: true, pickupStart: true, pickupEnd: true }, }, seller: { include: { business: { select: { name: true, city: true, state: true } } } } }, orderBy: { expiresAt: "asc" }, take: 100 }); }
export async function listSellerDonations(userId: string) { return prisma.donation.findMany({ where: { seller: { userId } }, include: { listing: { select: { name: true, foodType: true, pickupStart: true, pickupEnd: true } }, reservations: { include: { ngo: { select: { organizationName: true, contactPerson: true, phone: true } } } } }, orderBy: { createdAt: "desc" } }); }
export async function listNgoDonations(userId: string) { return prisma.donationReservation.findMany({ where: { ngo: { userId } }, include: { donation: { include: { listing: { select: { name: true, foodType: true, pickupStart: true, pickupEnd: true }, }, seller: { include: { business: { select: { name: true, city: true, state: true, address: true } } } } } } }, orderBy: { createdAt: "desc" } }); }

export async function reserveDonation(userId: string, donationId: string, input: unknown) {
  const { quantity } = donationReservationSchema.parse(input);
  const ngo = await prisma.nGOProfile.findUnique({ where: { userId }, select: { id: true, verificationStatus: true, user: { select: { status: true } } } });
  if (!ngo || ngo.user.status !== "ACTIVE" || ngo.verificationStatus !== "VERIFIED") throw new Error("Verified active NGO access is required.");
  const result = await prisma.$transaction(async (tx) => {
    const donation = await tx.donation.findUnique({ where: { id: donationId }, include: { listing: true } });
    if (!donation || donation.status !== "AVAILABLE" || donation.expiresAt <= new Date() || donation.listing.status !== "ACTIVE" || donation.availableQuantity < quantity) throw new Error("Donation is unavailable.");
    const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Donation" WHERE "id" = ${donationId}::uuid FOR UPDATE`;
    if (!locked.length) throw new Error("Donation is unavailable.");
    await tx.donation.update({ where: { id: donationId }, data: { availableQuantity: { decrement: quantity }, reservedQuantity: { increment: quantity }, status: "RESERVED" } });
    return tx.donationReservation.create({ data: { donationId, ngoId: ngo.id, quantity } });
  }, { isolationLevel: "Serializable" });
  await recordAuditEvent({ actorId: userId, action: "DONATION_RESERVED", resourceType: "Donation", resourceId: donationId, metadata: { quantity } });
  return result;
}

export async function transitionSellerDonation(userId: string, donationId: string, to: Extract<DonationStatus, "ACCEPTED" | "READY_FOR_PICKUP" | "CANCELLED">) {
  const donation = await prisma.donation.findFirst({ where: { id: donationId, seller: { userId } }, include: { reservations: { include: { ngo: true } } } });
  if (!donation || !canTransitionDonation(donation.status, to)) throw new Error("Donation transition is not allowed.");
  const updated = await prisma.$transaction(async (tx) => {
    if (to === "CANCELLED") { const release = donation.availableQuantity + donation.reservedQuantity; await tx.inventory.update({ where: { listingId: donation.listingId }, data: { availableQuantity: { increment: release }, donatedQuantity: { decrement: release }, version: { increment: 1 } } }); await tx.donationReservation.updateMany({ where: { donationId, status: "ACTIVE" }, data: { status: "CANCELLED" } }); }
    return tx.donation.update({ where: { id: donationId }, data: { status: to } });
  });
  await recordAuditEvent({ actorId: userId, action: `DONATION_${to}`, resourceType: "Donation", resourceId: donationId });
  await notifyDonation(donationId, to === "ACCEPTED" ? "DONATION_ACCEPTED" : to === "READY_FOR_PICKUP" ? "DONATION_READY" : "DONATION_CANCELLED", donation.reservations.map((r) => r.ngo.userId));
  return updated;
}

export async function collectDonation(userId: string, donationId: string, code: string) {
  const ngo = await prisma.nGOProfile.findUnique({ where: { userId }, select: { id: true, verificationStatus: true, user: { select: { status: true } } } });
  if (!ngo || ngo.user.status !== "ACTIVE" || ngo.verificationStatus !== "VERIFIED") throw new Error("Verified active NGO access is required.");
  const result = await prisma.$transaction(async (tx) => {
    const donation = await tx.donation.findFirst({ where: { id: donationId, status: "READY_FOR_PICKUP", pickupCodeHash: hashSecret(code), reservations: { some: { ngoId: ngo.id, status: "ACTIVE" } } }, include: { reservations: { where: { ngoId: ngo.id, status: "ACTIVE" } } } });
    if (!donation) throw new Error("Donation handoff verification failed.");
    const total = donation.reservations.reduce((sum, r) => sum + r.quantity, 0);
    await tx.donationReservation.updateMany({ where: { donationId, ngoId: ngo.id, status: "ACTIVE" }, data: { status: "COLLECTED" } });
    await tx.inventory.update({ where: { listingId: donation.listingId }, data: { version: { increment: 1 } } });
    return tx.donation.update({ where: { id: donationId }, data: { reservedQuantity: { decrement: total }, collectedQuantity: { increment: total }, status: "COLLECTED" } });
  });
  await recordAuditEvent({ actorId: userId, action: "DONATION_COLLECTED", resourceType: "Donation", resourceId: donationId });
  return result;
}

export async function expireDonations(now = new Date()) {
  const donations = await prisma.donation.findMany({ where: { status: { in: ["AVAILABLE", "RESERVED"] }, expiresAt: { lte: now } }, select: { id: true, listingId: true, availableQuantity: true, reservedQuantity: true } });
  for (const donation of donations) await prisma.$transaction(async (tx) => { const changed = await tx.donation.updateMany({ where: { id: donation.id, status: { in: ["AVAILABLE", "RESERVED"] } }, data: { status: "EXPIRED", availableQuantity: 0, reservedQuantity: 0 } }); if (changed.count) { const release = donation.availableQuantity + donation.reservedQuantity; await tx.inventory.update({ where: { listingId: donation.listingId }, data: { availableQuantity: { increment: release }, donatedQuantity: { decrement: release }, version: { increment: 1 } } }); await tx.donationReservation.updateMany({ where: { donationId: donation.id, status: "ACTIVE" }, data: { status: "EXPIRED" } }); } });
}
