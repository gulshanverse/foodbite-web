import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { bulkTransitionOwnedListings } from "@/lib/seller-operations-domain";
export async function POST(request: Request) { const user = await getCurrentUser(); if (!user || user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); try { return NextResponse.json(await bulkTransitionOwnedListings(user.id, await request.json())); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Bulk listing operation failed." }, { status: 409 }); } }
