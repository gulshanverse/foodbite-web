CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH', 'WHATSAPP');
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');
CREATE TYPE "NotificationType" AS ENUM ('ORDER_CREATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'ORDER_CONFIRMED', 'ORDER_PREPARING', 'ORDER_READY_FOR_PICKUP', 'ORDER_PICKED_UP', 'ORDER_COMPLETED', 'ORDER_CANCELLED', 'REFUND_PENDING', 'REFUND_COMPLETED', 'NEW_SELLER_ORDER', 'OPERATIONAL_ALERT');

CREATE TABLE "NotificationPreference" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
  "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
  "pushNotifications" BOOLEAN NOT NULL DEFAULT false,
  "whatsappNotifications" BOOLEAN NOT NULL DEFAULT false,
  "marketingNotifications" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" UUID NOT NULL,
  "eventId" TEXT NOT NULL,
  "recipientId" UUID NOT NULL,
  "type" "NotificationType" NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3),
  "processedAt" TIMESTAMP(3),
  "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3),
  "lastError" TEXT,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
CREATE UNIQUE INDEX "Notification_eventId_recipientId_type_channel_key" ON "Notification"("eventId", "recipientId", "type", "channel");
CREATE INDEX "Notification_recipientId_channel_createdAt_idx" ON "Notification"("recipientId", "channel", "createdAt");
CREATE INDEX "Notification_status_nextAttemptAt_idx" ON "Notification"("status", "nextAttemptAt");
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
