import { NextResponse } from "next/server";
import { businessSchema } from "@foodbite/validation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedBusiness, updateOwnedBusiness } from "@/lib/seller-operations-domain";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id }, select: { verificationStatus: true } });
  return NextResponse.json({ business: await getOwnedBusiness(user.id), verificationStatus: seller?.verificationStatus ?? null });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const business = await updateOwnedBusiness(user.id, businessSchema.parse(await request.json()));
    return NextResponse.json({ business });
  } catch { return NextResponse.json({ error: "Please check your business details." }, { status: 400 }); }
}
