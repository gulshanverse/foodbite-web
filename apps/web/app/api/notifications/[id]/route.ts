import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ read: z.boolean().default(true) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid notification state." }, { status: 400 });
  const { id } = await params;
  const updated = await prisma.notification.updateMany({ where: { id, recipientId: user.id, channel: "IN_APP" }, data: { readAt: parsed.data.read ? new Date() : null } });
  if (updated.count !== 1) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
