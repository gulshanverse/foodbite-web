import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createDonation, listSellerDonations } from "@/lib/donation-domain";
async function seller() { const user = await getCurrentUser(); return user?.role === "SELLER" && user.status === "ACTIVE" ? user : null; }
export async function GET() { const user = await seller(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json({ donations: await listSellerDonations(user.id) }); }
export async function POST(request: Request) { const user = await seller(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); try { return NextResponse.json({ donation: await createDonation(user.id, await request.json()) }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create donation." }, { status: 409 }); } }
