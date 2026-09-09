import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSellerAnalytics } from "@/lib/analytics-domain";
export async function GET(request: Request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); try { const params = Object.fromEntries(new URL(request.url).searchParams.entries()); return NextResponse.json(await getSellerAnalytics(user.id, params)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Analytics unavailable." }, { status: 400 }); } }
