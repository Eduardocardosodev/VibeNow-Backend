-- AlterTable
ALTER TABLE "feedbacks" ADD COLUMN "idempotency_key" VARCHAR(128);

-- CreateIndex: um par (userId, idempotency_key) único quando a chave não é NULL; vários NULL legados por usuário são permitidos no Postgres
CREATE UNIQUE INDEX "feedbacks_user_id_idempotency_key_key" ON "feedbacks"("userId", "idempotency_key");
