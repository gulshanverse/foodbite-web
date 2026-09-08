import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { refundOrder } from "@/lib/refund-domain";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission("REFUND_MANAGE");
  if (gate.response === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (gate.response) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try { const { id } = await params; return NextResponse.json({ order: await refundOrder(gate.user!.id, id) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Refund failed." }, { status: 409 }); }
}
