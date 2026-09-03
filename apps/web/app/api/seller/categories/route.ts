import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); const categories = await prisma.foodCategory.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }); return NextResponse.json({ categories }); }
