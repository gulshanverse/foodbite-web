import { UserRound } from "lucide-react";
import { requireRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";

export default async function BuyerProfilePage() { const user = await requireRole("BUYER"); const profile = await prisma.buyerProfile.findUnique({ where: { userId: user.id }, select: { name: true } }); return <main className="product-page"><div className="flex items-end gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><UserRound className="size-6" /></span><div><p className="page-kicker">Buyer account</p><h1 className="mt-2 text-4xl font-black sm:text-5xl">Your profile</h1></div></div><p className="mt-4">{user.email}</p><section className="form-section mt-7 max-w-3xl"><h2 className="text-xl font-black">Personal details</h2><p className="mt-1 text-sm">Keep your account information current for a smoother checkout experience.</p><div className="mt-6"><ProfileForm initialName={profile?.name ?? user.name ?? ""} /></div></section></main>; }
