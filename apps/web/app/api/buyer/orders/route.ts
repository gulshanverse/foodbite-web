import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createOrderFromCart, getBuyerOrders } from "@/lib/order-domain";
import { fulfillmentSchema } from "@foodbite/validation";

async function buyer() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUYER" || user.status !== "ACTIVE") return null;
  return user;
}

export async function GET() {
  const user = await buyer();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ orders: await getBuyerOrders(user.id) });
}

export async function POST(request: Request) {
  const user = await buyer();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const parsed = fulfillmentSchema.safeParse(await request.json().catch(() => ({ method: "PICKUP" })));
    if (!parsed.success) return NextResponse.json({ error: "Invalid fulfillment selection." }, { status: 400 });
    const order = await createOrderFromCart(user.id, parsed.data);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create order." }, { status: 409 });
  }
}
