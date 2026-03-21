import { Feedback } from '../../domain/entities/feedback.entity';
import { FeedbackMineResponse } from '../../dto/feedback-mine-response.dto';

export type FeedbackMinePageResult = {
  items: FeedbackMineResponse[];
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
  findByUserIdWithEstablishmentPaginated(
    userId: number,
    skip: number,
    take: number,
  ): Promise<FeedbackMinePageResult>;
  create(entity: Feedback): Promise<Feedback>;
  update(entity: Feedback): Promise<Feedback | null>;
  delete(id: number): Promise<void>;
}
