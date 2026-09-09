/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { analyticsRangeSchema } from "@foodbite/validation";
import type { Prisma } from "@prisma/client";

export const metricDefinitions = {
  totalOrders: "Orders created in the selected UTC range, regardless of current status.",
  completedOrders: "Orders with status COMPLETED created in the selected UTC range.",
  successfulOrderValue: "Sum of Order.totalAmount for orders with status COMPLETED in the selected UTC range; values are INR paise and include the persisted order total.",
  soldQuantity: "Sum of OrderItem.quantity for completed orders in the selected UTC range.",
  donatedQuantity: "Sum of Donation.quantity for donations created in the selected UTC range.",
  collectedDonationQuantity: "Sum of Donation.collectedQuantity for donations with status COLLECTED or COMPLETED created in the selected UTC range.",
  donationCompletionRate: "COMPLETED donations divided by donations eligible for completion (COLLECTED, COMPLETED, or FAILED_COLLECTION); N/A when denominator is zero.",
  pickupCompleted: "Orders with a Pickup record in PICKED_UP status in the selected order-created range.",
  deliveryCompleted: "Deliveries with status DELIVERED in the selected order-created range.",
} as const;

export function resolveAnalyticsRange(raw: unknown) {
  const parsed = analyticsRangeSchema.parse(raw ?? {}); const now = new Date(); let start: Date; let end: Date = now;
  if (parsed.range === "today") { start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); }
  else if (parsed.range === "7d") start = new Date(now.getTime() - 7 * 86400000);
  else if (parsed.range === "month") start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  else if (parsed.range === "previous-month") { start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)); end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); }
  else if (parsed.range === "custom") { start = new Date(parsed.start!); end = new Date(parsed.end!); }
  else start = new Date(now.getTime() - 30 * 86400000);
  return { start, end, range: parsed.range, timezone: "UTC" };
}

function pct(numerator: number, denominator: number) { return denominator === 0 ? null : Math.round((numerator / denominator) * 1000) / 10; }
function money(paise: number | null | undefined) { return paise ?? 0; }
function orderDateWhere(start: Date, end: Date): Prisma.OrderWhereInput { return { createdAt: { gte: start, lt: end } }; }

