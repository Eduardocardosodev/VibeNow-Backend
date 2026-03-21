-- AlterTable
ALTER TABLE "scheduled_events" ADD COLUMN "tablesAvailable" INTEGER,
ADD COLUMN "boothsAvailable" INTEGER;

-- Dados antigos: preenche quantidade mínima onde já havia oferta sem contagem
UPDATE "scheduled_events"
SET "tablesAvailable" = 1
WHERE "offersTableReservation" = true AND "tablesAvailable" IS NULL;

UPDATE "scheduled_events"
SET "boothsAvailable" = 1
WHERE "offersBoothReservation" = true AND "boothsAvailable" IS NULL;
