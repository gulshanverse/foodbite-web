import { requireRole } from "@/lib/authorization";
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) { await requireRole("ADMIN"); return <>{children}</>; }
