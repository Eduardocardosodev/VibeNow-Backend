import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Quote } from '../../domain/entities/quote.entity';
import { IRepositoryQuote } from './IRepository.repository';

type PrismaQuoteRow = {
  id: number;
  establishmentId: number;
  text: string;
  expiresAt: Date;
  createdAt: Date;
};

@Injectable()
export class PrismaQuoteRepository implements IRepositoryQuote {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: PrismaQuoteRow): Quote {
    return new Quote(
      row.id,
      row.establishmentId,
      row.text,
      row.expiresAt,
      row.createdAt,
    );
  }

  async create(entity: Quote): Promise<Quote> {
    const row = await this.prisma.quote.create({
      data: {
        establishmentId: entity.establishmentId,
        text: entity.text,
        expiresAt: entity.expiresAt,
      },
    });
    return this.toDomain(row as PrismaQuoteRow);
  }

  async findById(id: number): Promise<Quote | null> {
    const row = await this.prisma.quote.findUnique({
      where: { id },
    });
    return row ? this.toDomain(row as PrismaQuoteRow) : null;
  }

  async findByEstablishmentId(establishmentId: number): Promise<Quote[]> {
    const rows = await this.prisma.quote.findMany({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r as PrismaQuoteRow));
  }

  async findActiveByEstablishmentId(establishmentId: number): Promise<Quote[]> {
    const now = new Date();
    const rows = await this.prisma.quote.findMany({
      where: { establishmentId, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r as PrismaQuoteRow));
  }

  async update(entity: Quote): Promise<Quote | null> {
    const row = await this.prisma.quote.update({
      where: { id: entity.id },
      data: {
        text: entity.text,
      },
    });
    return row ? this.toDomain(row as PrismaQuoteRow) : null;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.quote.delete({ where: { id } });
  }
}
