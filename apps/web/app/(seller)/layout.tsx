import { requireRole } from "@/lib/authorization";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default async function SellerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole("SELLER");
  return <DashboardShell role="seller">{children}</DashboardShell>;
}
