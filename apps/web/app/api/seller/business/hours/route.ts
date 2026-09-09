import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedBusiness, replaceOwnedOperatingHours } from "@/lib/seller-operations-domain";
export async function GET() { const user = await getCurrentUser(); if (!user || user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); return NextResponse.json({ hours: (await getOwnedBusiness(user.id))?.operatingHours ?? [] }); }
export async function PUT(request: Request) { const user = await getCurrentUser(); if (!user || user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); try { return NextResponse.json({ hours: await replaceOwnedOperatingHours(user.id, await request.json()) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid operating hours." }, { status: 400 }); } }
