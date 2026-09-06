import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addToCart, getCart } from "@/lib/commerce-domain";

export async function GET() { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); try { return NextResponse.json({ cart: await getCart(user.id) }); } catch { return NextResponse.json({ error: "Buyer access is required." }, { status: 403 }); } }
export async function POST(request: Request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); try { return NextResponse.json({ cart: await addToCart(user.id, await request.json()) }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Cart update failed." }, { status: 400 }); } }
