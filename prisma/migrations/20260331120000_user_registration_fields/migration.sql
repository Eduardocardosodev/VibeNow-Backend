-- AlterTable
ALTER TABLE "users" ADD COLUMN "date_of_birth" DATE,
ADD COLUMN "accepted_terms_of_use" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "accepted_privacy_policy" BOOLEAN NOT NULL DEFAULT false;
