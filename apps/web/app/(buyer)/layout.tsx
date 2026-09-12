import { requireRole } from "@/lib/authorization";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function BuyerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole("BUYER");
  return <DashboardShell role="buyer">{children}</DashboardShell>;
}
