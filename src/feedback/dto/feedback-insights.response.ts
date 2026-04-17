/** Regras de sentimento baseadas na média dos 5 tópicos (1.0–5.0). */
export type FeedbackSentimentRules = {
  positive: { minRating: number };
  neutral: { minRating: number; maxRating: number };
  negative: { maxRating: number };
};

export type FeedbackInsightsTotals = {
  count: number;
  averageRating: number | null;
  positive: number;
  neutral: number;
  negative: number;
};

export type FeedbackInsightsBucket = {
  /** Início do bucket em ISO UTC (`hour`: início da hora; `day`: meia-noite UTC do dia). */
  bucketStart: string;
  count: number;
  averageRating: number | null;
  positive: number;
  neutral: number;
  negative: number;
};

export type FeedbackInsightsHighlight = {
  bucketStart: string;
  positives: number;
  totalInBucket: number;
  averageRating: number | null;
};

export type FeedbackInsightsLive = {
  minutes: number;
  from: string;
  to: string;
} & FeedbackInsightsTotals;

export type FeedbackInsightsResponse = {
  establishmentId: number;
  from: string;
  to: string;
  bucket: 'hour' | 'day';
  sentimentRules: FeedbackSentimentRules;
  totals: FeedbackInsightsTotals;
  buckets: FeedbackInsightsBucket[];
  /** Bucket com mais feedbacks “positivos” (empate: maior média). */
  peakPositivePraise: FeedbackInsightsHighlight | null;
  /** Texto pronto para card comercial (null se não houver elogios no período). */
  peakPositivePraiseHint: string | null;
  /** Últimos N minutos (pedido com `liveMinutes`). */
  live?: FeedbackInsightsLive;
};
