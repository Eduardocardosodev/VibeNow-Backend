/** Resposta de GET /feedbacks/me — campos de Feedback + estabelecimento (evita N+1 no app). */
export type FeedbackMineResponse = {
  id: number;
  userId: number;
  establishmentId: number;
  rating: number;
  comment: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  establishment: {
    id: number;
    name: string;
  };
};

/** Lista paginada de GET /feedbacks/me. */
export type FeedbackMinePaginatedResponse = {
  items: FeedbackMineResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
