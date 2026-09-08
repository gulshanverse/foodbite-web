import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { transitionSellerDonation } from "@/lib/donation-domain";
const schema = z.object({ status: z.enum(["ACCEPTED", "READY_FOR_PICKUP", "CANCELLED"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { const user = await getCurrentUser(); if (!user || user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid donation status." }, { status: 400 }); try { const { id } = await params; return NextResponse.json({ donation: await transitionSellerDonation(user.id, id, parsed.data.status) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Donation update failed." }, { status: 409 }); } }
