import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/authorization";
import { transitionSellerVerification } from "@/lib/admin-domain";

const schema = z.object({ status: z.enum(["UNDER_REVIEW", "VERIFIED", "REJECTED", "SUSPENDED"]), reason: z.string().trim().max(500).optional() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("SELLER_VERIFY");
  if (gate.response === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (gate.response) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid verification action." }, { status: 400 });
  try { const { id } = await params; const seller = await transitionSellerVerification(gate.user!.id, id, parsed.data.status, parsed.data.reason); return NextResponse.json({ seller }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Verification action failed." }, { status: 409 }); }
}
