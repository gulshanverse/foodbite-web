import { NextResponse } from "next/server";
import { processPendingNotifications } from "@/lib/notification-domain";

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (!expected || !provided || provided !== expected) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const result = await processPendingNotifications(25);
  return NextResponse.json({ processed: result.length, result });
}
