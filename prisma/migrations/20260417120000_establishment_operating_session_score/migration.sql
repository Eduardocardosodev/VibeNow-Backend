-- AlterTable
ALTER TABLE "establishments" ADD COLUMN "operating_time_zone" VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo';

-- CreateTable
CREATE TABLE "establishment_operating_sessions" (
    "establishment_id" INTEGER NOT NULL,
    "period_start_utc" TIMESTAMP(3) NOT NULL,
    "period_end_utc" TIMESTAMP(3) NOT NULL,
    "sum_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feedback_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "establishment_operating_sessions_pkey" PRIMARY KEY ("establishment_id")
);

-- CreateIndex
CREATE INDEX "establishment_operating_sessions_period_end_utc_idx" ON "establishment_operating_sessions"("period_end_utc");

-- AddForeignKey
ALTER TABLE "establishment_operating_sessions" ADD CONSTRAINT "establishment_operating_sessions_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "establishment_score_periods" (
    "id" SERIAL NOT NULL,
    "establishment_id" INTEGER NOT NULL,
    "period_start_utc" TIMESTAMP(3) NOT NULL,
    "period_end_utc" TIMESTAMP(3) NOT NULL,
    "sum_rating" DOUBLE PRECISION NOT NULL,
    "feedback_count" INTEGER NOT NULL,
    "average_rating" DOUBLE PRECISION NOT NULL,
    "closed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "establishment_score_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "establishment_score_periods_establishment_id_period_end_utc_idx" ON "establishment_score_periods"("establishment_id", "period_end_utc");

-- AddForeignKey
ALTER TABLE "establishment_score_periods" ADD CONSTRAINT "establishment_score_periods_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
