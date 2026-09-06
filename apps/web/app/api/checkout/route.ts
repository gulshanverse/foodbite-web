import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCheckout } from "@/lib/commerce-domain";

export async function POST(request: Request) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); try { const result = await createCheckout(user.id, await request.json()); return NextResponse.json({ ...result, paymentConfigured: result.paymentConfigured }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout could not be created." }, { status: 400 }); } }
