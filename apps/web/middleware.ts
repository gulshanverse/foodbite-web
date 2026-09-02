import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/buyer", "/seller", "/admin", "/account"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return NextResponse.next();
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token?.sub) return NextResponse.redirect(new URL("/login", request.url));
  if (["BANNED", "DEACTIVATED"].includes(String(token.status))) return NextResponse.redirect(new URL("/forbidden?reason=account-status", request.url));
  const role = String(token.role);
  if (pathname.startsWith("/buyer") && role !== "BUYER") return NextResponse.redirect(new URL("/forbidden", request.url));
  if (pathname.startsWith("/seller") && role !== "SELLER") return NextResponse.redirect(new URL("/forbidden", request.url));
  if (pathname.startsWith("/admin") && role !== "ADMIN") return NextResponse.redirect(new URL("/forbidden", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/buyer/:path*", "/seller/:path*", "/admin/:path*", "/account/:path*"] };
