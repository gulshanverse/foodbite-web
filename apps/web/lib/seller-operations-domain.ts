import { prisma } from "@/lib/prisma";
import { businessSchema, bulkListingActionSchema, operatingHoursSchema, sellerListingQuerySchema } from "@foodbite/validation";
import { recordAuditEvent } from "@/lib/audit";
import { canTransitionListing } from "@/lib/seller-domain";
import type { ListingStatus, Prisma } from "@prisma/client";

async function activeSeller(userId: string) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId }, select: { id: true, businessId: true, verificationStatus: true, user: { select: { status: true } } } });
  if (!seller || seller.user.status !== "ACTIVE") throw new Error("Active seller access is required.");
  return seller;
}

export async function updateOwnedBusiness(userId: string, input: unknown) {
  const value = businessSchema.parse(input); const seller = await activeSeller(userId);
  const business = await prisma.$transaction(async (tx) => { const next = seller.businessId ? await tx.business.update({ where: { id: seller.businessId }, data: value }) : await tx.business.create({ data: value }); if (!seller.businessId) await tx.sellerProfile.update({ where: { id: seller.id }, data: { businessId: next.id } }); return next; });
  await recordAuditEvent({ actorId: userId, action: "BUSINESS_SETTINGS_CHANGED", resourceType: "Business", resourceId: business.id, metadata: { outcome: "updated" } }); return business;
}

export async function getOwnedBusiness(userId: string) { const seller = await activeSeller(userId); return seller.businessId ? prisma.business.findFirst({ where: { id: seller.businessId, sellers: { some: { id: seller.id } } }, include: { operatingHours: { orderBy: [{ dayOfWeek: "asc" }, { openTime: "asc" }] } } }) : null; }

export async function replaceOwnedOperatingHours(userId: string, input: unknown) {
  const value = operatingHoursSchema.parse(input); const seller = await activeSeller(userId); if (!seller.businessId) throw new Error("Business information is required first.");
  const next = await prisma.$transaction(async (tx) => { await tx.businessOperatingHour.deleteMany({ where: { businessId: seller.businessId! } }); if (value.hours.length) await tx.businessOperatingHour.createMany({ data: value.hours.map((hour) => ({ ...hour, businessId: seller.businessId! })) }); return tx.businessOperatingHour.findMany({ where: { businessId: seller.businessId! }, orderBy: [{ dayOfWeek: "asc" }, { openTime: "asc" }] }); });
  await recordAuditEvent({ actorId: userId, action: "BUSINESS_HOURS_CHANGED", resourceType: "Business", resourceId: seller.businessId, metadata: { outcome: "updated" } }); return next;
}

export async function listOwnedListings(userId: string, raw: unknown) {
  const seller = await activeSeller(userId); const query = sellerListingQuerySchema.parse(raw); const where: Prisma.FoodListingWhereInput = { sellerId: seller.id, ...(query.q ? { OR: [{ name: { contains: query.q, mode: "insensitive" } }, { description: { contains: query.q, mode: "insensitive" } }] } : {}), ...(query.status ? { status: query.status } : {}), ...(query.categoryId ? { categoryId: query.categoryId } : {}), ...(query.foodType ? { foodType: query.foodType } : {}), ...(query.listingType ? { listingType: query.listingType } : {}) };
  const [listings, total] = await prisma.$transaction([prisma.foodListing.findMany({ where, include: { category: true, inventory: true }, orderBy: { [query.sort]: query.direction }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }), prisma.foodListing.count({ where })]); return { listings, total, page: query.page, pageSize: query.pageSize, pages: Math.ceil(total / query.pageSize) };
}

export async function bulkTransitionOwnedListings(userId: string, raw: unknown) {
  const input = bulkListingActionSchema.parse(raw); const seller = await activeSeller(userId); const to: ListingStatus = input.action === "PAUSE" ? "PAUSED" : input.action === "RESUME" ? "ACTIVE" : "CANCELLED";
  const result = await prisma.$transaction(async (tx) => { const listings = await tx.foodListing.findMany({ where: { id: { in: input.listingIds }, sellerId: seller.id }, select: { id: true, status: true, pickupEnd: true } }); if (listings.length !== input.listingIds.length || listings.some((listing) => !canTransitionListing(listing.status, to) || (to === "ACTIVE" && listing.pickupEnd <= new Date()))) throw new Error("One or more listing actions are not allowed."); for (const listing of listings) await tx.foodListing.update({ where: { id: listing.id }, data: { status: to, publishedAt: to === "ACTIVE" ? new Date() : undefined, expiredAt: to === "CANCELLED" ? undefined : undefined } }); return listings.length; });
  await recordAuditEvent({ actorId: userId, action: "LISTINGS_BULK_OPERATION", resourceType: "SellerProfile", resourceId: seller.id, metadata: { outcome: input.action, to } }); return { updated: result };
}

