import { requireRole } from "@/lib/authorization";
export default async function NgoLayout({ children }: Readonly<{ children: React.ReactNode }>) { await requireRole("NGO"); return <>{children}</>; }
