import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listSellerOrders } from "@/lib/seller-order-operations";
export async function GET(request: Request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); try { return NextResponse.json(await listSellerOrders(user.id, Object.fromEntries(new URL(request.url).searchParams))); } catch { return NextResponse.json({ error: "Unable to load seller orders." }, { status: 400 }); } }
