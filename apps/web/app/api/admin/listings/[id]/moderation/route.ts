import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/authorization";
import { moderateListing } from "@/lib/admin-domain";

const schema = z.object({ status: z.enum(["ACTIVE", "BLOCKED"]), reason: z.string().trim().max(500).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("LISTING_MODERATE");
  if (gate.response === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (gate.response) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
  try { const { id } = await params; const listing = await moderateListing(gate.user!.id, id, parsed.data.status, parsed.data.reason); return NextResponse.json({ listing }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Moderation action failed." }, { status: 409 }); }
}
