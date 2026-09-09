import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { reviewListing } from "@/lib/ai/seller";
export async function POST(request: Request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); try { return NextResponse.json(await reviewListing(user.id, await request.json())); } catch { return NextResponse.json({ error: "AI quality review is temporarily unavailable." }, { status: 503 }); } }
