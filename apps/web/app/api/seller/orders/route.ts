import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSellerOrders } from "@/lib/commerce-domain";
export async function GET() { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); try { return NextResponse.json({ orders: await getSellerOrders(user.id) }); } catch { return NextResponse.json({ error: "Seller access is required." }, { status: 403 }); } }
