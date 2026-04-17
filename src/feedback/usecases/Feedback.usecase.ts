import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Feedback } from '../domain/entities/feedback.entity';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import {
  CreateFeedbackResult,
  FeedbackRewardPayload,
} from '../dto/create-feedback-result.dto';
import { FeedbackMinePaginatedResponse } from '../dto/feedback-mine-response.dto';
import { UpdateFeedbackDto } from '../dto/update-feedback.dto';
import {
  FEEDBACK_PANEL_MAX_RANGE_MS,
  FeedbackEstablishmentPanelQueryDto,
} from '../dto/feedback-establishment-panel-query.dto';
import { FeedbackInsightsQueryDto } from '../dto/feedback-insights-query.dto';
import {
  FeedbackInsightsBucket,
  FeedbackInsightsHighlight,
  FeedbackInsightsLive,
  FeedbackInsightsResponse,
  FeedbackInsightsTotals,
} from '../dto/feedback-insights.response';
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

/** Calcula a média arredondada (1 casa) dos 5 tópicos de rating. */
function computeOverallRating(topics: {
  ratingCrowding: number;
  ratingAnimation: number;
  ratingOrganization: number;
  ratingHygiene: number;
  ratingAmbience: number;
}): number {
  const sum =
    topics.ratingCrowding +
    topics.ratingAnimation +
    topics.ratingOrganization +
    topics.ratingHygiene +
    topics.ratingAmbience;
  return Math.round((sum / 5) * 10) / 10;
}

const DEFAULT_FEEDBACK_REWARD_MESSAGE =
  'Obrigado pelo feedback! Consulte a equipe do local para retirar sua recompensa.';

const MAX_INSIGHTS_RANGE_MS = 400 * 24 * 60 * 60 * 1000;

const SENTIMENT_RULES = {
  positive: { minRating: 3.5 },
  neutral: { minRating: 2.5, maxRating: 3.49 },
  negative: { maxRating: 2.49 },
};

function sentimentCounts(ratings: number[]): {
  positive: number;
  neutral: number;
  negative: number;
} {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  for (const r of ratings) {
    if (r >= SENTIMENT_RULES.positive.minRating) positive++;
    else if (r >= SENTIMENT_RULES.neutral.minRating) neutral++;
    else negative++;
  }
  return { positive, neutral, negative };
}

function averageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 100) / 100;
}

function bucketKeyUtcHour(d: Date): string {
  const x = new Date(d);
  x.setUTCMinutes(0, 0, 0);
  x.setUTCMilliseconds(0);
  return x.toISOString();
}

function bucketKeyUtcDay(d: Date): string {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  return x.toISOString();
}

function buildTotals(rows: { rating: number }[]): FeedbackInsightsTotals {
  const ratings = rows.map((r) => r.rating);
  return {
    count: ratings.length,
    averageRating: averageRating(ratings),
    ...sentimentCounts(ratings),
  };
}

function pickPeakPositive(
  buckets: FeedbackInsightsBucket[],
): FeedbackInsightsHighlight | null {
  let best: FeedbackInsightsHighlight | null = null;
  for (const b of buckets) {
    if (b.positive === 0) continue;
    if (
      !best ||
      b.positive > best.positives ||
      (b.positive === best.positives &&
        (b.averageRating ?? 0) > (best.averageRating ?? 0))
    ) {
      best = {
        bucketStart: b.bucketStart,
        positives: b.positive,
        totalInBucket: b.count,
        averageRating: b.averageRating,
      };
    }
  }
  return best;
}

function peakHint(
  peak: FeedbackInsightsHighlight | null,
  bucket: 'hour' | 'day',
): string | null {
  if (!peak || peak.positives === 0) return null;
  const d = new Date(peak.bucketStart);
  if (bucket === 'hour') {
    const h = d.getUTCHours().toString().padStart(2, '0');
    return `Pico de elogios por volta das ${h}h UTC (${peak.positives} feedbacks positivos nesta hora).`;
  }
  const day = d.toISOString().slice(0, 10);
  return `Pico de elogios em ${day} (${peak.positives} feedbacks positivos neste dia).`;
}

export class FeedbackUsecase {
  constructor(
    private readonly feedbackRepository: IRepositoryFeedback,
    private readonly establishmentRepository: IRepositoryEstablishment,
  ) {}

