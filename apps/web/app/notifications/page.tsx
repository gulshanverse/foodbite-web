import { requireActiveAccount } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { NotificationsList } from "./notifications-list";

export default async function NotificationsPage() {
  const user = await requireActiveAccount();
  const notifications = await prisma.notification.findMany({ where: { recipientId: user.id, channel: "IN_APP" }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, title: true, body: true, createdAt: true, readAt: true } });
  return <main className="mx-auto max-w-3xl px-6 py-12"><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#e85d3f]">Your updates</p><h1 className="mt-3 text-4xl font-bold text-[#173f3b]">Notifications</h1><p className="mt-3 text-[#55706c]">Order and pickup updates from FoodBite. Transactional notifications stay separate from marketing preferences.</p><section aria-label="Notification list" className="mt-8"><NotificationsList initial={notifications.map((notification) => ({ ...notification, createdAt: notification.createdAt.toISOString(), readAt: notification.readAt?.toISOString() ?? null }))} /></section></main>;
}
