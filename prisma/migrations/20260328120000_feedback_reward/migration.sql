-- Recompensa opcional pós-feedback (configurável pelo dono no portal).
ALTER TABLE "establishments" ADD COLUMN "feedback_reward_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "establishments" ADD COLUMN "feedback_reward_message" VARCHAR(500);
