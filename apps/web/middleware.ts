import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
const protectedPrefixes = ["/buyer", "/seller", "/admin", "/ngo", "/account"];
const requestIdPattern = /^[A-Za-z0-9._:-]{8,128}$/;
function withRequestId(request: NextRequest, requestId: string) { const headers = new Headers(request.headers); headers.set("x-request-id", requestId); return headers; }
function secure(response: NextResponse, requestId: string) { response.headers.set("x-request-id", requestId); response.headers.set("x-content-type-options", "nosniff"); response.headers.set("referrer-policy", "strict-origin-when-cross-origin"); response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()"); response.headers.set("x-frame-options", "DENY"); return response; }
export async function middleware(request: NextRequest) {
  const supplied = request.headers.get("x-request-id"); const requestId = supplied && requestIdPattern.test(supplied) ? supplied : `req_${crypto.randomUUID()}`; const requestHeaders = withRequestId(request, requestId); const next = () => secure(NextResponse.next({ request: { headers: requestHeaders } }), requestId);
  const { pathname } = request.nextUrl;
  if (!protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return next();
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token?.sub) return secure(NextResponse.redirect(new URL("/login", request.url)), requestId);
  if (["BANNED", "DEACTIVATED"].includes(String(token.status))) return secure(NextResponse.redirect(new URL("/forbidden?reason=account-status", request.url)), requestId);
  const role = String(token.role);
  if (pathname.startsWith("/buyer") && role !== "BUYER") return secure(NextResponse.redirect(new URL("/forbidden", request.url)), requestId);
  if (pathname.startsWith("/seller") && role !== "SELLER") return secure(NextResponse.redirect(new URL("/forbidden", request.url)), requestId);
  if (pathname.startsWith("/ngo") && role !== "NGO") return secure(NextResponse.redirect(new URL("/forbidden", request.url)), requestId);
  if (pathname.startsWith("/admin") && !["ADMIN", "MODERATOR", "SUPPORT", "SUPER_ADMIN"].includes(role)) return secure(NextResponse.redirect(new URL("/forbidden", request.url)), requestId);
  return next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
