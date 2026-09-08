import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const gate = await requirePermission("AUDIT_READ");
  if (gate.response === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (gate.response) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, actorId: true, action: true, resourceType: true, resourceId: true, metadata: true, createdAt: true } });
  return NextResponse.json({ logs });
}
