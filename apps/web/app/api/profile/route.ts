import { NextResponse } from "next/server";
import { buyerProfileSchema } from "@foodbite/validation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "BUYER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const input = buyerProfileSchema.parse(await request.json());
    await prisma.buyerProfile.update({ where: { userId: user.id }, data: input });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Please check your profile details." }, { status: 400 });
  }
}
