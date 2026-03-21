-- CreateTable
CREATE TABLE "quotes" (
    "id" SERIAL NOT NULL,
    "establishmentId" INTEGER NOT NULL,
    "text" VARCHAR(80) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
