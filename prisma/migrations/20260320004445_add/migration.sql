-- AlterTable
ALTER TABLE "scheduled_events" ADD COLUMN     "boothPeopleCapacity" INTEGER,
ADD COLUMN     "offersBoothReservation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offersTableReservation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tablePeopleCapacity" INTEGER;
