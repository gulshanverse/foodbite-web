import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createListing } from "@/lib/seller-domain";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!seller) return NextResponse.json({ listings: [] });
  const listings = await prisma.foodListing.findMany({ where: { sellerId: seller.id }, include: { category: true, inventory: true, images: { orderBy: { sortOrder: "asc" } } }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ listings });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try { const listing = await createListing(user.id, await request.json(), "DRAFT"); return NextResponse.json({ listing }, { status: 201 }); }
  catch { return NextResponse.json({ error: "Please check the listing details." }, { status: 400 }); }
}
