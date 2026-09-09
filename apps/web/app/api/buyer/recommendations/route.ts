import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBuyerRecommendations } from "@/lib/ai/buyer";
export async function GET() { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); if (user.role !== "BUYER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); try { return NextResponse.json(await getBuyerRecommendations(user.id)); } catch { return NextResponse.json({ listings: [], personalized: false, fallback: true }); } }
