import type { ListingStatus, SellerVerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";

const verificationTransitions: Record<SellerVerificationStatus, SellerVerificationStatus[]> = {
  PENDING: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["VERIFIED", "REJECTED", "SUSPENDED"],
  VERIFIED: ["SUSPENDED"],
  REJECTED: ["UNDER_REVIEW"],
  SUSPENDED: ["UNDER_REVIEW"],
};

export function canTransitionVerification(from: SellerVerificationStatus, to: SellerVerificationStatus) { return verificationTransitions[from].includes(to); }

export async function transitionSellerVerification(actorId: string, sellerId: string, to: SellerVerificationStatus, reason?: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId }, select: { id: true, userId: true, verificationStatus: true, businessId: true } });
  if (!seller || seller.userId === actorId || !canTransitionVerification(seller.verificationStatus, to)) throw new Error("Verification transition is not allowed.");
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.sellerProfile.update({ where: { id: sellerId }, data: { verificationStatus: to } });
    if (seller.businessId) await tx.business.update({ where: { id: seller.businessId }, data: { verificationStatus: to } });
    return result;
  });
  await recordAuditEvent({ actorId, action: "SELLER_VERIFICATION_CHANGED", resourceType: "SellerProfile", resourceId: sellerId, metadata: { from: seller.verificationStatus, to, reason } });
  return updated;
}

export async function moderateListing(actorId: string, listingId: string, to: Extract<ListingStatus, "ACTIVE" | "BLOCKED">, reason?: string) {
  const listing = await prisma.foodListing.findUnique({ where: { id: listingId }, select: { id: true, status: true, sellerId: true, pickupEnd: true } });
  if (!listing || (to === "ACTIVE" && listing.pickupEnd <= new Date()) || (to === "ACTIVE" && !["PENDING_REVIEW", "PAUSED", "DRAFT"].includes(listing.status))) throw new Error("Listing moderation transition is not allowed.");
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.foodListing.update({ where: { id: listingId }, data: { status: to, publishedAt: to === "ACTIVE" ? new Date() : undefined } });
    if (to === "ACTIVE") await tx.inventory.upsert({ where: { listingId }, create: { listingId, totalQuantity: result.quantity, availableQuantity: result.quantity }, update: {} });
    return result;
  });
  await recordAuditEvent({ actorId, action: to === "BLOCKED" ? "LISTING_BLOCKED" : "LISTING_APPROVED", resourceType: "FoodListing", resourceId: listingId, metadata: { from: listing.status, to, reason } });
  return updated;
}

export async function suspendAccount(actorId: string, userId: string, status: "SUSPENDED" | "BANNED", reason?: string) {
  if (actorId === userId) throw new Error("You cannot suspend your own account.");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
  if (!user) throw new Error("User not found.");
  const updated = await prisma.user.update({ where: { id: userId }, data: { status } });
  await recordAuditEvent({ actorId, action: "ACCOUNT_STATUS_CHANGED", resourceType: "User", resourceId: userId, metadata: { from: user.status, to: status, reason } });
  return updated;
}
