import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOwnNgoProfile, updateNgoProfile } from "@/lib/donation-domain";
async function ngo() { const user = await getCurrentUser(); return user?.role === "NGO" && user.status === "ACTIVE" ? user : null; }
export async function GET() { const user = await ngo(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json({ profile: await getOwnNgoProfile(user.id) }); }
export async function PATCH(request: Request) { const user = await ngo(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); try { return NextResponse.json({ profile: await updateNgoProfile(user.id, await request.json()) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid NGO profile." }, { status: 400 }); } }
