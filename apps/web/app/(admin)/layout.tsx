import { requireRole } from "@/lib/authorization";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole("ADMIN", "MODERATOR", "SUPPORT", "SUPER_ADMIN");
  return <DashboardShell role="admin">{children}</DashboardShell>;
}
