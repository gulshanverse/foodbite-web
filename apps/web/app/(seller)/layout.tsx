import { requireRole } from "@/lib/authorization";
export default async function SellerLayout({ children }: Readonly<{ children: React.ReactNode }>) { await requireRole("SELLER"); return <>{children}</>; }
