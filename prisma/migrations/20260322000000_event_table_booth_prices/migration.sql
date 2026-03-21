-- AlterTable
ALTER TABLE "scheduled_events" ADD COLUMN "tablePrice" DECIMAL(10,2),
ADD COLUMN "boothPrice" DECIMAL(10,2);

-- Registros antigos com oferta ativa: valor mínimo até o dono ajustar no portal
UPDATE "scheduled_events"
SET "tablePrice" = 1.00
WHERE "offersTableReservation" = true AND "tablePrice" IS NULL;

UPDATE "scheduled_events"
SET "boothPrice" = 1.00
WHERE "offersBoothReservation" = true AND "boothPrice" IS NULL;
