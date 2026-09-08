import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const url = new URL(request.url); const page = Math.max(1, Math.min(100, Number(url.searchParams.get("page") ?? "1") || 1)); const take = 20;
  const where = { recipientId: user.id, channel: "IN_APP" as const };
  const [notifications, unreadCount] = await prisma.$transaction([prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take, select: { id: true, type: true, title: true, body: true, status: true, createdAt: true, readAt: true } }), prisma.notification.count({ where: { ...where, readAt: null } })]);
  return NextResponse.json({ notifications, unreadCount, page, pageSize: take });
}
