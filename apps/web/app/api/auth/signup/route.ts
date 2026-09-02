import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@foodbite/validation";

export async function POST(request: Request) {
  try {
    const input = signupSchema.parse(await request.json());
    const existing = await prisma.user.findFirst({ where: { email: input.email.toLowerCase(), deletedAt: null }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "Unable to create account with these details." }, { status: 409 });
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({ data: { email: input.email.toLowerCase(), passwordHash, role: input.role, status: "ACTIVE", ...(input.role === "BUYER" ? { buyerProfile: { create: { name: input.name } } } : { sellerProfile: { create: {} } }) }, select: { id: true, email: true, role: true, status: true } });
    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }
}
