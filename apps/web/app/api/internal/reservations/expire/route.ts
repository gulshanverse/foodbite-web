import { NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/order-domain";

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  await releaseExpiredReservations();
  return NextResponse.json({ ok: true });
}
export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
