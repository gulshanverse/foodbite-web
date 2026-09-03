import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { adjustOwnedInventory } from "@/lib/seller-domain";

export async function PATCH(request: Request, { params }: { params: Promise<{ listingId: string }> }) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); try { const { listingId } = await params; const inventory = await adjustOwnedInventory(user.id, listingId, await request.json()); return NextResponse.json({ inventory }); } catch { return NextResponse.json({ error: "Inventory adjustment could not be completed." }, { status: 400 }); } }
