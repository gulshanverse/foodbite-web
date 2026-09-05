import { NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/order-domain";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  await releaseExpiredReservations();
  return NextResponse.json({ ok: true });
}
