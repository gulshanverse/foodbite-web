import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelBuyerOrder, getBuyerOrder } from "@/lib/order-domain";

async function buyer() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUYER" || user.status !== "ACTIVE") return null;
  return user;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await buyer();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  const order = await getBuyerOrder(user.id, id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ order });
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await buyer();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  try { const order = await cancelBuyerOrder(user.id, id); return NextResponse.json({ order }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to cancel order." }, { status: 409 }); }
}
