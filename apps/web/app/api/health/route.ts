import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/logger";
export async function GET(request: Request) { const requestId = createRequestId(request.headers.get("x-request-id")); return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
