import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transitionOwnedListing } from "@/lib/seller-domain";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params; const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const listing = seller ? await prisma.foodListing.findFirst({ where: { id, sellerId: seller.id }, include: { category: true, inventory: true, images: true } }) : null;
  return listing ? NextResponse.json({ listing }) : NextResponse.json({ error: "Listing not found." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try { const { id } = await params; const body = await request.json() as { action?: "PUBLISH" | "PAUSE" | "RESUME" | "CANCEL" }; const target = body.action === "PUBLISH" ? "ACTIVE" : body.action === "PAUSE" ? "PAUSED" : body.action === "RESUME" ? "ACTIVE" : "CANCELLED"; const listing = await transitionOwnedListing(user.id, id, target); return NextResponse.json({ listing }); }
  catch { return NextResponse.json({ error: "Listing action could not be completed." }, { status: 400 }); }
}
