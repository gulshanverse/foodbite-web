import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sellerInsights } from "@/lib/ai/seller";
export async function GET() { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); try { return NextResponse.json(await sellerInsights(user.id)); } catch { return NextResponse.json({ error: "AI insights are temporarily unavailable." }, { status: 503 }); } }
