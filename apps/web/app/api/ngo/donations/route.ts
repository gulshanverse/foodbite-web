import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listAvailableDonations, listNgoDonations } from "@/lib/donation-domain";
async function ngo() { const user = await getCurrentUser(); return user?.role === "NGO" && user.status === "ACTIVE" ? user : null; }
export async function GET() { const user = await ngo(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json({ available: await listAvailableDonations(), mine: await listNgoDonations(user.id) }); }
