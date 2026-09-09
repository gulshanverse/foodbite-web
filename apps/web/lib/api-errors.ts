import { NextResponse } from "next/server";
import { log, safeErrorCategory } from "@/lib/logger";
export type ErrorCategory = "validation" | "authentication" | "authorization" | "not_found" | "conflict" | "rate_limited" | "dependency_failure" | "database_failure" | "provider_failure" | "internal_error";
export function errorResponse(category: ErrorCategory, message: string, requestId: string, status: number) { if (status >= 500) log("error", "api_error", { requestId, category, status }); return NextResponse.json({ error: message, requestId }, { status, headers: { "x-request-id": requestId } }); }
export function unexpectedError(error: unknown, requestId: string, fallback = "Something went wrong.") { log("error", "unhandled_api_error", { requestId, category: safeErrorCategory(error) }); return errorResponse("internal_error", `${fallback} Reference: ${requestId}`, requestId, 500); }