export async function getSellerAnalytics(userId: string, raw: unknown) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId }, select: { id: true, user: { select: { status: true } } } }); if (!seller || seller.user.status !== "ACTIVE") throw new Error("Active seller access is required.");
  const { start, end, range, timezone } = resolveAnalyticsRange(raw); const orderWhere: Prisma.OrderWhereInput = { ...orderDateWhere(start, end), items: { some: { sellerId: seller.id } } };
  const [orders, completedValue, listings, inventory, donations, fulfillment] = await prisma.$transaction([
    prisma.order.groupBy({ by: ["status"], where: orderWhere, _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.order.aggregate({ where: { ...orderWhere, status: "COMPLETED" }, _sum: { totalAmount: true } }),
    prisma.foodListing.groupBy({ by: ["status"], where: { sellerId: seller.id, createdAt: { gte: start, lt: end } }, _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.inventory.aggregate({ where: { listing: { sellerId: seller.id } }, _sum: { totalQuantity: true, availableQuantity: true, reservedQuantity: true, soldQuantity: true, donatedQuantity: true } }),
    prisma.donation.groupBy({ by: ["status"], where: { sellerId: seller.id, createdAt: { gte: start, lt: end } }, _count: { _all: true }, orderBy: { status: "asc" }, _sum: { quantity: true, collectedQuantity: true } }),
    prisma.order.groupBy({ by: ["fulfillmentMethod", "status"], where: orderWhere, _count: { _all: true }, orderBy: { status: "asc" } }),
  ]);
  const countMap = (rows: any[]) => Object.fromEntries(rows.map((r) => [String(r.status), Number(r._count?._all ?? 0)])); const orderCounts = countMap(orders); const listingCounts = countMap(listings); const donationCounts = countMap(donations); const eligible = (donationCounts.COLLECTED ?? 0) + (donationCounts.COMPLETED ?? 0) + (donationCounts.FAILED_COLLECTION ?? 0); const donationCompleted = donationCounts.COMPLETED ?? 0;
  return { range: { start: start.toISOString(), end: end.toISOString(), range, timezone }, orders: { total: Object.values(orderCounts).reduce((a, b) => a + b, 0), completed: orderCounts.COMPLETED ?? 0, cancelled: orderCounts.CANCELLED ?? 0, pending: (orderCounts.PENDING_PAYMENT ?? 0) + (orderCounts.PAID ?? 0) + (orderCounts.CONFIRMED ?? 0), byStatus: orderCounts }, sales: { successfulOrderValuePaise: money(completedValue._sum?.totalAmount), currency: "INR", semantics: "completed Order.totalAmount" }, inventory: { ...inventory._sum, soldOutListings: listingCounts.SOLD_OUT ?? 0, listingStatuses: listingCounts }, surplusRecovery: { donatedQuantity: donations.reduce((a, r) => a + (r._sum?.quantity ?? 0), 0), collectedQuantity: donations.reduce((a, r) => a + (r._sum?.collectedQuantity ?? 0), 0), byStatus: donationCounts, completionRatePercent: pct(donationCompleted, eligible) }, fulfillment: { byMethodAndStatus: fulfillment.map((r: any) => ({ method: r.fulfillmentMethod, status: r.status, count: Number(r._count?._all ?? 0) })) }, definitions: metricDefinitions };
}

export async function getAdminAnalytics(raw: unknown) {
  const { start, end, range, timezone } = resolveAnalyticsRange(raw); const orderWhere = orderDateWhere(start, end); const [orders, payments, listings, users, donations, deliveries, pickup, orderValue, usersByRole] = await prisma.$transaction([
    prisma.order.groupBy({ by: ["status"], where: orderWhere, _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.payment.groupBy({ by: ["status"], where: { createdAt: { gte: start, lt: end } }, _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.foodListing.groupBy({ by: ["status"], where: { createdAt: { gte: start, lt: end } }, _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.user.groupBy({ by: ["role", "status"], where: { createdAt: { gte: start, lt: end }, deletedAt: null }, _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.donation.groupBy({ by: ["status"], where: { createdAt: { gte: start, lt: end } }, _count: { _all: true }, orderBy: { status: "asc" }, _sum: { quantity: true, collectedQuantity: true } }),
    prisma.delivery.groupBy({ by: ["status"], where: { createdAt: { gte: start, lt: end } }, _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.pickup.groupBy({ by: ["status"], where: { createdAt: { gte: start, lt: end } }, _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.order.aggregate({ where: { ...orderWhere, status: "COMPLETED" }, _sum: { totalAmount: true } }),
    prisma.user.groupBy({ by: ["role"], where: { deletedAt: null }, _count: { _all: true }, orderBy: { role: "asc" } }),
  ]);
  const map = (rows: any[]) => Object.fromEntries(rows.map((r: any) => [String(r.status), Number(r._count?._all ?? 0)])); const donationMap = map(donations); const eligible = (donationMap.COLLECTED ?? 0) + (donationMap.COMPLETED ?? 0) + (donationMap.FAILED_COLLECTION ?? 0); return { range: { start: start.toISOString(), end: end.toISOString(), range, timezone }, marketplace: { listingsByStatus: map(listings), usersByRole: Object.fromEntries(usersByRole.map((r: any) => [r.role, Number(r._count?._all ?? 0)])), usersCreatedByRoleStatus: users.map((r: any) => ({ role: r.role, status: r.status, count: Number(r._count?._all ?? 0) })) }, orders: { byStatus: map(orders), completedOrderValuePaise: money(orderValue._sum?.totalAmount), currency: "INR", semantics: "completed Order.totalAmount" }, payments: { byStatus: map(payments) }, recovery: { donationsByStatus: donationMap, donatedQuantity: donations.reduce((a: number, r: any) => a + (r._sum?.quantity ?? 0), 0), collectedQuantity: donations.reduce((a: number, r: any) => a + (r._sum?.collectedQuantity ?? 0), 0), completionRatePercent: pct(donationMap.COMPLETED ?? 0, eligible) }, fulfillment: { deliveryByStatus: map(deliveries), pickupByStatus: map(pickup) }, definitions: metricDefinitions };
}

export function analyticsCsv(data: Record<string, unknown>) { const rows: string[] = ["metric,value,unit"]; const walk = (prefix: string, value: unknown) => { if (value && typeof value === "object" && !Array.isArray(value)) for (const [key, child] of Object.entries(value)) walk(prefix ? `${prefix}.${key}` : key, child); else if (typeof value === "number" || typeof value === "string" || value === null) rows.push(`${csv(prefix)},${csv(value === null ? "N/A" : value)},${csv(prefix.endsWith("Paise") ? "INR paise" : "count/value")}`); }; walk("", data); return rows.join("\n") + "\n"; }
function csv(value: unknown) { const text = String(value ?? ""); return /[\",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
