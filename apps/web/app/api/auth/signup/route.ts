import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@foodbite/validation";
import { checkRateLimit, clientKey, rateLimitResponse } from "@/lib/security";

export async function POST(request: Request) {
  const limit = checkRateLimit(`signup:${clientKey(request)}`, { limit: 5, windowMs: 15 * 60_000 });
  if (!limit.allowed) return NextResponse.json({ error: "Too many signup attempts. Try again later." }, { status: 429, headers: rateLimitResponse(limit) });
  try {
    const input = signupSchema.parse(await request.json());
    const existing = await prisma.user.findFirst({ where: { email: input.email.toLowerCase(), deletedAt: null }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "Unable to create account with these details." }, { status: 409 });
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({ data: { email: input.email.toLowerCase(), passwordHash, role: input.role, status: "ACTIVE", ...(input.role === "BUYER" ? { buyerProfile: { create: { name: input.name } } } : input.role === "SELLER" ? { sellerProfile: { create: {} } } : { ngoProfile: { create: { organizationName: input.name, contactPerson: input.name, verificationStatus: "PENDING" } } }) }, select: { id: true, email: true, role: true, status: true } });
    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }
}