export async function getSellerOperationalSummary(userId: string) {
  const seller = await activeSeller(userId); const now = new Date(); const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const [listings, orders, donations, inventory] = await prisma.$transaction([
    prisma.foodListing.findMany({ where: { sellerId: seller.id }, select: { status: true, pickupEnd: true, inventory: { select: { availableQuantity: true, reservedQuantity: true, soldQuantity: true, donatedQuantity: true, totalQuantity: true } } } }),
    prisma.order.findMany({ where: { items: { some: { sellerId: seller.id } } }, select: { status: true, createdAt: true } }),
    prisma.donation.groupBy({ by: ["status"], where: { sellerId: seller.id }, orderBy: { status: "asc" }, _count: { _all: true } }),
    prisma.inventory.aggregate({ where: { listing: { sellerId: seller.id } }, _sum: { availableQuantity: true, reservedQuantity: true, soldQuantity: true, donatedQuantity: true } }),
  ]);
  const donationCounts = Object.fromEntries(donations.map((row) => [row.status, typeof row._count === "object" ? row._count._all ?? 0 : 0])); return { listings: { active: listings.filter((l) => l.status === "ACTIVE").length, paused: listings.filter((l) => l.status === "PAUSED").length, drafts: listings.filter((l) => l.status === "DRAFT").length, soldOut: listings.filter((l) => l.status === "SOLD_OUT").length, lowStock: listings.filter((l) => l.status === "ACTIVE" && (l.inventory?.availableQuantity ?? 0) > 0 && (l.inventory?.availableQuantity ?? 0) <= 5).length, expiringSoon: listings.filter((l) => l.status === "ACTIVE" && l.pickupEnd > now && l.pickupEnd <= tomorrow).length }, orders: Object.fromEntries(["PAID", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED"].map((status) => [status, orders.filter((order) => order.status === status).length])), inventory: inventory._sum, donations: donationCounts };
}

export async function exportOwnedOperationalData(userId: string, kind: "listings" | "inventory" | "orders") {
  const seller = await activeSeller(userId); let rows: string[] = [];
  if (kind === "listings") { const data = await prisma.foodListing.findMany({ where: { sellerId: seller.id }, select: { id: true, name: true, status: true, quantity: true, unit: true, pickupStart: true, pickupEnd: true, inventory: { select: { availableQuantity: true, reservedQuantity: true, soldQuantity: true, donatedQuantity: true } } }, orderBy: { createdAt: "desc" } }); rows = ["id,name,status,quantity,unit,pickupStart,pickupEnd,available,reserved,sold,donated", ...data.map((r) => [r.id, r.name, r.status, r.quantity, r.unit, r.pickupStart.toISOString(), r.pickupEnd.toISOString(), r.inventory?.availableQuantity ?? 0, r.inventory?.reservedQuantity ?? 0, r.inventory?.soldQuantity ?? 0, r.inventory?.donatedQuantity ?? 0].map(csv).join(","))]; }
  if (kind === "inventory") { const data = await prisma.inventory.findMany({ where: { listing: { sellerId: seller.id } }, select: { listing: { select: { name: true } }, totalQuantity: true, availableQuantity: true, reservedQuantity: true, soldQuantity: true, donatedQuantity: true } }); rows = ["listing,total,available,reserved,sold,donated", ...data.map((r) => [r.listing.name, r.totalQuantity, r.availableQuantity, r.reservedQuantity, r.soldQuantity, r.donatedQuantity].map(csv).join(","))]; }
  if (kind === "orders") { const data = await prisma.order.findMany({ where: { items: { some: { sellerId: seller.id } } }, select: { orderNumber: true, status: true, fulfillmentMethod: true, createdAt: true, items: { where: { sellerId: seller.id }, select: { listingName: true, quantity: true, lineTotal: true } } }, orderBy: { createdAt: "desc" } }); rows = ["orderNumber,status,fulfillment,createdAt,item,quantity,lineTotal", ...data.flatMap((r) => r.items.map((item) => [r.orderNumber, r.status, r.fulfillmentMethod, r.createdAt.toISOString(), item.listingName, item.quantity, item.lineTotal].map(csv).join(",")))]; }
  return rows.join("\n") + "\n";
}
function csv(value: unknown) { const text = String(value ?? ""); return /[,"\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
