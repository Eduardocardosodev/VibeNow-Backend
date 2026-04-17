import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Feedback } from '../../domain/entities/feedback.entity';
import {
  FeedbackMinePageResult,
  FeedbackPanelFilter,
  FeedbackPanelPageResult,
  IRepositoryFeedback,
} from './IRepository.repository';

type PrismaFeedbackRow = {
  id: number;
  userId: number;
  establishmentId: number;
  rating: number;
  ratingCrowding: number;
  ratingAnimation: number;
  ratingOrganization: number;
  ratingHygiene: number;
  ratingAmbience: number;
  comment: string | null;
  photoUrl: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaFeedbackRepository implements IRepositoryFeedback {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: PrismaFeedbackRow): Feedback {
    return new Feedback(
      row.id,
      row.userId,
      row.establishmentId,
      row.rating,
      row.ratingCrowding,
      row.ratingAnimation,
      row.ratingOrganization,
      row.ratingHygiene,
      row.ratingAmbience,
      row.comment,
      row.photoUrl,
      row.idempotencyKey,
      row.createdAt,
      row.updatedAt,
    );
  }

  async findLastByUserAndEstablishment(
    userId: number,
    establishmentId: number,
  ): Promise<Feedback | null> {
    const row = await this.prisma.feedback.findFirst({
      where: { userId, establishmentId },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Feedback[]> {
    const rows = await this.prisma.feedback.findMany({
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: number): Promise<Feedback | null> {
    const row = await this.prisma.feedback.findUnique({
      where: { id },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByEstablishmentId(establishmentId: number): Promise<Feedback[]> {
    const rows = await this.prisma.feedback.findMany({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByEstablishmentPanel(
    establishmentId: number,
    filter: FeedbackPanelFilter,
    skip: number,
    take: number,
    sortDesc: boolean,
  ): Promise<FeedbackPanelPageResult> {
    const parts: Record<string, unknown>[] = [{ establishmentId }];

    if (filter.from != null || filter.to != null) {
      parts.push({
        createdAt: {
          ...(filter.from != null && { gte: filter.from }),
          ...(filter.to != null && { lte: filter.to }),
        },
      });
    }

    if (filter.minRating != null || filter.maxRating != null) {
      parts.push({
        rating: {
          ...(filter.minRating != null && { gte: filter.minRating }),
          ...(filter.maxRating != null && { lte: filter.maxRating }),
        },
      });
    }

    if (filter.hasPhoto === true) {
      parts.push({
        AND: [{ photoUrl: { not: null } }, { photoUrl: { not: '' } }],
      });
    } else if (filter.hasPhoto === false) {
      parts.push({
        OR: [{ photoUrl: null }, { photoUrl: '' }],
      });
    }

    const where = parts.length === 1 ? parts[0]! : { AND: parts };

    const orderBy = sortDesc
      ? ({ createdAt: 'desc' } as const)
      : ({ createdAt: 'asc' } as const);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.feedback.count({ where }),
      this.prisma.feedback.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map((r) => this.toDomain(r as PrismaFeedbackRow)),
      total,
    };
  }

  async findRatingsInRange(
    establishmentId: number,
    from: Date,
    to: Date,
  ): Promise<{ rating: number; createdAt: Date }[]> {
    return this.prisma.feedback.findMany({
      where: {
        establishmentId,
        createdAt: { gte: from, lte: to },
      },
      select: { rating: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByUserIdAndIdempotencyKey(
    userId: number,
    idempotencyKey: string,
  ): Promise<Feedback | null> {
    const row = await this.prisma.feedback.findFirst({
      where: { userId, idempotencyKey },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByUserIdWithEstablishmentPaginated(
    userId: number,
    skip: number,
    take: number,
  ): Promise<FeedbackMinePageResult> {
    const where = { userId };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.feedback.count({ where }),
      this.prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          establishment: { select: { id: true, name: true } },
        },
      }),
    ]);
    const items = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      establishmentId: r.establishmentId,
      rating: r.rating,
      ratingCrowding: r.ratingCrowding,
      ratingAnimation: r.ratingAnimation,
      ratingOrganization: r.ratingOrganization,
      ratingHygiene: r.ratingHygiene,
      ratingAmbience: r.ratingAmbience,
      comment: r.comment,
      photoUrl: r.photoUrl,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      establishment: {
        id: r.establishment.id,
        name: r.establishment.name,
      },
    }));
    return { items, total };
  }

  async create(entity: Feedback): Promise<Feedback> {
    const row = await this.prisma.feedback.create({
      data: {
        userId: entity.userId,
        establishmentId: entity.establishmentId,
        rating: entity.rating,
        ratingCrowding: entity.ratingCrowding,
        ratingAnimation: entity.ratingAnimation,
        ratingOrganization: entity.ratingOrganization,
        ratingHygiene: entity.ratingHygiene,
        ratingAmbience: entity.ratingAmbience,
        comment: entity.comment,
        photoUrl: entity.photoUrl,
        idempotencyKey: entity.idempotencyKey ?? undefined,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async update(entity: Feedback): Promise<Feedback | null> {
    const row = await this.prisma.feedback.update({
      where: { id: entity.id },
      data: {
        rating: entity.rating,
        ratingCrowding: entity.ratingCrowding,
        ratingAnimation: entity.ratingAnimation,
        ratingOrganization: entity.ratingOrganization,
        ratingHygiene: entity.ratingHygiene,
        ratingAmbience: entity.ratingAmbience,
        comment: entity.comment,
        photoUrl: entity.photoUrl,
        updatedAt: entity.updatedAt,
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.feedback.delete({
      where: { id },
    });
  }
}
