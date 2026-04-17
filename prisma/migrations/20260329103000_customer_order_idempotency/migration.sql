-- Idempotência em pedidos (retry com mesma Idempotency-Key não duplica).
ALTER TABLE "customer_orders" ADD COLUMN "idempotency_key" VARCHAR(128);

CREATE UNIQUE INDEX "customer_orders_user_id_idempotency_key_key" ON "customer_orders" ("userId", "idempotency_key");
