import { Feedback } from '../domain/entities/feedback.entity';

/** Mensagem pós-feedback quando o estabelecimento tem recompensa ativa. */
export type FeedbackRewardPayload = {
  message: string;
};

/** Resultado de POST /feedbacks — replay em retry de rede (mesma Idempotency-Key). */
export type CreateFeedbackResult = {
  feedback: Feedback;
  /** true = registro já existia (HTTP 200); false = criado agora (HTTP 201). */
  replay: boolean;
  /** Se não null, o app pode exibir um alerta/modal com `message`. */
  reward: FeedbackRewardPayload | null;
};
