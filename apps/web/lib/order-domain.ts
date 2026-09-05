import { randomBytes, randomInt, createHash } from "node:crypto";
import { Prisma, type ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const RESERVATION_MINUTES = 10;

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createPickupSecrets() {
  const code = randomInt(100000, 1000000).toString();
  const token = randomBytes(32).toString("base64url");
  return { code, token, codeHash: hashSecret(code), tokenHash: hashSecret(token) };
}

function orderNumber() {
  return `FB-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({ where: { userId }, create: { userId }, update: {}, include: { items: { include: { listing: { include: { category: true, images: { orderBy: { sortOrder: "asc" } }, inventory: true, seller: { include: { business: true } } } } } } } });
}

export async function addCartItem(userId: string, listingId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Quantity must be positive.");
  const listing = await prisma.foodListing.findFirst({ where: { id: listingId, status: "ACTIVE", pickupEnd: { gt: new Date() }, inventory: { is: { availableQuantity: { gt: 0 } } }, seller: { user: { status: "ACTIVE" } } }, include: { inventory: true } });
  if (!listing?.inventory) throw new Error("This surplus listing is no longer available.");
  if (quantity > listing.inventory.availableQuantity) throw new Error("Not enough quantity available.");
  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => item.listingId === listingId);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  if (nextQuantity > listing.inventory.availableQuantity) throw new Error("Cart quantity exceeds availability.");
  return prisma.cartItem.upsert({ where: { cartId_listingId: { cartId: cart.id, listingId } }, create: { cartId: cart.id, listingId, quantity }, update: { quantity: nextQuantity } });
}

export async function updateCartItem(userId: string, listingId: string, quantity: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new Error("Cart not found.");
  if (quantity < 1) return prisma.cartItem.deleteMany({ where: { cartId: cart.id, listingId } });
  const listing = await prisma.foodListing.findFirst({ where: { id: listingId, status: "ACTIVE", pickupEnd: { gt: new Date() } }, include: { inventory: true } });
  if (!listing?.inventory || quantity > listing.inventory.availableQuantity) throw new Error("Requested quantity is unavailable.");
  return prisma.cartItem.update({ where: { cartId_listingId: { cartId: cart.id, listingId } }, data: { quantity } });
}

export async function removeCartItem(userId: string, listingId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return;
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, listingId } });
}

async function expireReservations(tx: Prisma.TransactionClient, now: Date) {
  const expired = await tx.reservation.findMany({ where: { status: "ACTIVE", expiresAt: { lte: now } }, select: { id: true, listingId: true, quantity: true } });
  for (const reservation of expired) {
    const changed = await tx.reservation.updateMany({ where: { id: reservation.id, status: "ACTIVE" }, data: { status: "EXPIRED" } });
    if (changed.count === 1) {
      await tx.inventory.updateMany({ where: { listingId: reservation.listingId, reservedQuantity: { gte: reservation.quantity } }, data: { availableQuantity: { increment: reservation.quantity }, reservedQuantity: { decrement: reservation.quantity }, version: { increment: 1 } } });
    }
  }
}

export async function reserveListing(userId: string, listingId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Quantity must be positive.");
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    await expireReservations(tx, now);
    const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "Inventory" WHERE "listingId" = ${listingId}::uuid FOR UPDATE`);
    if (!rows.length) throw new Error("Inventory not found.");
    const listing = await tx.foodListing.findFirst({ where: { id: listingId, status: "ACTIVE", pickupEnd: { gt: now }, seller: { user: { status: "ACTIVE" } } }, include: { inventory: true } });
    if (!listing?.inventory || listing.inventory.availableQuantity < quantity) throw new Error("Not enough surplus available.");
    await tx.inventory.update({ where: { listingId }, data: { availableQuantity: { decrement: quantity }, reservedQuantity: { increment: quantity }, version: { increment: 1 } } });
    return tx.reservation.create({ data: { userId, listingId, quantity, expiresAt: new Date(now.getTime() + RESERVATION_MINUTES * 60_000) } });
  }, { isolationLevel: "Serializable" });
}

