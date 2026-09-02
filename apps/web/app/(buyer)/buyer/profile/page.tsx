import { requireRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";

export default async function BuyerProfilePage() {
  const user = await requireRole("BUYER");
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id }, select: { name: true } });
  return <main className="mx-auto max-w-3xl px-6 py-16"><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#e85d3f]">Buyer profile</p><h1 className="mt-3 text-4xl font-bold text-[#173f3b]">Your profile</h1><p className="mt-4 text-[#55706c]">{user.email}</p><ProfileForm initialName={profile?.name ?? user.name ?? ""} /></main>;
}
