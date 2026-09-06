import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { removeCartItem, updateCartItem } from "@/lib/commerce-domain";

export async function PATCH(request: Request, { params }: { params: Promise<{ listingId: string }> }) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); try { const { listingId } = await params; return NextResponse.json({ cart: await updateCartItem(user.id, listingId, await request.json()) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Cart update failed." }, { status: 400 }); } }
export async function DELETE(_: Request, { params }: { params: Promise<{ listingId: string }> }) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 }); try { const { listingId } = await params; return NextResponse.json({ cart: await removeCartItem(user.id, listingId) }); } catch { return NextResponse.json({ error: "Cart item could not be removed." }, { status: 400 }); } }