export async function createOrderFromCart(userId: string) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    await expireReservations(tx, now);
    const buyer = await tx.user.findFirst({ where: { id: userId, role: "BUYER", status: "ACTIVE", deletedAt: null }, include: { buyerProfile: true, cart: { include: { items: { include: { listing: { include: { inventory: true, category: true, seller: { include: { business: true } } } } } } } } } });
    if (!buyer?.cart?.items.length) throw new Error("Your cart is empty.");
    const reservations: Array<{ id: string; listingId: string; quantity: number }> = [];
    const items: Array<{ listingId: string; sellerId: string; listingName: string; unit: any; foodType: any; quantity: number; unitPrice: number; originalUnitPrice: number; lineTotal: number }> = [];
    for (const cartItem of buyer.cart.items) {
      const listing = cartItem.listing;
      const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "Inventory" WHERE "listingId" = ${listing.id}::uuid FOR UPDATE`);
      if (!locked.length || !listing.inventory || listing.status !== "ACTIVE" || listing.pickupEnd <= now || listing.inventory.availableQuantity < cartItem.quantity) throw new Error(`"${listing.name}" is no longer available in the requested quantity.`);
      await tx.inventory.update({ where: { listingId: listing.id }, data: { availableQuantity: { decrement: cartItem.quantity }, reservedQuantity: { increment: cartItem.quantity }, version: { increment: 1 } } });
      const reservation = await tx.reservation.create({ data: { userId, listingId: listing.id, quantity: cartItem.quantity, status: "CONFIRMED", expiresAt: new Date(now.getTime() + RESERVATION_MINUTES * 60_000) } });
      reservations.push({ id: reservation.id, listingId: listing.id, quantity: cartItem.quantity });
      items.push({ listingId: listing.id, sellerId: listing.sellerId, listingName: listing.name, unit: listing.unit, foodType: listing.foodType, quantity: cartItem.quantity, unitPrice: listing.sellingPrice, originalUnitPrice: listing.originalPrice, lineTotal: listing.sellingPrice * cartItem.quantity });
    }
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const order = await tx.order.create({ data: { orderNumber: orderNumber(), buyerId: userId, subtotal, totalAmount: subtotal, buyerName: buyer.buyerProfile?.name ?? buyer.email, buyerPhone: buyer.phone, pickupAddress: undefined, pickupCity: buyer.buyerProfile?.city, pickupPincode: buyer.buyerProfile?.pincode, items: { create: items }, reservations: { connect: reservations.map((r) => ({ id: r.id })) }, payment: { create: { provider: process.env.PAYMENT_PROVIDER ?? "razorpay", amount: subtotal, currency: "INR", status: "CREATED" } } }, include: { items: true, payment: true } });
    await tx.cartItem.deleteMany({ where: { cartId: buyer.cart.id } });
    return order;
  }, { isolationLevel: "Serializable" });
}

export async function markPaymentSuccessful(providerOrderId: string, providerPaymentId: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { providerOrderId }, include: { order: { include: { reservations: true } } } });
    if (!payment) throw new Error("Payment not found.");
    if (payment.status === "SUCCESS") return payment.order;
    const order = await tx.order.update({ where: { id: payment.orderId }, data: { status: "PAID", paidAt: new Date() } });
    await tx.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS", providerPaymentId, paidAt: new Date() } });
    for (const reservation of payment.order.reservations) {
      await tx.inventory.update({ where: { listingId: reservation.listingId }, data: { reservedQuantity: { decrement: reservation.quantity }, soldQuantity: { increment: reservation.quantity }, version: { increment: 1 } } });
    }
    await tx.reservation.updateMany({ where: { orderId: payment.orderId, status: "CONFIRMED" }, data: { status: "CONFIRMED" } });
    return order;
  });
}

export async function getBuyerOrders(userId: string) {
  return prisma.order.findMany({ where: { buyerId: userId }, orderBy: { createdAt: "desc" }, include: { items: true, payment: true, pickup: true } });
}

export async function getBuyerOrder(userId: string, id: string) {
  return prisma.order.findFirst({ where: { id, buyerId: userId }, include: { items: { include: { listing: { include: { images: { orderBy: { sortOrder: "asc" } } } }, seller: { include: { business: true } } } }, payment: true, pickup: true } });
}

export async function cancelBuyerOrder(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id, buyerId: userId }, include: { reservations: true } });
    if (!order || !["PENDING_PAYMENT", "PAID", "CONFIRMED"].includes(order.status)) throw new Error("This order cannot be cancelled.");
    if (order.status !== "PENDING_PAYMENT") throw new Error("Paid orders require seller/support refund processing.");
    for (const reservation of order.reservations) {
      if (reservation.status === "CONFIRMED") {
        await tx.inventory.update({ where: { listingId: reservation.listingId }, data: { availableQuantity: { increment: reservation.quantity }, reservedQuantity: { decrement: reservation.quantity }, version: { increment: 1 } } });
        await tx.reservation.update({ where: { id: reservation.id }, data: { status: "CANCELLED" } });
      }
    }
    return tx.order.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  });
}

export const activeOrderStatuses: ListingStatus[] = ["ACTIVE"];
