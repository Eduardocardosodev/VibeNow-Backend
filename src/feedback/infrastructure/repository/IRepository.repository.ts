import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackMineResponse } from '../../dto/feedback-mine-response.dto';

export type FeedbackMinePageResult = {
  items: FeedbackMineResponse[];
  total: number;
};

export type FeedbackPanelFilter = {
  from?: Date;
  to?: Date;
  minRating?: number;
  maxRating?: number;
  hasPhoto?: boolean;
};

export type FeedbackPanelPageResult = {
  items: Feedback[];
  total: number;
};

export interface IRepositoryFeedback {
  findLastByUserAndEstablishment(
    userId: number,
    establishmentId: number,
  ): Promise<Feedback | null>;
  findAll(): Promise<Feedback[]>;
  findById(id: number): Promise<Feedback | null>;
  findByEstablishmentId(establishmentId: number): Promise<Feedback[]>;
  findByEstablishmentPanel(
    establishmentId: number,
    filter: FeedbackPanelFilter,
    skip: number,
    take: number,
    sortDesc: boolean,
  ): Promise<FeedbackPanelPageResult>;
  findRatingsInRange(
    establishmentId: number,
    from: Date,
    to: Date,
  ): Promise<{ rating: number; createdAt: Date }[]>;
  findByUserIdAndIdempotencyKey(
    userId: number,
    idempotencyKey: string,
  ): Promise<Feedback | null>;
  findByUserIdWithEstablishmentPaginated(
    userId: number,
    skip: number,
    take: number,
  ): Promise<FeedbackMinePageResult>;
  create(entity: Feedback): Promise<Feedback>;
  update(entity: Feedback): Promise<Feedback | null>;
  delete(id: number): Promise<void>;
}
