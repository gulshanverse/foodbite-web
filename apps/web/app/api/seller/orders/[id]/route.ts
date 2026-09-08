import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { transitionSellerOrder } from "@/lib/seller-order-domain";

const schema = z.object({ status: z.enum(["CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "CANCELLED", "COMPLETED"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  try { const { id } = await params; const order = await transitionSellerOrder(user.id, id, parsed.data.status); return NextResponse.json({ order }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Order update failed." }, { status: 409 }); }
}
