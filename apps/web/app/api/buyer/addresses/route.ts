import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createBuyerAddress, listBuyerAddresses } from "@/lib/delivery-domain";

async function buyer() { const user = await getCurrentUser(); return user?.role === "BUYER" && user.status === "ACTIVE" ? user : null; }
export async function GET() { const user = await buyer(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); return NextResponse.json({ addresses: await listBuyerAddresses(user.id) }); }
export async function POST(request: Request) { const user = await buyer(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); try { return NextResponse.json({ address: await createBuyerAddress(user.id, await request.json()) }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid address." }, { status: 400 }); } }
