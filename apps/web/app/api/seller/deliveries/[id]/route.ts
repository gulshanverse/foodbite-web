import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { transitionDelivery } from "@/lib/delivery-domain";
const schema = z.object({ status: z.enum(["ASSIGNED", "PICKED_UP_FROM_SELLER", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid delivery status." }, { status: 400 });
  try { const { id } = await params; return NextResponse.json({ delivery: await transitionDelivery(user.id, id, parsed.data.status) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Delivery update failed." }, { status: 409 }); }
}
