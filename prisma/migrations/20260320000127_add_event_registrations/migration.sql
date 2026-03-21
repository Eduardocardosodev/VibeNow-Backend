-- CreateTable
CREATE TABLE "event_registrations" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "scheduledEventId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_registrations_scheduledEventId_idx" ON "event_registrations"("scheduledEventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_userId_scheduledEventId_key" ON "event_registrations"("userId", "scheduledEventId");

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_scheduledEventId_fkey" FOREIGN KEY ("scheduledEventId") REFERENCES "scheduled_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
