import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ emailNotifications: z.boolean(), smsNotifications: z.boolean(), pushNotifications: z.boolean(), whatsappNotifications: z.boolean(), marketingNotifications: z.boolean() });

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const preferences = await prisma.notificationPreference.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  return NextResponse.json({ preferences });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.status !== "ACTIVE") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid notification preferences." }, { status: 400 });
  const preferences = await prisma.notificationPreference.upsert({ where: { userId: user.id }, create: { userId: user.id, ...parsed.data }, update: parsed.data });
  return NextResponse.json({ preferences });
}
