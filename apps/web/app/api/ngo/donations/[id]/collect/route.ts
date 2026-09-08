import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { collectDonation } from "@/lib/donation-domain";
const schema = z.object({ code: z.string().regex(/^\d{6}$/) });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const user = await getCurrentUser(); if (!user || user.role !== "NGO" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 }); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid handoff code." }, { status: 400 }); try { const { id } = await params; return NextResponse.json({ donation: await collectDonation(user.id, id, parsed.data.code) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Collection failed." }, { status: 409 }); } }
