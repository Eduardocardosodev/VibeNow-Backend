-- CreateEnum
CREATE TYPE "EventListType" AS ENUM ('GENERAL', 'FREE_LIST', 'FRIEND_LIST', 'VIP');

-- CreateTable
CREATE TABLE "scheduled_events" (
    "id" SERIAL NOT NULL,
    "establishmentId" INTEGER NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" VARCHAR(2000),
    "attractions" VARCHAR(2000),
    "dj" VARCHAR(160),
    "priceInfo" VARCHAR(500),
    "eventStartsAt" TIMESTAMP(3) NOT NULL,
    "eventEndsAt" TIMESTAMP(3),
    "listType" "EventListType" NOT NULL DEFAULT 'GENERAL',
    "posterImageUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_events_establishmentId_eventStartsAt_idx" ON "scheduled_events"("establishmentId", "eventStartsAt");

-- AddForeignKey
ALTER TABLE "scheduled_events" ADD CONSTRAINT "scheduled_events_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
