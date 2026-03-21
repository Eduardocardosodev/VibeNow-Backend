/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstablishmentType" AS ENUM ('LOUNGE', 'PARTY');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "establishments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "instagram" TEXT NOT NULL,
    "establishmentType" "EstablishmentType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "establishments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "establishments_cnpj_key" ON "establishments"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "establishments_email_key" ON "establishments"("email");

-- CreateIndex
CREATE UNIQUE INDEX "establishments_instagram_key" ON "establishments"("instagram");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
