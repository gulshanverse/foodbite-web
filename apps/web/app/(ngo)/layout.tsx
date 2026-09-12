import { requireRole } from "@/lib/authorization";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function NgoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole("NGO");
  return <DashboardShell role="ngo">{children}</DashboardShell>;
}
