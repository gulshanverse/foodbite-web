import { redirect } from "next/navigation";
import type { AccountStatus, UserRole } from "@prisma/client";
import { getCurrentUser, type AppUser } from "@/lib/auth";

export type Permission =
  | "LISTING_MODERATE"
  | "SELLER_VERIFY"
  | "ACCOUNT_SUSPEND"
  | "ORDER_SUPPORT"
  | "REFUND_MANAGE"
  | "AUDIT_READ"
  | "NGO_VERIFY";

const permissions: Record<Permission, UserRole[]> = {
  LISTING_MODERATE: ["MODERATOR", "ADMIN", "SUPER_ADMIN"],
  SELLER_VERIFY: ["MODERATOR", "ADMIN", "SUPER_ADMIN"],
  ACCOUNT_SUSPEND: ["ADMIN", "SUPER_ADMIN"],
  ORDER_SUPPORT: ["SUPPORT", "ADMIN", "SUPER_ADMIN"],
  REFUND_MANAGE: ["SUPPORT", "ADMIN", "SUPER_ADMIN"],
  AUDIT_READ: ["ADMIN", "SUPER_ADMIN"],
  NGO_VERIFY: ["ADMIN", "SUPER_ADMIN"],
};

export function canAccessRole(userRole: UserRole, allowedRoles: UserRole[]) { return allowedRoles.includes(userRole); }
export function hasPermission(user: Pick<AppUser, "role" | "status">, permission: Permission) {
  return user.status === "ACTIVE" && permissions[permission].includes(user.role);
}

export async function requireAuth() { const user = await getCurrentUser(); if (!user) redirect("/login"); return user; }
export async function requireRole(...roles: UserRole[]) { const user = await requireAuth(); if (user.status !== "ACTIVE" || !roles.includes(user.role)) redirect("/forbidden"); return user; }
export async function requireActiveAccount() { const user = await requireAuth(); if (user.status !== ("ACTIVE" as AccountStatus)) redirect("/forbidden?reason=account-status"); return user; }

export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: "unauthenticated" as const };
  if (!hasPermission(user, permission)) return { user, response: "forbidden" as const };
  return { user, response: null };
}
