import { NextResponse } from "next/server";
import { businessSchema } from "@foodbite/validation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id }, include: { business: true } });
  return NextResponse.json({ business: seller?.business ?? null, verificationStatus: seller?.verificationStatus ?? null });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const input = businessSchema.parse(await request.json());
    const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id }, select: { id: true, businessId: true } });
    if (!seller) return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    const business = await prisma.$transaction(async (tx) => {
      const next = seller.businessId ? await tx.business.update({ where: { id: seller.businessId }, data: input }) : await tx.business.create({ data: input });
      if (!seller.businessId) await tx.sellerProfile.update({ where: { id: seller.id }, data: { businessId: next.id } });
      return next;
    });
    return NextResponse.json({ business });
  } catch { return NextResponse.json({ error: "Please check your business details." }, { status: 400 }); }
}
