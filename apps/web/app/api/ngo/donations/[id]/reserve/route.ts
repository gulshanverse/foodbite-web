import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { reserveDonation } from "@/lib/donation-domain";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const user = await getCurrentUser(); if (!user || user.role !== "NGO" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); try { const { id } = await params; return NextResponse.json({ reservation: await reserveDonation(user.id, id, await request.json()) }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Donation reservation failed." }, { status: 409 }); } }
