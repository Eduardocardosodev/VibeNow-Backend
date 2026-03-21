import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Feedback } from '../domain/entities/feedback.entity';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { FeedbackMinePaginatedResponse } from '../dto/feedback-mine-response.dto';
import { UpdateFeedbackDto } from '../dto/update-feedback.dto';
import { IRepositoryFeedback } from '../infrastructure/repository/IRepository.repository';
import { IRepositoryEstablishment } from 'src/establishment/infrastructure/repository/IRepository.repository';
import { Establishment } from 'src/establishment/domain/entities/establishment.entity';

const DEFAULT_FEEDBACK_MINE_PAGE = 1;
const DEFAULT_FEEDBACK_MINE_PAGE_SIZE = 20;
const MAX_FEEDBACK_MINE_PAGE_SIZE = 100;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export class FeedbackUsecase {
  constructor(
    private readonly feedbackRepository: IRepositoryFeedback,
    private readonly establishmentRepository: IRepositoryEstablishment,
  ) {}

  private async recalculateEstablishmentScore(
    establishmentId: number,
  ): Promise<void> {
    const feedbacks =
      await this.feedbackRepository.findByEstablishmentId(establishmentId);
    const score =
      feedbacks.length > 0
        ? Math.round(
            (feedbacks.reduce((sum, f) => sum + f.rating, 0) /
              feedbacks.length) *
              10,
          ) / 10
        : 0;

    const establishment =
      await this.establishmentRepository.findById(establishmentId);
    if (!establishment) return;

    const now = new Date();
    await this.establishmentRepository.update(
      new Establishment(
        establishment.id,
        establishment.name,
        establishment.cnpj,
        establishment.address,
        establishment.city,
        establishment.state,
        establishment.zipCode,
        establishment.phone,
        establishment.email,
        establishment.instagram,
        establishment.establishmentType,
        establishment.profilePhoto,
        establishment.latitude,
        establishment.longitude,
        score,
        establishment.openingHours,
        establishment.createdAt,
        now,
      ),
    );
  }

  async execute(userId: number, data: CreateFeedbackDto): Promise<Feedback> {
    const last = await this.feedbackRepository.findLastByUserAndEstablishment(
      userId,
      data.establishmentId,
    );
    const now = new Date();
    if (last && isSameDay(last.createdAt, now)) {
      throw new BadRequestException(
        'Você já fez um feedback para este estabelecimento hoje. Tente novamente amanhã.',
      );
    }

    const feedback = new Feedback(
      0,
      userId,
      data.establishmentId,
      data.rating,
      data.comment ?? null,
      data.photoUrl ?? null,
      now,
      now,
    );
    const created = await this.feedbackRepository.create(feedback);
    await this.recalculateEstablishmentScore(data.establishmentId);
    return created;
  }

  async findAll(): Promise<Feedback[]> {
    const list = await this.feedbackRepository.findAll();
    if (list.length === 0) {
      throw new NotFoundException('Feedbacks not found');
    }
    return list;
  }

  async findById(id: number): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findById(id);
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }
    return feedback;
  }

  async findByEstablishmentId(establishmentId: number): Promise<Feedback[]> {
    return await this.feedbackRepository.findByEstablishmentId(establishmentId);
  }

  /**
   * Feedbacks do usuário logado, paginados (GET /feedbacks/me).
   * Query: ?page=1&pageSize=20 (pageSize máx. 100).
   */
  async findMine(
    userId: number,
    page?: number,
    pageSize?: number,
  ): Promise<FeedbackMinePaginatedResponse> {
    const p = Math.max(1, page ?? DEFAULT_FEEDBACK_MINE_PAGE);
    const size = Math.min(
      MAX_FEEDBACK_MINE_PAGE_SIZE,
      Math.max(1, pageSize ?? DEFAULT_FEEDBACK_MINE_PAGE_SIZE),
    );
    const skip = (p - 1) * size;
    const { items, total } =
      await this.feedbackRepository.findByUserIdWithEstablishmentPaginated(
        userId,
        skip,
        size,
      );
    const totalPages = total === 0 ? 0 : Math.ceil(total / size);
    return {
      items,
      total,
      page: p,
      pageSize: size,
      totalPages,
    };
  }

  async update(id: number, data: UpdateFeedbackDto): Promise<Feedback | null> {
    const feedback = await this.feedbackRepository.findById(id);
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }
    const now = new Date();
    const updated = await this.feedbackRepository.update(
      new Feedback(
        feedback.id,
        feedback.userId,
        feedback.establishmentId,
        data.rating ?? feedback.rating,
        data.comment !== undefined ? data.comment : feedback.comment,
        data.photoUrl !== undefined ? data.photoUrl : feedback.photoUrl,
        feedback.createdAt,
        now,
      ),
    );
    await this.recalculateEstablishmentScore(feedback.establishmentId);
    return updated;
  }

  async delete(id: number): Promise<void> {
    const feedback = await this.feedbackRepository.findById(id);
    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }
    const establishmentId = feedback.establishmentId;
    await this.feedbackRepository.delete(id);
    await this.recalculateEstablishmentScore(establishmentId);
  }
}