  private buildFeedbackReward(
    establishment: Establishment | null,
  ): FeedbackRewardPayload | null {
    if (!establishment?.feedbackRewardEnabled) return null;
    const raw = establishment.feedbackRewardMessage?.trim();
    const message =
      raw && raw.length > 0 ? raw : DEFAULT_FEEDBACK_REWARD_MESSAGE;
    return { message };
  }

  private async rewardForEstablishment(
    establishmentId: number,
  ): Promise<FeedbackRewardPayload | null> {
    const est = await this.establishmentRepository.findById(establishmentId);
    return this.buildFeedbackReward(est);
  }

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
        establishment.addressNumber,
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
        establishment.ownerUserId,
        establishment.feedbackRewardEnabled,
        establishment.feedbackRewardMessage,
        establishment.createdAt,
        now,
      ),
    );
  }

  async execute(
    userId: number,
    data: CreateFeedbackDto,
    idempotencyKey: string,
  ): Promise<CreateFeedbackResult> {
    const existingByKey =
      await this.feedbackRepository.findByUserIdAndIdempotencyKey(
        userId,
        idempotencyKey,
      );
    if (existingByKey) {
      if (existingByKey.establishmentId !== data.establishmentId) {
        throw new ConflictException(
          'Esta Idempotency-Key já foi usada para outro estabelecimento. Gere uma chave nova para cada envio.',
        );
      }
      const reward = await this.rewardForEstablishment(data.establishmentId);
      return { feedback: existingByKey, replay: true, reward };
    }

    const last = await this.feedbackRepository.findLastByUserAndEstablishment(
      userId,
      data.establishmentId,
    );
    const now = new Date();
    if (last && isSameDay(last.createdAt, now)) {
      throw new ConflictException(
        'Você já fez um feedback para este estabelecimento hoje. Use a mesma Idempotency-Key para repetir o envio em caso de falha de rede, ou tente novamente amanhã com uma chave nova.',
      );
    }

    const rating = computeOverallRating(data);

    const feedback = new Feedback(
      0,
      userId,
      data.establishmentId,
      rating,
      data.ratingCrowding,
      data.ratingAnimation,
      data.ratingOrganization,
      data.ratingHygiene,
      data.ratingAmbience,
      data.comment ?? null,
      data.photoUrl ?? null,
      idempotencyKey,
      now,
      now,
    );

    try {
      const created = await this.feedbackRepository.create(feedback);
      await this.recalculateEstablishmentScore(data.establishmentId);
      const reward = await this.rewardForEstablishment(data.establishmentId);
      return { feedback: created, replay: false, reward };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        const raced =
          await this.feedbackRepository.findByUserIdAndIdempotencyKey(
            userId,
            idempotencyKey,
          );
        if (raced) {
          if (raced.establishmentId !== data.establishmentId) {
            throw new ConflictException(
              'Esta Idempotency-Key já foi usada para outro estabelecimento.',
            );
          }
          const reward = await this.rewardForEstablishment(
            data.establishmentId,
          );
          return { feedback: raced, replay: true, reward };
        }
      }
      throw e;
    }
  }

  async findAll(): Promise<Feedback[]> {
    const list = await this.feedbackRepository.findAll();
    if (list.length === 0) {
      throw new NotFoundException('Nenhum feedback encontrado.');
    }
    return list;
  }

  async findById(id: number): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findById(id);
    if (!feedback) {
      throw new NotFoundException('Feedback não encontrado.');
    }
    return feedback;
  }

  async findByEstablishmentId(establishmentId: number): Promise<Feedback[]> {
    return await this.feedbackRepository.findByEstablishmentId(establishmentId);
  }

  /**
   * Painel do portal: lista paginada com filtros (dono/funcionário — guard no controller).
   */
  async findByEstablishmentForPanel(
    establishmentId: number,
    query: FeedbackEstablishmentPanelQueryDto,
  ) {
    const page = query.getPage();
    const pageSize = query.getPageSize();
    const sortDesc = query.sort !== 'asc';

    let from: Date | undefined;
    let to: Date | undefined;
    if (query.from) from = new Date(query.from);
    if (query.to) to = new Date(query.to);

    if (from && to && from.getTime() >= to.getTime()) {
      throw new BadRequestException('from deve ser anterior a to');
    }
    if (
      from &&
      to &&
      to.getTime() - from.getTime() > FEEDBACK_PANEL_MAX_RANGE_MS
    ) {
      throw new BadRequestException('Intervalo máximo: 400 dias');
    }
    if (
      query.minRating != null &&
      query.maxRating != null &&
      query.minRating > query.maxRating
    ) {
      throw new BadRequestException(
        'minRating não pode ser maior que maxRating',
      );
    }

    const skip = (page - 1) * pageSize;
    const { items, total } =
      await this.feedbackRepository.findByEstablishmentPanel(
        establishmentId,
        {
          from,
          to,
          minRating: query.minRating,
          maxRating: query.maxRating,
          hasPhoto: query.hasPhoto,
        },
        skip,
        pageSize,
        sortDesc,
      );

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Agregações para dashboard (intervalo, heatmap, pico de elogios, janela live opcional).
   * Buckets são em **UTC**; o portal pode pedir vários intervalos para comparar ontem / semana / mês.
   */
  async getInsights(
    establishmentId: number,
    query: FeedbackInsightsQueryDto,
  ): Promise<FeedbackInsightsResponse> {
    const now = new Date();
    const to = query.to ? new Date(query.to) : now;
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (from.getTime() >= to.getTime()) {
      throw new BadRequestException('from deve ser anterior a to');
    }
    if (to.getTime() - from.getTime() > MAX_INSIGHTS_RANGE_MS) {
      throw new BadRequestException('Intervalo máximo: 400 dias');
    }

    const bucketMode = query.bucket ?? 'hour';
    const rows = await this.feedbackRepository.findRatingsInRange(
      establishmentId,
      from,
      to,
    );

    const totals = buildTotals(rows);

    const bucketMap = new Map<string, number[]>();
    for (const row of rows) {
      const key =
        bucketMode === 'day'
          ? bucketKeyUtcDay(row.createdAt)
          : bucketKeyUtcHour(row.createdAt);
      const arr = bucketMap.get(key) ?? [];
      arr.push(row.rating);
      bucketMap.set(key, arr);
    }

    const buckets: FeedbackInsightsBucket[] = [...bucketMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([bucketStart, ratings]) => ({
        bucketStart,
        count: ratings.length,
        averageRating: averageRating(ratings),
        ...sentimentCounts(ratings),
      }));

    const peakPositivePraise = pickPeakPositive(buckets);
    const peakPositivePraiseHint = peakHint(peakPositivePraise, bucketMode);

    const base: FeedbackInsightsResponse = {
      establishmentId,
      from: from.toISOString(),
      to: to.toISOString(),
      bucket: bucketMode,
      sentimentRules: SENTIMENT_RULES,
      totals,
      buckets,
      peakPositivePraise,
      peakPositivePraiseHint,
    };

    if (query.liveMinutes != null) {
      const liveTo = now;
      const liveFrom = new Date(now.getTime() - query.liveMinutes * 60 * 1000);
      const liveRows = await this.feedbackRepository.findRatingsInRange(
        establishmentId,
        liveFrom,
        liveTo,
      );
      const liveTotals = buildTotals(liveRows);
      const live: FeedbackInsightsLive = {
        minutes: query.liveMinutes,
        from: liveFrom.toISOString(),
        to: liveTo.toISOString(),
        ...liveTotals,
      };
      return { ...base, live };
    }

    return base;
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
      throw new NotFoundException('Feedback não encontrado.');
    }

    const ratingCrowding = data.ratingCrowding ?? feedback.ratingCrowding;
    const ratingAnimation = data.ratingAnimation ?? feedback.ratingAnimation;
    const ratingOrganization = data.ratingOrganization ?? feedback.ratingOrganization;
    const ratingHygiene = data.ratingHygiene ?? feedback.ratingHygiene;
    const ratingAmbience = data.ratingAmbience ?? feedback.ratingAmbience;
    const rating = computeOverallRating({
      ratingCrowding,
      ratingAnimation,
      ratingOrganization,
      ratingHygiene,
      ratingAmbience,
    });

    const now = new Date();
    const updated = await this.feedbackRepository.update(
      new Feedback(
        feedback.id,
        feedback.userId,
        feedback.establishmentId,
        rating,
        ratingCrowding,
        ratingAnimation,
        ratingOrganization,
        ratingHygiene,
        ratingAmbience,
        data.comment !== undefined ? data.comment : feedback.comment,
        data.photoUrl !== undefined ? data.photoUrl : feedback.photoUrl,
        feedback.idempotencyKey,
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
      throw new NotFoundException('Feedback não encontrado.');
    }
    const establishmentId = feedback.establishmentId;
    await this.feedbackRepository.delete(id);
    await this.recalculateEstablishmentScore(establishmentId);
  }
}
