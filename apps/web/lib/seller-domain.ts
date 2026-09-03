import type { FoodListing, ListingStatus, Prisma } from "@prisma/client";
import { listingSchema, inventoryAdjustmentSchema } from "@foodbite/validation";
import { prisma } from "@/lib/prisma";

export function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "surplus-listing"; }
export function calculateDiscount(originalPrice: number, sellingPrice: number) { return originalPrice <= 0 ? 0 : Math.round(((originalPrice - sellingPrice) / originalPrice) * 100); }
export function assertInventoryInvariant(total: number, available: number, reserved: number, sold: number) { if (total !== available + reserved + sold || [total, available, reserved, sold].some((value) => value < 0)) throw new Error("Inventory invariant violated"); }

const allowedTransitions: Record<ListingStatus, ListingStatus[]> = { DRAFT: ["PENDING_REVIEW", "ACTIVE", "CANCELLED"], PENDING_REVIEW: ["ACTIVE", "CANCELLED"], ACTIVE: ["PAUSED", "SOLD_OUT", "EXPIRED", "CANCELLED"], PAUSED: ["ACTIVE", "CANCELLED", "EXPIRED"], SOLD_OUT: [], EXPIRED: [], BLOCKED: [], CANCELLED: [] };
export function canTransitionListing(from: ListingStatus, to: ListingStatus) { return allowedTransitions[from].includes(to); }

async function getOwnedSeller(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId }, select: { id: true, businessId: true, verificationStatus: true, user: { select: { status: true } } } });
  if (!seller || seller.user.status !== "ACTIVE") throw new Error("Seller access denied");
  return seller;
}

export async function createListing(userId: string, input: unknown, status: "DRAFT" | "ACTIVE" = "DRAFT") {
  const seller = await getOwnedSeller(userId);
  const parsed = listingSchema.parse(input);
  if (status === "ACTIVE" && (!seller.businessId || new Date(parsed.pickupEnd) <= new Date())) throw new Error("Business information and a valid pickup window are required to publish");
  if (status === "ACTIVE") { const business = await prisma.business.findUnique({ where: { id: seller.businessId! }, select: { name: true, city: true, pincode: true } }); if (!business?.name || !business.city || !business.pincode) throw new Error("Complete business information before publishing"); }
  const baseSlug = slugify(parsed.name);
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  return prisma.$transaction(async (tx) => {
    const listing = await tx.foodListing.create({ data: { sellerId: seller.id, slug, name: parsed.name, categoryId: parsed.categoryId, listingType: parsed.listingType, foodType: parsed.foodType, description: parsed.description, originalPrice: parsed.originalPrice, sellingPrice: parsed.sellingPrice, quantity: parsed.quantity, unit: parsed.unit, preparedAt: parsed.preparedAt ? new Date(parsed.preparedAt) : undefined, pickupStart: new Date(parsed.pickupStart), pickupEnd: new Date(parsed.pickupEnd), packagingInfo: parsed.packagingInfo, allergenInfo: parsed.allergenInfo, status, publishedAt: status === "ACTIVE" ? new Date() : undefined } });
    if (status === "ACTIVE") await tx.inventory.create({ data: { listingId: listing.id, totalQuantity: parsed.quantity, availableQuantity: parsed.quantity } });
    return listing;
  });
}

export async function transitionOwnedListing(userId: string, listingId: string, to: ListingStatus) {
  const seller = await getOwnedSeller(userId);
  const listing = await prisma.foodListing.findFirst({ where: { id: listingId, sellerId: seller.id } });
  if (!listing || !canTransitionListing(listing.status, to)) throw new Error("Listing transition is not allowed");
  if (to === "ACTIVE" && new Date() >= listing.pickupEnd) throw new Error("Pickup window has ended");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.foodListing.update({ where: { id: listing.id }, data: { status: to, publishedAt: to === "ACTIVE" ? new Date() : listing.publishedAt, expiredAt: to === "EXPIRED" ? new Date() : undefined } });
    if (to === "ACTIVE") await tx.inventory.upsert({ where: { listingId: listing.id }, create: { listingId: listing.id, totalQuantity: listing.quantity, availableQuantity: listing.quantity }, update: {} });
    return updated;
  });
}

export async function adjustOwnedInventory(userId: string, listingId: string, input: unknown) {
  const seller = await getOwnedSeller(userId); const parsed = inventoryAdjustmentSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const listing = await tx.foodListing.findFirst({ where: { id: listingId, sellerId: seller.id }, include: { inventory: true } });
    if (!listing?.inventory) throw new Error("Inventory not found");
    const { reservedQuantity, soldQuantity } = listing.inventory;
    const availableQuantity = parsed.totalQuantity - reservedQuantity - soldQuantity;
    if (availableQuantity < 0) throw new Error("Total quantity cannot be below reserved and sold quantity");
    assertInventoryInvariant(parsed.totalQuantity, availableQuantity, reservedQuantity, soldQuantity);
    return tx.inventory.update({ where: { listingId }, data: { totalQuantity: parsed.totalQuantity, availableQuantity, version: { increment: 1 } } });
  });
}

export async function expireListings(now = new Date()) { return prisma.foodListing.updateMany({ where: { status: { in: ["ACTIVE", "PAUSED"] }, pickupEnd: { lte: now } }, data: { status: "EXPIRED", expiredAt: now } }); }

export type ListingWithInventory = Prisma.FoodListingGetPayload<{ include: { inventory: true; category: true } }>;
export type { FoodListing };
