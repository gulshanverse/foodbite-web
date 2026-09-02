import { redirect } from "next/navigation";
import type { AccountStatus, UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

export async function requireAuth() { const user = await getCurrentUser(); if (!user) redirect("/login"); return user; }
export async function requireRole(...roles: UserRole[]) { const user = await requireAuth(); if (user.status !== "ACTIVE" || !roles.includes(user.role)) redirect("/forbidden"); return user; }
export async function requireActiveAccount() { const user = await requireAuth(); if (user.status !== ("ACTIVE" as AccountStatus)) redirect("/forbidden?reason=account-status"); return user; }
export function canAccessRole(userRole: UserRole, allowedRoles: UserRole[]) { return allowedRoles.includes(userRole); }
