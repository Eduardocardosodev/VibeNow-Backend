-- CreateEnum (UserRole — se já existir, comente esta parte e rode o restante)
CREATE TYPE "UserRole" AS ENUM ('NORMAL_USER', 'ADMIN', 'OWNER_ESTABLISHMENT', 'EMPLOYEE_ESTABLISHMENT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'NORMAL_USER';

-- AlterTable
ALTER TABLE "establishments" ADD COLUMN "owner_user_id" INTEGER;

-- AddForeignKey
ALTER TABLE "establishments" ADD CONSTRAINT "establishments_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "establishments_owner_user_id_idx" ON "establishments"("owner_user_id");

-- CreateTable
CREATE TABLE "establishment_employees" (
    "id" SERIAL NOT NULL,
    "establishmentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "establishment_employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "establishment_employees_establishmentId_userId_key" ON "establishment_employees"("establishmentId", "userId");

-- AddForeignKey
ALTER TABLE "establishment_employees" ADD CONSTRAINT "establishment_employees_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establishment_employees" ADD CONSTRAINT "establishment_employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
