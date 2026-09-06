import { requireRole } from "@/lib/authorization";
export default async function BuyerLayout({ children }: Readonly<{ children: React.ReactNode }>) { await requireRole("BUYER"); return <>{children}</>; }
