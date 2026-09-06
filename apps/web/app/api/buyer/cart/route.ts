import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { addCartItem, getOrCreateCart, removeCartItem, updateCartItem } from "@/lib/order-domain";

const itemSchema = z.object({ listingId: z.string().uuid(), quantity: z.number().int().positive().max(1000) });

async function buyer() {
  const user = await getCurrentUser();
  if (!user || user.role !== "BUYER" || user.status !== "ACTIVE") return null;
  return user;
}

export async function GET() {
  const user = await buyer();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ cart: await getOrCreateCart(user.id) });
}

export async function POST(request: Request) {
  const user = await buyer();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = itemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
  try { await addCartItem(user.id, parsed.data.listingId, parsed.data.quantity); return NextResponse.json({ cart: await getOrCreateCart(user.id) }, { status: 201 }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update cart." }, { status: 409 }); }
}

export async function PATCH(request: Request) {
  const user = await buyer();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = itemSchema.extend({ quantity: z.number().int().min(0).max(1000) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
  try { await updateCartItem(user.id, parsed.data.listingId, parsed.data.quantity); return NextResponse.json({ cart: await getOrCreateCart(user.id) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update cart." }, { status: 409 }); }
}

export async function DELETE(request: Request) {
  const user = await buyer();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const parsed = z.object({ listingId: z.string().uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid listing." }, { status: 400 });
  await removeCartItem(user.id, parsed.data.listingId);
  return NextResponse.json({ cart: await getOrCreateCart(user.id) });
}
