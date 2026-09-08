import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import type { DeliveryStatus } from "@prisma/client";
import { addressSchema } from "@foodbite/validation";

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateDeliveryFee(baseFee: number, perKmFee: number, distanceKm: number) {
  return baseFee + Math.ceil(distanceKm * perKmFee);
}

export async function listBuyerAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
}
export async function createBuyerAddress(userId: string, input: unknown) {
  const value = addressSchema.parse(input);
  const address = await prisma.address.create({ data: { ...value, userId } });
  await recordAuditEvent({ actorId: userId, action: "ADDRESS_CREATED", resourceType: "Address", resourceId: address.id });
  return address;
}
export async function updateBuyerAddress(userId: string, id: string, input: unknown) {
  const value = addressSchema.parse(input);
  const address = await prisma.address.updateMany({ where: { id, userId }, data: value });
  if (address.count !== 1) throw new Error("Address not found.");
  await recordAuditEvent({ actorId: userId, action: "ADDRESS_UPDATED", resourceType: "Address", resourceId: id });
  return prisma.address.findUniqueOrThrow({ where: { id } });
}
export async function deleteBuyerAddress(userId: string, id: string) {
  const deleted = await prisma.address.deleteMany({ where: { id, userId } });
  if (deleted.count !== 1) throw new Error("Address not found.");
  await recordAuditEvent({ actorId: userId, action: "ADDRESS_DELETED", resourceType: "Address", resourceId: id });
}

const transitions: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
  PENDING: ["ASSIGNED", "CANCELLED"], ASSIGNED: ["PICKED_UP_FROM_SELLER", "FAILED", "CANCELLED"],
  PICKED_UP_FROM_SELLER: ["IN_TRANSIT", "FAILED"], IN_TRANSIT: ["OUT_FOR_DELIVERY", "DELIVERED", "FAILED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"], FAILED: ["PENDING"],
};
export function canTransitionDelivery(from: DeliveryStatus, to: DeliveryStatus) { return transitions[from]?.includes(to) ?? false; }
export async function transitionDelivery(userId: string, deliveryId: string, to: DeliveryStatus) {
  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, order: { items: { some: { seller: { userId } } } } } });
  if (!delivery || !canTransitionDelivery(delivery.status, to)) throw new Error("Delivery transition is not allowed.");
  const now = new Date();
  const updated = await prisma.delivery.update({ where: { id: deliveryId }, data: { status: to, assignedAt: to === "ASSIGNED" ? now : undefined, pickedUpAt: to === "PICKED_UP_FROM_SELLER" ? now : undefined, deliveredAt: to === "DELIVERED" ? now : undefined, failedAt: to === "FAILED" ? now : undefined } });
  await recordAuditEvent({ actorId: userId, action: "DELIVERY_STATUS_CHANGED", resourceType: "Delivery", resourceId: deliveryId, metadata: { from: delivery.status, to } });
  return updated;
}
