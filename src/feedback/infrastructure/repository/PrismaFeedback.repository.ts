import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Feedback } from '../../domain/entities/feedback.entity';
import {
  FeedbackMinePageResult,
  IRepositoryFeedback,
} from './IRepository.repository';

type PrismaFeedbackRow = {
  id: number;
  userId: number;
  establishmentId: number;
  rating: number;
  comment: string | null;
  photoUrl: string | null;
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
      row.comment,
      row.photoUrl,
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
        comment: entity.comment,
        photoUrl: entity.photoUrl,
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
