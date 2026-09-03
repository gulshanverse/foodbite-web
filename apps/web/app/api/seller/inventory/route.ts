import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const inventory = seller ? await prisma.inventory.findMany({ where: { listing: { sellerId: seller.id } }, include: { listing: { select: { id: true, name: true, status: true, unit: true } } }, orderBy: { updatedAt: "desc" }, take: 50 }) : [];
  return NextResponse.json({ inventory });
}
