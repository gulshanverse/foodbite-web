import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createListing } from "@/lib/seller-domain";
import { listOwnedListings } from "@/lib/seller-operations-domain";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  return NextResponse.json(await listOwnedListings(user.id, Object.fromEntries(new URL(request.url).searchParams)));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try { const listing = await createListing(user.id, await request.json(), "DRAFT"); return NextResponse.json({ listing }, { status: 201 }); }
  catch { return NextResponse.json({ error: "Please check the listing details." }, { status: 400 }); }
}
