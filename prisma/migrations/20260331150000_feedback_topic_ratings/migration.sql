-- AlterTable: adicionar 5 campos de tópicos de feedback e converter rating para Float
ALTER TABLE "feedbacks" ADD COLUMN "ratingCrowding" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "feedbacks" ADD COLUMN "ratingAnimation" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "feedbacks" ADD COLUMN "ratingOrganization" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "feedbacks" ADD COLUMN "ratingHygiene" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "feedbacks" ADD COLUMN "ratingAmbience" INTEGER NOT NULL DEFAULT 3;

-- Converter rating de INT para FLOAT (média calculada dos 5 tópicos)
ALTER TABLE "feedbacks" ALTER COLUMN "rating" TYPE DOUBLE PRECISION;

-- Backfill: para feedbacks existentes, copiar o rating antigo para todos os 5 tópicos
UPDATE "feedbacks"
SET "ratingCrowding" = ROUND("rating")::INTEGER,
    "ratingAnimation" = ROUND("rating")::INTEGER,
    "ratingOrganization" = ROUND("rating")::INTEGER,
    "ratingHygiene" = ROUND("rating")::INTEGER,
    "ratingAmbience" = ROUND("rating")::INTEGER;

-- Remover defaults agora que todos os registros existentes foram atualizados
ALTER TABLE "feedbacks" ALTER COLUMN "ratingCrowding" DROP DEFAULT;
ALTER TABLE "feedbacks" ALTER COLUMN "ratingAnimation" DROP DEFAULT;
ALTER TABLE "feedbacks" ALTER COLUMN "ratingOrganization" DROP DEFAULT;
ALTER TABLE "feedbacks" ALTER COLUMN "ratingHygiene" DROP DEFAULT;
ALTER TABLE "feedbacks" ALTER COLUMN "ratingAmbience" DROP DEFAULT;
