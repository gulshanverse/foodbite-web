import { prisma } from "@/lib/prisma";

const SAFE_KEYS = new Set(["from", "to", "reason", "provider", "outcome", "source"]);

export async function recordAuditEvent(input: {
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}) {
  const metadata = input.metadata
    ? Object.fromEntries(Object.entries(input.metadata).filter(([key, value]) => SAFE_KEYS.has(key) && value !== undefined))
    : undefined;
  return prisma.auditLog.create({ data: { actorId: input.actorId, action: input.action, resourceType: input.resourceType, resourceId: input.resourceId, metadata } });
}
