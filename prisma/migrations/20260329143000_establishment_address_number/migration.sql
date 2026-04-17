-- AlterTable
ALTER TABLE "establishments" ADD COLUMN "address_number" VARCHAR(30) NOT NULL DEFAULT '';

-- Drop o default temporário (movido de 20260325004853_add_number_address)
ALTER TABLE "establishments" ALTER COLUMN "address_number" DROP DEFAULT;
